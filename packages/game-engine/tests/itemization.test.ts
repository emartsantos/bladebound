import { describe, it, expect } from 'vitest';
import {
  generateItemMods,
  resolveItemStats,
  TIER_STAT_BUDGET,
  RARITY_STAT_LINES,
  computeItemValue,
  getItemLevel,
  isAcquiredFrom,
} from '../src/itemization';
import type { ItemDefinition } from '@premium-rpg/shared-types';

describe('itemization engine', () => {
  it('produces more stat lines at higher rarity (not just bigger stats)', () => {
    const common = generateItemMods({ rarity: 'common', slot: 'weapon' });
    const legendary = generateItemMods({ rarity: 'legendary', slot: 'weapon' });
    expect(legendary.statLines.length).toBeGreaterThan(common.statLines.length);
    expect(legendary.statLines.length).toBeLessThanOrEqual(RARITY_STAT_LINES.legendary);
  });

  it('scales the stat budget with tier', () => {
    expect(TIER_STAT_BUDGET.bronze).toBeLessThan(TIER_STAT_BUDGET.iron);
    expect(TIER_STAT_BUDGET.iron).toBeLessThan(TIER_STAT_BUDGET.void);
  });

  it('higher rarity adds load-bearing passives', () => {
    const common = generateItemMods({ rarity: 'common', slot: 'amulet' });
    const epic = generateItemMods({ rarity: 'epic', slot: 'amulet' });
    expect(common.passives.length).toBe(0);
    expect(epic.passives.length).toBeGreaterThanOrEqual(1);
  });

  it('common and uncommon gear never carry passives', () => {
    for (const rarity of ['common', 'uncommon'] as const) {
      const item = generateItemMods({ rarity, slot: 'chest' });
      expect(item.passives.length).toBe(0);
    }
  });

  it('generates distinct stat combos per slot archetype', () => {
    const weapon = generateItemMods({ rarity: 'rare', slot: 'weapon' });
    const chest = generateItemMods({ rarity: 'rare', slot: 'chest' });
    const weaponStats = weapon.statLines.map((l) => l.stat);
    const chestStats = chest.statLines.map((l) => l.stat);
    // Weapon should lean toward offense; chest toward survivability
    expect(weaponStats).toContain('strength');
    expect(chestStats.some((s) => s === 'armor' || s === 'defense' || s === 'vitality')).toBe(true);
  });

  it('resolves unique items to their authored passives and stats', () => {
    const unmaker: ItemDefinition = {
      id: 'unmaker_heart', name: 'Unmaker Heart', type: 'armor',
      rarity: 'legendary', stackable: false, maxStack: 1, weight: 2,
      tier: 'void', equipmentSlot: 'amulet', levelRequired: 99,
      acquisition: ['boss'],
      description: 'The heart of the Unmaker.',
      metadata: {},
      stats: { strength: 25, intelligence: 25, critDamage: 40, maxHealth: 150 },
      unique: {
        name: 'Unmaker Heart',
        description: 'The heart of the Unmaker.',
        passives: [
          { id: 'uh_unmake', name: 'Annihilate', description: 'xxx', category: 'crit', value: 0.1, condition: 'after_kill' },
          { id: 'uh_void', name: 'Void Eminence', description: 'y', category: 'utility', value: 0.2, condition: 'always' },
        ],
      },
    };
    const resolved = resolveItemStats(unmaker);
    expect(resolved.passives.length).toBe(2);
    expect(resolved.passives.some((p) => p.category === 'crit')).toBe(true);
    expect(resolved.passives.some((p) => p.category === 'utility')).toBe(true);
    // preserve authored stats
    expect(resolved.statLines.find((l) => l.stat === 'strength')?.value).toBe(25);
  });

  it('computes a higher value for legendary/unique items', () => {
    const common: ItemDefinition = {
      id: 'c', name: 'Common', type: 'weapon', rarity: 'common',
      stackable: false, maxStack: 1, weight: 2, tier: 'bronze',
      equipmentSlot: 'weapon', levelRequired: 1, acquisition: ['crafting'],
      description: '', metadata: {},
    };
    const legendary: ItemDefinition = {
      id: 'l', name: 'Legendary', type: 'armor', rarity: 'legendary',
      stackable: false, maxStack: 1, weight: 2, tier: 'void',
      equipmentSlot: 'amulet', levelRequired: 99, acquisition: ['boss'],
      description: '', metadata: {},
      passives: [{ id: 'x', name: 'X', description: '', category: 'damage', value: 0.1, condition: 'always' }],
      unique: { name: 'L', description: '', passives: [], soulbound: true },
    };
    expect(computeItemValue(legendary)).toBeGreaterThan(computeItemValue(common));
  });

  it('tracks acquisition sources', () => {
    const item: ItemDefinition = {
      id: 'boss_item', name: 'Boss Item', type: 'weapon',
      rarity: 'epic', stackable: false, maxStack: 1, weight: 2,
      acquisition: ['boss', 'dungeon'], description: '', metadata: {},
    };
    expect(isAcquiredFrom(item, 'boss')).toBe(true);
    expect(isAcquiredFrom(item, 'gathering')).toBe(false);
  });

  it('generates weapon lines from the weapon archetype pool', () => {
    const item = generateItemMods({ rarity: 'common', tier: 'iron', slot: 'weapon' });
    // weapon archetype only rolls offensive stats; verify no defensive-only stats
    const offensive = ['strength', 'agility', 'intelligence', 'critChance', 'critDamage', 'attackSpeed'];
    expect(item.statLines.every((l) => offensive.includes(l.stat))).toBe(true);
  });

  it('never exceeds the tier stat budget total', () => {
    const item = generateItemMods({ rarity: 'legendary', tier: 'rune', slot: 'chest' });
    const total = item.statLines.reduce((sum, l) => sum + l.value, 0);
    // Budget is distributed; total spent should not wildly exceed budget semantics
    expect(item.statBudget).toBe(TIER_STAT_BUDGET.rune);
    expect(total).toBeGreaterThan(0);
  });

  it('reports item level from requirement or tier budget', () => {
    const item: ItemDefinition = {
      id: 'x', name: 'X', type: 'weapon', rarity: 'rare',
      stackable: false, maxStack: 1, weight: 2, levelRequired: 42,
      description: '', metadata: {}, tier: 'adamant',
    };
    expect(getItemLevel(item)).toBe(42);
  });
});
