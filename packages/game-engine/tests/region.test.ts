import { describe, it, expect } from 'vitest';
import {
  createRegionProgress,
  isRegionUnlocked,
  getUnlockedRegions,
  moveToRegion,
  markBossDefeated,
  isBossDefeated,
  countDefeatedBosses,
  getNextRegion,
} from '../src/region';
import type { Region } from '../src/region';

const testRegions: Region[] = [
  {
    id: 'starter-frontier',
    name: 'Starter Frontier',
    recommendedLevel: 1,
    unlockConditions: [],
  },
  {
    id: 'darkwood-forest',
    name: 'Darkwood Forest',
    recommendedLevel: 8,
    unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 6 }],
  },
  {
    id: 'ruined-province',
    name: 'Ruined Province',
    recommendedLevel: 18,
    unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 15 }],
  },
  {
    id: 'volcanic-wasteland',
    name: 'Volcanic Wasteland',
    recommendedLevel: 85,
    unlockConditions: [
      { type: 'level', target: 'level', comparison: 'gte', value: 80 },
      { type: 'region', target: 'forgotten-citadel', comparison: 'gte', value: 1 },
    ],
  },
];

describe('region progression', () => {
  it('creates a new region progress with starter region', () => {
    const progress = createRegionProgress('starter-frontier');
    expect(progress.currentRegion).toBe('starter-frontier');
    expect(progress.unlockedRegions).toEqual(['starter-frontier']);
    expect(progress.totalRegionsVisited).toBe(1);
  });

  it('starter region is always unlocked', () => {
    expect(isRegionUnlocked(testRegions[0], { level: 1, unlockedRegions: [] })).toBe(true);
  });

  it('checks level-based unlock conditions', () => {
    const region = testRegions[1]; // darkwood-forest requires level 6
    expect(isRegionUnlocked(region, { level: 5, unlockedRegions: [] })).toBe(false);
    expect(isRegionUnlocked(region, { level: 6, unlockedRegions: [] })).toBe(true);
  });

  it('getUnlockedRegions returns only unlocked regions', () => {
    const progress = createRegionProgress('starter-frontier');
    const unlocked = getUnlockedRegions(testRegions, progress, 20);
    const ids = unlocked.map((r) => r.id);
    expect(ids).toContain('starter-frontier');
    expect(ids).toContain('darkwood-forest');
    expect(ids).toContain('ruined-province');
    expect(ids).not.toContain('volcanic-wasteland');
  });

  it('moveToRegion allows moving to an unlocked region', () => {
    const progress = createRegionProgress('starter-frontier');
    const result = moveToRegion(progress, 'darkwood-forest', testRegions, 10);
    expect(result.success).toBe(true);
    expect(result.newProgress?.currentRegion).toBe('darkwood-forest');
    expect(result.newProgress?.unlockedRegions).toContain('darkwood-forest');
    expect(result.newProgress?.regionVisitCount['darkwood-forest']).toBe(1);
  });

  it('moveToRegion rejects locked regions', () => {
    const progress = createRegionProgress('starter-frontier');
    const result = moveToRegion(progress, 'darkwood-forest', testRegions, 3);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('moveToRegion rejects unknown regions', () => {
    const progress = createRegionProgress('starter-frontier');
    const result = moveToRegion(progress, 'not-a-region', testRegions, 99);
    expect(result.success).toBe(false);
  });

  it('respects multiple unlock conditions', () => {
    const progress = createRegionProgress('starter-frontier');
    // needs level 80 AND forgotten-citadel unlocked
    let progress2 = moveToRegion(progress, 'forgotten-citadel', testRegions, 80);
    // forgotten-citadel isn't in test list, so creates a synthetic — use direct check instead
    const volcanic = testRegions[3];
    const lowLevel = isRegionUnlocked(volcanic, { level: 90, unlockedRegions: [] });
    expect(lowLevel).toBe(false); // region condition not satisfied
  });

  it('marks a boss as defeated', () => {
    let progress = createRegionProgress('starter-frontier');
    progress = markBossDefeated(progress, 'starter-frontier', 'forest_troll_king');
    expect(isBossDefeated(progress, 'starter-frontier', 'forest_troll_king')).toBe(true);
    expect(countDefeatedBosses(progress)).toBe(1);
  });

  it('getNextRegion returns the next region in progression order', () => {
    const next = getNextRegion(testRegions, 'starter-frontier');
    expect(next?.id).toBe('darkwood-forest');
  });

  it('getNextRegion returns null when at the last region', () => {
    const next = getNextRegion(testRegions, 'volcanic-wasteland');
    expect(next).toBeNull();
  });
});
