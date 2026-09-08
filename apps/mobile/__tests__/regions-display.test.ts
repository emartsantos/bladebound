import { describe, it, expect } from 'vitest';
import { ALL_REGIONS, type Region } from '@premium-rpg/game-data';
import { buildRegionsDisplay } from '../src/data/regions';

describe('buildRegionsDisplay', () => {
  it('projects one display entry per region', () => {
    const displays = buildRegionsDisplay();
    expect(displays).toHaveLength(ALL_REGIONS.length);
  });

  it('carries through id, name and recommended level', () => {
    const displays = buildRegionsDisplay();
    const starter = displays.find((d) => d.id === 'starter-frontier');
    expect(starter).toBeDefined();
    expect(starter?.name).toBe('Starter Frontier');
    expect(starter?.recommendedLevel).toBe(1);
  });

  it('derives enemyCount from the real enemy pool', () => {
    const displays = buildRegionsDisplay();
    for (const d of displays) {
      const region = ALL_REGIONS.find((r) => r.id === d.id)!;
      expect(d.enemyCount).toBe(region.enemyPool.length);
      expect(d.enemyCount).toBeGreaterThan(0);
    }
  });

  it('marks a region unlocked only when it has no unlock conditions', () => {
    const displays = buildRegionsDisplay();
    const starter = displays.find((d) => d.id === 'starter-frontier')!;
    const darkwood = displays.find((d) => d.id === 'darkwood-forest')!;
    expect(starter.unlocked).toBe(true);
    expect(darkwood.unlocked).toBe(false);
  });

  it('falls back to a dash when a region has no boss', () => {
    const noBossZone: Region = {
      id: 'no-boss-zone',
      name: 'No Boss Zone',
      visualIdentity: 'ancient-swamp',
      recommendedLevel: 3,
      skills: ['mining'],
      resources: ['iron_ore'],
      enemyPool: ['skeleton'],
      quests: [],
      dungeon: null,
      boss: null,
      specialRewards: [],
      unlockConditions: [],
    };
    const displays = buildRegionsDisplay([noBossZone]);
    expect(displays[0].boss).toBe('—');
    expect(displays[0].unlocked).toBe(true);
    expect(displays[0].enemyCount).toBe(1);
  });
});