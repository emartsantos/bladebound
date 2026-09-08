import { describe, expect, it } from 'vitest';
import type { WeightedLootTable } from '../../src/loot/weighted';
import { selectWeightedEntries } from '../../src/loot/weighted';
import { createSeededRandom } from '../../src/utils/random';

const commonTable: WeightedLootTable = {
  options: [
    { id: 'copper_ore', weight: 70, rarity: 'common' },
    { id: 'tin_ore', weight: 25, rarity: 'common' },
    { id: 'ancient_fragment', weight: 5, rarity: 'rare' },
  ],
};

describe('selectWeightedEntries', () => {
  it('returns exactly the requested count', () => {
    const rand = createSeededRandom(99);
    const results = selectWeightedEntries(commonTable, 5, rand);
    expect(results).toHaveLength(5);
  });

  it('always picks from the defined options', () => {
    const rand = createSeededRandom(1);
    const ids = new Set(commonTable.options.map((o) => o.id));
    for (let i = 0; i < 200; i += 1) {
      const results = selectWeightedEntries(commonTable, 3, rand);
      for (const result of results) {
        expect(ids.has(result.id)).toBe(true);
      }
    }
  });

  it('is deterministic with a seeded random source', () => {
    const a = selectWeightedEntries(commonTable, 10, createSeededRandom(5));
    const b = selectWeightedEntries(commonTable, 10, createSeededRandom(5));
    expect(a).toEqual(b);
  });

  it('always selects a single-item table deterministically', () => {
    const results = selectWeightedEntries(
      { options: [{ id: 'a', weight: 100 }] },
      1,
      createSeededRandom(0),
    );
    expect(results[0].id).toBe('a');
  });

  it('handles an extremely heavy single option', () => {
    const table: WeightedLootTable = {
      options: [
        { id: 'heavy', weight: 1000000 },
        { id: 'tiny', weight: 1 },
      ],
    };
    const rand = createSeededRandom(123);
    let heavyCount = 0;
    for (let i = 0; i < 1000; i += 1) {
      const results = selectWeightedEntries(table, 1, rand);
      if (results[0].id === 'heavy') {
        heavyCount += 1;
      }
    }
    expect(heavyCount).toBeGreaterThan(990);
  });

  it('throws for a negative count', () => {
    expect(() => selectWeightedEntries(commonTable, -1)).toThrow();
  });

  it('throws for an empty table', () => {
    expect(() => selectWeightedEntries({ options: [] }, 1)).toThrow();
  });

  it('throws for zero total weight', () => {
    expect(() => selectWeightedEntries({ options: [{ id: 'a', weight: 0 }] }, 1)).toThrow();
  });
});