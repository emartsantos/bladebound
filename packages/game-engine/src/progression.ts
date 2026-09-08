// ─── CHARACTER PROGRESSION ENGINE ─────────────────────────────────
// Phase 5: Central XP curves, level calculation, stat computation,
// skill progression, total level, unlock checks, and dev tools.
//
// Pure functions, no framework imports.

import type { SkillId } from '@premium-rpg/shared-types';
import type {
  XpCurveConfig,
  LevelUpResult,
  SkillProgressionResult,
  ComputedPlayerStats,
  ProgressionStatContribution,
  ProgressionUnlockCondition,
  UnlockCheckResult,
  TotalLevelBreakdown,
  GrantXpInput,
  SetLevelInput,
  ResetSkillInput,
  ProgressionSimConfig,
  ProgressionSimResult,
  ProgressionEvent,
} from '@premium-rpg/shared-types';

// ─── DEFAULT XP CURVE ───────────────────────────────────────────
// Classic MMO curve: grows quadratically, soft-caps at 70,
// max level 99.

export const DEFAULT_XP_CURVE: XpCurveConfig = {
  base: 100,
  growth: 1.15,
  softCap: 70,
  softCapGrowth: 1.25,
  maxLevel: 99,
};

// ─── XP CURVE MATH ──────────────────────────────────────────────

/**
 * Calculate the XP required to reach `level` from `level - 1`.
 * At level 1 this returns 0 (level 1 requires 0 XP).
 */
export function xpRequiredForLevel(level: number, config: XpCurveConfig = DEFAULT_XP_CURVE): number {
  if (level <= 1) return 0;
  const l = level - 1; // XP needed to go from level-1 → level
  if (config.softCap && l >= config.softCap && config.softCapGrowth) {
    // Compute XP up to softCap with base growth, then remaining with softCapGrowth
    const xpToSoftCap = xpRequiredForLevel(config.softCap, config);
    let xp = xpToSoftCap;
    for (let i = config.softCap; i < l; i++) {
      xp = Math.floor(xp * config.softCapGrowth + 10);
    }
    return xp;
  }
  // Base formula: sum of geometric series rounded
  return Math.floor(config.base * (Math.pow(config.growth, l - 1)));
}

/**
 * Calculate the total cumulative XP required to reach `level` from level 1.
 */
export function totalXpForLevel(level: number, config: XpCurveConfig = DEFAULT_XP_CURVE): number {
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += xpRequiredForLevel(l, config);
  }
  return total;
}

/**
 * Given total accumulated XP, compute the level and XP within current bracket.
 */
export function levelFromXp(totalXp: number, config: XpCurveConfig = DEFAULT_XP_CURVE): { level: number; xpInLevel: number; xpForLevel: number; xpToNext: number } {
  let level = 1;
  let accumulated = 0;

  while (level < config.maxLevel) {
    const needed = xpRequiredForLevel(level + 1, config);
    if (accumulated + needed > totalXp) {
      return {
        level,
        xpInLevel: totalXp - accumulated,
        xpForLevel: needed,
        xpToNext: needed - (totalXp - accumulated),
      };
    }
    accumulated += needed;
    level++;
  }

  return {
    level: config.maxLevel,
    xpInLevel: 0,
    xpForLevel: 0,
    xpToNext: 0,
  };
}

// ─── LEVEL-UP PROCESSING ────────────────────────────────────────

/**
 * Process an XP grant and return the resulting level-up info.
 */
export function processXpGrant(
  currentLevel: number,
  currentXpInLevel: number,
  xpAmount: number,
  config: XpCurveConfig = DEFAULT_XP_CURVE,
): LevelUpResult {
  const now = Date.now();
  let xpRemaining = currentXpInLevel + xpAmount;
  let level = currentLevel;
  let levelsGained = 0;
  const events: ProgressionEvent[] = [];

  while (level < config.maxLevel) {
    const needed = xpRequiredForLevel(level + 1, config);
    if (xpRemaining < needed) break;

    xpRemaining -= needed;
    levelsGained++;
    const prevLevel = level;
    level++;

    events.push({
      type: 'level_up',
      target: 'combat_level',
      previous: prevLevel,
      next: level,
      timestamp: now,
    });
  }

  // If at max level, cap remaining XP
  if (level >= config.maxLevel) {
    xpRemaining = 0;
  }

  return {
    leveled: levelsGained > 0,
    previousLevel: currentLevel,
    newLevel: level,
    levelsGained,
    xpForCurrentLevel: xpRequiredForLevel(level + 1, config),
    xpToNext: level < config.maxLevel ? xpRequiredForLevel(level + 1, config) - xpRemaining : 0,
    events,
  };
}

// ─── SKILL PROGRESSION ──────────────────────────────────────────

/**
 * Process XP gain for a skill. Same curve as combat but configurable.
 */
export function processSkillXpGain(
  skillId: SkillId,
  currentLevel: number,
  currentXpInLevel: number,
  xpAmount: number,
  config: XpCurveConfig = DEFAULT_XP_CURVE,
): SkillProgressionResult {
  const now = Date.now();
  let xpRemaining = currentXpInLevel + xpAmount;
  let level = currentLevel;
  let levelsGained = 0;
  const events: ProgressionEvent[] = [];

  while (level < config.maxLevel) {
    const needed = xpRequiredForLevel(level + 1, config);
    if (xpRemaining < needed) break;

    xpRemaining -= needed;
    levelsGained++;
    const prevLevel = level;
    level++;

    events.push({
      type: 'skill_level_up',
      target: skillId,
      previous: prevLevel,
      next: level,
      timestamp: now,
    });
  }

  if (level >= config.maxLevel) xpRemaining = 0;

  return {
    leveled: levelsGained > 0,
    skillId,
    previousLevel: currentLevel,
    newLevel: level,
    levelsGained,
    xpForCurrentLevel: xpRequiredForLevel(level + 1, config),
    xpToNext: level < config.maxLevel ? xpRequiredForLevel(level + 1, config) - xpRemaining : 0,
    events,
  };
}

// ─── STAT COMPUTATION ───────────────────────────────────────────

/** Per-level stat growth table. Indexed by stat name. */
const LEVEL_STAT_GROWTH: Record<string, (level: number) => number> = {
  maxHealth: (lvl) => 20 + lvl * 8,
  strength: (lvl) => 2 + Math.floor(lvl * 0.8),
  agility: (lvl) => 2 + Math.floor(lvl * 0.6),
  intelligence: (lvl) => 2 + Math.floor(lvl * 0.5),
  vitality: (lvl) => 2 + Math.floor(lvl * 0.7),
  damage: (lvl) => 3 + Math.floor(lvl * 1.2),
  defense: (lvl) => 1 + Math.floor(lvl * 0.6),
};

const SKILL_STAT_BONUSES: Record<string, Partial<Record<keyof ComputedPlayerStats, number>>> = {
  mining: { strength: 0.5, vitality: 0.3 },
  woodcutting: { agility: 0.4, strength: 0.2 },
  fishing: { agility: 0.3, maxHealth: 1 },
  smithing: { strength: 0.4, vitality: 0.3 },
  cooking: { maxHealth: 2, vitality: 0.2 },
  alchemy: { intelligence: 0.5 },
  enchanting: { intelligence: 0.6 },
  fletching: { agility: 0.4, strength: 0.2 },
  runecrafting: { intelligence: 0.7 },
};

function contrib(base: number, skillBonus: number): ProgressionStatContribution {
  return { baseFromLevel: base, fromSkills: skillBonus, total: base + skillBonus };
}

/**
 * Compute level-based stats for a given combat level and skill levels.
 * Equipment bonuses are NOT included (use equipment.ts for that).
 */
export function computeProgressionStats(
  combatLevel: number,
  skillLevels: Record<string, number>,
): ComputedPlayerStats {
  const base: Record<string, number> = {};
  const skillBonus: Record<string, number> = {};

  for (const [stat, fn] of Object.entries(LEVEL_STAT_GROWTH)) {
    base[stat] = fn(combatLevel);
    skillBonus[stat] = 0;
  }

  for (const [skillId, skillLevel] of Object.entries(skillLevels)) {
    const bonuses = SKILL_STAT_BONUSES[skillId];
    if (!bonuses) continue;
    for (const [stat, perLevel] of Object.entries(bonuses)) {
      skillBonus[stat] = (skillBonus[stat] ?? 0) + Math.floor(skillLevel * perLevel);
    }
  }

  return {
    maxHealth: contrib(base.maxHealth ?? 0, skillBonus.maxHealth ?? 0),
    strength: contrib(base.strength ?? 0, skillBonus.strength ?? 0),
    agility: contrib(base.agility ?? 0, skillBonus.agility ?? 0),
    intelligence: contrib(base.intelligence ?? 0, skillBonus.intelligence ?? 0),
    vitality: contrib(base.vitality ?? 0, skillBonus.vitality ?? 0),
    damage: contrib(base.damage ?? 0, skillBonus.damage ?? 0),
    defense: contrib(base.defense ?? 0, skillBonus.defense ?? 0),
  };
}

// ─── TOTAL LEVEL ────────────────────────────────────────────────

/**
 * Compute total level from combat level and all skill levels.
 */
export function computeTotalLevel(
  combatLevel: number,
  skillLevels: Record<string, number>,
): TotalLevelBreakdown {
  const skillLevelsSum = Object.values(skillLevels).reduce((a, b) => a + b, 0);
  return {
    combatLevel,
    skillLevels: skillLevelsSum,
    totalLevel: combatLevel + skillLevelsSum,
  };
}

// ─── UNLOCK CHECKS ──────────────────────────────────────────────

export interface UnlockContext {
  combatLevel: number;
  skillLevels: Record<string, number>;
  totalLevel: number;
  completedQuests: string[];
  discoveredRegions: string[];
}

/**
 * Check whether all unlock conditions are met.
 */
export function checkUnlocks(
  conditions: ProgressionUnlockCondition[],
  context: UnlockContext,
): UnlockCheckResult {
  const failed: UnlockCheckResult['failed'] = [];

  for (const cond of conditions) {
    let actual = 0;
    switch (cond.type) {
      case 'level':
        actual = context.combatLevel;
        break;
      case 'skill_level':
        actual = context.skillLevels[cond.target] ?? 0;
        break;
      case 'total_level':
        actual = context.totalLevel;
        break;
      case 'quest_complete':
        actual = context.completedQuests.includes(cond.target) ? 1 : 0;
        break;
      case 'region_discovered':
        actual = context.discoveredRegions.includes(cond.target) ? 1 : 0;
        break;
    }

    let met = false;
    switch (cond.comparison) {
      case 'gte': met = actual >= cond.value; break;
      case 'gt': met = actual > cond.value; break;
      case 'lte': met = actual <= cond.value; break;
      case 'lt': met = actual < cond.value; break;
      case 'eq': met = actual === cond.value; break;
    }

    if (!met) {
      failed.push({ condition: cond, actual });
    }
  }

  return { met: failed.length === 0, failed };
}

// ─── DEV TOOLS ──────────────────────────────────────────────────

/**
 * Grant XP to a character. Returns the new level and XP state.
 */
export function grantXp(input: GrantXpInput): { newLevel: number; newXp: number; result: LevelUpResult } {
  const result = processXpGrant(input.currentLevel, input.currentXp, input.amount, input.config);
  return {
    newLevel: result.newLevel,
    newXp: result.xpToNext > 0 ? result.xpForCurrentLevel - result.xpToNext : 0,
    result,
  };
}

/**
 * Set a character to a specific level (resetting XP within level to 0).
 */
export function setLevel(input: SetLevelInput): { level: number; xp: number } {
  const config = input.config ?? DEFAULT_XP_CURVE;
  const level = Math.max(1, Math.min(input.targetLevel, config.maxLevel));
  return { level, xp: 0 };
}

/**
 * Reset a skill to level 1, 0 XP.
 */
export function resetSkill(input: ResetSkillInput): { skillId: SkillId; level: number; xp: number } {
  return { skillId: input.skillId, level: 1, xp: 0 };
}

/**
 * Simulate a progression loop for balancing purposes.
 */
export function simulateProgression(input: ProgressionSimConfig): ProgressionSimResult {
  const config = input.config ?? DEFAULT_XP_CURVE;
  let level = input.startLevel ?? 1;
  let xpInLevel = input.startXp ?? 0;
  let totalXp = 0;
  let levelUps = 0;
  const transitions: ProgressionSimResult['transitions'] = [];

  for (let i = 0; i < input.iterations; i++) {
    const result = processXpGrant(level, xpInLevel, input.xpPerGrant, config);
    if (result.leveled) {
      levelUps += result.levelsGained;
      transitions.push({ from: result.previousLevel, to: result.newLevel, atXp: totalXp });
      level = result.newLevel;
    }
    xpInLevel = result.xpToNext > 0 ? result.xpForCurrentLevel - result.xpToNext : 0;
    totalXp += input.xpPerGrant;
  }

  return {
    finalLevel: level,
    finalXp: xpInLevel,
    totalXpGranted: totalXp,
    levelUps,
    transitions,
  };
}
