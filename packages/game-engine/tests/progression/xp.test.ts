import { describe, expect, it } from 'vitest';
import {
  BASE_XP,
  MAX_LEVEL,
  XP_GROWTH,
  gainExperience,
  levelForXp,
  xpForLevel,
  xpForNextLevel,
} from '../../src/progression/xp';

describe('xpForLevel', () => {
  it('level 1 requires zero cumulative XP', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('level 2 requires the first step', () => {
    expect(xpForLevel(2)).toBe(Math.floor(BASE_XP * Math.pow(1, XP_GROWTH)));
  });

  it('is monotonically increasing', () => {
    for (let level = 1; level < MAX_LEVEL; level += 1) {
      expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
    }
  });

  it('throws for invalid level 0', () => {
    expect(() => xpForLevel(0)).toThrow();
  });

  it('throws for negative level', () => {
    expect(() => xpForLevel(-5)).toThrow();
  });

  it('throws for level above max', () => {
    expect(() => xpForLevel(MAX_LEVEL + 1)).toThrow();
  });

  it('throws for non-integer level', () => {
    expect(() => xpForLevel(1.5)).toThrow();
  });
});

describe('levelForXp', () => {
  it('returns 1 for zero XP', () => {
    expect(levelForXp(0)).toBe(1);
  });

  it('returns 1 for XP below level 2 threshold', () => {
    expect(levelForXp(xpForLevel(2) - 1)).toBe(1);
  });

  it('reaches the boundary level at exactly the threshold', () => {
    expect(levelForXp(xpForLevel(10))).toBe(10);
  });

  it('returns 1 level below the next threshold', () => {
    expect(levelForXp(xpForLevel(10) - 1)).toBe(9);
  });

  it('caps at max level for very high XP', () => {
    expect(levelForXp(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
  });

  it('throws for negative XP', () => {
    expect(() => levelForXp(-1)).toThrow();
  });

  it('throws for NaN', () => {
    expect(() => levelForXp(NaN)).toThrow();
  });
});

describe('xpForNextLevel', () => {
  it('returns 0 at max level', () => {
    expect(xpForNextLevel(xpForLevel(MAX_LEVEL))).toBe(0);
  });

  it('returns exact remaining XP at boundary', () => {
    expect(xpForNextLevel(0)).toBe(xpForLevel(2));
  });
});

describe('gainExperience', () => {
  it('adds XP and reports no level gain', () => {
    const result = gainExperience(0, 10);
    expect(result.newXp).toBe(10);
    expect(result.newLevel).toBe(1);
    expect(result.levelsGained).toBe(0);
  });

  it('reports a level gain crossing a threshold', () => {
    const before = xpForLevel(5);
    const result = gainExperience(before, xpForNextLevel(before));
    expect(result.levelsGained).toBe(1);
    expect(result.newLevel).toBe(6);
  });

  it('does not reduce XP for zero gain', () => {
    const result = gainExperience(500, 0);
    expect(result.newXp).toBe(500);
    expect(result.levelsGained).toBe(0);
  });

  it('throws for negative gain', () => {
    expect(() => gainExperience(500, -10)).toThrow();
  });

  it('throws for negative current XP', () => {
    expect(() => gainExperience(-1, 10)).toThrow();
  });
});