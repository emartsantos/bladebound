// ─── CHARACTER PROGRESSION TYPES ──────────────────────────────────
// Phase 5: XP curves, level calculation, stat computation, skill
// progression, total level, unlock checks, and dev tools.

import type { StatBlock } from './combat';
import type { SkillId } from './skill';

// ─── XP CURVE CONFIGURATION ─────────────────────────────────────

export interface XpCurveConfig {
  /** Base XP required for level 1→2. */
  base: number;
  /** Growth factor per level. Formula: base * (growth ^ (level - 1)). */
  growth: number;
  /** Optional soft-cap level where growth changes. */
  softCap?: number;
  /** Growth factor after soft-cap. */
  softCapGrowth?: number;
  /** Maximum level cap. */
  maxLevel: number;
}

// ─── LEVEL RESULTS ──────────────────────────────────────────────

export interface LevelUpResult {
  /** Whether a level-up occurred. */
  leveled: boolean;
  /** Previous level. */
  previousLevel: number;
  /** New level (same as previous if no level-up). */
  newLevel: number;
  /** Number of levels gained (can be >1 for large XP bursts). */
  levelsGained: number;
  /** Total XP required for the current level bracket. */
  xpForCurrentLevel: number;
  /** XP remaining to next level. */
  xpToNext: number;
  /** Events generated (for UI: level-up banner, stat recalc, etc.). */
  events: ProgressionEvent[];
}

// ─── PROGRESSION EVENTS ─────────────────────────────────────────

export interface ProgressionEvent {
  type: 'level_up' | 'skill_level_up' | 'unlock' | 'stat_recalculated';
  /** What gained a level. */
  target: string;
  /** Previous value. */
  previous: number;
  /** New value. */
  next: number;
  /** Timestamp. */
  timestamp: number;
}

// ─── SKILL PROGRESSION ──────────────────────────────────────────

export interface SkillProgressionResult {
  /** Whether a skill level-up occurred. */
  leveled: boolean;
  skillId: SkillId;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  xpForCurrentLevel: number;
  xpToNext: number;
  events: ProgressionEvent[];
}

// ─── STAT COMPUTATION ───────────────────────────────────────────

export interface ProgressionStatContribution {
  /** Base stat from level alone. */
  baseFromLevel: number;
  /** Additional stats from skill levels. */
  fromSkills: number;
  /** Total. */
  total: number;
}

export interface ComputedPlayerStats {
  maxHealth: ProgressionStatContribution;
  strength: ProgressionStatContribution;
  agility: ProgressionStatContribution;
  intelligence: ProgressionStatContribution;
  vitality: ProgressionStatContribution;
  damage: ProgressionStatContribution;
  defense: ProgressionStatContribution;
}

// ─── UNLOCK CHECKS ──────────────────────────────────────────────

export interface ProgressionUnlockCondition {
  type: 'level' | 'skill_level' | 'total_level' | 'quest_complete' | 'region_discovered';
  /** Target level/quest/region ID. */
  target: string;
  /** Comparison operator. */
  comparison: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  /** Required value. */
  value: number;
}

export interface UnlockCheckResult {
  met: boolean;
  /** Conditions that were not met (empty if all met). */
  failed: Array<{ condition: ProgressionUnlockCondition; actual: number }>;
}

// ─── TOTAL LEVEL ────────────────────────────────────────────────

export interface TotalLevelBreakdown {
  combatLevel: number;
  /** Sum of all skill levels. */
  skillLevels: number;
  /** combatLevel + skillLevels. */
  totalLevel: number;
}

// ─── DEV TOOLS ──────────────────────────────────────────────────

export interface GrantXpInput {
  currentLevel: number;
  currentXp: number;
  amount: number;
  config?: XpCurveConfig;
}

export interface SetLevelInput {
  targetLevel: number;
  config?: XpCurveConfig;
}

export interface ResetSkillInput {
  skillId: SkillId;
  currentLevel: number;
  currentXp: number;
}

export interface ProgressionSimConfig {
  /** Number of XP grants to simulate. */
  iterations: number;
  /** XP per iteration. */
  xpPerGrant: number;
  /** Starting level. */
  startLevel?: number;
  /** Starting XP. */
  startXp?: number;
  config?: XpCurveConfig;
}

export interface ProgressionSimResult {
  /** Final level. */
  finalLevel: number;
  /** Final XP. */
  finalXp: number;
  /** Total XP granted. */
  totalXpGranted: number;
  /** Number of level-ups that occurred. */
  levelUps: number;
  /** History of level transitions. */
  transitions: Array<{ from: number; to: number; atXp: number }>;
}
