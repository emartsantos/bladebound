import type { Rarity } from '@premium-rpg/shared-types';

export interface WeightedEntry {
  id: string;
  weight: number;
  rarity?: Rarity;
}

export interface SelectedWeightedEntry extends WeightedEntry {
  rarity: Rarity;
}

export interface WeightedLootTable {
  options: WeightedEntry[];
}

export function selectWeightedEntries(
  table: WeightedLootTable,
  count: number,
  random: () => number = Math.random,
): SelectedWeightedEntry[] {
  if (count < 0 || !Number.isFinite(count)) {
    throw new Error(`Invalid selection count: ${count}`);
  }
  if (!table || !Array.isArray(table.options) || table.options.length === 0) {
    throw new Error('Loot table must contain at least one option');
  }

  const totalWeight = table.options.reduce((sum, option) => sum + option.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Loot table total weight must be positive');
  }

  const results: SelectedWeightedEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = random();
    if (raw < 0 || raw >= 1) {
      throw new Error(`Random source out of range: ${raw}`);
    }
    const target = raw * totalWeight;
    let cumulative = 0;
    let selected: WeightedEntry | null = null;
    for (const option of table.options) {
      cumulative += option.weight;
      if (target < cumulative) {
        selected = option;
        break;
      }
    }
    if (!selected) {
      selected = table.options[table.options.length - 1];
    }
    results.push({ ...selected, rarity: selected.rarity ?? 'common' });
  }
  return results;
}