import type { CombatEncounter, EquipmentSlots, SkillId, PlayerDungeonState, PlayerTaskState, PlayerQuestState, PlayerAchievementState, PlayerCollectionState, BestiaryState, Rarity } from '@premium-rpg/shared-types';
import type { ActiveAction, QueuedAction } from '@/lib/game/service';
import type { EventFrameworkState } from '@/lib/game/events';

export const GAME_SAVE_SCHEMA_VERSION = 12;

export type ForgedEquipmentRarities = Record<string, Rarity[]>;
export interface ForgedEquipmentAffix { stat: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'armor'; value: number; name: string }
export type ForgedEquipmentAffixes = Record<string, Array<ForgedEquipmentAffix | null>>;

export interface RetentionMail {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  claimed: boolean;
  reward?: { gold?: number; combatXp?: number; items?: Array<{ itemId: string; quantity: number }> };
}

export interface RetentionState {
  loginDays: Record<string, boolean>;
  loginStreak: number;
  longestLoginStreak: number;
  lastLoginDay: string | null;
  lastSeenAt: number;
  offlineReport: { awayMs: number; actionLabel: string | null; createdAt: number } | null;
  mailbox: RetentionMail[];
  regionReputation: Record<string, number>;
  visitedRegions: string[];
  rerolls: Record<string, number>;
}

export interface BattleHistoryEntry {
  id: string;
  enemyId: string;
  regionId: string;
  startedAt: number;
  completedAt: number;
  result: 'victory' | 'defeat';
  xp: number;
  gold: number;
  bhc?: number;
  loot: Array<{ itemId: string; quantity: number }>;
}

export interface DailyBattleState {
  nextBattleAt: number;
  activeAttemptId: string | null;
  activeStartedAt: number | null;
  history: BattleHistoryEntry[];
}

export interface EconomyTransaction {
  id: string;
  createdAt: number;
  category: 'gold' | 'item' | 'skill_xp' | 'combat_xp' | 'bhc';
  assetId: string;
  delta: number;
  balance: number;
  reason: string;
}

export interface InvestmentRecord {
  id: string;
  type: 'forge' | 'awaken' | 'weapon_reroll' | 'hero_rebirth' | 'hero_reforge';
  label: string;
  cost: number;
  createdAt: number;
}

export interface InvestmentState {
  bhc: number;
  burnedTotal: number;
  heroRebirth: number;
  heroReforge: number;
  heroBonusStat: 'strength' | 'agility' | 'intelligence' | 'vitality' | null;
  heroBonusValue: number;
  history: InvestmentRecord[];
}

export type MarketplaceAssetType = 'hero' | 'weapon';
export type MarketplaceListingStatus = 'active' | 'sold' | 'cancelled';

export interface MarketplaceListing {
  id: string;
  idempotencyKey: string;
  sellerId: string;
  sellerName: string;
  assetType: MarketplaceAssetType;
  assetId: string;
  title: string;
  price: number;
  listingFee: number;
  snapshot: Record<string, unknown>;
  status: MarketplaceListingStatus;
  buyerId: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface MarketplaceHistoryEntry {
  id: string;
  listingId: string;
  type: 'listed' | 'cancelled' | 'purchased' | 'sold';
  label: string;
  amount: number;
  createdAt: number;
}

export interface MarketplaceState {
  listingFee: number;
  listings: MarketplaceListing[];
  history: MarketplaceHistoryEntry[];
  acquiredHeroes: Array<Record<string, unknown>>;
  heroLocked: boolean;
}

export type SummonRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SummonClass = 'warrior' | 'assassin' | 'ranger' | 'mage' | 'knight';

export interface SummonedHero {
  id: string;
  archetypeId: string;
  name: string;
  class: SummonClass;
  rarity: SummonRarity;
  variation: number;
  copies: number;
  essence: number;
  summonedAt: number;
  nextBattleAt: number;
}

export interface SummonHistoryEntry {
  id: string;
  idempotencyKey: string;
  archetypeId: string;
  heroName: string;
  rarity: SummonRarity;
  heroClass: SummonClass;
  duplicate: boolean;
  roll: number;
  createdAt: number;
}

export interface SummoningState {
  heroes: SummonedHero[];
  history: SummonHistoryEntry[];
  pity: number;
  totalSummons: number;
  essence: number;
  rewardPool: number;
  treasury: number;
  battleDay: string | null;
  battlesToday: number;
}

export interface EmberColossusEventState {
  attemptsByDay: Record<string, boolean>;
  victories: number;
  weaponClaimed: boolean;
  history: Array<{ day: string; victory: boolean; createdAt: number }>;
}

/**
 * The authoritative fields of a game save. Carried by every persistence
 * implementation; clients never write this shape directly except through a
 * GamePersistence, so a server-backed implementation can replace the local
 * one without touching game code.
 */
export interface GameSaveData {
  schemaVersion?: number;
  savedAt?: number;
  skills: Record<SkillId, number>;
  gold: number;
  inventory: Record<string, number>;
  durability: Record<string, number>;
  equipment: EquipmentSlots;
  /** Rolled rarity for each unequipped item forged by this character. */
  forgedEquipmentRarities?: ForgedEquipmentRarities;
  /** Affixes aligned by index with forgedEquipmentRarities for each item id. */
  forgedEquipmentAffixes?: ForgedEquipmentAffixes;
  combatXp: number;
  combatLevel: number;
  selectedSkill: SkillId;
  /** In-progress trade action and its FIFO queue. */
  activeAction?: ActiveAction | null;
  actionQueue?: QueuedAction[];
  /** Per-save shop purchase ledger (finite stock / one-time tracking). */
  shopBought?: Record<string, number>;
  /** Dungeon progress + any active run. */
  dungeon?: PlayerDungeonState;
  /** Transient active dungeon fight (restored so a reload keeps fighting). */
  dungeonCombat?: DungeonCombatSlice;
  /** Daily/weekly assignments and their live progress. */
  task?: PlayerTaskState;
  /** Append-only audit trail for every persisted economy/progression change. */
  ledger?: EconomyTransaction[];
  /** Per-hero rewarded battle cooldown and recent result history. */
  dailyBattle?: DailyBattleState;
  quest?: PlayerQuestState;
  achievement?: PlayerAchievementState;
  collection?: PlayerCollectionState;
  bestiary?: BestiaryState;
  retention?: RetentionState;
  investment?: InvestmentState;
  marketplace?: MarketplaceState;
  summoning?: SummoningState;
  emberColossus?: EmberColossusEventState;
  events?: EventFrameworkState;
}

/** Upgrade older browser/cloud saves without discarding valid zero balances. */
export function migrateGameSave(input: GameSaveData): GameSaveData {
  const source = input && typeof input === 'object' ? input : ({} as GameSaveData);
  return {
    ...source,
    schemaVersion: GAME_SAVE_SCHEMA_VERSION,
    savedAt: typeof source.savedAt === 'number' ? source.savedAt : Date.now(),
    gold: Number.isFinite(source.gold) ? Math.max(0, source.gold) : 0,
    skills: source.skills ?? ({} as GameSaveData['skills']),
    inventory: source.inventory ?? {},
    durability: source.durability ?? {},
    forgedEquipmentRarities: source.forgedEquipmentRarities ?? {},
    forgedEquipmentAffixes: source.forgedEquipmentAffixes ?? {},
    ledger: Array.isArray(source.ledger) ? source.ledger.slice(-500) : [],
    dailyBattle: {
      nextBattleAt: Math.max(0, source.dailyBattle?.nextBattleAt ?? 0),
      activeAttemptId: source.dailyBattle?.activeAttemptId ?? null,
      activeStartedAt: source.dailyBattle?.activeStartedAt ?? null,
      history: Array.isArray(source.dailyBattle?.history) ? source.dailyBattle.history.slice(-30) : [],
    },
    retention: source.retention,
  };
}

/**
 * The transient encounter for an in-progress dungeon fight. Isolated from the
 * open-world combat slice so a run survives section changes and reloads.
 */
export interface DungeonCombatSlice {
  encounter: CombatEncounter | null;
  nextRoundAt: number | null;
  /** Hunter HP carried between dungeon floors while a run is active. */
  playerHp: number;
}

/** The persistence boundary for authoritative game data. */
export interface GamePersistence {
  load(playerId: string): GameSaveData | null;
  save(playerId: string, data: GameSaveData, syncCloud?: boolean): void;
  remove(playerId: string): void;
}
