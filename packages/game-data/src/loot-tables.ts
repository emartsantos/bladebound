import type { LootTable } from '@premium-rpg/shared-types';

export const LOOT_TABLES: Record<string, LootTable> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin Loot',
    drops: [
      { itemId: 'copper_ore', chance: 0.4, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'tin_ore', chance: 0.3, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'goblin_teeth', chance: 0.5, minQuantity: 1, maxQuantity: 3, guaranteed: false },
      { itemId: 'shrimp', chance: 0.2, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf Loot',
    drops: [
      { itemId: 'wolf_pelt', chance: 0.7, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'raw_wolf_meat', chance: 0.5, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'wolf_fang', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
    ],
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Loot',
    drops: [
      { itemId: 'bone', chance: 0.8, minQuantity: 1, maxQuantity: 3, guaranteed: false },
      { itemId: 'iron_arrows', chance: 0.2, minQuantity: 3, maxQuantity: 6, guaranteed: false },
      { itemId: 'skeleton_helmet', chance: 0.05, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'steel_bar', chance: 0.1, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  forest: {
    id: 'forest',
    name: 'Darkwood Forest Loot',
    drops: [
      { itemId: 'shade_essence', chance: 0.4, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'darkwood_log', chance: 0.4, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'spider_silk', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'iron_ore', chance: 0.2, minQuantity: 1, maxQuantity: 2, guaranteed: false },
    ],
  },
  ruins: {
    id: 'ruins',
    name: 'Ruined Province Loot',
    drops: [
      { itemId: 'lich_philactery', chance: 0.02, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'gold_ore', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'runite_bar', chance: 0.1, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'soul_essence', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
    ],
  },
  mountain: {
    id: 'mountain',
    name: 'Mountain Stronghold Loot',
    drops: [
      { itemId: 'wyvern_scale', chance: 0.4, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'mithril_ore', chance: 0.5, minQuantity: 1, maxQuantity: 3, guaranteed: false },
      { itemId: 'adamant_ore', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'frost_crown', chance: 0.05, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'mountain_crystal', chance: 0.2, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  marsh: {
    id: 'marsh',
    name: 'Haunted Marsh Loot',
    drops: [
      { itemId: 'serpent_fang', chance: 0.35, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'death_rune', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'plague_sample', chance: 0.25, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'marsh_herb', chance: 0.4, minQuantity: 1, maxQuantity: 3, guaranteed: false },
      { itemId: 'spectral_shard', chance: 0.15, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  citadel: {
    id: 'citadel',
    name: 'Forgotten Citadel Loot',
    drops: [
      { itemId: 'void_essence', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'demon_horn', chance: 0.2, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'obsidian_shard', chance: 0.35, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'chaos_rune', chance: 0.25, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'fallen_holy_symbol', chance: 0.1, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic Wasteland Loot',
    drops: [
      { itemId: 'infernal_core', chance: 0.25, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'magma_scale', chance: 0.35, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'volcanic_ash', chance: 0.4, minQuantity: 1, maxQuantity: 3, guaranteed: false },
      { itemId: 'fire_rune', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'ember_crystal', chance: 0.15, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
  abyss: {
    id: 'abyss',
    name: 'The Eternal Abyss Loot',
    drops: [
      { itemId: 'abyssal_shard', chance: 0.3, minQuantity: 1, maxQuantity: 2, guaranteed: false },
      { itemId: 'void_crystal', chance: 0.25, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'temporal_fragment', chance: 0.2, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'elder_dragon_scale', chance: 0.1, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'cosmic_dust', chance: 0.35, minQuantity: 1, maxQuantity: 2, guaranteed: false },
    ],
  },
  boss_loot: {
    id: 'boss_loot',
    name: 'Boss Loot',
    drops: [
      { itemId: 'boss_key', chance: 0.5, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'titan_plate', chance: 0.3, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'rare_gem', chance: 0.2, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'dragon_shard', chance: 0.1, minQuantity: 1, maxQuantity: 1, guaranteed: false },
      { itemId: 'unmaker_heart', chance: 0.05, minQuantity: 1, maxQuantity: 1, guaranteed: false },
    ],
  },
};
