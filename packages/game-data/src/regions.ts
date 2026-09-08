import type { UnlockCondition } from '@premium-rpg/shared-types';

// Region visual identity themes - original fantasy names
export type VisualIdentity =
  | 'aged-forest'
  | 'ancient-swamp'
  | 'ruined-province'
  | 'mountain-stronghold'
  | 'haunted-marsh'
  | 'forgotten-citadel'
  | 'volcanic-wasteland'
  | 'ancient-endgame';

// Region definition - structured data for world progression
export interface Region {
  id: string;
  name: string;
  visualIdentity: VisualIdentity;
  recommendedLevel: number;
  skills: string[];
  resources: string[];
  enemyPool: string[];
  quests: string[];
  dungeon: string | null;
  boss: string | null;
  specialRewards: string[];
  unlockConditions: UnlockCondition[];
}

// ============================================================
// REGIONS 1-4 (existing)
// ============================================================

export const STARTER_FRONTIER: Region = {
  id: 'starter-frontier',
  name: 'Starter Frontier',
  visualIdentity: 'aged-forest',
  recommendedLevel: 1,
  skills: ['mining', 'woodcutting', 'fishing'],
  resources: ['copper_ore', 'tin_ore', 'wolf_pelt', 'logs', 'shrimp'],
  enemyPool: ['goblin', 'goblin_champion', 'skeleton', 'skeleton_archer', 'wolf', 'alpha_wolf', 'forest_boar', 'bush_rat', 'rook'],
  quests: [],
  dungeon: null,
  boss: 'forest_troll_king',
  specialRewards: [],
  unlockConditions: [],
};

export const DARKWOOD_FOREST: Region = {
  id: 'darkwood-forest',
  name: 'Darkwood Forest',
  visualIdentity: 'haunted-marsh',
  recommendedLevel: 8,
  skills: ['woodcutting', 'fishing', 'combat'],
  resources: ['oak_logs', 'willow_logs', 'iron_ore', 'coal', 'trout'],
  enemyPool: ['darkwood_spider', 'cave_bat', 'zombie', 'ghoul', 'werewolf', 'shade', 'elder_dryad', 'night_stalker', 'count_vlad'],
  quests: [],
  dungeon: 'darkwood-caverns',
  boss: 'count_vlad',
  specialRewards: ['werewolf_claw', 'shade_essence'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 6 }],
};

export const RUINED_PROVINCE: Region = {
  id: 'ruined-province',
  name: 'Ruined Province',
  visualIdentity: 'ruined-province',
  recommendedLevel: 18,
  skills: ['mining', 'combat', 'smithing'],
  resources: ['coal', 'iron_ore', 'gold_ore', 'maple_logs', 'salmon'],
  enemyPool: ['skeleton_knight', 'grave_guardian', 'wraith', 'corrupted_mage', 'stone_golem', 'soul_reaper', 'ancient_lich', 'undead_dragon'],
  quests: [],
  dungeon: 'crumbling-citadel',
  boss: 'ancient_lich',
  specialRewards: ['lich_philactery'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 15 }],
};

export const MOUNTAIN_STRONGHOLD: Region = {
  id: 'mountain-stronghold',
  name: 'Mountain Stronghold',
  visualIdentity: 'mountain-stronghold',
  recommendedLevel: 30,
  skills: ['mining', 'smithing', 'combat'],
  resources: ['mithril_ore', 'adamant_ore', 'runite_ore', 'yew_logs', 'tuna'],
  enemyPool: ['ice_elemental', 'mountain_troll', 'frost_drake', 'giant_warrior', 'runite_elemental', 'wyvern', 'mountain_king', 'frost_giant_king'],
  quests: [],
  dungeon: 'frozen-summit',
  boss: 'frost_giant_king',
  specialRewards: ['wyvern_scale', 'frost_crown'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 28 }],
};

// ============================================================
// REGIONS 5-8 (new)
// ============================================================

export const HAUNTED_MARSH: Region = {
  id: 'haunted-marsh',
  name: 'Haunted Marsh',
  visualIdentity: 'haunted-marsh',
  recommendedLevel: 55,
  skills: ['fishing', 'alchemy', 'combat'],
  resources: ['magic_logs', 'shark', 'runite_ore', 'death_rune', 'nature_rune'],
  enemyPool: ['bog_horror', 'marsh_wraith', 'swamp_troll', 'spectral_knight', 'plague_rat', 'flood_lich', 'marsh_serpent', 'tyrant_of_the_deep'],
  quests: [],
  dungeon: 'sunken-catacombs',
  boss: 'tyrant_of_the_deep',
  specialRewards: ['serpent_fang', 'death_rune_pack'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 50 }],
};

export const FORGOTTEN_CITADEL: Region = {
  id: 'forgotten-citadel',
  name: 'Forgotten Citadel',
  visualIdentity: 'forgotten-citadel',
  recommendedLevel: 70,
  skills: ['smithing', 'runecrafting', 'combat'],
  resources: ['dragon_ore', 'elder_logs', 'death_rune', 'chaos_rune'],
  enemyPool: ['citadel_guardian', 'wailing_herald', 'obsidian_golem', 'fallen_pally', 'void_stalker', 'hollow_king', 'arch_demon'],
  quests: [],
  dungeon: 'citadel-depths',
  boss: 'arch_demon',
  specialRewards: ['void_essence', 'demon_horn'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 65 }],
};

export const VOLCANIC_WASTELAND: Region = {
  id: 'volcanic-wasteland',
  name: 'Volcanic Wasteland',
  visualIdentity: 'volcanic-wasteland',
  recommendedLevel: 85,
  skills: ['mining', 'smithing', 'alchemy', 'combat'],
  resources: ['infernal_ore', 'obsidian_logs', 'chaos_rune', 'nature_rune'],
  enemyPool: ['magma_drake', 'infernal_elemental', 'fire_giant', 'ash_wraith', 'pyro_lord', 'ember_serpent', 'magma_tyrant'],
  quests: [],
  dungeon: 'molten-core',
  boss: 'magma_tyrant',
  specialRewards: ['infernal_core', 'magma_scale'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 80 }],
};

export const ANCIENT_ENDGAME: Region = {
  id: 'ancient-endgame',
  name: 'The Eternal Abyss',
  visualIdentity: 'ancient-endgame',
  recommendedLevel: 95,
  skills: ['mining', 'woodcutting', 'fishing', 'smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting', 'crafting'],
  resources: ['void_ore', 'abyssal_log', 'elder_fish', 'chaos_rune', 'death_rune'],
  enemyPool: ['abyssal_walker', 'time_reaver', 'void_lord', 'elder_dragon', 'the_unmaker'],
  quests: [],
  dungeon: 'abyssal-throne',
  boss: 'the_unmaker',
  specialRewards: ['abyssal_shard', 'unmaker_heart'],
  unlockConditions: [{ type: 'level', target: 'level', comparison: 'gte', value: 90 }],
};

// ============================================================
// REGION REGISTRY
// ============================================================

export const REGIONS = {
  starterFrontier: 'starter-frontier',
  darkwoodForest: 'darkwood-forest',
  ruinedProvince: 'ruined-province',
  mountainStronghold: 'mountain-stronghold',
  hauntedMarsh: 'haunted-marsh',
  forgottenCitadel: 'forgotten-citadel',
  volcanicWasteland: 'volcanic-wasteland',
  ancientEndgame: 'ancient-endgame',
} as const;

export type RegionId = (typeof REGIONS)[keyof typeof REGIONS];

// All regions in order
export const ALL_REGIONS: readonly Region[] = [
  STARTER_FRONTIER,
  DARKWOOD_FOREST,
  RUINED_PROVINCE,
  MOUNTAIN_STRONGHOLD,
  HAUNTED_MARSH,
  FORGOTTEN_CITADEL,
  VOLCANIC_WASTELAND,
  ANCIENT_ENDGAME,
];

// Region progression order
export const REGION_PROGRESSION: readonly Region[] = [
  STARTER_FRONTIER,
  DARKWOOD_FOREST,
  RUINED_PROVINCE,
  MOUNTAIN_STRONGHOLD,
  HAUNTED_MARSH,
  FORGOTTEN_CITADEL,
  VOLCANIC_WASTELAND,
  ANCIENT_ENDGAME,
];

// Legacy export
export const ORIGINAL_REGIONS = ALL_REGIONS;

// Region lookup by id
export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
  ALL_REGIONS.map((r) => [r.id, r])
);
