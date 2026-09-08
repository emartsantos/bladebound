import type { EnemyDefinition } from './combat';
import type { UnlockCondition } from './domain';

// ─── DUNGEON DEFINITION ──────────────────────────────────────────────

// A dungeon is a structured, linear sequence of encounters culminating
// in a boss. It is NOT merely an enemy-selection screen — each encounter
// is authored with placement, modifiers, and enemy groups.
export type DungeonEncounterType = 'trash' | 'elite' | 'miniboss' | 'boss';

export interface DungeonEncounter {
  id: string;
  type: DungeonEncounterType;
  name: string;
  description: string;
  // Primary enemy for this encounter (boss/miniboss fights use this)
  enemyId?: string;
  // Group of enemies for multi-target trash/elite fights
  enemyIds?: string[];
  // Modifiers applied to the encounter (strategic variety)
  modifiers?: DungeonModifier[];
  // Base XP/gold for clearing this encounter (boss uses its own reward)
  xpReward?: number;
  goldReward?: number;
  // Optional unique drops specific to this encounter
  guaranteedDrops?: { itemId: string; quantity: number }[];
}

export type DungeonModifier =
  | 'defensive'      // enemies have +armor
  | 'offensive'      // enemies deal +damage
  | 'quick'          // enemies attack faster
  | 'tanky'          // enemies have +health
  | 'regenerating'   // enemies heal over time
  | 'cursed';        // player stats debuffed

export interface DungeonEntryRequirement {
  level: number;
  keyId?: string;       // consumable key required to enter (optional)
  keyConsumedOnEntry?: boolean;
  unlockConditions?: UnlockCondition[];
}

export interface DungeonReward {
  guaranteed: { itemId: string; quantity: number }[];
  weightedLootTableId?: string;
  firstClearBonus?: { itemId: string; quantity: number }[];
  xp: number;
  gold: number;
}

export interface DungeonDefinition {
  id: string;
  name: string;
  regionId: string;
  description: string;
  recommendedLevel: number;
  maxFloor: number;
  entryRequirement: DungeonEntryRequirement;
  encounters: DungeonEncounter[];
  // Rewards for completing the full run
  reward: DungeonReward;
  // Whether repeat runs are allowed and give reduced reward
  repeatable: boolean;
  repeatRewardMultiplier: number; // 0-1 scale applied to repeat rewards
  difficultyModifiers?: string[]; // placeholder for future difficulty system
}

// ─── DUNGEON RUN STATE ───────────────────────────────────────────────

export type DungeonRunStatus = 'idle' | 'active' | 'completed' | 'failed' | 'abandoned';

export interface DungeonRunState {
  dungeonId: string;
  status: DungeonRunStatus;
  currentFloor: number;        // 1-based index into encounters
  startedAt: number;
  // Snapshot of the encounter being fought
  currentEncounterId: string | null;
  encountersCleared: string[];
  isFirstClear: boolean;       // whether this run qualifies for first-clear bonus
  completedAt: number | null;
  result: 'victory' | 'defeat' | null;
}

export interface DungeonRunHistory {
  dungeonId: string;
  completedAt: number;
  floorsCleared: number;
  success: boolean;
  isFirstClear: boolean;
  xpGained: number;
  goldGained: number;
  itemsGained: { itemId: string; quantity: number }[];
  timeTakenMs: number;
}

export interface DungeonProgressState {
  bestFloor: number;                 // highest floor reached
  clears: number;                    // total successful clears
  firstClearDone: boolean;           // first-clear bonus already claimed
  firstClearAt: number | null;
  bestTimeMs: number | null;         // fasted full clear
  lastRunTime: number | null;
  history: DungeonRunHistory[];      // capped list of past runs
  // Legacy: track boss cleared per dungeon (for UI + rewards): bossId -> first clear
  bossCleared: Record<string, boolean>;
}

// Full player-side dungeon save payload
export interface PlayerDungeonState {
  currentRun: DungeonRunState | null;
  progress: Record<string, DungeonProgressState>; // dungeonId -> progress
}
