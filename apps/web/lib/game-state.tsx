'use client';

// Runeswick-style idle game state driving the whole web shell:
// - per-skill cumulative XP (leveled via the engine's XP curve)
// - a live "current action" loop (gathering / crafting) that repeats
// - combat with manual + auto-fight, persistent HP, rest, and food
// - inventory, gold, and a gains feed
// - localStorage persistence per player

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  SkillId,
  FoodItem,
  CombatLogEntry,
  CombatEncounter,
  BaseStats,
  StatBlock,
  EquipmentSlots,
  EquipmentSlot,
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
  type SkillName,
} from '@premium-rpg/game-engine';
import { ALL_ENEMIES, LOOT_TABLES, ITEM_BY_ID } from '@premium-rpg/game-data';
import { usePlayer } from './use-player';
import { baseStatsForLevel, cumulativeXpForLevel } from './player-summary';
import { itemName, itemHeal } from './item-names';
import { useNotifications } from '@/components/ui/notification';

const TICK_MS = 250;
const AUTO_FIGHT_GAP_MS = 1100;
const REST_HEAL_FRACTION = 0.02; // of max HP per second
const SAVE_PREFIX = 'premium-rpg:game:';

// Starter satchel for a brand-new save (no save file yet). Enough ore to try
// mining + the Forge pipeline and a first alchemy brew, so new hunters aren't
// blocked on materials they can't yet source. Returning players keep their
// own save inventory untouched.
const STARTING_SATCHEL: Record<string, number> = {
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
}

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

export interface GameState {
  playerName: string;
  skills: Record<SkillId, number>; // cumulative XP per skill
  gold: number;
  inventory: Record<string, number>;
  durability: Record<string, number>;
  equipment: EquipmentSlots;
  activeAction: ActiveAction | null;
  actionLog: ActionLogEntry[];
  gains: GainFeed[];
  combat: CombatView;
  combatXp: number; // cumulative character XP
  combatLevel: number;
  selectedSkill: SkillId;
}

export interface SkillView {
  skill: SkillId;
  level: number;
  xp: number;
  intoLevel: number;
  needNext: number;
  pct: number;
}

interface SaveShape {
  skills: Record<SkillId, number>;
  gold: number;
  inventory: Record<string, number>;
  durability: Record<string, number>;
  equipment: EquipmentSlots;
  combatXp: number;
  combatLevel: number;
  selectedSkill: SkillId;
}

let seq = 0;
const nextId = () => ++seq;

// Mirrors the engine XP step (BASE_XP * level^XP_GROWTH) for bar math.
const BASE_XP = 52;
const XP_GROWTH = 1.1;
function xpStepForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, XP_GROWTH));
}

function toStatBlock(stats: BaseStats): StatBlock {
  return {
    ...stats,
    damage: Math.floor(stats.strength * 0.9),
    defense: Math.floor(stats.armor * 0.6),
  };
}

function loadSave(playerId: string): SaveShape | null {
  try {
    const raw = localStorage.getItem(`${SAVE_PREFIX}${playerId}`);
    return raw ? (JSON.parse(raw) as SaveShape) : null;
  } catch {
    return null;
  }
}

function persistSave(playerId: string, state: GameState): void {
  try {
    const shape: SaveShape = {
      skills: state.skills,
      gold: state.gold,
      inventory: state.inventory,
      durability: state.durability,
      equipment: state.equipment,
      combatXp: state.combatXp,
      combatLevel: state.combatLevel,
      selectedSkill: state.selectedSkill,
    };
    localStorage.setItem(`${SAVE_PREFIX}${playerId}`, JSON.stringify(shape));
  } catch {
    // quota / privacy-mode: ignore
  }
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
function needsStarterSatchel(save: SaveShape | null | undefined): boolean {
  if (!save) return true;
  return Object.keys(save.inventory ?? {}).length === 0;
}

function emptyEquipment(): EquipmentSlots {
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

function seedState(playerId: string): GameState {
  const save = loadSave(playerId);
  return {
    playerName: '',
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
    activeAction: null,
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
  };
}

// Build a working state seeded both from the shell player and any saved file.
function mergeSeed(playerId: string, name: string, skills: Record<SkillId, { level: number; xp: number }>, combatLevel: number, equipment: EquipmentSlots, gold: number): GameState {
  const base = seedState(playerId);
  const savedSkills = base.skills;
  const savedEquipment = base.equipment;
  const out: GameState = {
    ...base,
    playerName: name,
    combatXp: base.combatXp > 0 ? base.combatXp : cumulativeXpForLevel(combatLevel),
    combatLevel: base.combatLevel > 0 ? base.combatLevel : combatLevel,
    skills: {
      mining: savedSkills.mining > 0 ? savedSkills.mining : skills.mining.xp,
      woodcutting: savedSkills.woodcutting > 0 ? savedSkills.woodcutting : skills.woodcutting.xp,
      fishing: savedSkills.fishing > 0 ? savedSkills.fishing : skills.fishing.xp,
      smelting: savedSkills.smelting > 0 ? savedSkills.smelting : skills.smelting.xp,
      smithing: savedSkills.smithing > 0 ? savedSkills.smithing : skills.smithing.xp,
      cooking: savedSkills.cooking > 0 ? savedSkills.cooking : skills.cooking.xp,
      fletching: savedSkills.fletching > 0 ? savedSkills.fletching : skills.fletching.xp,
      alchemy: savedSkills.alchemy > 0 ? savedSkills.alchemy : skills.alchemy.xp,
      runecrafting: savedSkills.runecrafting > 0 ? savedSkills.runecrafting : skills.runecrafting.xp,
    },
    gold: base.gold > 0 ? base.gold : Math.max(0, gold),
    equipment: Object.keys(savedEquipment).some(k => savedEquipment[k as keyof EquipmentSlots]) ? savedEquipment : equipment,
    durability: Object.keys(base.durability).length > 0 ? base.durability : initialDurability(equipment),
    combat: {
      ...base.combat,
      playerHp: Math.max(1, Math.min(base.combat.playerHp, 100)),
    },
  };
  return out;
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

function pushActionLog(log: ActionLogEntry[], entries: { skill: SkillId; text: string; rare: boolean }[]): ActionLogEntry[] {
  const now = Date.now();
  return [...log, ...entries.map((e) => ({ ...e, id: nextId(), ts: now }))].slice(-60);
}

function roundDelayMs(encounter: CombatEncounter): number {
  return getRoundDuration(encounter.player.stats.attackSpeed, encounter.enemy.stats.attackSpeed) * 1000;
}

function startEncounterState(prev: GameState, now: number): GameState {
  const enemy = ALL_ENEMIES.find((e) => e.id === prev.combat.enemyId);
  if (!enemy || prev.combat.encounter) return prev;
  const stats = baseStatsForLevel(prev.combatLevel);
  const player = createPlayerParticipant(prev.playerName, prev.combatLevel, toStatBlock(stats), Math.max(1, prev.combat.playerHp), 'melee');
  const encounter = startCombatEncounter(player, createEnemyParticipant(enemy));
  return {
    ...prev,
    combat: {
      ...prev.combat,
      encounter,
      enemyHp: enemy.maxHealth,
      nextRoundAt: now + roundDelayMs(encounter),
      resting: false,
    },
  };
}

function tick(prev: GameState, now: number): GameState {
  let state = prev;

  // ---- Active action (gathering / crafting) ----
  const action = prev.activeAction;
  if (action) {
    const elapsed = now - action.startTime;
    if (elapsed >= action.duration) {
      if (action.kind === 'gathering' && action.nodeId) {
        const node = getNodesForSkill(action.skill as SkillName).find((n) => n.id === action.nodeId);
        if (!node) {
          state = { ...state, activeAction: null };
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
            gains.push({ id: nextId(), text: `${r.quantity > 1 ? `${r.quantity}x ` : ''}${itemName(r.itemId)}`, kind: r.rare ? 'rare' : 'item' });
          }
          if (grow.levelsGained > 0) {
            gains.push({ id: nextId(), text: `${itemName(node.id)} — ${action.skill} level ${grow.newLevel}!`, kind: 'level' });
          }
          const newTool = getBestTool(action.skill as SkillName, grow.newLevel);
          const duration = Math.floor(node.baseDuration / (newTool ? newTool.bonus.speedMultiplier : 1));
          state = {
            ...state,
            skills: { ...state.skills, [action.skill]: grow.newXp },
            inventory,
            gains: pushGains(state.gains, gains),
            actionLog: pushActionLog(state.actionLog, [{ skill: action.skill, text: `${itemName(node.id)} → ${reward.xpGained} XP`, rare: false }]),
            activeAction: { kind: 'gathering', skill: action.skill, nodeId: node.id, toolId: newTool?.id ?? null, startTime: now, duration },
          };
        }
      } else if (action.kind === 'crafting' && action.recipeId) {
        const recipe = getRecipeById(action.recipeId);
        if (!recipe) {
          state = { ...state, activeAction: null };
        } else {
          const check = hasIngredients(recipe, state.inventory);
          if (!check.canCraft) {
            state = {
              ...state,
              activeAction: null,
              actionLog: pushActionLog(state.actionLog, [{ skill: action.skill, text: `Stopped ${recipe.name}: missing ingredients`, rare: false }]),
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
              gains.push({ id: nextId(), text: `${o.quantity > 1 ? `${o.quantity}x ` : ''}${itemName(o.itemId)}`, kind: 'item' });
            }
            if (grow.levelsGained > 0) {
              gains.push({ id: nextId(), text: `${recipe.name} — ${action.skill} level ${grow.newLevel}!`, kind: 'level' });
            }
            state = {
              ...state,
              skills: { ...state.skills, [action.skill]: grow.newXp },
              inventory,
              gains: pushGains(state.gains, gains),
              actionLog: pushActionLog(state.actionLog, [{ skill: action.skill, text: `${recipe.name} crafted`, rare: false }]),
              activeAction: { kind: 'crafting', skill: action.skill, recipeId: recipe.id, startTime: now, duration: recipe.duration },
            };
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
        const newCombatLevel = levelForXp(newCombatXp);
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
          gains.push({ id: nextId(), text: `${drop.quantity > 1 ? `${drop.quantity}x ` : ''}${itemName(drop.itemId)}`, kind: ITEM_BY_ID[drop.itemId]?.rarity === 'legendary' || drop.quantity > 3 ? 'rare' : 'item' });
        }
        state = {
          ...state,
          gold: state.gold + enemy.goldReward,
          inventory,
          combatXp: newCombatXp,
          combatLevel: newCombatLevel,
          gains: pushGains(state.gains, gains),
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
      } else {
        const enemy = ALL_ENEMIES.find((e) => e.id === combat.enemyId) ?? ALL_ENEMIES[0];
        state = {
          ...state,
          gains: pushGains(state.gains, [{ id: nextId(), text: `${enemy.name} defeated you.`, kind: 'info' }]),
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

  // ---- Combat: auto-fight start / rest ----
  if (combat.autoFight && !combat.resting && combat.playerHp > 0 && !combat.encounter && combat.nextAutoFightAt && now >= combat.nextAutoFightAt) {
    state = startEncounterState(state, now);
  } else if (combat.resting && combat.playerHp > 0 && !combat.encounter) {
    const stats = baseStatsForLevel(state.combatLevel);
    const heal = Math.ceil(stats.maxHealth * REST_HEAL_FRACTION * (TICK_MS / 1000));
    const playerHp = Math.min(stats.maxHealth, combat.playerHp + heal);
    state = { ...state, combat: { ...state.combat, playerHp, resting: playerHp < stats.maxHealth } };
  }

  return state;
}

interface GameContextValue {
  state: GameState;
  playerId: string;
  stats: BaseStats;
  maxHealth: number;
  skillView: (skill: SkillId) => SkillView;
  foods: FoodItem[];
  startAction: (skill: SkillId, id: string, kind: 'gathering' | 'crafting') => void;
  stopAction: () => void;
  clearActionLog: () => void;
  setSelectedSkill: (skill: SkillId) => void;
  setCombatTarget: (regionId: string, enemyId: string) => void;
  fight: () => void;
  toggleAutoFight: () => void;
  toggleRest: () => void;
  eatFood: () => void;
  clearCombatLog: () => void;
  repairAll: () => void;
  resetProgress: () => void;
  equipItem: (slot: EquipmentSlot, itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children, resetNonce }: { children: ReactNode; resetNonce?: number }) {
  const { player } = usePlayer();
  const playerId = player.id;
  const { addNotification } = useNotifications();

  const [state, setState] = useState<GameState>(() =>
    mergeSeed(playerId, player.name, player.skills, player.combatLevel, player.equipment, player.currency.gold),
  );

  // Capture player identity; if the player changes (logout/login) reset.
  const initialPlayerId = useState(playerId)[0];
  useEffect(() => {
    if (playerId !== initialPlayerId) {
      setState(mergeSeed(playerId, player.name, player.skills, player.combatLevel, player.equipment, player.currency.gold));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, initialPlayerId]);

  // Reset handler (settings "New save").
  useEffect(() => {
    if (!resetNonce) return;
    setState(mergeSeed(playerId, player.name, player.skills, player.combatLevel, player.equipment, player.currency.gold));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce]);

  // Tick loop.
  const [, setFrame] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setState((prev) => tick(prev, Date.now()));
      setFrame((f) => f + 1);
    }, TICK_MS);
    return () => clearInterval(iv);
  }, []);

  // Persist (debounced).
  useEffect(() => {
    const t = setTimeout(() => persistSave(playerId, state), 800);
    return () => clearTimeout(t);
  }, [state, playerId]);

  const stats = baseStatsForLevel(state.combatLevel);
  const maxHealth = stats.maxHealth;

  const skillView = useCallback(
    (skill: SkillId): SkillView => {
      const xp = state.skills[skill];
      const level = levelForXp(xp);
      const intoLevel = xp - cumulativeXpForLevel(level);
      const needNext = xpStepForLevel(level);
      return { skill, level, xp, intoLevel, needNext, pct: needNext > 0 ? Math.min(100, Math.round((intoLevel / needNext) * 100)) : 100 };
    },
    [state.skills],
  );

  const foods: FoodItem[] = Object.entries(state.inventory)
    .filter(([id, qty]) => qty > 0 && itemHeal(id) !== undefined)
    .map(([id]) => ({ itemId: id, name: itemName(id), healAmount: itemHeal(id) ?? 0 }));

  const startAction = useCallback((skill: SkillId, id: string, kind: 'gathering' | 'crafting') => {
    setState((prev) => {
      const now = Date.now();
      if (kind === 'gathering') {
        const node = getNodesForSkill(skill as SkillName).find((n) => n.id === id);
        if (!node) return prev;
        const level = levelForXp(prev.skills[skill]);
        const tool = getBestTool(skill as SkillName, level);
        const duration = Math.floor(node.baseDuration / (tool ? tool.bonus.speedMultiplier : 1));
        return { ...prev, activeAction: { kind, skill, nodeId: node.id, toolId: tool?.id ?? null, startTime: now, duration } };
      }
      const recipe = getRecipeById(id);
      if (!recipe) return prev;
      return { ...prev, activeAction: { kind, skill, recipeId: recipe.id, startTime: now, duration: recipe.duration } };
    });
  }, []);

  const stopAction = useCallback(() => setState((prev) => ({ ...prev, activeAction: null })), []);
  const clearActionLog = useCallback(() => setState((prev) => ({ ...prev, actionLog: [] })), []);
  const setSelectedSkill = useCallback((skill: SkillId) => setState((prev) => ({ ...prev, selectedSkill: skill })), []);
  const clearCombatLog = useCallback(() => setState((prev) => ({ ...prev, combat: { ...prev.combat, combatLog: [] } })), []);

  const setCombatTarget = useCallback((regionId: string, enemyId: string) => {
    setState((prev) => {
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
    });
  }, []);

  const fight = useCallback(() => {
    setState((prev) => {
      if (prev.combat.playerHp <= 0) return prev;
      return startEncounterState(prev, Date.now());
    });
  }, []);

  const toggleAutoFight = useCallback(() => {
    setState((prev) => {
      const autoFight = !prev.combat.autoFight;
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
    });
  }, []);

  const toggleRest = useCallback(() => {
    setState((prev) => {
      const enemy = ALL_ENEMIES.find((e) => e.id === prev.combat.enemyId);
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
    });
  }, [maxHealth]);

  const eatFood = useCallback(() => {
    setState((prev) => {
      const usable = foods.filter((f) => prev.inventory[f.itemId] > 0);
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
    });
  }, [foods]);

  const repairAll = useCallback(() => {
    setState((prev) => {
      const durability: Record<string, number> = {};
      for (const uid of Object.keys(prev.durability)) durability[uid] = 100;
      return { ...prev, durability };
    });
  }, []);

  const resetProgress = useCallback(() => {
    try {
      localStorage.removeItem(`${SAVE_PREFIX}${playerId}`);
    } catch {
      // ignore
    }
    setState(mergeSeed(playerId, player.name, player.skills, player.combatLevel, player.equipment, player.currency.gold));
    addNotification('info', 'New save', 'Progress was reset.');
  }, [playerId, player, addNotification]);

  const equipItem = useCallback((slot: EquipmentSlot, itemId: string) => {
    setState((prev) => {
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

      // Create new equipment item
      const newItem = {
        uid: itemId,
        itemId,
        quantity: 1,
        equipped: true,
        durability: 100,
        metadata: {},
      } as import('@premium-rpg/shared-types').InventoryItem;

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
    });
  }, []);

  const unequipItem = useCallback((slot: EquipmentSlot) => {
    setState((prev) => {
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
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        playerId,
        stats,
        maxHealth,
        skillView,
        foods,
        startAction,
        stopAction,
        clearActionLog,
        setSelectedSkill,
        setCombatTarget,
        fight,
        toggleAutoFight,
        toggleRest,
        eatFood,
        clearCombatLog,
        repairAll,
        resetProgress,
        equipItem,
        unequipItem,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}