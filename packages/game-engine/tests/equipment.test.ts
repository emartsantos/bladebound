import { describe, it, expect } from 'vitest';
import {
  calculateEquipmentStats,
  getEquippedPassives,
} from '../src/equipment';
import type { EquipmentSlots, ItemDefinition, InventoryItem } from '@premium-rpg/shared-types';

function makeItem(id: string, name: string, type: 'weapon' | 'armor', rarity: ItemDefinition['rarity'], slot: ItemDefinition['equipmentSlot'], stats: ItemDefinition['stats'], passives: ItemDefinition['passives'] = [], tier: ItemDefinition['tier'] = 'iron'): ItemDefinition {
  return {
    id, name, type, rarity, stackable: false, maxStack: 1, weight: 2,
    tier, equipmentSlot: slot, stats, passives,
    acquisition: ['boss'], levelRequired: 1,
    description: name, metadata: {},
  };
}

describe('equipment with itemization', () => {
  it('resolves explicit weapon stats', () => {
    const swordDef = makeItem('sword', 'Sword', 'weapon', 'rare', 'weapon',
      { strength: 10, damage: 12, critChance: 1 });
    const item: InventoryItem = { uid: 'u1', itemId: 'sword', quantity: 1, equipped: true, durability: null, metadata: {} };
    const slots: EquipmentSlots = { weapon: item, offhand: null, helmet: null, chest: null, gloves: null, legs: null, boots: null, amulet: null, ring: null, cape: null };
    const stats = calculateEquipmentStats(slots, { sword: swordDef });
    expect(stats.strength).toBe(10);
    expect(stats.damage).toBe(12);
    expect(stats.critChance).toBe(1);
  });

  it('aggregates equipped passives', () => {
    const amuletDef = makeItem('amulet', 'Amulet', 'armor', 'epic', 'amulet',
      { maxHealth: 40 },
      [{ id: 'p1', name: 'Pact', description: 'x', category: 'damage', value: 0.25, condition: 'full_hp' }],
      'rune');
    const item: InventoryItem = { uid: 'u1', itemId: 'amulet', quantity: 1, equipped: true, durability: null, metadata: {} };
    const slots: EquipmentSlots = { weapon: null, offhand: null, helmet: null, chest: null, gloves: null, legs: null, boots: null, amulet: item, ring: null, cape: null };
    const passives = getEquippedPassives(slots, { amulet: amuletDef });
    expect(passives).toHaveLength(1);
    expect(passives[0].category).toBe('damage');
  });

  it('common gear without passives yields empty passive list', () => {
    const chestDef = makeItem('chest', 'Chest', 'armor', 'common', 'chest', { armor: 5 });
    const item: InventoryItem = { uid: 'u1', itemId: 'chest', quantity: 1, equipped: true, durability: null, metadata: {} };
    const slots: EquipmentSlots = { weapon: null, offhand: null, helmet: null, chest: item, gloves: null, legs: null, boots: null, amulet: null, ring: null, cape: null };
    expect(getEquippedPassives(slots, { chest: chestDef })).toHaveLength(0);
  });
});
