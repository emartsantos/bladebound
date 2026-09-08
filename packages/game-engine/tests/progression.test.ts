import { describe, it, expect } from 'vitest';
import {
  DEFAULT_XP_CURVE,
  xpRequiredForLevel,
  totalXpForLevel,
  levelFromXp,
  processXpGrant,
  processSkillXpGain,
  computeProgressionStats,
  computeTotalLevel,
  checkUnlocks,
  grantXp,
  setLevel,
  resetSkill,
  simulateProgression,
} from '../src/progression';
import type {
  XpCurveConfig,
  ProgressionUnlockCondition,
} from '@premium-rpg/shared-types';

// ── XP CURVE ───────────────────────────────────────────────────

describe('xpRequiredForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
  });

  it('returns base XP for level 2', () => {
    expect(xpRequiredForLevel(2)).toBe(DEFAULT_XP_CURVE.base);
  });

  it('increases monotonically', () => {
    for (let l = 2; l <= 20; l++) {
      expect(xpRequiredForLevel(l + 1)).toBeGreaterThan(xpRequiredForLevel(l));
    }
  });

  it('uses custom curve config', () => {
    const config: XpCurveConfig = { base: 50, growth: 1.1, maxLevel: 30 };
    expect(xpRequiredForLevel(2, config)).toBe(50);
    expect(xpRequiredForLevel(3, config)).toBe(Math.floor(50 * 1.1));
  });
});

describe('totalXpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(totalXpForLevel(1)).toBe(0);
  });

  it('accumulates correctly for level 3', () => {
    const total = xpRequiredForLevel(2) + xpRequiredForLevel(3);
    expect(totalXpForLevel(3)).toBe(total);
  });
});

describe('levelFromXp', () => {
  it('returns level 1 with 0 XP', () => {
    const result = levelFromXp(0);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(0);
  });

  it('levels up with enough XP', () => {
    const xpNeeded = xpRequiredForLevel(2);
    const result = levelFromXp(xpNeeded);
    expect(result.level).toBe(2);
    expect(result.xpInLevel).toBe(0);
  });

  it('handles partial XP within a level', () => {
    const xpNeeded = xpRequiredForLevel(2);
    const result = levelFromXp(Math.floor(xpNeeded / 2));
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(Math.floor(xpNeeded / 2));
  });

  it('caps at max level', () => {
    const hugeXp = totalXpForLevel(DEFAULT_XP_CURVE.maxLevel) + 999999;
    const result = levelFromXp(hugeXp);
    expect(result.level).toBe(DEFAULT_XP_CURVE.maxLevel);
  });
});

// ── LEVEL-UP PROCESSING ────────────────────────────────────────

describe('processXpGrant', () => {
  it('does not level up with insufficient XP', () => {
    const result = processXpGrant(1, 0, 50);
    expect(result.leveled).toBe(false);
    expect(result.newLevel).toBe(1);
    expect(result.levelsGained).toBe(0);
    expect(result.events).toHaveLength(0);
  });

  it('levels up with exact XP', () => {
    const xpNeeded = xpRequiredForLevel(2);
    const result = processXpGrant(1, 0, xpNeeded);
    expect(result.leveled).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.levelsGained).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('level_up');
  });

  it('handles multi-level burst', () => {
    // Grant huge XP to jump multiple levels
    const totalXp = totalXpForLevel(10);
    const result = processXpGrant(1, 0, totalXp);
    expect(result.leveled).toBe(true);
    expect(result.newLevel).toBe(10);
    expect(result.levelsGained).toBe(9);
    expect(result.events).toHaveLength(9);
  });

  it('caps at max level', () => {
    const hugeXp = totalXpForLevel(DEFAULT_XP_CURVE.maxLevel) + 999999;
    const result = processXpGrant(1, 0, hugeXp);
    expect(result.newLevel).toBe(DEFAULT_XP_CURVE.maxLevel);
    expect(result.xpToNext).toBe(0);
  });

  it('carries over existing XP in level', () => {
    const xpNeeded = xpRequiredForLevel(2);
    // Start with half the XP needed, then grant the other half
    const result = processXpGrant(1, Math.floor(xpNeeded / 2), xpNeeded);
    expect(result.leveled).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});

// ── SKILL PROGRESSION ──────────────────────────────────────────

describe('processSkillXpGain', () => {
  it('does not level up with insufficient XP', () => {
    const result = processSkillXpGain('mining', 1, 0, 50);
    expect(result.leveled).toBe(false);
    expect(result.newLevel).toBe(1);
    expect(result.skillId).toBe('mining');
  });

  it('levels up with enough XP', () => {
    const xpNeeded = xpRequiredForLevel(2);
    const result = processSkillXpGain('mining', 1, 0, xpNeeded);
    expect(result.leveled).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.events[0].target).toBe('mining');
    expect(result.events[0].type).toBe('skill_level_up');
  });

  it('handles multi-level burst', () => {
    const totalXp = totalXpForLevel(5);
    const result = processSkillXpGain('woodcutting', 1, 0, totalXp);
    expect(result.newLevel).toBe(5);
    expect(result.levelsGained).toBe(4);
  });

  it('caps at max level', () => {
    const hugeXp = totalXpForLevel(DEFAULT_XP_CURVE.maxLevel) + 999999;
    const result = processSkillXpGain('fishing', 1, 0, hugeXp);
    expect(result.newLevel).toBe(DEFAULT_XP_CURVE.maxLevel);
    expect(result.xpToNext).toBe(0);
  });
});

// ── STAT COMPUTATION ───────────────────────────────────────────

describe('computeProgressionStats', () => {
  it('returns base stats for level 1 with no skills', () => {
    const stats = computeProgressionStats(1, {});
    expect(stats.maxHealth.baseFromLevel).toBe(28); // 20 + 1*8
    expect(stats.strength.baseFromLevel).toBe(2);   // 2 + floor(1*0.8)
    expect(stats.damage.baseFromLevel).toBe(4);     // 3 + floor(1*1.2)
    expect(stats.maxHealth.fromSkills).toBe(0);
  });

  it('increases stats with level', () => {
    const lvl1 = computeProgressionStats(1, {});
    const lvl10 = computeProgressionStats(10, {});
    expect(lvl10.maxHealth.baseFromLevel).toBeGreaterThan(lvl1.maxHealth.baseFromLevel);
    expect(lvl10.strength.baseFromLevel).toBeGreaterThan(lvl1.strength.baseFromLevel);
    expect(lvl10.damage.baseFromLevel).toBeGreaterThan(lvl1.damage.baseFromLevel);
  });

  it('adds skill bonuses', () => {
    const noSkills = computeProgressionStats(10, {});
    const withMining = computeProgressionStats(10, { mining: 50 });
    expect(withMining.strength.fromSkills).toBeGreaterThan(noSkills.strength.fromSkills);
    expect(withMining.vitality.fromSkills).toBeGreaterThan(noSkills.vitality.fromSkills);
  });

  it('sums base + skill bonuses in total', () => {
    const stats = computeProgressionStats(10, { mining: 20 });
    expect(stats.strength.total).toBe(stats.strength.baseFromLevel + stats.strength.fromSkills);
  });

  it('handles multiple skills', () => {
    const stats = computeProgressionStats(10, { mining: 30, smithing: 20 });
    // mining gives str 0.5/lvl, smithing gives str 0.4/lvl
    // str from skills = floor(30*0.5) + floor(20*0.4) = 15 + 8 = 23
    expect(stats.strength.fromSkills).toBe(23);
  });
});

// ── TOTAL LEVEL ────────────────────────────────────────────────

describe('computeTotalLevel', () => {
  it('returns combat level when no skills', () => {
    const result = computeTotalLevel(10, {});
    expect(result.combatLevel).toBe(10);
    expect(result.skillLevels).toBe(0);
    expect(result.totalLevel).toBe(10);
  });

  it('sums combat + all skill levels', () => {
    const result = computeTotalLevel(10, { mining: 15, woodcutting: 8 });
    expect(result.skillLevels).toBe(23);
    expect(result.totalLevel).toBe(33);
  });
});

// ── UNLOCK CHECKS ──────────────────────────────────────────────

describe('checkUnlocks', () => {
  const ctx = {
    combatLevel: 15,
    skillLevels: { mining: 20, woodcutting: 10 },
    totalLevel: 45,
    completedQuests: ['q1', 'q2'],
    discoveredRegions: ['starter', 'ashenvale'],
  };

  it('returns met: true when all conditions satisfied', () => {
    const conds: ProgressionUnlockCondition[] = [
      { type: 'level', target: '', comparison: 'gte', value: 10 },
      { type: 'skill_level', target: 'mining', comparison: 'gte', value: 15 },
    ];
    expect(checkUnlocks(conds, ctx).met).toBe(true);
  });

  it('returns met: false when a condition fails', () => {
    const conds: ProgressionUnlockCondition[] = [
      { type: 'level', target: '', comparison: 'gte', value: 10 },
      { type: 'skill_level', target: 'mining', comparison: 'gte', value: 25 },
    ];
    const result = checkUnlocks(conds, ctx);
    expect(result.met).toBe(false);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].actual).toBe(20);
  });

  it('checks quest_complete', () => {
    const conds: ProgressionUnlockCondition[] = [
      { type: 'quest_complete', target: 'q1', comparison: 'eq', value: 1 },
    ];
    expect(checkUnlocks(conds, ctx).met).toBe(true);
    const conds2: ProgressionUnlockCondition[] = [
      { type: 'quest_complete', target: 'q99', comparison: 'eq', value: 1 },
    ];
    expect(checkUnlocks(conds2, ctx).met).toBe(false);
  });

  it('checks region_discovered', () => {
    const conds: ProgressionUnlockCondition[] = [
      { type: 'region_discovered', target: 'ashenvale', comparison: 'eq', value: 1 },
    ];
    expect(checkUnlocks(conds, ctx).met).toBe(true);
    const conds2: ProgressionUnlockCondition[] = [
      { type: 'region_discovered', target: 'dragonspine', comparison: 'eq', value: 1 },
    ];
    expect(checkUnlocks(conds2, ctx).met).toBe(false);
  });

  it('checks total_level', () => {
    const conds: ProgressionUnlockCondition[] = [
      { type: 'total_level', target: '', comparison: 'gte', value: 40 },
    ];
    expect(checkUnlocks(conds, ctx).met).toBe(true);
    const conds2: ProgressionUnlockCondition[] = [
      { type: 'total_level', target: '', comparison: 'gte', value: 50 },
    ];
    expect(checkUnlocks(conds2, ctx).met).toBe(false);
  });

  it('checks all comparison operators', () => {
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'gt', value: 14 }], ctx).met).toBe(true);
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'gt', value: 15 }], ctx).met).toBe(false);
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'lt', value: 16 }], ctx).met).toBe(true);
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'lt', value: 15 }], ctx).met).toBe(false);
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'eq', value: 15 }], ctx).met).toBe(true);
    expect(checkUnlocks([{ type: 'level', target: '', comparison: 'lte', value: 15 }], ctx).met).toBe(true);
  });
});

// ── DEV TOOLS ──────────────────────────────────────────────────

describe('grantXp', () => {
  it('grants XP and returns new state', () => {
    const xpNeeded = xpRequiredForLevel(2);
    const result = grantXp({ currentLevel: 1, currentXp: 0, amount: xpNeeded });
    expect(result.newLevel).toBe(2);
  });

  it('returns same level with insufficient XP', () => {
    const result = grantXp({ currentLevel: 1, currentXp: 0, amount: 10 });
    expect(result.newLevel).toBe(1);
  });
});

describe('setLevel', () => {
  it('sets level correctly', () => {
    expect(setLevel({ targetLevel: 50 })).toEqual({ level: 50, xp: 0 });
  });

  it('clamps to min level 1', () => {
    expect(setLevel({ targetLevel: 0 })).toEqual({ level: 1, xp: 0 });
  });

  it('clamps to max level', () => {
    expect(setLevel({ targetLevel: 999 })).toEqual({ level: DEFAULT_XP_CURVE.maxLevel, xp: 0 });
  });
});

describe('resetSkill', () => {
  it('resets a skill to level 1, 0 XP', () => {
    const result = resetSkill({ skillId: 'mining', currentLevel: 50, currentXp: 5000 });
    expect(result).toEqual({ skillId: 'mining', level: 1, xp: 0 });
  });
});

describe('simulateProgression', () => {
  it('simulates XP grants and tracks level-ups', () => {
    const result = simulateProgression({
      iterations: 100,
      xpPerGrant: 100,
      startLevel: 1,
      startXp: 0,
    });
    expect(result.totalXpGranted).toBe(10000);
    expect(result.levelUps).toBeGreaterThan(0);
    expect(result.finalLevel).toBeGreaterThan(1);
    expect(result.transitions.length).toBeGreaterThan(0);
  });

  it('respects max level', () => {
    const gentleCurve: XpCurveConfig = { base: 50, growth: 1.05, maxLevel: 30 };
    const result = simulateProgression({
      iterations: 5000,
      xpPerGrant: 200,
      startLevel: 1,
      config: gentleCurve,
    });
    expect(result.finalLevel).toBe(30);
  });
});

// ── DATA INTEGRITY ─────────────────────────────────────────────

describe('progression data integrity', () => {
  it('default XP curve has valid values', () => {
    expect(DEFAULT_XP_CURVE.base).toBeGreaterThan(0);
    expect(DEFAULT_XP_CURVE.growth).toBeGreaterThan(1);
    expect(DEFAULT_XP_CURVE.maxLevel).toBeGreaterThan(1);
  });

  it('XP required is always non-negative', () => {
    for (let l = 1; l <= 30; l++) {
      expect(xpRequiredForLevel(l)).toBeGreaterThanOrEqual(0);
    }
  });

  it('totalXpForLevel is monotonically increasing', () => {
    for (let l = 2; l <= 20; l++) {
      expect(totalXpForLevel(l)).toBeGreaterThan(totalXpForLevel(l - 1));
    }
  });
});
