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
  Rarity,
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
  createQuestState,
  startQuest,
  processQuestEvent,
  completeQuest,
  isQuestCompletable,
  isQuestAvailable,
  createAchievementState,
  processAchievementEvent,
  createCollectionState,
  registerEntries,
  processCollectionEvent,
  createEmptyBestiary,
  discoverEnemy,
  recordEnemyDefeat,
  dailyKey,
  weeklyKey,
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
  QUESTS,
  QUEST_BY_ID,
  ACHIEVEMENTS,
  COLLECTION_ENTRIES,
  COLLECTION_SET_REWARDS,
} from '@premium-rpg/game-data';
import { baseStatsForLevel, cumulativeXpForLevel } from '@/lib/player-summary';
import { itemName, itemHeal } from '@/lib/item-names';
import { GAME_SAVE_SCHEMA_VERSION, type EconomyTransaction, type GamePersistence, type GameSaveData } from '@/lib/persistence/game-persistence';
import type { DungeonCombatSlice } from '@/lib/persistence/game-persistence';
import type { DailyBattleState, BattleHistoryEntry, EmberColossusEventState } from '@/lib/persistence/game-persistence';
import type { RetentionState, InvestmentState, InvestmentRecord, MarketplaceAssetType, MarketplaceListing, MarketplaceState, SummonClass, SummonRarity, SummoningState, ForgedEquipmentAffix } from '@/lib/persistence/game-persistence';
import { COMBAT_LEVEL_CAP, derivedCombatStats } from '@/lib/combat-progression';
import { EVENT_BY_ID, EMBER_EVENT_ID, emptyParticipation, eventDay, eventStatus, type EventFrameworkState } from '@/lib/game/events';

export const TICK_MS = 250;
export const AUTO_FIGHT_GAP_MS = 1100;
export const REST_HEAL_FRACTION = 0.02; // of max HP per second
export const MAX_ACTION_QUEUE = 10;
export const MAX_ACTION_REPETITIONS = 1000;
export const MAX_OFFLINE_CATCHUP_PER_TICK = 500;
export const REWARDED_BATTLE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const MARKETPLACE_LISTING_FEE = 0.075;
export const SUMMON_COST = 1;
export const SUMMON_BURN = 0.5;
export const SUMMON_REWARD_POOL = 0.4;
export const SUMMON_TREASURY = 0.1;
export const EMBER_COLOSSUS_START = EVENT_BY_ID[EMBER_EVENT_ID].startsAt;
export const EMBER_COLOSSUS_END = EVENT_BY_ID[EMBER_EVENT_ID].endsAt;
export const EMBER_COLOSSUS_BHC_REWARD = 0.25;

export function emberEventDay(now = Date.now()): string {
  return eventDay(now);
}

export function emberEventActive(now = Date.now()): boolean {
  return eventStatus(EVENT_BY_ID[EMBER_EVENT_ID], now) === 'active';
}

export function reduceChallengeEvent(prev: GameState, eventId: string, roll = Math.random(), now = Date.now()): GameState {
  const definition = EVENT_BY_ID[eventId];
  const day = eventDay(now);
  const participation = prev.events.participation[eventId] ?? emptyParticipation();
  if (!definition?.playable || !definition.rewards || eventStatus(definition, now) !== 'active' || participation.attemptsByDay[day] || prev.marketplace.heroLocked) return prev;
  const victory = roll < Math.min(0.95, 0.35 + prev.combatLevel * 0.01);
  let inventory = prev.inventory;
  let bhc = prev.investment.bhc;
  let weaponClaimed = participation.featuredRewardClaimed;
  const gains: GainFeed[] = [{ id: nextId(), text: victory ? `${definition.name} falls!` : `${definition.name} drove you back.`, kind: victory ? 'rare' : 'info' }];
  if (victory) {
    for (const item of definition.rewards.items) inventory = addInventory(inventory, item.itemId, item.quantity);
    bhc += definition.rewards.bhc;
    gains.push({ id: nextId(), text: definition.rewardSummary, kind: 'rare' });
    if (!weaponClaimed && definition.rewards.firstVictoryItemId) {
      inventory = addInventory(inventory, definition.rewards.firstVictoryItemId, 1);
      weaponClaimed = true;
      gains.push({ id: nextId(), text: itemName(definition.rewards.firstVictoryItemId), kind: 'rare' });
    }
  }
  const nextParticipation = { attemptsByDay: { ...participation.attemptsByDay, [day]: true }, victories: participation.victories + (victory ? 1 : 0), featuredRewardClaimed: weaponClaimed, history: [{ day, victory, createdAt: now }, ...participation.history].slice(0, 30) };
  return {
    ...prev, inventory, investment: { ...prev.investment, bhc }, gains: pushGains(prev.gains, gains),
    events: { participation: { ...prev.events.participation, [eventId]: nextParticipation } },
    emberColossus: {
      attemptsByDay: nextParticipation.attemptsByDay, victories: nextParticipation.victories,
      weaponClaimed: nextParticipation.featuredRewardClaimed, history: nextParticipation.history,
    },
  };
}

export function reduceChallengeEmberColossus(prev: GameState, roll = Math.random(), now = Date.now()): GameState {
  return reduceChallengeEvent(prev, EMBER_EVENT_ID, roll, now);
}
export const SUMMONED_HERO_BATTLE_CAP = 5;

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
  forgedEquipmentRarities: Record<string, Rarity[]>;
  forgedEquipmentAffixes: Record<string, Array<ForgedEquipmentAffix | null>>;
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
  quest: import('@premium-rpg/shared-types').PlayerQuestState;
  achievement: import('@premium-rpg/shared-types').PlayerAchievementState;
  collection: import('@premium-rpg/shared-types').PlayerCollectionState;
  bestiary: import('@premium-rpg/shared-types').BestiaryState;
  retention: RetentionState;
  investment: InvestmentState;
  marketplace: MarketplaceState;
  summoning: SummoningState;
  emberColossus: EmberColossusEventState;
  events: EventFrameworkState;
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

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Roll forge quality without ever lowering the item's native rarity. */
export function rollForgedRarity(base: Rarity, smithingLevel: number, roll = Math.random()): Rarity {
  const baseIndex = RARITY_ORDER.indexOf(base);
  const levelBonus = Math.max(0, Math.min(99, smithingLevel - 1)) / 500;
  const legendaryChance = 0.005 + levelBonus * 0.05;
  const doubleUpgradeChance = 0.035 + levelBonus * 0.15;
  const singleUpgradeChance = 0.22 + levelBonus;
  const upgrade = roll < legendaryChance ? 4 : roll < doubleUpgradeChance ? 2 : roll < singleUpgradeChance ? 1 : 0;
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, baseIndex + upgrade)];
}

export function forgedInventoryRarity(state: Pick<GameState, 'forgedEquipmentRarities'>, itemId: string, fallback: Rarity): Rarity {
  const rolls = state.forgedEquipmentRarities[itemId] ?? [];
  return rolls.reduce((best, rarity) => RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(best) ? rarity : best, fallback);
}

const FORGED_AFFIXES: Array<{ stat: ForgedEquipmentAffix['stat']; name: string }> = [
  { stat: 'strength', name: 'Mighty' }, { stat: 'agility', name: 'Swift' },
  { stat: 'intelligence', name: 'Sage' }, { stat: 'vitality', name: 'Stalwart' },
  { stat: 'armor', name: 'Warded' },
];

export function rollForgedAffix(rarity: Rarity, smithingLevel: number, roll = Math.random()): ForgedEquipmentAffix | null {
  const rarityIndex = RARITY_ORDER.indexOf(rarity);
  if (rarityIndex === 0 && roll > 0.25 + Math.min(0.2, smithingLevel / 500)) return null;
  const pick = FORGED_AFFIXES[Math.min(FORGED_AFFIXES.length - 1, Math.floor(roll * FORGED_AFFIXES.length))];
  return { ...pick, value: Math.max(1, 1 + rarityIndex * 2 + Math.floor(smithingLevel / 20)) };
}

export function inventoryRarityStacks(state: Pick<GameState, 'forgedEquipmentRarities'>, itemId: string, total: number, fallback: Rarity): Array<{ rarity: Rarity; quantity: number }> {
  const counts = new Map<Rarity, number>();
  for (const rarity of state.forgedEquipmentRarities[itemId] ?? []) counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
  const untracked = Math.max(0, total - [...counts.values()].reduce((sum, value) => sum + value, 0));
  if (untracked > 0) counts.set(fallback, (counts.get(fallback) ?? 0) + untracked);
  return [...counts.entries()].sort((a, b) => RARITY_ORDER.indexOf(b[0]) - RARITY_ORDER.indexOf(a[0])).map(([rarity, quantity]) => ({ rarity, quantity }));
}

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

function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function previousDayKey(now: number): string {
  return dayKey(now - 86_400_000);
}

function seedRetention(saved: RetentionState | undefined, activeAction: ActiveAction | null, now = Date.now()): RetentionState {
  const base: RetentionState = saved ?? {
    loginDays: {}, loginStreak: 0, longestLoginStreak: 0, lastLoginDay: null,
    lastSeenAt: now, offlineReport: null, mailbox: [], regionReputation: {}, visitedRegions: [], rerolls: {},
  };
  const today = dayKey(now);
  const awayMs = Math.max(0, now - (base.lastSeenAt || now));
  const next = { ...base, loginDays: { ...base.loginDays }, mailbox: [...base.mailbox], rerolls: { ...base.rerolls } };
  if (awayMs >= 60_000) next.offlineReport = { awayMs, actionLabel: activeAction ? `${activeAction.skill} continued while away` : null, createdAt: now };
  if (!next.loginDays[today]) {
    next.loginStreak = next.lastLoginDay === previousDayKey(now) ? next.loginStreak + 1 : 1;
    next.longestLoginStreak = Math.max(next.longestLoginStreak, next.loginStreak);
    next.lastLoginDay = today;
    next.loginDays[today] = true;
    const gold = 50 + Math.min(7, next.loginStreak) * 25;
    next.mailbox.unshift({ id: `login-${today}`, title: `Day ${next.loginStreak} login reward`, message: `The frontier remembers your return.`, createdAt: now, claimed: false, reward: { gold } });
  }
  next.lastSeenAt = now;
  return next;
}

function seedMarketplace(saved: MarketplaceState | undefined): MarketplaceState {
  if (saved) return { ...saved, listingFee: MARKETPLACE_LISTING_FEE };
  const now = Date.now();
  const demo: MarketplaceListing[] = [
    ['mkt-rune', 'Ashen Wolf', 'weapon', 'rune_sword', 'Rune Sword', 4.5, { rarity: 'epic', forgeLevel: 3 }],
    ['mkt-dragon', 'Vale Keeper', 'weapon', 'dragon_sword', 'Dragon Sword', 7.25, { rarity: 'legendary', forgeLevel: 5, awakening: 1 }],
    ['mkt-mithril', 'Iron Warden', 'weapon', 'mithril_sword', 'Mithril Sword', 2.75, { rarity: 'rare', forgeLevel: 2 }],
    ['mkt-void', 'Nyx', 'weapon', 'void_blade', 'Void Blade', 12, { rarity: 'legendary', forgeLevel: 7, awakening: 2 }],
    ['mkt-hero-1', 'Northwatch', 'hero', 'hero-riven', 'Riven · Level 24 Warrior', 9.5, { name: 'Riven', class: 'warrior', combatLevel: 24, nextBattleAt: now + 3_600_000 }],
    ['mkt-hero-2', 'Ember Guild', 'hero', 'hero-lyra', 'Lyra · Level 38 Mage', 16, { name: 'Lyra', class: 'mage', combatLevel: 38, nextBattleAt: 0 }],
    ['mkt-hero-3', 'Dawn Company', 'hero', 'hero-kael', 'Kael · Level 17 Rogue', 6.25, { name: 'Kael', class: 'rogue', combatLevel: 17, nextBattleAt: now + 12_000_000 }],
    ['mkt-steel', 'Copper Fox', 'weapon', 'steel_sword', 'Steel Sword', 1.4, { rarity: 'uncommon', forgeLevel: 1 }],
  ].map(([id, sellerName, assetType, assetId, title, price, snapshot], index) => ({
    id: String(id), idempotencyKey: `seed-${id}`, sellerId: `market-seller-${index}`, sellerName: String(sellerName),
    assetType: assetType as MarketplaceAssetType, assetId: String(assetId), title: String(title), price: Number(price),
    listingFee: MARKETPLACE_LISTING_FEE, snapshot: snapshot as Record<string, unknown>, status: 'active', buyerId: null,
    createdAt: now - (index + 1) * 3_600_000, completedAt: null,
  }));
  return { listingFee: MARKETPLACE_LISTING_FEE, listings: demo, history: [], acquiredHeroes: [], heroLocked: false };
}

function seedSummoning(saved: SummoningState | undefined): SummoningState {
  return saved ?? { heroes: [], history: [], pity: 0, totalSummons: 0, essence: 0, rewardPool: 0, treasury: 0, battleDay: null, battlesToday: 0 };
}

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
  const quest = save?.quest ?? createQuestState();
  const achievement = save?.achievement ?? createAchievementState(ACHIEVEMENTS);
  const collection = save?.collection ?? createCollectionState();
  registerEntries(collection, COLLECTION_ENTRIES);
  const bestiary = save?.bestiary ?? createEmptyBestiary(ALL_ENEMIES);
  const retainedAction = save?.activeAction ? { ...save.activeAction, repetitionsRemaining: Math.max(1, Math.min(MAX_ACTION_REPETITIONS, save.activeAction.repetitionsRemaining ?? 1)) } : null;
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
    forgedEquipmentRarities: save?.forgedEquipmentRarities ?? {},
    forgedEquipmentAffixes: save?.forgedEquipmentAffixes ?? {},
    activeAction: retainedAction,
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
    quest,
    achievement,
    collection,
    bestiary,
    retention: seedRetention(save?.retention, retainedAction),
    investment: save?.investment ?? { bhc: 0, burnedTotal: 0, heroRebirth: 0, heroReforge: 0, heroBonusStat: null, heroBonusValue: 0, history: [] },
    marketplace: seedMarketplace(save?.marketplace),
    summoning: seedSummoning(save?.summoning),
    emberColossus: save?.emberColossus ?? { attemptsByDay: {}, victories: 0, weaponClaimed: false, history: [] },
    events: save?.events ?? { participation: save?.emberColossus ? { [EMBER_EVENT_ID]: { attemptsByDay: save.emberColossus.attemptsByDay, victories: save.emberColossus.victories, featuredRewardClaimed: save.emberColossus.weaponClaimed, history: save.emberColossus.history } } : {} },
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
    forgedEquipmentRarities: state.forgedEquipmentRarities,
    forgedEquipmentAffixes: state.forgedEquipmentAffixes,
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
    quest: state.quest,
    achievement: state.achievement,
    collection: state.collection,
    bestiary: state.bestiary,
    retention: { ...state.retention, lastSeenAt: Date.now() },
    investment: state.investment,
    marketplace: state.marketplace,
    summoning: state.summoning,
    emberColossus: state.emberColossus,
    events: state.events,
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
  const completedGains = result.newlyCompleted.map((assignment) => ({
    id: nextId(),
    text: `Task complete: ${TASK_BY_ID[assignment.taskId]?.name ?? assignment.taskId}`,
    kind: 'rare' as const,
  }));
  let next: GameState = result.changed.length > 0 ? { ...prev, task, gains: pushGains(prev.gains, completedGains) } : prev;

  const quest = structuredClone(next.quest);
  const questContext = {
    level: next.combatLevel,
    skills: Object.fromEntries(Object.entries(next.skills).map(([id, xp]) => [id, levelForXp(xp)])),
    region: next.combat.regionId,
    unlocks: quest.unlocks,
    completedQuestIds: Object.keys(quest.completed),
  };
  for (const definition of QUESTS.filter((entry) => entry.category === 'main')) {
    if (isQuestAvailable(definition, quest, questContext)) startQuest(quest, definition, now);
  }
  processQuestEvent(quest, QUEST_BY_ID, event, now);

  let gold = next.gold;
  let combatXp = next.combatXp;
  let inventory = next.inventory;
  let skills = next.skills;
  const collection = structuredClone(next.collection);
  const retention = structuredClone(next.retention);
  const questGains: GainFeed[] = [];
  for (const [questId, progress] of Object.entries(quest.active)) {
    if (!isQuestCompletable(progress)) continue;
    const definition = QUEST_BY_ID[questId];
    if (!definition) continue;
    const grant = completeQuest(quest, definition, now);
    if (!grant) continue;
    gold += grant.gold;
    combatXp += grant.experience;
    for (const item of grant.items) inventory = addInventory(inventory, item.itemId, item.quantity);
    skills = { ...skills };
    for (const [skillId, xp] of Object.entries(grant.skillExperience)) if (skillId in skills) skills[skillId as SkillId] += xp;
    for (const entryId of grant.collectionEntries) processCollectionEvent(collection, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'grant_entry', entryId }, now);
    for (const title of grant.titles) processCollectionEvent(collection, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'title_earned', title }, now);
    retention.mailbox.unshift({ id: `quest-${questId}-${now}`, title: `Quest complete: ${definition.name}`, message: `Rewards delivered: ${grant.gold} gold and ${grant.experience} XP.`, createdAt: now, claimed: true });
    questGains.push({ id: nextId(), text: `Quest complete · ${definition.name}`, kind: 'rare' });
  }

  let bestiary = structuredClone(next.bestiary);
  let collectionEvent: import('@premium-rpg/shared-types').CollectionEvent | null = null;
  if (event.type === 'enemy_killed' && typeof event.enemyId === 'string') {
    const enemy = ALL_ENEMIES.find((entry) => entry.id === event.enemyId);
    if (enemy) {
      bestiary = recordEnemyDefeat(discoverEnemy(bestiary, enemy.id), enemy, [], LOOT_TABLES, ITEM_BY_ID, now);
      retention.regionReputation[enemy.regionId] = (retention.regionReputation[enemy.regionId] ?? 0) + (enemy.category === 'boss' ? 10 : enemy.category === 'elite' ? 3 : 1);
      collectionEvent = { type: 'enemy_defeated', enemyId: enemy.id };
    }
  } else if (event.type === 'item_collected' && typeof event.itemId === 'string') {
    collectionEvent = { type: 'item_acquired', itemId: event.itemId, quantity: typeof event.quantity === 'number' ? event.quantity : 1 };
  } else if (event.type === 'item_crafted' && typeof event.itemId === 'string') {
    collectionEvent = { type: 'item_crafted', itemId: event.itemId };
  } else if (event.type === 'region_visited' && typeof event.regionId === 'string') {
    collectionEvent = { type: 'region_visited', regionId: event.regionId };
    if (!retention.visitedRegions.includes(event.regionId)) retention.visitedRegions.push(event.regionId);
  } else if (event.type === 'dungeon_completed' && typeof event.dungeonId === 'string') {
    collectionEvent = { type: 'dungeon_completed', dungeonId: event.dungeonId };
  }
  if (collectionEvent) processCollectionEvent(collection, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, collectionEvent, now);

  const achievement = structuredClone(next.achievement);
  const achievementEvent = event.type === 'enemy_killed' ? { type: 'enemy_killed' as const, enemyId: event.enemyId as string, isElite: ALL_ENEMIES.find((e) => e.id === event.enemyId)?.category !== 'normal' }
    : event.type === 'resource_gathered' ? { type: 'resource_gathered' as const, quantity: event.quantity as number }
      : event.type === 'item_crafted' ? { type: 'item_crafted' as const, itemId: event.itemId as string, quantity: event.quantity as number }
        : event.type === 'item_collected' ? { type: 'item_collected' as const, itemId: event.itemId as string, quantity: event.quantity as number }
          : event.type === 'dungeon_completed' ? { type: 'dungeon_completed' as const, dungeonId: event.dungeonId as string }
            : event.type === 'region_visited' ? { type: 'region_visited' as const, regionId: event.regionId as string }
              : null;
  if (achievementEvent) {
    const awarded = processAchievementEvent(achievement, ACHIEVEMENTS, {
      level: next.combatLevel,
      totalLevel: next.combatLevel + Object.values(skills).reduce((sum, xp) => sum + levelForXp(xp), 0),
      skillLevel: (id) => levelForXp(skills[id as SkillId] ?? 0),
      bestiaryDefeated: bestiary.totalDefeated,
      bestiaryCompleted: bestiary.totalCompleted,
      bestiaryKillCount: (id) => bestiary.entries[id]?.killCount ?? 0,
      regionVisitedCount: retention.visitedRegions.length,
      questCompleted: Object.keys(quest.completed).length,
      collectionEntryCount: Object.values(collection.entries).filter((entry) => entry.collected).length,
      titleCount: collection.titles.length,
      playtimeHours: achievement.counters.playtime_hours as number,
    }, achievementEvent, now).newlyAwarded;
    for (const award of awarded) {
      retention.mailbox.unshift({ id: `achievement-${award.achievementId}`, title: `Achievement unlocked`, message: `${ACHIEVEMENTS.find((entry) => entry.id === award.achievementId)?.name ?? award.achievementId} · ${award.points} points`, createdAt: now, claimed: true });
      questGains.push({ id: nextId(), text: `Achievement · +${award.points} points`, kind: 'rare' });
    }
  }

  return { ...next, quest, achievement, collection, bestiary, retention, gold, combatXp, combatLevel: Math.min(COMBAT_LEVEL_CAP, levelForXp(combatXp)), inventory, skills, gains: pushGains(next.gains, questGains) };
}

export function reduceClaimMail(prev: GameState, mailId: string): GameState {
  const mail = prev.retention.mailbox.find((entry) => entry.id === mailId);
  if (!mail || mail.claimed) return prev;
  let inventory = prev.inventory;
  for (const item of mail.reward?.items ?? []) inventory = addInventory(inventory, item.itemId, item.quantity);
  const combatXp = prev.combatXp + (mail.reward?.combatXp ?? 0);
  return {
    ...prev,
    gold: prev.gold + (mail.reward?.gold ?? 0), inventory, combatXp,
    combatLevel: Math.min(COMBAT_LEVEL_CAP, levelForXp(combatXp)),
    retention: { ...prev.retention, mailbox: prev.retention.mailbox.map((entry) => entry.id === mailId ? { ...entry, claimed: true } : entry) },
  };
}

export function reduceRerollTask(prev: GameState, group: 'daily' | 'weekly', index: number, now = Date.now()): GameState {
  const task = cloneTaskState(prev.task);
  const cycleKey = group === 'daily' ? dailyKey(new Date(now)) : weeklyKey(new Date(now));
  const rerollKey = `${group}:${cycleKey}`;
  if ((prev.retention.rerolls[rerollKey] ?? 0) >= 1) return prev;
  const current = getCurrentTasks(task, new Date(now));
  const assignments = group === 'daily' ? current.daily : current.weekly;
  const target = assignments[index];
  if (!target || target.current > 0 || target.completed) return prev;
  const replacement = ALL_TASKS.find((definition) => definition.group === group && !assignments.some((entry) => entry.taskId === definition.id));
  if (!replacement) return prev;
  assignments[index] = { taskId: replacement.id, group, objectiveType: replacement.objective.type, objectiveTarget: replacement.objective.targetId ?? null, skillId: replacement.objective.skillId ?? null, regionId: replacement.objective.regionId ?? null, required: replacement.objective.required, current: 0, completed: false, claimed: false, assignedAt: now };
  return { ...prev, task, retention: { ...prev.retention, rerolls: { ...prev.retention.rerolls, [rerollKey]: 1 } } };
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

const RARITY_BHC_BONUS: Record<string, number> = { common: 0, uncommon: 0.02, rare: 0.05, epic: 0.09, legendary: 0.15 };

export function battleBhcReward(state: GameState, enemy: EnemyDefinition): number {
  const weapon = state.equipment.weapon;
  const rarity = weapon ? (weapon.metadata?.forgedRarity as Rarity | undefined) ?? ITEM_BY_ID[weapon.itemId]?.rarity ?? 'common' : 'common';
  const forge = Number(weapon?.metadata?.forgeLevel ?? 0);
  const awakening = Number(weapon?.metadata?.awakening ?? 0);
  const categoryBonus = enemy.category === 'boss' ? 0.12 : enemy.category === 'rare' ? 0.07 : enemy.category === 'elite' ? 0.03 : 0;
  const raw = 0.08 + Math.min(0.2, state.combatLevel * 0.002) + RARITY_BHC_BONUS[rarity] + forge * 0.005 + awakening * 0.01 + categoryBonus;
  return Math.min(0.5, Math.round(raw * 1000) / 1000);
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
  const stats = derivedCombatStats(prev.combatLevel, prev.characterClass, prev.equipment, prev.investment);
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
function tickCore(prev: GameState, now: number, includeCombat: boolean): GameState {
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
            const craftSkill = (recipe.skill === 'crafting' ? action.skill : recipe.skill) as SkillId;
            const grow = gainExperience(state.skills[craftSkill], craft.xpGained);
            let inventory = state.inventory;
            const forgedEquipmentRarities = Object.fromEntries(
              Object.entries(state.forgedEquipmentRarities).map(([id, rarities]) => [id, [...rarities]]),
            );
            const forgedEquipmentAffixes = Object.fromEntries(
              Object.entries(state.forgedEquipmentAffixes).map(([id, affixes]) => [id, [...affixes]]),
            );
            for (const ing of craft.consumedIngredients) inventory = addInventory(inventory, ing.itemId, -ing.quantity);
            const gains: GainFeed[] = [{ id: nextId(), text: `+${craft.xpGained} XP`, kind: 'xp' }];
            for (const o of craft.outputs) {
              inventory = addInventory(inventory, o.itemId, o.quantity);
              const definition = ITEM_BY_ID[o.itemId];
              if (craftSkill === 'smithing' && definition?.equipmentSlot) {
                const rarities = forgedEquipmentRarities[o.itemId] ?? [];
                const affixes = forgedEquipmentAffixes[o.itemId] ?? [];
                for (let count = 0; count < o.quantity; count += 1) {
                  const rarity = rollForgedRarity(definition.rarity, grow.newLevel);
                  rarities.push(rarity);
                  affixes.push(rollForgedAffix(rarity, grow.newLevel));
                }
                forgedEquipmentRarities[o.itemId] = rarities.slice(-1000);
                forgedEquipmentAffixes[o.itemId] = affixes.slice(-1000);
              }
              const forgedRarity = definition?.equipmentSlot ? forgedEquipmentRarities[o.itemId]?.at(-1) : undefined;
              gains.push({
                id: nextId(),
                text: `${forgedRarity ? `${forgedRarity[0].toUpperCase()}${forgedRarity.slice(1)} ` : ''}${o.quantity > 1 ? `${o.quantity}x ` : ''}${itemName(o.itemId)}`,
                kind: forgedRarity === 'epic' || forgedRarity === 'legendary' ? 'rare' : 'item',
              });
            }
            if (grow.levelsGained > 0) {
              gains.push({ id: nextId(), text: `${recipe.name} — ${craftSkill} level ${grow.newLevel}!`, kind: 'level' });
            }
            const advanced = { ...state, skills: { ...state.skills, [craftSkill]: grow.newXp }, inventory, forgedEquipmentRarities, forgedEquipmentAffixes };
            state = {
              ...advanced,
              gains: pushGains(state.gains, gains),
              actionLog: pushActionLog(state.actionLog, [{ skill: craftSkill, text: `${recipe.name} crafted`, rare: false }]),
              ...nextActionState(advanced, {
                kind: 'crafting', skill: craftSkill, recipeId: recipe.id,
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

  if (includeCombat) {
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
        const bhcReward = battleBhcReward(state, enemy);
        const gains: GainFeed[] = [
          { id: nextId(), text: `+${enemy.goldReward} gold`, kind: 'gold' },
          { id: nextId(), text: `+${enemy.xpReward} XP`, kind: 'xp' },
          { id: nextId(), text: `+${bhcReward.toFixed(3)} BHC`, kind: 'rare' },
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
          bhc: bhcReward,
          loot,
        };
        state = {
          ...state,
          gold: state.gold + enemy.goldReward,
          inventory,
          combatXp: newCombatXp,
          combatLevel: newCombatLevel,
          investment: { ...state.investment, bhc: Math.round((state.investment.bhc + bhcReward) * 1000) / 1000 },
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
  }

  return state;
}

/**
 * Resolve every elapsed trade completion in chronological order. This makes
 * persisted queues catch up after reload/browser close instead of restarting
 * their timers. Work is bounded per UI tick; very long queues continue
 * draining on following ticks without blocking the page.
 */
export function tick(prev: GameState, now: number): GameState {
  let state = prev;
  let completed = 0;
  while (state.activeAction && completed < MAX_OFFLINE_CATCHUP_PER_TICK) {
    const completionAt = state.activeAction.startTime + state.activeAction.duration;
    if (completionAt > now) break;
    const next = tickCore(state, completionAt, false);
    if (next === state) break;
    state = next;
    completed += 1;
  }
  return completed >= MAX_OFFLINE_CATCHUP_PER_TICK ? state : tickCore(state, now, true);
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
    if (!recipe) return null;
    const recipeSkill = (recipe.skill === 'crafting' ? queued.skill : recipe.skill) as SkillId;
    if (levelForXp(prev.skills[recipeSkill]) < recipe.levelRequired || !hasIngredients(recipe, prev.inventory).canCraft) return null;
    return { ...queued, skill: recipeSkill, startTime: now, duration: recipe.duration, repetitionsRemaining: queued.repetitions };
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
  const next = {
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
  return reduceTaskEvent(next, { type: 'region_visited', regionId });
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

export function reduceEquipItem(prev: GameState, slot: EquipmentSlot, itemId: string, requestedRarity?: Rarity): GameState {
  const qty = prev.inventory[itemId] ?? 0;
  if (qty <= 0) return prev; // don't have the item

  // Check if item can go in this slot
  const def = ITEM_BY_ID[itemId];
  if (!def || def.equipmentSlot !== slot) return prev;

  // Unequip current item in slot (if any)
  const current = prev.equipment[slot];
  const inventory = { ...prev.inventory };
  const equipment: EquipmentSlots = { ...prev.equipment };
  const forgedEquipmentRarities = Object.fromEntries(
    Object.entries(prev.forgedEquipmentRarities).map(([id, rarities]) => [id, [...rarities]]),
  );
  const forgedEquipmentAffixes = Object.fromEntries(
    Object.entries(prev.forgedEquipmentAffixes).map(([id, affixes]) => [id, [...affixes]]),
  );

  if (current) {
    // Put current item back in inventory
    inventory[current.itemId] = (inventory[current.itemId] ?? 0) + 1;
    const currentRarity = current.metadata?.forgedRarity;
    if (typeof currentRarity === 'string' && RARITY_ORDER.includes(currentRarity as Rarity)) {
      forgedEquipmentRarities[current.itemId] = [...(forgedEquipmentRarities[current.itemId] ?? []), currentRarity as Rarity];
      const currentAffix = current.metadata?.affix as ForgedEquipmentAffix | undefined;
      forgedEquipmentAffixes[current.itemId] = [...(forgedEquipmentAffixes[current.itemId] ?? []), currentAffix ?? null];
    }
  }

  // Move new item from inventory to equipment slot
  inventory[itemId] = (inventory[itemId] ?? 0) - 1;
  if ((inventory[itemId] ?? 0) <= 0) {
    delete inventory[itemId];
  }

  // Create new equipment instance. NOTE: uids are item-definition ids for now
  // (dev); unique instance ids for durability/forge/awaken state land with
  // server-side ItemInstance (see gameserver work).
  const forgedRolls = forgedEquipmentRarities[itemId] ?? [];
  let forgedRarity: Rarity | undefined;
  let forgedAffix: ForgedEquipmentAffix | null = null;
  if (forgedRolls.length > 0) {
    const requestedIndex = requestedRarity ? forgedRolls.findIndex((rarity) => rarity === requestedRarity) : -1;
    const bestIndex = requestedIndex >= 0 ? requestedIndex : forgedRolls.reduce((best, rarity, index) =>
      RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(forgedRolls[best]) ? index : best, 0);
    [forgedRarity] = forgedRolls.splice(bestIndex, 1);
    const affixes = forgedEquipmentAffixes[itemId] ?? [];
    [forgedAffix] = affixes.splice(bestIndex, 1);
    if (forgedRolls.length === 0) delete forgedEquipmentRarities[itemId];
    if (affixes.length === 0) delete forgedEquipmentAffixes[itemId];
  }
  const newItem = {
    uid: `${itemId}-${Date.now()}-${nextId()}`,
    itemId,
    quantity: 1,
    equipped: true,
    durability: 100,
    metadata: forgedRarity ? {
      forgedRarity,
      ...(forgedAffix ? { affix: forgedAffix, bonusStat: forgedAffix.stat, bonusValue: forgedAffix.value } : {}),
    } : {},
  } as InventoryItem;

  equipment[slot] = newItem;

  const now = Date.now();
  const next = {
    ...prev,
    inventory,
    equipment,
    forgedEquipmentRarities,
    forgedEquipmentAffixes,
    actionLog: [
      { id: nextId(), skill: 'smithing' as SkillId, text: `Equipped ${ITEM_BY_ID[itemId]?.name ?? itemId}`, rare: false, ts: now },
      ...prev.actionLog,
    ].slice(0, 60),
  };
  return reduceTaskEvent(next, { type: 'item_equipped', slot, itemId }, now);
}

export function reduceUnequipItem(prev: GameState, slot: EquipmentSlot): GameState {
  const current = prev.equipment[slot];
  if (!current) return prev; // nothing to unequip

  const inventory = { ...prev.inventory, [current.itemId]: (prev.inventory[current.itemId] ?? 0) + 1 };
  const equipment: EquipmentSlots = { ...prev.equipment, [slot]: null };
  const forgedEquipmentRarities = { ...prev.forgedEquipmentRarities };
  const forgedEquipmentAffixes = { ...prev.forgedEquipmentAffixes };
  const currentRarity = current.metadata?.forgedRarity;
  if (typeof currentRarity === 'string' && RARITY_ORDER.includes(currentRarity as Rarity)) {
    forgedEquipmentRarities[current.itemId] = [...(prev.forgedEquipmentRarities[current.itemId] ?? []), currentRarity as Rarity];
    const currentAffix = current.metadata?.affix as ForgedEquipmentAffix | undefined;
    forgedEquipmentAffixes[current.itemId] = [...(prev.forgedEquipmentAffixes[current.itemId] ?? []), currentAffix ?? null];
  }

  const now = Date.now();
  return {
    ...prev,
    inventory,
    equipment,
    forgedEquipmentRarities,
    forgedEquipmentAffixes,
    actionLog: [
      { id: nextId(), skill: 'smithing' as SkillId, text: `Unequipped ${ITEM_BY_ID[current.itemId]?.name ?? current.itemId}`, rare: false, ts: now },
      ...prev.actionLog,
    ].slice(0, 60),
  };
}

// ─── FORGING & INVESTMENT ───────────────────────────────────────

export const FORGE_COSTS = [0.25, 0.35, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.75, 2] as const;
export const AWAKENING_COSTS = [1, 2, 4, 7, 12] as const;
export const REBIRTH_COSTS = [2, 4, 7, 11, 16] as const;
export const REBIRTH_LEVELS = [20, 40, 60, 80, 100] as const;
const RARITY_REROLL_COST: Record<string, number> = { common: 0.5, uncommon: 0.75, rare: 1.25, epic: 2, legendary: 3 };
const HERO_REFORGE_COSTS = [1, 2, 4, 7, 10] as const;

export function weaponRerollCost(state: GameState): number | null {
  const weapon = state.equipment.weapon;
  if (!weapon) return null;
  return RARITY_REROLL_COST[(weapon.metadata?.forgedRarity as Rarity | undefined) ?? ITEM_BY_ID[weapon.itemId]?.rarity ?? 'common'];
}

export function heroReforgeCost(state: GameState): number {
  return HERO_REFORGE_COSTS[Math.min(state.investment.heroReforge, HERO_REFORGE_COSTS.length - 1)];
}

function spendInvestment(prev: GameState, cost: number, record: Omit<InvestmentRecord, 'id' | 'cost' | 'createdAt'>, patch: Partial<InvestmentState>): GameState {
  if (prev.investment.bhc + 0.000001 < cost) return prev;
  const createdAt = Date.now();
  const entry: InvestmentRecord = { ...record, id: `investment-${createdAt}-${nextId()}`, cost, createdAt };
  return {
    ...prev,
    investment: {
      ...prev.investment,
      ...patch,
      bhc: Math.round((prev.investment.bhc - cost) * 1000) / 1000,
      burnedTotal: Math.round((prev.investment.burnedTotal + cost) * 1000) / 1000,
      history: [entry, ...prev.investment.history].slice(0, 50),
    },
    gains: pushGains(prev.gains, [{ id: nextId(), text: `${record.label} · ${cost} BHC burned`, kind: 'rare' }]),
  };
}

export function reduceForgeWeapon(prev: GameState): GameState {
  const weapon = prev.equipment.weapon;
  if (!weapon) return prev;
  const level = Number(weapon.metadata?.forgeLevel ?? 0);
  if (level >= 10) return prev;
  const cost = FORGE_COSTS[level];
  if (prev.investment.bhc < cost) return prev;
  const equipment = { ...prev.equipment, weapon: { ...weapon, metadata: { ...weapon.metadata, forgeLevel: level + 1 } } };
  return spendInvestment({ ...prev, equipment }, cost, { type: 'forge', label: `${itemName(weapon.itemId)} forged to +${level + 1}` }, {});
}

export function reduceAwakenWeapon(prev: GameState): GameState {
  const weapon = prev.equipment.weapon;
  if (!weapon) return prev;
  const awakening = Number(weapon.metadata?.awakening ?? 0);
  const forge = Number(weapon.metadata?.forgeLevel ?? 0);
  if (awakening >= 5 || forge < (awakening + 1) * 2) return prev;
  const cost = AWAKENING_COSTS[awakening];
  if (prev.investment.bhc < cost) return prev;
  const equipment = { ...prev.equipment, weapon: { ...weapon, metadata: { ...weapon.metadata, awakening: awakening + 1 } } };
  return spendInvestment({ ...prev, equipment }, cost, { type: 'awaken', label: `${itemName(weapon.itemId)} awakened to tier ${awakening + 1}` }, {});
}

export function reduceRerollWeapon(prev: GameState): GameState {
  const weapon = prev.equipment.weapon;
  if (!weapon) return prev;
  const cost = weaponRerollCost(prev);
  if (cost === null) return prev;
  if (prev.investment.bhc < cost) return prev;
  const count = Number(weapon.metadata?.rerolls ?? 0) + 1;
  const stats = ['strength', 'agility', 'intelligence', 'vitality'] as const;
  const bonusStat = stats[count % stats.length];
  const bonusValue = 2 + Math.floor(Number(ITEM_BY_ID[weapon.itemId]?.levelRequired ?? 1) / 10);
  const equipment = { ...prev.equipment, weapon: { ...weapon, metadata: { ...weapon.metadata, rerolls: count, bonusStat, bonusValue } } };
  return spendInvestment({ ...prev, equipment }, cost, { type: 'weapon_reroll', label: `${itemName(weapon.itemId)} rerolled: +${bonusValue} ${bonusStat}` }, {});
}

export function reduceRebirthHero(prev: GameState): GameState {
  const tier = prev.investment.heroRebirth;
  if (tier >= 5 || prev.combatLevel < REBIRTH_LEVELS[tier]) return prev;
  const cost = REBIRTH_COSTS[tier];
  return spendInvestment(prev, cost, { type: 'hero_rebirth', label: `Hero rebirth tier ${tier + 1}` }, { heroRebirth: tier + 1 });
}

export function reduceReforgeHero(prev: GameState): GameState {
  const count = prev.investment.heroReforge;
  const cost = heroReforgeCost(prev);
  if (prev.investment.bhc < cost) return prev;
  const stats = ['strength', 'agility', 'intelligence', 'vitality'] as const;
  const bonusStat = stats[(count + 1) % stats.length];
  const bonusValue = 3 + prev.investment.heroRebirth * 2;
  return spendInvestment(prev, cost, { type: 'hero_reforge', label: `Hero reforged: +${bonusValue} ${bonusStat}` }, { heroReforge: count + 1, heroBonusStat: bonusStat, heroBonusValue: bonusValue });
}

// ─── SUMMONING ──────────────────────────────────────────────────

/** Account hero roster cap (free starter + up to 4 summoned). */
export const HERO_CAP = 5;

export const SUMMON_RARITY_ODDS: ReadonlyArray<{ rarity: SummonRarity; chance: number }> = [
  { rarity: 'common', chance: 0.55 },
  { rarity: 'uncommon', chance: 0.27 },
  { rarity: 'rare', chance: 0.12 },
  { rarity: 'epic', chance: 0.05 },
  { rarity: 'legendary', chance: 0.01 },
];
const SUMMON_CLASSES: readonly SummonClass[] = ['warrior', 'assassin', 'ranger', 'mage', 'knight'];
const SUMMON_NAMES: Record<SummonClass, readonly string[]> = {
  warrior: ['Aldric', 'Brynn', 'Corin', 'Dagna', 'Eryk'], assassin: ['Nyra', 'Silas', 'Vex', 'Kestrel', 'Shade'],
  ranger: ['Lyra', 'Rowan', 'Tarin', 'Wren', 'Fael'], mage: ['Orin', 'Seraph', 'Mira', 'Cael', 'Ilyra'],
  knight: ['Garran', 'Elowen', 'Lucan', 'Maelis', 'Tor'],
};
const DUPLICATE_ESSENCE: Record<SummonRarity, number> = { common: 1, uncommon: 2, rare: 5, epic: 12, legendary: 30 };
const SUMMON_BATTLE_REWARD: Record<SummonRarity, number> = { common: 0.05, uncommon: 0.07, rare: 0.1, epic: 0.14, legendary: 0.2 };

export function summonRarityForRoll(roll: number, pity: number, totalSummons: number): SummonRarity {
  const safe = Math.max(0, Math.min(0.999999, roll));
  let rarity: SummonRarity = safe < 0.55 ? 'common' : safe < 0.82 ? 'uncommon' : safe < 0.94 ? 'rare' : safe < 0.99 ? 'epic' : 'legendary';
  const number = totalSummons + 1;
  if (pity >= 99) rarity = 'legendary';
  else if (number % 50 === 0 && (rarity === 'common' || rarity === 'uncommon' || rarity === 'rare')) rarity = 'epic';
  else if (number % 10 === 0 && (rarity === 'common' || rarity === 'uncommon')) rarity = 'rare';
  return rarity;
}

/** The playable class a summoned hero actually fights as ('assassin'/'knight'
 * are flavor classes only — the combat engine supports warrior/ranger/mage). */
export function heroPlayerClass(heroClass: SummonClass): 'warrior' | 'ranger' | 'mage' {
  return heroClass === 'assassin' || heroClass === 'knight' ? 'warrior' : heroClass;
}

export interface SummonDescriptor {
  summonId: string;
  characterId: string;
  archetypeId: string;
  name: string;
  class: SummonClass;
  playerClass: 'warrior' | 'ranger' | 'mage';
  rarity: SummonRarity;
  variation: number;
  duplicate: boolean;
  essenceGain: number;
  createdAt: number;
}

/**
 * Deterministic description of one summon roll. Ids are derived from the roll
 * and a supplied createdAt so the reducer (which owns the ledger) and the
 * caller (which materializes the account roster hero) stay in sync without
 * any shared mutable state.
 */
export function rollSummonDescriptor(roll: number, pity: number, totalSummons: number, heroes: SummoningState['heroes'], createdAt = Date.now()): SummonDescriptor {
  const rarity = summonRarityForRoll(roll, pity, totalSummons);
  const classIndex = Math.floor((roll * 100_003) % SUMMON_CLASSES.length);
  const heroClass = SUMMON_CLASSES[classIndex];
  const variation = Math.floor((roll * 10_007) % 5) + 1;
  const archetypeId = `${heroClass}-${rarity}-${variation}`;
  const name = SUMMON_NAMES[heroClass][variation - 1];
  const existing = heroes.some((hero) => hero.archetypeId === archetypeId);
  const bucket = Math.floor(roll * 100_000_007) % 1_000_000;
  return {
    summonId: `summoned-${createdAt}-${bucket}`,
    characterId: `char-${createdAt}-${bucket}`,
    archetypeId,
    name,
    class: heroClass,
    playerClass: heroPlayerClass(heroClass),
    rarity,
    variation,
    duplicate: existing,
    essenceGain: existing ? DUPLICATE_ESSENCE[rarity] : 0,
    createdAt,
  };
}

/** One summon, one idempotency key, and the complete 50/40/10 settlement. */
export function reduceSummonHero(prev: GameState, roll: number, idempotencyKey: string, createdAt = Date.now()): GameState {
  if (!idempotencyKey || !Number.isFinite(roll) || roll < 0 || roll >= 1 || prev.investment.bhc + 0.000001 < SUMMON_COST) return prev;
  if (prev.summoning.history.some((entry) => entry.idempotencyKey === idempotencyKey)) return prev;
  const rollResult = rollSummonDescriptor(roll, prev.summoning.pity, prev.summoning.totalSummons, prev.summoning.heroes, createdAt);
  const existing = rollResult.duplicate;
  const essenceGain = rollResult.essenceGain;
  const heroes = existing
    ? prev.summoning.heroes.map((hero) => hero.archetypeId === rollResult.archetypeId ? { ...hero, copies: hero.copies + 1, essence: hero.essence + essenceGain } : hero)
    : [...prev.summoning.heroes, { id: rollResult.summonId, characterId: rollResult.characterId, archetypeId: rollResult.archetypeId, name: rollResult.name, class: rollResult.class, rarity: rollResult.rarity, variation: rollResult.variation, copies: 1, essence: 0, summonedAt: createdAt, nextBattleAt: 0 }];
  const history = [{ id: `summon-${createdAt}-${Math.floor(roll * 1_000_003) % 100_000}`, idempotencyKey, archetypeId: rollResult.archetypeId, heroName: rollResult.name, rarity: rollResult.rarity, heroClass: rollResult.class, duplicate: existing, roll, createdAt }, ...prev.summoning.history].slice(0, 100);
  return {
    ...prev,
    investment: {
      ...prev.investment,
      bhc: Math.round((prev.investment.bhc - SUMMON_COST) * 1000) / 1000,
      burnedTotal: Math.round((prev.investment.burnedTotal + SUMMON_BURN) * 1000) / 1000,
    },
    summoning: {
      ...prev.summoning, heroes, history, totalSummons: prev.summoning.totalSummons + 1,
      pity: rollResult.rarity === 'legendary' ? 0 : prev.summoning.pity + 1,
      essence: prev.summoning.essence + essenceGain,
      rewardPool: Math.round((prev.summoning.rewardPool + SUMMON_REWARD_POOL) * 1000) / 1000,
      treasury: Math.round((prev.summoning.treasury + SUMMON_TREASURY) * 1000) / 1000,
    },
    gains: pushGains(prev.gains, [{ id: nextId(), text: existing ? `${rollResult.name} duplicate · +${essenceGain} essence` : `${rollResult.rarity} ${rollResult.name} summoned`, kind: rollResult.rarity === 'epic' || rollResult.rarity === 'legendary' ? 'rare' : 'item' }]),
  };
}

export function reduceSummonedHeroBattle(prev: GameState, heroId: string, now = Date.now()): GameState {
  const hero = prev.summoning.heroes.find((entry) => entry.id === heroId);
  if (!hero || hero.nextBattleAt > now) return prev;
  const today = new Date(now).toISOString().slice(0, 10);
  const battlesToday = prev.summoning.battleDay === today ? prev.summoning.battlesToday : 0;
  if (battlesToday >= SUMMONED_HERO_BATTLE_CAP) return prev;
  const reward = SUMMON_BATTLE_REWARD[hero.rarity];
  if (prev.summoning.rewardPool + 0.000001 < reward) return prev;
  return {
    ...prev,
    investment: { ...prev.investment, bhc: Math.round((prev.investment.bhc + reward) * 1000) / 1000 },
    summoning: {
      ...prev.summoning,
      heroes: prev.summoning.heroes.map((entry) => entry.id === heroId ? { ...entry, nextBattleAt: now + REWARDED_BATTLE_COOLDOWN_MS } : entry),
      rewardPool: Math.round((prev.summoning.rewardPool - reward) * 1000) / 1000,
      battleDay: today,
      battlesToday: battlesToday + 1,
    },
    gains: pushGains(prev.gains, [{ id: nextId(), text: `${hero.name} returned · +${reward} BHC from the reward pool`, kind: 'rare' }]),
  };
}

// ─── MARKETPLACE ────────────────────────────────────────────────

function marketplaceHistory(prev: GameState, listingId: string, type: 'listed' | 'cancelled' | 'purchased' | 'sold', label: string, amount: number) {
  const createdAt = Date.now();
  return [{ id: `market-history-${createdAt}-${nextId()}`, listingId, type, label, amount, createdAt }, ...prev.marketplace.history].slice(0, 100);
}

/** Validate first, then burn the listing fee and escrow the asset in one transition. */
export function reduceCreateMarketplaceListing(
  prev: GameState,
  actorId: string,
  assetType: MarketplaceAssetType,
  assetId: string,
  price: number,
  idempotencyKey: string,
): GameState {
  const cleanPrice = Math.round(price * 1000) / 1000;
  if (!idempotencyKey || !Number.isFinite(cleanPrice) || cleanPrice < 0.01 || cleanPrice > 1_000_000) return prev;
  if (prev.marketplace.listings.some((listing) => listing.idempotencyKey === idempotencyKey)) return prev;
  if (prev.marketplace.listings.some((listing) => listing.status === 'active' && listing.sellerId === actorId && listing.assetType === assetType && listing.assetId === assetId)) return prev;
  if (prev.investment.bhc + 0.000001 < prev.marketplace.listingFee) return prev;

  let inventory = prev.inventory;
  let heroLocked = prev.marketplace.heroLocked;
  let title: string;
  let snapshot: Record<string, unknown>;
  if (assetType === 'weapon') {
    const definition = ITEM_BY_ID[assetId];
    if (definition?.equipmentSlot !== 'weapon' || (prev.inventory[assetId] ?? 0) < 1) return prev;
    if (prev.equipment.weapon?.itemId === assetId) return prev;
    inventory = addInventory(prev.inventory, assetId, -1);
    title = itemName(assetId);
    snapshot = { itemId: assetId, rarity: definition.rarity, levelRequired: definition.levelRequired ?? 1 };
  } else {
    if (heroLocked || assetId !== actorId) return prev;
    heroLocked = true;
    title = `${prev.playerName} · Level ${prev.combatLevel} ${prev.characterClass}`;
    snapshot = {
      name: prev.playerName, class: prev.characterClass, combatLevel: prev.combatLevel, combatXp: prev.combatXp,
      skills: prev.skills, equipment: prev.equipment, investment: prev.investment, nextBattleAt: prev.dailyBattle.nextBattleAt,
    };
  }

  const createdAt = Date.now();
  const listing: MarketplaceListing = {
    id: `market-${createdAt}-${nextId()}`, idempotencyKey, sellerId: actorId, sellerName: prev.playerName,
    assetType, assetId, title, price: cleanPrice, listingFee: prev.marketplace.listingFee, snapshot,
    status: 'active', buyerId: null, createdAt, completedAt: null,
  };
  const fee = prev.marketplace.listingFee;
  return {
    ...prev,
    inventory,
    activeAction: assetType === 'hero' ? null : prev.activeAction,
    actionQueue: assetType === 'hero' ? [] : prev.actionQueue,
    investment: {
      ...prev.investment,
      bhc: Math.round((prev.investment.bhc - fee) * 1000) / 1000,
      burnedTotal: Math.round((prev.investment.burnedTotal + fee) * 1000) / 1000,
    },
    marketplace: {
      ...prev.marketplace, heroLocked,
      listings: [listing, ...prev.marketplace.listings],
      history: marketplaceHistory(prev, listing.id, 'listed', `${title} listed`, fee),
    },
    gains: pushGains(prev.gains, [{ id: nextId(), text: `${title} listed · ${fee} BHC burned`, kind: 'rare' }]),
  };
}

export function reduceCancelMarketplaceListing(prev: GameState, actorId: string, listingId: string): GameState {
  const listing = prev.marketplace.listings.find((entry) => entry.id === listingId);
  if (!listing || listing.status !== 'active' || listing.sellerId !== actorId) return prev;
  const completedAt = Date.now();
  const listings = prev.marketplace.listings.map((entry) => entry.id === listingId ? { ...entry, status: 'cancelled' as const, completedAt } : entry);
  const inventory = listing.assetType === 'weapon' ? addInventory(prev.inventory, listing.assetId, 1) : prev.inventory;
  return {
    ...prev,
    inventory,
    marketplace: {
      ...prev.marketplace,
      heroLocked: listing.assetType === 'hero' ? false : prev.marketplace.heroLocked,
      listings,
      history: marketplaceHistory(prev, listing.id, 'cancelled', `${listing.title} cancelled · fee not refunded`, 0),
    },
  };
}

/** Transfer payment and escrowed ownership atomically; purchase price is transferred, never burned. */
export function reduceBuyMarketplaceListing(prev: GameState, actorId: string, listingId: string, idempotencyKey: string): GameState {
  const listing = prev.marketplace.listings.find((entry) => entry.id === listingId);
  if (!listing || listing.status !== 'active' || listing.sellerId === actorId || !idempotencyKey) return prev;
  if (prev.marketplace.history.some((entry) => entry.id === `purchase-${idempotencyKey}`)) return prev;
  if (prev.investment.bhc + 0.000001 < listing.price) return prev;
  const completedAt = Date.now();
  const listings = prev.marketplace.listings.map((entry) => entry.id === listingId ? { ...entry, status: 'sold' as const, buyerId: actorId, completedAt } : entry);
  const inventory = listing.assetType === 'weapon' ? addInventory(prev.inventory, listing.assetId, 1) : prev.inventory;
  const acquiredHeroes = listing.assetType === 'hero' ? [...prev.marketplace.acquiredHeroes, { ...listing.snapshot, marketplaceAssetId: listing.assetId }] : prev.marketplace.acquiredHeroes;
  const historyEntry = { id: `purchase-${idempotencyKey}`, listingId, type: 'purchased' as const, label: `${listing.title} purchased`, amount: listing.price, createdAt: completedAt };
  return {
    ...prev,
    inventory,
    investment: { ...prev.investment, bhc: Math.round((prev.investment.bhc - listing.price) * 1000) / 1000 },
    marketplace: { ...prev.marketplace, listings, acquiredHeroes, history: [historyEntry, ...prev.marketplace.history].slice(0, 100) },
    gains: pushGains(prev.gains, [{ id: nextId(), text: `${listing.title} acquired · ${listing.price} BHC transferred`, kind: 'rare' }]),
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
