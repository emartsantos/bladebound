import { describe, expect, it } from 'vitest';
import {
  createEmptyBestiary,
  discoverEnemy,
  recordEnemyDefeat,
  getBestiaryProgress,
  getBestiaryCompletions,
  isBestiaryEntryComplete,
  getRecommendedDifficulty,
} from '../src/bestiary';
import type { EnemyDefinition, LootTable, ItemDefinition } from '@premium-rpg/shared-types';

const mockEnemy: EnemyDefinition = {
  id: 'goblin',
  name: 'Goblin',
  regionId: 'starter-frontier',
  level: 3,
  maxHealth: 25,
  stats: {
    strength: 3, agility: 4, intelligence: 1, vitality: 3,
    accuracy: 30, evasion: 25, critChance: 3, critDamage: 1.5,
    attackSpeed: 1.0, armor: 1, maxHealth: 25, damage: 3, defense: 1,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [],
  lootTableId: 'goblin',
  xpReward: 15,
  goldReward: 8,
  loreSnippet: '',
  bestiaryMetadata: {
    title: 'Pest',
    description: '',
    difficulty: 'easy',
    recommendedLevel: 1,
    family: 'goblin',
  },
};

const mockLoot: Record<string, LootTable> = {
  goblin: {
    id: 'goblin',
    name: '',
    drops: [
      { itemId: 'copper_ore', chance: 0.5, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'tin_ore', chance: 0.3, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
};

const mockItems: Record<string, ItemDefinition> = {
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', description: '', type: 'material', rarity: 'common', stackable: true, maxStack: 999, weight: 1, metadata: {} },
  tin_ore: { id: 'tin_ore', name: 'Tin Ore', description: '', type: 'material', rarity: 'common', stackable: true, maxStack: 999, weight: 1, metadata: {} },
};

describe('createEmptyBestiary', () => {
  it('creates entries for all enemies', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    expect(Object.keys(bestiary.entries)).toHaveLength(1);
    expect(bestiary.entries['goblin'].discovered).toBe(false);
    expect(bestiary.entries['goblin'].defeated).toBe(false);
    expect(bestiary.entries['goblin'].killCount).toBe(0);
    expect(bestiary.entries['goblin'].completed).toBe(false);
    expect(bestiary.totalDiscovered).toBe(0);
  });
});

describe('discoverEnemy', () => {
  it('marks an enemy as discovered', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const updated = discoverEnemy(bestiary, 'goblin');
    expect(updated.entries['goblin'].discovered).toBe(true);
    expect(updated.totalDiscovered).toBe(1);
  });

  it('is idempotent', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const first = discoverEnemy(bestiary, 'goblin');
    const second = discoverEnemy(first, 'goblin');
    expect(second.totalDiscovered).toBe(1);
  });
});

describe('recordEnemyDefeat', () => {
  it('records a defeat with kill count', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const updated = recordEnemyDefeat(bestiary, mockEnemy, [], mockLoot, mockItems);
    expect(updated.entries['goblin'].defeated).toBe(true);
    expect(updated.entries['goblin'].killCount).toBe(1);
    expect(updated.totalDefeated).toBe(1);
  });

  it('increments kill count on repeat defeats', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const first = recordEnemyDefeat(bestiary, mockEnemy, [], mockLoot, mockItems);
    const second = recordEnemyDefeat(first, mockEnemy, [], mockLoot, mockItems);
    expect(second.entries['goblin'].killCount).toBe(2);
    expect(second.totalDefeated).toBe(1);
  });

  it('tracks discovered drops from loot table', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const updated = recordEnemyDefeat(bestiary, mockEnemy, ['copper_ore'], mockLoot, mockItems);
    expect(updated.entries['goblin'].dropsDiscovered).toContain('copper_ore');
  });

  it('marks completed when all nonguaranteed drops discovered', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const complete = recordEnemyDefeat(bestiary, mockEnemy, ['copper_ore', 'tin_ore'], mockLoot, mockItems);
    expect(complete.entries['goblin'].completed).toBe(true);
    expect(complete.totalCompleted).toBe(1);
  });
});

describe('getBestiaryProgress', () => {
  it('reports zeroed progress on empty bestiary', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const progress = getBestiaryProgress(bestiary);
    expect(progress.total).toBe(1);
    expect(progress.percentDiscovered).toBe(0);
    expect(progress.percentDefeated).toBe(0);
  });

  it('reports discovered percentage', () => {
    const bestiary = discoverEnemy(createEmptyBestiary([mockEnemy]), 'goblin');
    const progress = getBestiaryProgress(bestiary);
    expect(progress.percentDiscovered).toBe(100);
  });
});

describe('getRecommendedDifficulty', () => {
  it('returns Fair when levels are close', () => {
    expect(getRecommendedDifficulty(5, mockEnemy)).toBe('Fair');
  });
  it('returns Dangerous when enemy outlevels by 2+', () => {
    const boss = { ...mockEnemy, level: 8 };
    expect(getRecommendedDifficulty(5, boss)).toBe('Dangerous');
  });
});

describe('getBestiaryCompletions', () => {
  it('lists completed enemy ids', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const complete = recordEnemyDefeat(bestiary, mockEnemy, ['copper_ore', 'tin_ore'], mockLoot, mockItems);
    expect(getBestiaryCompletions(complete)).toEqual(['goblin']);
  });
});

describe('isBestiaryEntryComplete', () => {
  it('returns true when complete', () => {
    const bestiary = createEmptyBestiary([mockEnemy]);
    const complete = recordEnemyDefeat(bestiary, mockEnemy, ['copper_ore', 'tin_ore'], mockLoot, mockItems);
    expect(isBestiaryEntryComplete(complete.entries['goblin'])).toBe(true);
  });
});