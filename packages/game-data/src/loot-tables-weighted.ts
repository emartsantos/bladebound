import type { Rarity } from '@premium-rpg/shared-types';

// ─── CENTRALIZED WEIGHTED ITEM TABLES ────────────────────────────────
// Single source of truth for weighted loot. Each table maps item IDs to
// drop weights and rarity tiers. These drive boss drops, dungeon rewards,
// and rare gathering procs via the shared WeightedLootTable engine.

export interface WeightedItemEntry {
  id: string;
  weight: number;
  rarity: Rarity;
}

export interface CentralWeightedTable {
  id: string;
  name: string;
  entries: WeightedItemEntry[];
}

// Boss drop tables — unique items with low weights sit alongside
// rare-tier material drops, creating chase materials.
export const BOSS_DROP_TABLES: Record<string, CentralWeightedTable> = {
  count_vlad: {
    id: 'count_vlad',
    name: 'Count Vlad Drops',
    entries: [
      { id: 'vampire_fang', weight: 1, rarity: 'rare' },
      { id: 'iron_bar', weight: 4, rarity: 'common' },
      { id: 'werewolf_claw', weight: 3, rarity: 'uncommon' },
      { id: 'gold_ore', weight: 3, rarity: 'uncommon' },
    ],
  },
  ancient_lich: {
    id: 'ancient_lich',
    name: 'Ancient Lich Drops',
    entries: [
      { id: 'lich_philactery', weight: 1, rarity: 'epic' },
      { id: 'runite_bar', weight: 3, rarity: 'rare' },
      { id: 'soul_essence', weight: 3, rarity: 'uncommon' },
      { id: 'lich_philactery', weight: 1, rarity: 'epic' },
    ],
  },
  frost_giant_king: {
    id: 'frost_giant_king',
    name: 'Frost Giant King Drops',
    entries: [
      { id: 'frost_crown', weight: 1, rarity: 'epic' },
      { id: 'mountain_crystal', weight: 2, rarity: 'rare' },
      { id: 'wyvern_scale', weight: 3, rarity: 'uncommon' },
      { id: 'mithril_bar', weight: 3, rarity: 'rare' },
    ],
  },
  tyrant_of_the_deep: {
    id: 'tyrant_of_the_deep',
    name: 'Tyrant of the Deep Drops',
    entries: [
      { id: 'tidal_crown', weight: 1, rarity: 'epic' },
      { id: 'serpent_fang', weight: 3, rarity: 'rare' },
      { id: 'shark', weight: 3, rarity: 'uncommon' },
      { id: 'death_rune', weight: 2, rarity: 'rare' },
    ],
  },
  arch_demon: {
    id: 'arch_demon',
    name: 'Arch Demon Drops',
    entries: [
      { id: 'demon_horn', weight: 1, rarity: 'epic' },
      { id: 'obsidian_shard', weight: 3, rarity: 'rare' },
      { id: 'chaos_rune', weight: 2, rarity: 'rare' },
      { id: 'obsidian_golem', weight: 2, rarity: 'uncommon' },
    ],
  },
  magma_tyrant: {
    id: 'magma_tyrant',
    name: 'Magma Tyrant Drops',
    entries: [
      { id: 'magma_tyrant_core', weight: 1, rarity: 'legendary' },
      { id: 'ember_crystal', weight: 3, rarity: 'rare' },
      { id: 'infernal_ore', weight: 3, rarity: 'rare' },
      { id: 'magma_scale', weight: 3, rarity: 'uncommon' },
    ],
  },
  the_unmaker: {
    id: 'the_unmaker',
    name: 'The Unmaker Drops',
    entries: [
      { id: 'unmaker_heart', weight: 1, rarity: 'legendary' },
      { id: 'abyssal_shard', weight: 2, rarity: 'epic' },
      { id: 'void_crystal', weight: 3, rarity: 'rare' },
      { id: 'cosmic_dust', weight: 2, rarity: 'rare' },
    ],
  },
};

// Dungeon reward tables — supplement guaranteed drops with weighted loot.
export const DUNGEON_REWARD_TABLES: Record<string, CentralWeightedTable> = {
  dungeon_darkwood: {
    id: 'dungeon_darkwood',
    name: 'Darkwood Caverns Rewards',
    entries: [
      { id: 'vampire_fang', weight: 1, rarity: 'rare' },
      { id: 'darkwood_log', weight: 4, rarity: 'uncommon' },
      { id: 'iron_bar', weight: 3, rarity: 'common' },
      { id: 'werewolf_claw', weight: 2, rarity: 'uncommon' },
    ],
  },
  dungeon_citadel: {
    id: 'dungeon_citadel',
    name: 'Crumbling Citadel Rewards',
    entries: [
      { id: 'lich_philactery', weight: 1, rarity: 'epic' },
      { id: 'runite_bar', weight: 3, rarity: 'rare' },
      { id: 'soul_essence', weight: 3, rarity: 'uncommon' },
    ],
  },
  dungeon_summit: {
    id: 'dungeon_summit',
    name: 'Frozen Summit Rewards',
    entries: [
      { id: 'frost_crown', weight: 1, rarity: 'epic' },
      { id: 'mountain_crystal', weight: 2, rarity: 'rare' },
      { id: 'wyvern_scale', weight: 3, rarity: 'uncommon' },
    ],
  },
  dungeon_sunken: {
    id: 'dungeon_sunken',
    name: 'Sunken Catacombs Rewards',
    entries: [
      { id: 'tidal_crown', weight: 1, rarity: 'epic' },
      { id: 'serpent_fang', weight: 3, rarity: 'rare' },
      { id: 'death_rune', weight: 2, rarity: 'rare' },
    ],
  },
  dungeon_depths: {
    id: 'dungeon_depths',
    name: 'Citadel Depths Rewards',
    entries: [
      { id: 'demon_horn', weight: 1, rarity: 'epic' },
      { id: 'obsidian_shard', weight: 3, rarity: 'rare' },
      { id: 'chaos_rune', weight: 2, rarity: 'rare' },
    ],
  },
  dungeon_core: {
    id: 'dungeon_core',
    name: 'Molten Core Rewards',
    entries: [
      { id: 'magma_tyrant_core', weight: 1, rarity: 'legendary' },
      { id: 'ember_crystal', weight: 3, rarity: 'rare' },
      { id: 'infernal_ore', weight: 3, rarity: 'rare' },
    ],
  },
  dungeon_abyss: {
    id: 'dungeon_abyss',
    name: 'Abyssal Throne Rewards',
    entries: [
      { id: 'unmaker_heart', weight: 1, rarity: 'legendary' },
      { id: 'abyssal_shard', weight: 2, rarity: 'epic' },
      { id: 'void_crystal', weight: 3, rarity: 'rare' },
    ],
  },
};

// Rare gathering procs — legendary/rare materials from high level skills.
export const GATHERING_PROC_TABLES: Record<string, CentralWeightedTable> = {
  void_mining: {
    id: 'void_mining',
    name: 'Void Mining Procs',
    entries: [
      { id: 'cosmic_crystal', weight: 1, rarity: 'legendary' },
      { id: 'void_ore', weight: 3, rarity: 'rare' },
      { id: 'infernal_ore', weight: 3, rarity: 'rare' },
    ],
  },
  abyssal_woodcutting: {
    id: 'abyssal_woodcutting',
    name: 'Abyssal Woodcutting Procs',
    entries: [
      { id: 'ethereal_wood', weight: 1, rarity: 'legendary' },
      { id: 'abyssal_log', weight: 3, rarity: 'rare' },
      { id: 'obsidian_logs', weight: 3, rarity: 'rare' },
    ],
  },
  abyssal_fishing: {
    id: 'abyssal_fishing',
    name: 'Abyssal Fishing Procs',
    entries: [
      { id: 'void_pike', weight: 1, rarity: 'epic' },
      { id: 'elder_fish', weight: 3, rarity: 'rare' },
      { id: 'shark', weight: 3, rarity: 'uncommon' },
    ],
  },
};

// Aggregate registry so a loot layer can look up any table by id.
export const ALL_WEIGHTED_TABLES: Record<string, CentralWeightedTable> = {
  ...BOSS_DROP_TABLES,
  ...DUNGEON_REWARD_TABLES,
  ...GATHERING_PROC_TABLES,
};
