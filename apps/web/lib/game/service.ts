// Pure, framework-free game domain service. This module owns the authoritative
// game-state transitions for the web client (tick loop, gathering, crafting,
// combat, inventory, equipment, progression) and is the single place those
// rules live outside React. It depends only on the shared engine/data/
// shared-types packages and the GamePersistence interface — never on the DOM.
//
// The React layer (GameProvider / GameClient) is a thin facade over these
// transitions; components never run gameplay math themselves.

import type {
  SkillId,
  FoodItem,
  CombatLogEntry,
  CombatEncounter,
  BaseStats,
  StatBlock,
  EquipmentSlots,
  EquipmentSlot,
  InventoryItem,
  PlayerDungeonState,
  EnemyDefinition,
  DungeonModifier,
  ShopItemDefinition,
  PlayerTaskState,
  QuestEvent,
} from '@premium-rpg/shared-types';
import {
  getNodesForSkill,
  getBestTool,
  completeGatheringAction,
  gainExperience,
  levelForXp,
  getRecipeById,
  completeCraftingAction,
  hasIngredients,
  createPlayerParticipant,
  createEnemyParticipant,
  startCombatEncounter,
  executeCombatRound,
  getRoundDuration,
  findBestFood,
  useFood,
  createEmptyDungeonState,
  startDungeonRun,
  getCurrentEncounter,
  resolveDungeonEncounter,
  computeDungeonRewards,
  clearDungeonRun,
  addRunHistory,
  computeItemValue,
  selectWeightedEntries,
  BASE_XP,
  XP_GROWTH,
  createTaskState,
  ensureCurrentTasks,
  processTaskEvent,
  claimTask,
  getCurrentTasks,
  type SkillName,
} from '@premium-rpg/game-engine';
import {
  ALL_ENEMIES,
  LOOT_TABLES,
  ITEM_BY_ID,
  ALL_DUNGEONS,
  SHOP_STOCK,
  PRESTIGE_STOCK,
  ECONOMY_COST_MODEL,
  DUNGEON_REWARD_TABLES,
  ALL_TASKS,
  TASK_BY_ID,
  DEFAULT_TASK_SELECTION,
} from '@premium-rpg/game-data';
import { baseStatsForLevel, cumulativeXpForLevel } from '@/lib/player-summary';
import { itemName, itemHeal } from '@/lib/item-names';
import { GAME_SAVE_SCHEMA_VERSION, type EconomyTransaction, type GamePersistence, type GameSaveData } from '@/lib/persistence/game-persistence';
import type { DungeonCombatSlice } from '@/lib/persistence/game-persistence';
import type { DailyBattleState, BattleHistoryEntry } from '@/lib/persistence/game-persistence';
import { COMBAT_LEVEL_CAP, derivedCombatStats } from '@/lib/combat-progression';

export const TICK_MS = 250;
export const AUTO_FIGHT_GAP_MS = 1100;
export const REST_HEAL_FRACTION = 0.02; // of max HP per second
export const MAX_ACTION_QUEUE = 10;
export const MAX_ACTION_REPETITIONS = 1000;
export const REWARDED_BATTLE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Starter satchel for a brand-new save (no save file yet). Enough ore to try
// mining + the Forge pipeline and a first alchemy brew, so new hunters aren't
// blocked on materials they can't yet source. Returning players keep their
// own save inventory untouched.
export const STARTING_SATCHEL: Record<string, number> = {
  copper_ore: 6,
  tin_ore: 6,
  iron_ore: 4,
  coal: 2,
  shrimp: 4,
  guam_herb: 2,
  newt_eye: 2,
};

export interface ActiveAction {
  kind: 'gathering' | 'crafting';
  skill: SkillId;
  nodeId?: string;
  recipeId?: string;
  toolId?: string | null;
  startTime: number;
  duration: number;
  /** Number of completions still to perform, including the current run. */
  repetitionsRemaining: number;
}

export type QueuedAction = Pick<ActiveAction, 'kind' | 'skill' | 'nodeId' | 'recipeId'> & {
  repetitions: number;
};

export interface ActionLogEntry {
  id: number;
  skill: SkillId;
  text: string;
  rare: boolean;
  ts: number;
}

export interface GainFeed {
  id: number;
  text: string;
  kind: 'item' | 'xp' | 'level' | 'gold' | 'info' | 'rare';
}

export interface CombatView {
  mustPick: boolean;
  regionId: string;
  enemyId: string;
  playerHp: number;
  enemyHp: number;
  encounter: CombatEncounter | null;
  nextRoundAt: number | null;
  autoFight: boolean;
  resting: boolean;
  nextAutoFightAt: number | null;
  sessionKills: number;
  sessionXp: number;
  sessionGold: number;
  combatLog: CombatLogEntry[];
}

export type { DungeonCombatSlice };

export interface GameState {
  playerName: string;
  characterClass: string;
  skills: Record<SkillId, number>; // cumulative XP per skill
  gold: number;
  inventory: Record<string, number>;
  durability: Record<string, number>;
  equipment: EquipmentSlots;
  activeAction: ActiveAction | null;
  actionQueue: QueuedAction[];
  actionLog: ActionLogEntry[];
  gains: GainFeed[];
  combat: CombatView;
  combatXp: number; // cumulative character XP
  combatLevel: number;
  selectedSkill: SkillId;
  /** Per-save record of shop purchases (finite-stock / one-time tracking). */
  shopBought: Record<string, number>;
  /** Dungeon run + per-dungeon progress. */
  dungeon: PlayerDungeonState;
  /** Transient encounter for the active dungeon fight (isolated from open-world combat). */
  dungeonCombat: DungeonCombatSlice;
  /** Persisted daily and weekly task assignments and progress. */
  task: PlayerTaskState;
  ledger: EconomyTransaction[];
  dailyBattle: DailyBattleState;
}

export interface SkillView {
  skill: SkillId;
  level: number;
  xp: number;
  intoLevel: number;
  needNext: number;
  pct: number;
}

let seq = 0;
export const nextId = (): number => ++seq;

// Bar-math mirror of the engine XP step (BASE_XP * level^XP_GROWTH), using the
// engine's own constants so the curve has a single source of truth.
export function xpStepForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, XP_GROWTH));
}

function toStatBlock(stats: BaseStats): StatBlock {
  return {
    ...stats,
    damage: Math.floor(stats.strength * 0.9),
    defense: Math.floor(stats.armor * 0.6),
  };
}

function initialDurability(equipment: EquipmentSlots): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [uid, item] of Object.entries(equipment)) {
    if (item) out[uid] = item.durability ?? 100;
  }
  return out;
}

// A brand-new save — or any save whose satchel is entirely empty — is given
// the starter kit so no hunter is hard-blocked on materials (this is a demo;
// the loop always needs something to work with). Existing items are untouched.
function needsStarterSatchel(save: GameSaveData | null | undefined): boolean {
  return !save || save.inventory == null;
}

export function emptyEquipment(): EquipmentSlots {
  return {
    weapon: null,
    offhand: null,
    helmet: null,
    chest: null,
    gloves: null,
    legs: null,
    boots: null,
    amulet: null,
    ring: null,
    cape: null,
  };
}

const EMPTY_DUNGEON_COMBAT: DungeonCombatSlice = { encounter: null, nextRoundAt: null, playerHp: 0 };

export function emptyDungeonState(): PlayerDungeonState {
  return createEmptyDungeonState(ALL_DUNGEONS.map((d) => d.id));
}

export type SeedConfig = {
  playerId: string;
  playerName: string;
  characterClass?: string;
  skills: Record<SkillId, { level: number; xp: number }>;
  combatLevel: number;
  equipment: EquipmentSlots;
  gold: number;
  persistence: GamePersistence;
};

export function seedState(config: Pick<SeedConfig, 'playerId' | 'persistence'>): GameState {
  const save = config.persistence.load(config.playerId);
  const task = cloneTaskState(save?.task ?? createTaskState());
  ensureCurrentTasks(task, ALL_TASKS, DEFAULT_TASK_SELECTION, new Date(), save?.combatLevel ?? 1);
  return {
    playerName: '',
    characterClass: 'warrior',
    skills: {
      mining: save?.skills?.mining ?? 0,
      woodcutting: save?.skills?.woodcutting ?? 0,
      fishing: save?.skills?.fishing ?? 0,
      smelting: save?.skills?.smelting ?? 0,
      smithing: save?.skills?.smithing ?? 0,
      cooking: save?.skills?.cooking ?? 0,
      fletching: save?.skills?.fletching ?? 0,
      alchemy: save?.skills?.alchemy ?? 0,
      runecrafting: save?.skills?.runecrafting ?? 0,
    },
    gold: save?.gold ?? 0,
    inventory: needsStarterSatchel(save) ? { ...STARTING_SATCHEL } : (save?.inventory ?? {}),
    durability: save?.durability ?? {},
    equipment: save?.equipment ?? emptyEquipment(),
    activeAction: save?.activeAction
      ? { ...save.activeAction, repetitionsRemaining: Math.max(1, Math.min(MAX_ACTION_REPETITIONS, save.activeAction.repetitionsRemaining ?? 1)) }
      : null,
    actionQueue: (save?.actionQueue ?? []).slice(0, MAX_ACTION_QUEUE).map((action) => ({
      ...action,
      repetitions: Math.max(1, Math.min(MAX_ACTION_REPETITIONS, action.repetitions ?? 1)),
    })),
    actionLog: [],
    gains: [],
    combatXp: save?.combatXp ?? 0,
    combatLevel: save?.combatLevel ?? 1,
    combat: {
      mustPick: true,
      regionId: 'starter-frontier',
      enemyId: '',
      playerHp: 100,
      enemyHp: 0,
      encounter: null,
      nextRoundAt: null,
      autoFight: false,
      resting: false,
      nextAutoFightAt: null,
      sessionKills: 0,
      sessionXp: 0,
      sessionGold: 0,
      combatLog: [],
    },
    selectedSkill: save?.selectedSkill ?? 'mining',
    shopBought: save?.shopBought ?? {},
    dungeon: save?.dungeon ?? emptyDungeonState(),
    dungeonCombat: save?.dungeonCombat ?? EMPTY_DUNGEON_COMBAT,
    task,
    ledger: save?.ledger ?? [],
    dailyBattle: save?.dailyBattle ?? { nextBattleAt: 0, activeAttemptId: null, activeStartedAt: null, history: [] },
  };
}

// Build a working state seeded both from the shell player and any saved file.
export function mergeSeed(config: SeedConfig): GameState {
  const persisted = config.persistence.load(config.playerId);
  const base = seedState(config);
  const savedSkills = base.skills;
  const savedEquipment = base.equipment;
  return {
    ...base,
    playerName: config.playerName,
    characterClass: config.characterClass ?? 'warrior',
    combatXp: persisted && typeof persisted.combatXp === 'number'
      ? base.combatXp
      : cumulativeXpForLevel(config.combatLevel),
    combatLevel: base.combatLevel > 0 ? base.combatLevel : config.combatLevel,
    skills: {
      mining: typeof persisted?.skills?.mining === 'number' ? savedSkills.mining : config.skills.mining.xp,
      woodcutting: typeof persisted?.skills?.woodcutting === 'number' ? savedSkills.woodcutting : config.skills.woodcutting.xp,
      fishing: typeof persisted?.skills?.fishing === 'number' ? savedSkills.fishing : config.skills.fishing.xp,
      smelting: typeof persisted?.skills?.smelting === 'number' ? savedSkills.smelting : config.skills.smelting.xp,
      smithing: typeof persisted?.skills?.smithing === 'number' ? savedSkills.smithing : config.skills.smithing.xp,
      cooking: typeof persisted?.skills?.cooking === 'number' ? savedSkills.cooking : config.skills.cooking.xp,
      fletching: typeof persisted?.skills?.fletching === 'number' ? savedSkills.fletching : config.skills.fletching.xp,
      alchemy: typeof persisted?.skills?.alchemy === 'number' ? savedSkills.alchemy : config.skills.alchemy.xp,
      runecrafting: typeof persisted?.skills?.runecrafting === 'number' ? savedSkills.runecrafting : config.skills.runecrafting.xp,
    },
    gold: typeof persisted?.gold === 'number' ? base.gold : Math.max(0, config.gold),
    equipment: Object.keys(savedEquipment).some((k) => savedEquipment[k as keyof EquipmentSlots])
      || persisted?.equipment != null
      ? savedEquipment
      : config.equipment,
    durability: Object.keys(base.durability).length > 0 ? base.durability : initialDurability(config.equipment),
    combat: {
      ...base.combat,
      playerHp: Math.max(1, Math.min(base.combat.playerHp, 100)),
    },
  };
}

export function gameToSaveData(state: GameState): GameSaveData {
  return {
    schemaVersion: GAME_SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    skills: state.skills,
    gold: state.gold,
    inventory: state.inventory,
    durability: state.durability,
    equipment: state.equipment,
    combatXp: state.combatXp,
    combatLevel: state.combatLevel,
    selectedSkill: state.selectedSkill,
    activeAction: state.activeAction,
    actionQueue: state.actionQueue,
    shopBought: state.shopBought,
    dungeon: state.dungeon,
    dungeonCombat: state.dungeonCombat,
    task: state.task,
    ledger: state.ledger,
    dailyBattle: state.dailyBattle,
  };
}

function cloneTaskState(task: PlayerTaskState): PlayerTaskState {
  const cloneAssignments = (sets: Record<string, import('@premium-rpg/shared-types').TaskAssignment[]>) =>
    Object.fromEntries(Object.entries(sets).map(([key, assignments]) => [key, assignments.map((a) => ({ ...a }))]));
  return {
    daily: cloneAssignments(task.daily),
    weekly: cloneAssignments(task.weekly),
    catchUpClaims: task.catchUpClaims.map((a) => ({ ...a })),
    totalTasksCompleted: task.totalTasksCompleted,
    history: task.history.map((h) => ({ ...h })),
  };
}

export function reduceTaskEvent(prev: GameState, event: QuestEvent, now = Date.now()): GameState {
  const task = cloneTaskState(prev.task);
  ensureCurrentTasks(task, ALL_TASKS, DEFAULT_TASK_SELECTION, new Date(now), prev.combatLevel);
  const result = processTaskEvent(task, new Date(now), event);
  if (result.changed.length === 0) return prev;
  const completedGains = result.newlyCompleted.map((assignment) => ({
    id: nextId(),
    text: `Task complete: ${TASK_BY_ID[assignment.taskId]?.name ?? assignment.taskId}`,
    kind: 'rare' as const,
  }));
  return { ...prev, task, gains: pushGains(prev.gains, completedGains) };
}

function rollLootFor(enemyId: string): { itemId: string; quantity: number }[] {
  const enemy = ALL_ENEMIES.find((e) => e.id === enemyId);
  if (!enemy) return [];
  const table = LOOT_TABLES[enemy.lootTableId];
  if (!table) return [];
  const drops: { itemId: string; quantity: number }[] = [];
  for (const drop of table.drops) {
    if (Math.random() >= drop.chance) continue;
    const qty = drop.minQuantity + Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1));
    drops.push({ itemId: drop.itemId, quantity: qty });
  }
  return drops;
}

function addInventory(inv: Record<string, number>, itemId: string, quantity: number): Record<string, number> {
  const next = { ...inv };
  next[itemId] = Math.max(0, (next[itemId] ?? 0) + quantity);
  if ((next[itemId] ?? 0) <= 0) delete next[itemId];
  return next;
}

function pushGains(gains: GainFeed[], entries: GainFeed[]): GainFeed[] {
  return [...entries, ...gains].slice(0, 16);
}

function pushActionLog(
  log: ActionLogEntry[],
  entries: { skill: SkillId; text: string; rare: boolean }[],
): ActionLogEntry[] {
  const now = Date.now();
  return [...log, ...entries.map((e) => ({ ...e, id: nextId(), ts: now }))].slice(-60);
}

function roundDelayMs(encounter: CombatEncounter): number {
  return getRoundDuration(encounter.player.stats.attackSpeed, encounter.enemy.stats.attackSpeed) * 1000;
}

function beginEncounter(prev: GameState, now: number): GameState {
  const enemy = ALL_ENEMIES.find((e) => e.id === prev.combat.enemyId);
  if (!enemy || prev.combat.encounter || now < prev.dailyBattle.nextBattleAt) return prev;
  const stats = derivedCombatStats(prev.combatLevel, prev.characterClass, prev.equipment);
  const attemptId = `battle-${now}-${nextId()}`;
  const player = createPlayerParticipant(
    prev.playerName,
    prev.combatLevel,
    toStatBlock(stats),
    Math.max(1, prev.combat.playerHp),
    'melee',
  );
  const encounter = startCombatEncounter(player, createEnemyParticipant(enemy));
  return {
    ...prev,
    dailyBattle: {
      ...prev.dailyBattle,
      nextBattleAt: now + REWARDED_BATTLE_COOLDOWN_MS,
      activeAttemptId: attemptId,
      activeStartedAt: now,
    },
    combat: {
      ...prev.combat,
      encounter,
      enemyHp: enemy.maxHealth,
      nextRoundAt: now + roundDelayMs(encounter),
      resting: false,
    },
  };
}

/**
 * Advance the game by one tick. This is the single reward-granting path:
 * gathering/crafting completions and combat victories are resolved here, and
 * the resulting state re-arms the action/encounter in the same immutable
 * update, so a duplicate evaluation cannot double-grant.
 */
export function tick(prev: GameState, now: number): GameState {
  let state = prev;

  // ---- Active action (gathering / crafting) ----
  const action = prev.activeAction;
  if (action) {
    const elapsed = now - action.startTime;
    if (elapsed >= action.duration) {
      if (action.kind === 'gathering' && action.nodeId) {
        const node = getNodesForSkill(action.skill as SkillName).find((n) => n.id === action.nodeId);
        if (!node) {
          state = { ...state, activeAction: null, actionQueue: [] };
        } else {
          const currentLevel = levelForXp(state.skills[action.skill]);
          const tool = getBestTool(action.skill as SkillName, currentLevel);
          const reward = completeGatheringAction({
            nodeId: node.id,
            skill: node.skill,
            startTime: action.startTime,
            duration: action.duration,
            toolId: tool?.id,
          });
          const grow = gainExperience(state.skills[action.skill], reward.xpGained);
          let inventory = state.inventory;
          const gains: GainFeed[] = [{ id: nextId(), text: `+${reward.xpGained} XP`, kind: 'xp' }];
          for (const r of reward.resources) {
            inventory = addInventory(inventory, r.itemId, r.quantity);
            gains.push({
              id: nextId(),
              text: `${r.quantity > 1 ? `${r.quantity}x ` : ''}${itemName(r.itemId)}`,
              kind: r.rare ? 'rare' : 'item',
            });
          }
          if (grow.levelsGained > 0) {
            gains.push({ id: nextId(), text: `${itemName(node.id)} — ${action.skill} level ${grow.newLevel}!`, kind: 'level' });
          }
          const newTool = getBestTool(action.skill as SkillName, grow.newLevel);
          const duration = Math.floor(node.baseDuration / (newTool ? newTool.bonus.speedMultiplier : 1));
          const advanced = { ...state, skills: { ...state.skills, [action.skill]: grow.newXp }, inventory };
          state = {
            ...advanced,
            gains: pushGains(state.gains, gains),
            actionLog: pushActionLog(state.actionLog, [
              { skill: action.skill, text: `${itemName(node.id)} → ${reward.xpGained} XP`, rare: false },
            ]),
            ...nextActionState(advanced, {
              kind: 'gathering', skill: action.skill, nodeId: node.id,
              toolId: newTool?.id ?? null, startTime: now, duration,
              repetitionsRemaining: action.repetitionsRemaining,
            }, now),
          };
          for (const resource of reward.resources) {
            state = reduceTaskEvent(state, {
              type: 'resource_gathered', skillId: action.skill,
              resourceId: resource.itemId, quantity: resource.quantity,
            }, now);
          }
        }
      } else if (action.kind === 'crafting' && action.recipeId) {
        const recipe = getRecipeById(action.recipeId);
        if (!recipe) {
          state = { ...state, activeAction: null, actionQueue: [] };
        } else {
          const check = hasIngredients(recipe, state.inventory);
          if (!check.canCraft) {
            state = {
              ...state,
              activeAction: null,
              actionQueue: [],
              actionLog: pushActionLog(state.actionLog, [
                { skill: action.skill, text: `Stopped ${recipe.name}: missing ingredients`, rare: false },
              ]),
            };
          } else {
            const craft = completeCraftingAction({
              recipeId: recipe.id,
              skill: recipe.skill,
              startTime: action.startTime,
              duration: action.duration,
              quantity: 1,
              completed: 0,
            });
            const grow = gainExperience(state.skills[action.skill], craft.xpGained);
            let inventory = state.inventory;
            for (const ing of craft.consumedIngredients) inventory = addInventory(inventory, ing.itemId, -ing.quantity);
            const gains: GainFeed[] = [{ id: nextId(), text: `+${craft.xpGained} XP`, kind: 'xp' }];
            for (const o of craft.outputs) {
              inventory = addInventory(inventory, o.itemId, o.quantity);
              gains.push({
                id: nextId(),
                text: `${o.quantity > 1 ? `${o.quantity}x ` : ''}${itemName(o.itemId)}`,
                kind: 'item',
              });
            }
            if (grow.levelsGained > 0) {
              gains.push({ id: nextId(), text: `${recipe.name} — ${action.skill} level ${grow.newLevel}!`, kind: 'level' });
            }
            const advanced = { ...state, skills: { ...state.skills, [action.skill]: grow.newXp }, inventory };
            state = {
              ...advanced,
              gains: pushGains(state.gains, gains),
              actionLog: pushActionLog(state.actionLog, [{ skill: action.skill, text: `${recipe.name} crafted`, rare: false }]),
              ...nextActionState(advanced, {
                kind: 'crafting', skill: action.skill, recipeId: recipe.id,
                startTime: now, duration: recipe.duration,
                repetitionsRemaining: action.repetitionsRemaining,
              }, now),
            };
            for (const output of craft.outputs) {
              state = reduceTaskEvent(state, {
                type: 'item_crafted', itemId: output.itemId, quantity: output.quantity,
              }, now);
            }
          }
        }
      }
    }
  }

  // ---- Combat: active encounter rounds ----
  let combat = state.combat;
  if (combat.encounter && !combat.encounter.finished && combat.nextRoundAt && now >= combat.nextRoundAt) {
    const nextEncounter = executeCombatRound(combat.encounter);
    const delta = nextEncounter.log.slice(combat.encounter.log.length);
    const combatLog = [...combat.combatLog, ...delta].slice(-80);
    state = {
      ...state,
      combat: {
        ...combat,
        encounter: nextEncounter,
        enemyHp: nextEncounter.enemy.health,
        playerHp: nextEncounter.player.health,
        nextRoundAt: now + roundDelayMs(nextEncounter),
        combatLog,
      },
    };
    combat = state.combat;

    const enc = combat.encounter;
    if (enc && enc.finished) {
      if (enc.result === 'victory') {
        const enemy = ALL_ENEMIES.find((e) => e.id === combat.enemyId) ?? ALL_ENEMIES[0];
        const newCombatXp = state.combatXp + enemy.xpReward;
        const newCombatLevel = Math.min(COMBAT_LEVEL_CAP, levelForXp(newCombatXp));
        const gains: GainFeed[] = [
          { id: nextId(), text: `+${enemy.goldReward} gold`, kind: 'gold' },
          { id: nextId(), text: `+${enemy.xpReward} XP`, kind: 'xp' },
        ];
        if (newCombatLevel > state.combatLevel) {
          gains.push({ id: nextId(), text: `Combat level up → ${newCombatLevel}!`, kind: 'level' });
        }
        let inventory = state.inventory;
        const loot = rollLootFor(enemy.id);
        for (const drop of loot) {
          inventory = addInventory(inventory, drop.itemId, drop.quantity);
          gains.push({
            id: nextId(),
            text: `${drop.quantity > 1 ? `${drop.quantity}x ` : ''}${itemName(drop.itemId)}`,
            kind: ITEM_BY_ID[drop.itemId]?.rarity === 'legendary' || drop.quantity > 3 ? 'rare' : 'item',
          });
        }
        const historyEntry: BattleHistoryEntry = {
          id: state.dailyBattle.activeAttemptId ?? `battle-${now}`,
          enemyId: enemy.id,
          regionId: combat.regionId,
          startedAt: state.dailyBattle.activeStartedAt ?? now,
          completedAt: now,
          result: 'victory',
          xp: enemy.xpReward,
          gold: enemy.goldReward,
          loot,
        };
        state = {
          ...state,
          gold: state.gold + enemy.goldReward,
          inventory,
          combatXp: newCombatXp,
          combatLevel: newCombatLevel,
          gains: pushGains(state.gains, gains),
          dailyBattle: { ...state.dailyBattle, activeAttemptId: null, activeStartedAt: null, history: [...state.dailyBattle.history, historyEntry].slice(-30) },
          combat: {
            ...combat,
            encounter: null,
            enemyHp: 0,
            nextRoundAt: null,
            autoFight: combat.autoFight,
            nextAutoFightAt: now + AUTO_FIGHT_GAP_MS,
            sessionKills: combat.sessionKills + 1,
            sessionXp: combat.sessionXp + enemy.xpReward,
            sessionGold: combat.sessionGold + enemy.goldReward,
          },
        };
        state = reduceTaskEvent(state, {
          type: 'enemy_killed', enemyId: enemy.id, regionId: combat.regionId,
        }, now);
        for (const drop of loot) {
          state = reduceTaskEvent(state, {
            type: 'item_collected', itemId: drop.itemId, quantity: drop.quantity,
          }, now);
        }
      } else {
        const enemy = ALL_ENEMIES.find((e) => e.id === combat.enemyId) ?? ALL_ENEMIES[0];
        const historyEntry: BattleHistoryEntry = {
          id: state.dailyBattle.activeAttemptId ?? `battle-${now}`,
          enemyId: enemy.id, regionId: combat.regionId,
          startedAt: state.dailyBattle.activeStartedAt ?? now, completedAt: now,
          result: 'defeat', xp: 0, gold: 0, loot: [],
        };
        state = {
          ...state,
          gains: pushGains(state.gains, [{ id: nextId(), text: `${enemy.name} defeated you.`, kind: 'info' }]),
          dailyBattle: { ...state.dailyBattle, activeAttemptId: null, activeStartedAt: null, history: [...state.dailyBattle.history, historyEntry].slice(-30) },
          combat: {
            ...combat,
            playerHp: 0,
            enemyHp: 0,
            encounter: null,
            nextRoundAt: null,
            autoFight: false,
            resting: false,
            nextAutoFightAt: null,
          },
        };
      }
      combat = state.combat;
    }
  }

  // ---- Dungeon combat: active floor encounter ----
  const dc = state.dungeonCombat;
  if (dc.encounter && !dc.encounter.finished && dc.nextRoundAt && now >= dc.nextRoundAt) {
    const nextEncounter = executeCombatRound(dc.encounter);
    if (nextEncounter.finished) {
      state = resolveDungeonCombat(state, nextEncounter.result === 'victory' ? 'victory' : 'defeat', now);
    } else {
      state = {
        ...state,
        dungeonCombat: { ...dc, encounter: nextEncounter, nextRoundAt: now + roundDelayMs(nextEncounter) },
      };
    }
  }

  // ---- Combat: auto-fight start / rest ----
  if (
    combat.autoFight && now >= state.dailyBattle.nextBattleAt &&
    !combat.resting &&
    combat.playerHp > 0 &&
    !combat.encounter &&
    combat.nextAutoFightAt &&
    now >= combat.nextAutoFightAt
  ) {
    state = beginEncounter(state, now);
  } else if (combat.resting && combat.playerHp > 0 && !combat.encounter) {
    const stats = baseStatsForLevel(state.combatLevel);
    const heal = Math.ceil(stats.maxHealth * REST_HEAL_FRACTION * (TICK_MS / 1000));
    const playerHp = Math.min(stats.maxHealth, combat.playerHp + heal);
    state = { ...state, combat: { ...state.combat, playerHp, resting: playerHp < stats.maxHealth } };
  }

  return state;
}

// ---- Action reducers (pure state transitions) ----

function activateQueuedAction(prev: GameState, queued: QueuedAction, now: number): ActiveAction | null {
  if (queued.kind === 'gathering' && queued.nodeId) {
    const node = getNodesForSkill(queued.skill as SkillName).find((n) => n.id === queued.nodeId);
    if (!node) return null;
    const tool = getBestTool(queued.skill as SkillName, levelForXp(prev.skills[queued.skill]));
    return {
      ...queued,
      toolId: tool?.id ?? null,
      startTime: now,
      duration: Math.floor(node.baseDuration / (tool ? tool.bonus.speedMultiplier : 1)),
      repetitionsRemaining: queued.repetitions,
    };
  }
  if (queued.kind === 'crafting' && queued.recipeId) {
    const recipe = getRecipeById(queued.recipeId);
    if (!recipe || !hasIngredients(recipe, prev.inventory).canCraft) return null;
    return { ...queued, startTime: now, duration: recipe.duration, repetitionsRemaining: queued.repetitions };
  }
  return null;
}

/** Repeat the current slot until its count drains, then advance FIFO. */
function nextActionState(prev: GameState, repeat: ActiveAction, now: number): Pick<GameState, 'activeAction' | 'actionQueue'> {
  if (repeat.repetitionsRemaining > 1) {
    return { activeAction: { ...repeat, repetitionsRemaining: repeat.repetitionsRemaining - 1 }, actionQueue: prev.actionQueue };
  }
  if (prev.actionQueue.length === 0) return { activeAction: null, actionQueue: [] };
  const [next, ...rest] = prev.actionQueue;
  const activeAction = activateQueuedAction(prev, next, now);
  return activeAction ? { activeAction, actionQueue: rest } : { activeAction: null, actionQueue: [] };
}

export function reduceStartAction(
  prev: GameState,
  skill: SkillId,
  id: string,
  kind: 'gathering' | 'crafting',
  repetitions = 1,
): GameState {
  const now = Date.now();
  const safeRepetitions = Math.max(1, Math.min(MAX_ACTION_REPETITIONS, Math.floor(repetitions) || 1));
  const queued: QueuedAction = kind === 'gathering'
    ? { kind, skill, nodeId: id, repetitions: safeRepetitions }
    : { kind, skill, recipeId: id, repetitions: safeRepetitions };
  const candidate = activateQueuedAction(prev, queued, now);
  if (!candidate) return prev;
  if (!prev.activeAction) return { ...prev, activeAction: candidate };
  if (prev.actionQueue.length >= MAX_ACTION_QUEUE) return prev;
  return { ...prev, actionQueue: [...prev.actionQueue, queued] };
}

export const reduceStopAction = (prev: GameState): GameState => ({ ...prev, activeAction: null, actionQueue: [] });
export const reduceRemoveQueuedAction = (prev: GameState, index: number): GameState => ({
  ...prev,
  actionQueue: prev.actionQueue.filter((_, i) => i !== index),
});
export const reduceClearActionQueue = (prev: GameState): GameState => ({ ...prev, actionQueue: [] });
export const reduceClearActionLog = (prev: GameState): GameState => ({ ...prev, actionLog: [] });

export function reduceClaimTask(prev: GameState, taskId: string, now = Date.now()): GameState {
  const task = cloneTaskState(prev.task);
  const current = getCurrentTasks(task, new Date(now));
  const assignment = [...current.daily, ...current.weekly, ...task.catchUpClaims]
    .find((a) => a.taskId === taskId && a.completed && !a.claimed);
  if (!assignment) return prev;
  const claim = claimTask(task, assignment, (id) => TASK_BY_ID[id]?.reward, now);
  if (!claim) return prev;

  let inventory = prev.inventory;
  for (const item of claim.reward.items ?? []) inventory = addInventory(inventory, item.itemId, item.quantity);
  const skills = { ...prev.skills };
  for (const [skillId, xp] of Object.entries(claim.reward.skillExperience ?? {})) {
    if (skillId in skills) skills[skillId as SkillId] += xp;
  }
  const combatXp = prev.combatXp + claim.reward.experience;
  return {
    ...prev,
    task,
    gold: prev.gold + claim.reward.gold,
    inventory,
    skills,
    combatXp,
    combatLevel: levelForXp(combatXp),
    gains: pushGains(prev.gains, [
      { id: nextId(), text: `Task reward · +${claim.reward.gold} gold · +${claim.reward.experience} XP`, kind: 'rare' },
    ]),
  };
}
export const reduceSetSelectedSkill = (prev: GameState, skill: SkillId): GameState => ({ ...prev, selectedSkill: skill });
export const reduceClearCombatLog = (prev: GameState): GameState => ({
  ...prev,
  combat: { ...prev.combat, combatLog: [] },
});

export function reduceSetCombatTarget(prev: GameState, regionId: string, enemyId: string): GameState {
  const enemy = ALL_ENEMIES.find((e) => e.id === enemyId);
  return {
    ...prev,
    combat: {
      ...prev.combat,
      regionId,
      enemyId,
      mustPick: false,
      enemyHp: enemy?.maxHealth ?? prev.combat.enemyHp,
      encounter: null,
      nextRoundAt: null,
      playerHp: Math.max(1, prev.combat.playerHp),
    },
  };
}

export function reduceFight(prev: GameState): GameState {
  if (prev.combat.playerHp <= 0) return prev;
  return beginEncounter(prev, Date.now());
}

export function reduceToggleAutoFight(prev: GameState): GameState {
  const autoFight = false;
  const enemy = ALL_ENEMIES.find((e) => e.id === prev.combat.enemyId);
  return {
    ...prev,
    combat: {
      ...prev.combat,
      autoFight,
      resting: false,
      encounter: null,
      nextRoundAt: null,
      enemyHp: enemy?.maxHealth ?? prev.combat.enemyHp,
      nextAutoFightAt: autoFight ? Date.now() + AUTO_FIGHT_GAP_MS : null,
    },
  };
}

export function reduceToggleRest(prev: GameState): GameState {
  const enemy = ALL_ENEMIES.find((e) => e.id === prev.combat.enemyId);
  const maxHealth = baseStatsForLevel(prev.combatLevel).maxHealth;
  return {
    ...prev,
    combat: {
      ...prev.combat,
      resting: !prev.combat.resting,
      autoFight: false,
      encounter: null,
      nextRoundAt: null,
      enemyHp: enemy?.maxHealth ?? prev.combat.enemyHp,
      nextAutoFightAt: null,
      playerHp: prev.combat.playerHp <= 0 ? Math.round(maxHealth * 0.4) : prev.combat.playerHp,
    },
  };
}

export function reduceEatFood(prev: GameState): GameState {
  const usable: FoodItem[] = Object.entries(prev.inventory)
    .filter(([id, qty]) => qty > 0 && itemHeal(id) !== undefined)
    .map(([id]) => ({ itemId: id, name: itemName(id), healAmount: itemHeal(id) ?? 0 }));
  if (usable.length === 0) return prev;

  const statsHere = baseStatsForLevel(prev.combatLevel);
  const encounter = prev.combat.encounter;
  const participant =
    encounter && !encounter.finished
      ? { ...encounter.player }
      : createPlayerParticipant(prev.playerName, prev.combatLevel, toStatBlock(statsHere), prev.combat.playerHp, 'melee');
  const food = findBestFood(usable, participant, (participant.health / participant.maxHealth) * 100);
  if (!food) return prev;

  const result = useFood(participant, food);
  const inventory = addInventory(prev.inventory, food.itemId, -1);
  const combatPatch: Partial<CombatView> = {
    playerHp: participant.health,
    combatLog: [...prev.combat.combatLog, ...result.log].slice(-80),
  };
  if (encounter && !encounter.finished) {
    combatPatch.encounter = { ...encounter, player: { ...encounter.player, health: participant.health } };
  }
  return { ...prev, inventory, combat: { ...prev.combat, ...combatPatch } };
}

export function reduceRepairAll(prev: GameState): GameState {
  const durability: Record<string, number> = {};
  for (const uid of Object.keys(prev.durability)) durability[uid] = 100;
  return { ...prev, durability };
}

export function reduceEquipItem(prev: GameState, slot: EquipmentSlot, itemId: string): GameState {
  const qty = prev.inventory[itemId] ?? 0;
  if (qty <= 0) return prev; // don't have the item

  // Check if item can go in this slot
  const def = ITEM_BY_ID[itemId];
  if (!def || def.equipmentSlot !== slot) return prev;

  // Unequip current item in slot (if any)
  const current = prev.equipment[slot];
  const inventory = { ...prev.inventory };
  const equipment: EquipmentSlots = { ...prev.equipment };

  if (current) {
    // Put current item back in inventory
    inventory[current.itemId] = (inventory[current.itemId] ?? 0) + 1;
  }

  // Move new item from inventory to equipment slot
  inventory[itemId] = (inventory[itemId] ?? 0) - 1;
  if ((inventory[itemId] ?? 0) <= 0) {
    delete inventory[itemId];
  }

  // Create new equipment instance. NOTE: uids are item-definition ids for now
  // (dev); unique instance ids for durability/forge/awaken state land with
  // server-side ItemInstance (see gameserver work).
  const newItem = {
    uid: itemId,
    itemId,
    quantity: 1,
    equipped: true,
    durability: 100,
    metadata: {},
  } as InventoryItem;

  equipment[slot] = newItem;

  const now = Date.now();
  return {
    ...prev,
    inventory,
    equipment,
    actionLog: [
      { id: nextId(), skill: 'smithing' as SkillId, text: `Equipped ${ITEM_BY_ID[itemId]?.name ?? itemId}`, rare: false, ts: now },
      ...prev.actionLog,
    ].slice(0, 60),
  };
}

export function reduceUnequipItem(prev: GameState, slot: EquipmentSlot): GameState {
  const current = prev.equipment[slot];
  if (!current) return prev; // nothing to unequip

  const inventory = { ...prev.inventory, [current.itemId]: (prev.inventory[current.itemId] ?? 0) + 1 };
  const equipment: EquipmentSlots = { ...prev.equipment, [slot]: null };

  const now = Date.now();
  return {
    ...prev,
    inventory,
    equipment,
    actionLog: [
      { id: nextId(), skill: 'smithing' as SkillId, text: `Unequipped ${ITEM_BY_ID[current.itemId]?.name ?? current.itemId}`, rare: false, ts: now },
      ...prev.actionLog,
    ].slice(0, 60),
  };
}

// ─── ECONOMY (SHOP) ─────────────────────────────────────────────

// Buy price for a shop row. Gold rows derive their price from the shared item
// value model (item value * shop markup); prestige rows use their explicit
// seal price. Falls back to the authored `price` when a gold item has no
// definition. Keeps pricing math out of the React layer.
export function shopBuyPrice(def: ShopItemDefinition): number {
  if (def.currency === 'gold') {
    const item = ITEM_BY_ID[def.itemId];
    if (item) {
      const derived = Math.max(1, Math.round(computeItemValue(item) * ECONOMY_COST_MODEL.shopMarkup));
      return def.price > 0 ? Math.max(def.price, derived) : derived;
    }
  }
  return def.price;
}

// Sell price for a single unit of a cataloged item (item value * sell ratio).
export function shopSellPrice(itemId: string): number {
  const item = ITEM_BY_ID[itemId];
  if (!item) return 0;
  return Math.max(1, Math.floor(computeItemValue(item) * ECONOMY_COST_MODEL.sellRatio));
}

const findShopItem = (shopItemId: string): ShopItemDefinition | undefined =>
  SHOP_STOCK.find((s) => s.id === shopItemId) ?? PRESTIGE_STOCK.find((s) => s.id === shopItemId);

export function reduceShopBuy(prev: GameState, shopItemId: string): GameState {
  const def = findShopItem(shopItemId);
  if (!def) return prev; // unknown listing
  if (prev.combatLevel < (def.levelRequired ?? 0)) return prev; // level gate

  const boughtSoFar = prev.shopBought[def.id] ?? 0;
  if (def.onetime && boughtSoFar >= 1) return prev; // one-time purchase used
  if (def.stock != null && boughtSoFar >= def.stock) return prev; // finite stock empty

  const price = shopBuyPrice(def);
  if (def.currency === 'gold') {
    if (prev.gold < price) return prev; // insufficient funds
    return {
      ...prev,
      gold: prev.gold - price,
      inventory: addInventory(prev.inventory, def.itemId, 1),
      shopBought: { ...prev.shopBought, [def.id]: boughtSoFar + 1 },
      gains: pushGains(prev.gains, [{ id: nextId(), text: `Bought ${itemName(def.itemId)}`, kind: 'gold' }]),
    };
  }
  // Prestige (dungeon seals) purchases are not spendable yet — blocked until a
  // wallet for seals exists in the client save.
  return prev;
}

export function reduceShopSell(prev: GameState, itemId: string): GameState {
  if ((prev.inventory[itemId] ?? 0) <= 0) return prev; // don't own it
  const price = shopSellPrice(itemId);
  if (price <= 0) return prev; // not sellable (no definition)
  return {
    ...prev,
    gold: prev.gold + price,
    inventory: addInventory(prev.inventory, itemId, -1),
    gains: pushGains(prev.gains, [{ id: nextId(), text: `Sold ${itemName(itemId)} · +${price} gold`, kind: 'gold' }]),
  };
}

// ─── DUNGEONS ────────────────────────────────────────────────────

const allDungeonIds = (): string[] => ALL_DUNGEONS.map((d) => d.id);

// Apply authored encounter modifiers to the primary enemy as discrete stat
// adjustments. Modifiers are displayed in the dungeon UI and this modest
// scaling keeps the fights distinct without reimplementing engine logic.
function applyDungeonModifiers(enemy: EnemyDefinition, modifiers: DungeonModifier[]): EnemyDefinition {
  if (!modifiers || modifiers.length === 0) return enemy;
  const stats = { ...enemy.stats };
  let maxHealth = enemy.maxHealth;
  for (const mod of modifiers) {
    switch (mod) {
      case 'defensive': stats.armor += 4; stats.defense += 4; break;
      case 'offensive': stats.damage += 3; break;
      case 'quick': stats.attackSpeed = Math.min(3.4, stats.attackSpeed + 0.4); break;
      case 'tanky': stats.maxHealth += Math.round(enemy.maxHealth * 0.4); stats.vitality += 4; break;
      case 'regenerating': stats.maxHealth += Math.round(enemy.maxHealth * 0.2); maxHealth = stats.maxHealth; break;
      case 'cursed': stats.accuracy -= 8; stats.critChance = Math.max(0, stats.critChance - 3); break;
    }
  }
  maxHealth = Math.max(enemy.maxHealth, stats.maxHealth, maxHealth);
  return { ...enemy, maxHealth, stats: { ...stats, maxHealth } };
}

// Roll one reward from a dungeon's weighted reward table (shared game-data
// table converted to the engine's WeightedLootTable shape).
function rollDungeonWeighted(tableId: string | undefined): { itemId: string; quantity: number }[] {
  if (!tableId) return [];
  const table = DUNGEON_REWARD_TABLES[tableId];
  if (!table || table.entries.length === 0) return [];
  const picks = selectWeightedEntries({ options: table.entries }, 1, Math.random);
  return picks.map((p) => ({ itemId: p.id, quantity: 1 }));
}

// Resolve a finished dungeon combat encounter: grants encounter rewards and
// (on a full clear) the run rewards + progress/history. Success only passes
// through `tick`, keeping the single-reward guarantee. Exported for tests.
export function resolveDungeonCombat(
  prev: GameState,
  result: 'victory' | 'defeat',
  now: number = Date.now(),
): GameState {
  const run = prev.dungeon.currentRun;
  const dungeon = run ? ALL_DUNGEONS.find((d) => d.id === run.dungeonId) : undefined;
  const encounter = prev.dungeonCombat.encounter;
  if (!run || run.status !== 'active' || !dungeon || !encounter) return prev;

  const gains: GainFeed[] = [];
  const ceiling = (hp: number, max: number) => Math.max(0, Math.min(hp, max));

  if (result === 'victory') {
    const floor = getCurrentEncounter(run, dungeon);
    const encounterXp = floor?.xpReward ?? 0;
    const encounterGold = floor?.goldReward ?? 0;
    const newCombatXp = prev.combatXp + encounterXp;
    const newCombatLevel = levelForXp(newCombatXp);
    if (encounterXp > 0) gains.push({ id: nextId(), text: `+${encounterXp} XP`, kind: 'xp' });
    if (encounterGold > 0) gains.push({ id: nextId(), text: `+${encounterGold} gold`, kind: 'gold' });
    if (newCombatLevel > prev.combatLevel) {
      gains.push({ id: nextId(), text: `Combat level up → ${newCombatLevel}!`, kind: 'level' });
    }

    const resolved = resolveDungeonEncounter(prev.dungeon, dungeon, 'victory', { now });
    const finishedRun = resolved.state.currentRun;
    let inventory = prev.inventory;
    let gold = prev.gold + encounterGold;
    let combatXp = newCombatXp;
    let combatLevel = newCombatLevel;
    let dungeonCompleted = false;

    if (finishedRun && finishedRun.status === 'completed' && finishedRun.result === 'victory') {
      dungeonCompleted = true;
      const rewards = computeDungeonRewards(finishedRun, dungeon);
      combatXp += rewards.xp;
      gold += rewards.gold;
      const newLevel = levelForXp(combatXp);
      if (newLevel > combatLevel) {
        gains.push({ id: nextId(), text: `Combat level up → ${newLevel}!`, kind: 'level' });
      }
      combatLevel = newLevel;
      gains.push({ id: nextId(), text: `Run complete · +${rewards.xp} XP · +${rewards.gold} gold`, kind: 'rare' });
      const itemPile: { itemId: string; quantity: number }[] = [...rewards.items];
      itemPile.push(...rollDungeonWeighted(dungeon.reward.weightedLootTableId));
      for (const drop of itemPile) {
        inventory = addInventory(inventory, drop.itemId, drop.quantity);
        gains.push({
          id: nextId(),
          text: `${drop.quantity > 1 ? `${drop.quantity}x ` : ''}${itemName(drop.itemId)}`,
          kind: ITEM_BY_ID[drop.itemId]?.rarity === 'legendary' || drop.quantity > 3 ? 'rare' : 'item',
        });
      }
      // Record a history entry on the completed progress.
      const progressId = dungeon.id;
      const progress = resolved.state.progress[progressId];
      const historyEntry = {
        dungeonId: dungeon.id,
        completedAt: now,
        floorsCleared: finishedRun.encountersCleared.length,
        success: true,
        isFirstClear: finishedRun.isFirstClear,
        xpGained: rewards.xp,
        goldGained: rewards.gold,
        itemsGained: [...rewards.items],
        timeTakenMs: now - finishedRun.startedAt,
      };
      resolved.state.progress[progressId] = addRunHistory(progress, historyEntry);
    }

    const next = {
      ...prev,
      gold,
      inventory,
      combatXp,
      combatLevel,
      gains: pushGains(prev.gains, gains),
      dungeon: resolved.state,
      dungeonCombat: {
        encounter: null,
        nextRoundAt: null,
        playerHp: ceiling(encounter.player.health, encounter.player.maxHealth),
      },
    };
    return dungeonCompleted
      ? reduceTaskEvent(next, { type: 'dungeon_completed', dungeonId: dungeon.id }, now)
      : next;
  }

  // defeat — run failed on this floor
  const resolved = resolveDungeonEncounter(prev.dungeon, dungeon, 'defeat', { now });
  gains.push({ id: nextId(), text: 'You fell in the depths.', kind: 'info' });
  return {
    ...prev,
    gains: pushGains(prev.gains, gains),
    dungeon: resolved.state,
    dungeonCombat: { encounter: null, nextRoundAt: null, playerHp: 0 },
  };
}

export function reduceDungeonEnter(prev: GameState, dungeonId: string): GameState {
  const dungeon = ALL_DUNGEONS.find((d) => d.id === dungeonId);
  if (!dungeon) return prev;
  if (prev.dungeon.currentRun && prev.dungeon.currentRun.status === 'active') return prev;

  const baseProgress = { ...emptyDungeonState().progress, ...(prev.dungeon.progress ?? {}) };
  const playerDungeon: PlayerDungeonState = { currentRun: prev.dungeon.currentRun, progress: baseProgress };
  const hasKey = (prev.inventory[dungeon.entryRequirement.keyId ?? ''] ?? 0) > 0;
  const start = startDungeonRun(playerDungeon, dungeon, prev.combatLevel, { hasKey });
  if (!start.success || !start.state) return prev;

  let inventory = prev.inventory;
  const requiredKey = dungeon.entryRequirement.keyId;
  if (dungeon.entryRequirement.keyConsumedOnEntry && requiredKey) {
    inventory = addInventory(inventory, requiredKey, -1);
  }
  return {
    ...prev,
    inventory,
    dungeon: start.state,
    dungeonCombat: { encounter: null, nextRoundAt: null, playerHp: 0 },
    actionLog: pushActionLog(prev.actionLog, [{ skill: 'mining', text: `Descended into ${dungeon.name}.`, rare: false }]),
  };
}

export function reduceDungeonFight(prev: GameState): GameState {
  const run = prev.dungeon.currentRun;
  const dungeon = run ? ALL_DUNGEONS.find((d) => d.id === run.dungeonId) : undefined;
  if (!run || run.status !== 'active' || !dungeon) return prev;
  if (prev.dungeonCombat.encounter) return prev; // already fighting

  const floor = getCurrentEncounter(run, dungeon);
  if (!floor) return prev;
  const enemyId = floor.enemyId ?? floor.enemyIds?.[0];
  const enemy = ALL_ENEMIES.find((e) => e.id === enemyId);
  if (!enemy) return prev;

  const stats = baseStatsForLevel(prev.combatLevel);
  const maxHealth = stats.maxHealth;
  const playerHp = prev.dungeonCombat.playerHp > 0 ? Math.min(prev.dungeonCombat.playerHp, maxHealth) : maxHealth;
  const player = createPlayerParticipant(prev.playerName || 'Hunter', prev.combatLevel, toStatBlock(stats), playerHp, 'melee');
  const modified = applyDungeonModifiers(enemy, floor.modifiers ?? []);
  const encounter = startCombatEncounter(player, createEnemyParticipant(modified));

  return {
    ...prev,
    dungeonCombat: {
      encounter,
      nextRoundAt: Date.now() + roundDelayMs(encounter),
      playerHp,
    },
  };
}

export function reduceAbandonDungeon(prev: GameState): GameState {
  const run = prev.dungeon.currentRun;
  const dungeon = run ? ALL_DUNGEONS.find((d) => d.id === run.dungeonId) : undefined;
  if (!run || run.status !== 'active' || !dungeon) return prev;
  const resolved = resolveDungeonEncounter(prev.dungeon, dungeon, 'retreat', { now: Date.now() });
  return {
    ...prev,
    gains: pushGains(prev.gains, [{ id: nextId(), text: 'You retreated from the depths.', kind: 'info' }]),
    dungeon: resolved.state,
    dungeonCombat: { encounter: null, nextRoundAt: null, playerHp: 0 },
  };
}

export function reduceClearDungeon(prev: GameState): GameState {
  if (!prev.dungeon.currentRun) return prev;
  return {
    ...prev,
    dungeon: clearDungeonRun(prev.dungeon),
    dungeonCombat: { encounter: null, nextRoundAt: null, playerHp: 0 },
  };
}
