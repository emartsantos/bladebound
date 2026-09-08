import type {
  CraftingSkill,
  CraftingRecipe,
  RecipeIngredient,
  RecipeOutput,
  CraftingBonus,
  CraftingAction,
  CraftingState,
} from '@premium-rpg/shared-types';

// ─── SMITHING RECIPES ──────────────────────────────────────────────

export const SMITHING_RECIPES: CraftingRecipe[] = [
  {
    id: 'smith_bronze_bar',
    name: 'Bronze Bar',
    skill: 'smithing',
    levelRequired: 1,
    ingredients: [{ itemId: 'copper_ore', quantity: 1 }, { itemId: 'tin_ore', quantity: 1 }],
    output: [{ itemId: 'bronze_bar', quantity: 1 }],
    duration: 3000,
    xp: 15,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_iron_bar',
    name: 'Iron Bar',
    skill: 'smithing',
    levelRequired: 10,
    ingredients: [{ itemId: 'iron_ore', quantity: 1 }, { itemId: 'coal', quantity: 1 }],
    output: [{ itemId: 'iron_bar', quantity: 1 }],
    duration: 4000,
    xp: 30,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_steel_bar',
    name: 'Steel Bar',
    skill: 'smithing',
    levelRequired: 20,
    ingredients: [{ itemId: 'iron_ore', quantity: 1 }, { itemId: 'coal', quantity: 2 }],
    output: [{ itemId: 'steel_bar', quantity: 1 }],
    duration: 5000,
    xp: 50,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_mithril_bar',
    name: 'Mithril Bar',
    skill: 'smithing',
    levelRequired: 30,
    ingredients: [{ itemId: 'mithril_ore', quantity: 1 }, { itemId: 'coal', quantity: 3 }],
    output: [{ itemId: 'mithril_bar', quantity: 1 }],
    duration: 6000,
    xp: 75,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_adamant_bar',
    name: 'Adamant Bar',
    skill: 'smithing',
    levelRequired: 40,
    ingredients: [{ itemId: 'adamant_ore', quantity: 1 }, { itemId: 'coal', quantity: 4 }],
    output: [{ itemId: 'adamant_bar', quantity: 1 }],
    duration: 7000,
    xp: 100,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_rune_bar',
    name: 'Rune Bar',
    skill: 'smithing',
    levelRequired: 50,
    ingredients: [{ itemId: 'rune_ore', quantity: 1 }, { itemId: 'coal', quantity: 5 }],
    output: [{ itemId: 'rune_bar', quantity: 1 }],
    duration: 8000,
    xp: 150,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'smith_bronze_sword',
    name: 'Bronze Sword',
    skill: 'smithing',
    levelRequired: 5,
    ingredients: [{ itemId: 'bronze_bar', quantity: 2 }],
    output: [{ itemId: 'bronze_sword', quantity: 1 }],
    duration: 4000,
    xp: 25,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 10 }],
  },
  {
    id: 'smith_iron_sword',
    name: 'Iron Sword',
    skill: 'smithing',
    levelRequired: 15,
    ingredients: [{ itemId: 'iron_bar', quantity: 2 }],
    output: [{ itemId: 'iron_sword', quantity: 1 }],
    duration: 5000,
    xp: 45,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 15 }],
  },
  {
    id: 'smith_bronze_shield',
    name: 'Bronze Shield',
    skill: 'smithing',
    levelRequired: 8,
    ingredients: [{ itemId: 'bronze_bar', quantity: 3 }],
    output: [{ itemId: 'bronze_shield', quantity: 1 }],
    duration: 5000,
    xp: 30,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 10 }],
  },
  {
    id: 'smith_iron_shield',
    name: 'Iron Shield',
    skill: 'smithing',
    levelRequired: 18,
    ingredients: [{ itemId: 'iron_bar', quantity: 3 }],
    output: [{ itemId: 'iron_shield', quantity: 1 }],
    duration: 6000,
    xp: 55,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 15 }],
  },
  {
    id: 'smith_bronze_helmet',
    name: 'Bronze Helmet',
    skill: 'smithing',
    levelRequired: 3,
    ingredients: [{ itemId: 'bronze_bar', quantity: 2 }],
    output: [{ itemId: 'bronze_helmet', quantity: 1 }],
    duration: 3500,
    xp: 20,
    bonuses: [{ type: 'double_output', chance: 0.03 }],
  },
  {
    id: 'smith_iron_helmet',
    name: 'Iron Helmet',
    skill: 'smithing',
    levelRequired: 12,
    ingredients: [{ itemId: 'iron_bar', quantity: 2 }],
    output: [{ itemId: 'iron_helmet', quantity: 1 }],
    duration: 4500,
    xp: 40,
    bonuses: [{ type: 'double_output', chance: 0.03 }],
  },
];

// ─── COOKING RECIPES ───────────────────────────────────────────────

export const COOKING_RECIPES: CraftingRecipe[] = [
  {
    id: 'cook_shrimp',
    name: 'Cooked Shrimp',
    skill: 'cooking',
    levelRequired: 1,
    ingredients: [{ itemId: 'shrimp', quantity: 1 }],
    output: [{ itemId: 'cooked_shrimp', quantity: 1 }],
    duration: 2000,
    xp: 10,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 5 }],
  },
  {
    id: 'cook_sardine',
    name: 'Cooked Sardine',
    skill: 'cooking',
    levelRequired: 5,
    ingredients: [{ itemId: 'sardine', quantity: 1 }],
    output: [{ itemId: 'cooked_sardine', quantity: 1 }],
    duration: 2500,
    xp: 18,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 8 }],
  },
  {
    id: 'cook_trout',
    name: 'Cooked Trout',
    skill: 'cooking',
    levelRequired: 10,
    ingredients: [{ itemId: 'trout', quantity: 1 }],
    output: [{ itemId: 'cooked_trout', quantity: 1 }],
    duration: 3000,
    xp: 28,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 12 }],
  },
  {
    id: 'cook_salmon',
    name: 'Cooked Salmon',
    skill: 'cooking',
    levelRequired: 18,
    ingredients: [{ itemId: 'salmon', quantity: 1 }],
    output: [{ itemId: 'cooked_salmon', quantity: 1 }],
    duration: 3500,
    xp: 40,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 15 }],
  },
  {
    id: 'cook_bass',
    name: 'Cooked Bass',
    skill: 'cooking',
    levelRequired: 25,
    ingredients: [{ itemId: 'bass', quantity: 1 }],
    output: [{ itemId: 'cooked_bass', quantity: 1 }],
    duration: 4000,
    xp: 55,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 20 }],
  },
  {
    id: 'cook_tuna',
    name: 'Cooked Tuna',
    skill: 'cooking',
    levelRequired: 30,
    ingredients: [{ itemId: 'tuna', quantity: 1 }],
    output: [{ itemId: 'cooked_tuna', quantity: 1 }],
    duration: 4500,
    xp: 65,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 25 }],
  },
  {
    id: 'cook_swordfish',
    name: 'Cooked Swordfish',
    skill: 'cooking',
    levelRequired: 40,
    ingredients: [{ itemId: 'swordfish', quantity: 1 }],
    output: [{ itemId: 'cooked_swordfish', quantity: 1 }],
    duration: 5000,
    xp: 85,
    bonuses: [{ type: 'bonus_xp', chance: 0.08, value: 30 }],
  },
  {
    id: 'cook_shark',
    name: 'Cooked Shark',
    skill: 'cooking',
    levelRequired: 50,
    ingredients: [{ itemId: 'shark', quantity: 1 }],
    output: [{ itemId: 'cooked_shark', quantity: 1 }],
    duration: 6000,
    xp: 120,
    bonuses: [{ type: 'bonus_xp', chance: 0.05, value: 50 }],
  },
];

// ─── FLETCHING RECIPES ─────────────────────────────────────────────

export const FLETCHING_RECIPES: CraftingRecipe[] = [
  {
    id: 'fletch_wooden_arrows',
    name: 'Wooden Arrows',
    skill: 'fletching',
    levelRequired: 1,
    ingredients: [{ itemId: 'logs', quantity: 1 }, { itemId: 'feathers', quantity: 5 }],
    output: [{ itemId: 'wooden_arrows', quantity: 10 }],
    duration: 2500,
    xp: 12,
    bonuses: [{ type: 'extra_output', chance: 0.15, value: 5 }],
  },
  {
    id: 'fletch_bone_arrows',
    name: 'Bone Arrows',
    skill: 'fletching',
    levelRequired: 10,
    ingredients: [{ itemId: 'oak_logs', quantity: 1 }, { itemId: 'feathers', quantity: 5 }],
    output: [{ itemId: 'bone_arrows', quantity: 10 }],
    duration: 3000,
    xp: 25,
    bonuses: [{ type: 'extra_output', chance: 0.15, value: 5 }],
  },
  {
    id: 'fletch_shortbow',
    name: 'Shortbow',
    skill: 'fletching',
    levelRequired: 5,
    ingredients: [{ itemId: 'logs', quantity: 2 }],
    output: [{ itemId: 'shortbow', quantity: 1 }],
    duration: 4000,
    xp: 20,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 8 }],
  },
  {
    id: 'fletch_longbow',
    name: 'Longbow',
    skill: 'fletching',
    levelRequired: 15,
    ingredients: [{ itemId: 'oak_logs', quantity: 3 }],
    output: [{ itemId: 'longbow', quantity: 1 }],
    duration: 5000,
    xp: 40,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 15 }],
  },
  {
    id: 'fletch_iron_arrows',
    name: 'Iron Arrows',
    skill: 'fletching',
    levelRequired: 20,
    ingredients: [{ itemId: 'iron_bar', quantity: 1 }, { itemId: 'feathers', quantity: 5 }],
    output: [{ itemId: 'iron_arrows', quantity: 10 }],
    duration: 3500,
    xp: 35,
    bonuses: [{ type: 'extra_output', chance: 0.12, value: 5 }],
  },
  {
    id: 'fletch_composite_bow',
    name: 'Composite Bow',
    skill: 'fletching',
    levelRequired: 30,
    ingredients: [{ itemId: 'maple_logs', quantity: 2 }, { itemId: 'steel_bar', quantity: 1 }],
    output: [{ itemId: 'composite_bow', quantity: 1 }],
    duration: 6000,
    xp: 60,
    bonuses: [{ type: 'bonus_xp', chance: 0.08, value: 25 }],
  },
  {
    id: 'fletch_mithril_arrows',
    name: 'Mithril Arrows',
    skill: 'fletching',
    levelRequired: 40,
    ingredients: [{ itemId: 'mithril_bar', quantity: 1 }, { itemId: 'feathers', quantity: 5 }],
    output: [{ itemId: 'mithril_arrows', quantity: 10 }],
    duration: 4000,
    xp: 55,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 5 }],
  },
  {
    id: 'fletch_yew_longbow',
    name: 'Yew Longbow',
    skill: 'fletching',
    levelRequired: 50,
    ingredients: [{ itemId: 'yew_logs', quantity: 3 }],
    output: [{ itemId: 'yew_longbow', quantity: 1 }],
    duration: 7000,
    xp: 90,
    bonuses: [{ type: 'bonus_xp', chance: 0.05, value: 40 }],
  },
];

// ─── ALCHEMY RECIPES ───────────────────────────────────────────────

export const ALCHEMY_RECIPES: CraftingRecipe[] = [
  {
    id: 'alchemy_healing_potion',
    name: 'Healing Potion',
    skill: 'alchemy',
    levelRequired: 1,
    ingredients: [{ itemId: 'guam_herb', quantity: 1 }, { itemId: 'newt_eye', quantity: 1 }],
    output: [{ itemId: 'healing_potion', quantity: 1 }],
    duration: 3000,
    xp: 15,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 1 }],
  },
  {
    id: 'alchemy_strength_potion',
    name: 'Strength Potion',
    skill: 'alchemy',
    levelRequired: 10,
    ingredients: [{ itemId: 'marrentill_herb', quantity: 1 }, { itemId: 'unicorn_dust', quantity: 1 }],
    output: [{ itemId: 'strength_potion', quantity: 1 }],
    duration: 4000,
    xp: 30,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 1 }],
  },
  {
    id: 'alchemy_defense_potion',
    name: 'Defense Potion',
    skill: 'alchemy',
    levelRequired: 15,
    ingredients: [{ itemId: 'tarromin_herb', quantity: 1 }, { itemId: 'spider_silk', quantity: 2 }],
    output: [{ itemId: 'defense_potion', quantity: 1 }],
    duration: 4000,
    xp: 35,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 1 }],
  },
  {
    id: 'alchemy_energy_potion',
    name: 'Energy Potion',
    skill: 'alchemy',
    levelRequired: 20,
    ingredients: [{ itemId: 'harralander_herb', quantity: 1 }, { itemId: 'cactus_spike', quantity: 1 }],
    output: [{ itemId: 'energy_potion', quantity: 1 }],
    duration: 3500,
    xp: 40,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 1 }],
  },
  {
    id: 'alchemy_super_healing',
    name: 'Super Healing Potion',
    skill: 'alchemy',
    levelRequired: 30,
    ingredients: [{ itemId: 'ranarr_herb', quantity: 2 }, { itemId: 'unicorn_dust', quantity: 2 }],
    output: [{ itemId: 'super_healing_potion', quantity: 1 }],
    duration: 5000,
    xp: 65,
    bonuses: [{ type: 'extra_output', chance: 0.08, value: 1 }],
  },
  {
    id: 'alchemy_combat_potion',
    name: 'Combat Potion',
    skill: 'alchemy',
    levelRequired: 40,
    ingredients: [{ itemId: 'kwuarm_herb', quantity: 2 }, { itemId: 'dragon_dust', quantity: 1 }],
    output: [{ itemId: 'combat_potion', quantity: 1 }],
    duration: 6000,
    xp: 90,
    bonuses: [{ type: 'extra_output', chance: 0.06, value: 1 }],
  },
  {
    id: 'alchemy_prayer_potion',
    name: 'Prayer Potion',
    skill: 'alchemy',
    levelRequired: 50,
    ingredients: [{ itemId: 'avantoe_herb', quantity: 2 }, { itemId: 'mort_myre_fungus', quantity: 1 }],
    output: [{ itemId: 'prayer_potion', quantity: 1 }],
    duration: 7000,
    xp: 120,
    bonuses: [{ type: 'extra_output', chance: 0.05, value: 1 }],
  },
];

// ─── RUNECRAFTING RECIPES ──────────────────────────────────────────

export const RUNECRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'rc_air_rune',
    name: 'Air Rune',
    skill: 'runecrafting',
    levelRequired: 1,
    ingredients: [{ itemId: 'pure_essence', quantity: 1 }],
    output: [{ itemId: 'air_rune', quantity: 2 }],
    duration: 3000,
    xp: 8,
    bonuses: [{ type: 'extra_output', chance: 0.2, value: 1 }],
  },
  {
    id: 'rc_fire_rune',
    name: 'Fire Rune',
    skill: 'runecrafting',
    levelRequired: 5,
    ingredients: [{ itemId: 'pure_essence', quantity: 1 }],
    output: [{ itemId: 'fire_rune', quantity: 2 }],
    duration: 3000,
    xp: 10,
    bonuses: [{ type: 'extra_output', chance: 0.2, value: 1 }],
  },
  {
    id: 'rc_water_rune',
    name: 'Water Rune',
    skill: 'runecrafting',
    levelRequired: 5,
    ingredients: [{ itemId: 'pure_essence', quantity: 1 }],
    output: [{ itemId: 'water_rune', quantity: 2 }],
    duration: 3000,
    xp: 10,
    bonuses: [{ type: 'extra_output', chance: 0.2, value: 1 }],
  },
  {
    id: 'rc_earth_rune',
    name: 'Earth Rune',
    skill: 'runecrafting',
    levelRequired: 5,
    ingredients: [{ itemId: 'pure_essence', quantity: 1 }],
    output: [{ itemId: 'earth_rune', quantity: 2 }],
    duration: 3000,
    xp: 10,
    bonuses: [{ type: 'extra_output', chance: 0.2, value: 1 }],
  },
  {
    id: 'rc_mind_rune',
    name: 'Mind Rune',
    skill: 'runecrafting',
    levelRequired: 10,
    ingredients: [{ itemId: 'pure_essence', quantity: 2 }],
    output: [{ itemId: 'mind_rune', quantity: 2 }],
    duration: 4000,
    xp: 18,
    bonuses: [{ type: 'extra_output', chance: 0.18, value: 1 }],
  },
  {
    id: 'rc_chaos_rune',
    name: 'Chaos Rune',
    skill: 'runecrafting',
    levelRequired: 25,
    ingredients: [{ itemId: 'pure_essence', quantity: 3 }],
    output: [{ itemId: 'chaos_rune', quantity: 2 }],
    duration: 5000,
    xp: 40,
    bonuses: [{ type: 'extra_output', chance: 0.15, value: 1 }],
  },
  {
    id: 'rc_death_rune',
    name: 'Death Rune',
    skill: 'runecrafting',
    levelRequired: 40,
    ingredients: [{ itemId: 'pure_essence', quantity: 4 }],
    output: [{ itemId: 'death_rune', quantity: 2 }],
    duration: 6000,
    xp: 65,
    bonuses: [{ type: 'extra_output', chance: 0.12, value: 1 }],
  },
  {
    id: 'rc_nature_rune',
    name: 'Nature Rune',
    skill: 'runecrafting',
    levelRequired: 50,
    ingredients: [{ itemId: 'pure_essence', quantity: 5 }],
    output: [{ itemId: 'nature_rune', quantity: 2 }],
    duration: 7000,
    xp: 100,
    bonuses: [{ type: 'extra_output', chance: 0.1, value: 1 }],
  },
];

// ─── CRAFTING RECIPES (jewelry, etc.) ──────────────────────────────

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_gold_ring',
    name: 'Gold Ring',
    skill: 'crafting',
    levelRequired: 1,
    ingredients: [{ itemId: 'gold_ore', quantity: 1 }],
    output: [{ itemId: 'gold_ring', quantity: 1 }],
    duration: 4000,
    xp: 20,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'craft_silver_ring',
    name: 'Silver Ring',
    skill: 'crafting',
    levelRequired: 5,
    ingredients: [{ itemId: 'silver_ore', quantity: 1 }],
    output: [{ itemId: 'silver_ring', quantity: 1 }],
    duration: 3500,
    xp: 15,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'craft_gold_amulet',
    name: 'Gold Amulet',
    skill: 'crafting',
    levelRequired: 10,
    ingredients: [{ itemId: 'gold_ore', quantity: 2 }, { itemId: 'thread', quantity: 1 }],
    output: [{ itemId: 'gold_amulet', quantity: 1 }],
    duration: 5000,
    xp: 35,
    bonuses: [{ type: 'double_output', chance: 0.05 }],
  },
  {
    id: 'craft_sapphire_ring',
    name: 'Sapphire Ring',
    skill: 'crafting',
    levelRequired: 15,
    ingredients: [{ itemId: 'gold_ring', quantity: 1 }, { itemId: 'uncut_sapphire', quantity: 1 }],
    output: [{ itemId: 'sapphire_ring', quantity: 1 }],
    duration: 6000,
    xp: 50,
    bonuses: [{ type: 'double_output', chance: 0.03 }],
  },
  {
    id: 'craft_emerald_ring',
    name: 'Emerald Ring',
    skill: 'crafting',
    levelRequired: 25,
    ingredients: [{ itemId: 'gold_ring', quantity: 1 }, { itemId: 'uncut_emerald', quantity: 1 }],
    output: [{ itemId: 'emerald_ring', quantity: 1 }],
    duration: 7000,
    xp: 75,
    bonuses: [{ type: 'double_output', chance: 0.03 }],
  },
  {
    id: 'craft_ruby_ring',
    name: 'Ruby Ring',
    skill: 'crafting',
    levelRequired: 35,
    ingredients: [{ itemId: 'gold_ring', quantity: 1 }, { itemId: 'uncut_ruby', quantity: 1 }],
    output: [{ itemId: 'ruby_ring', quantity: 1 }],
    duration: 8000,
    xp: 100,
    bonuses: [{ type: 'double_output', chance: 0.02 }],
  },
  {
    id: 'craft_diamond_ring',
    name: 'Diamond Ring',
    skill: 'crafting',
    levelRequired: 45,
    ingredients: [{ itemId: 'gold_ring', quantity: 1 }, { itemId: 'uncut_diamond', quantity: 1 }],
    output: [{ itemId: 'diamond_ring', quantity: 1 }],
    duration: 9000,
    xp: 140,
    bonuses: [{ type: 'double_output', chance: 0.02 }],
  },
  {
    id: 'craft_leather_body',
    name: 'Leather Body',
    skill: 'crafting',
    levelRequired: 8,
    ingredients: [{ itemId: 'leather', quantity: 3 }, { itemId: 'thread', quantity: 1 }],
    output: [{ itemId: 'leather_body', quantity: 1 }],
    duration: 5000,
    xp: 25,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 10 }],
  },
  {
    id: 'craft_hard_leather_body',
    name: 'Hard Leather Body',
    skill: 'crafting',
    levelRequired: 18,
    ingredients: [{ itemId: 'hard_leather', quantity: 3 }, { itemId: 'thread', quantity: 1 }],
    output: [{ itemId: 'hard_leather_body', quantity: 1 }],
    duration: 6000,
    xp: 45,
    bonuses: [{ type: 'bonus_xp', chance: 0.1, value: 15 }],
  },
  {
    id: 'craft_dragonhide_body',
    name: 'Dragonhide Body',
    skill: 'crafting',
    levelRequired: 40,
    ingredients: [{ itemId: 'dragon_leather', quantity: 3 }, { itemId: 'thread', quantity: 2 }],
    output: [{ itemId: 'dragonhide_body', quantity: 1 }],
    duration: 8000,
    xp: 110,
    bonuses: [{ type: 'bonus_xp', chance: 0.05, value: 40 }],
  },
];

// ─── ALL RECIPES ───────────────────────────────────────────────────

export const ALL_RECIPES: CraftingRecipe[] = [
  ...SMITHING_RECIPES,
  ...COOKING_RECIPES,
  ...FLETCHING_RECIPES,
  ...ALCHEMY_RECIPES,
  ...RUNECRAFTING_RECIPES,
  ...CRAFTING_RECIPES,
];

// ─── RECIPE LOOKUP HELPERS ─────────────────────────────────────────

export function getRecipesForSkill(skill: CraftingSkill): CraftingRecipe[] {
  return ALL_RECIPES.filter(r => r.skill === skill);
}

export function getRecipeById(recipeId: string): CraftingRecipe | undefined {
  return ALL_RECIPES.find(r => r.id === recipeId);
}

export function getAvailableRecipes(skill: CraftingSkill, level: number): CraftingRecipe[] {
  return getRecipesForSkill(skill).filter(r => r.levelRequired <= level);
}

export function getLockedRecipes(skill: CraftingSkill, level: number): CraftingRecipe[] {
  return getRecipesForSkill(skill).filter(r => r.levelRequired > level);
}

export function getIngredientsForRecipe(recipeId: string): RecipeIngredient[] {
  const recipe = getRecipeById(recipeId);
  return recipe?.ingredients ?? [];
}

export function getOutputsForRecipe(recipeId: string): RecipeOutput[] {
  const recipe = getRecipeById(recipeId);
  return recipe?.output ?? [];
}

// ─── INGREDIENT CHECK ──────────────────────────────────────────────

export function hasIngredients(
  recipe: CraftingRecipe,
  inventory: Record<string, number>
): { canCraft: boolean; missing: RecipeIngredient[] } {
  const missing: RecipeIngredient[] = [];
  for (const ingredient of recipe.ingredients) {
    const have = inventory[ingredient.itemId] ?? 0;
    if (have < ingredient.quantity) {
      missing.push({ itemId: ingredient.itemId, quantity: ingredient.quantity - have });
    }
  }
  return { canCraft: missing.length === 0, missing };
}

export function calculateMaxCrafts(
  recipe: CraftingRecipe,
  inventory: Record<string, number>
): number {
  let maxCrafts = Infinity;
  for (const ingredient of recipe.ingredients) {
    const have = inventory[ingredient.itemId] ?? 0;
    const batch = Math.floor(have / ingredient.quantity);
    if (batch < maxCrafts) maxCrafts = batch;
  }
  return maxCrafts === Infinity ? 0 : maxCrafts;
}

// ─── CRAFTING ACTION LIFECYCLE ─────────────────────────────────────

export function startCraftingAction(
  recipeId: string,
  quantity: number = 1,
  startTime: number = Date.now()
): CraftingAction {
  const recipe = getRecipeById(recipeId);
  if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);
  if (quantity < 1) throw new Error('Quantity must be at least 1');

  return {
    recipeId,
    skill: recipe.skill,
    startTime,
    duration: recipe.duration,
    quantity,
    completed: 0,
  };
}

export function isCraftingComplete(action: CraftingAction): boolean {
  const recipe = getRecipeById(action.recipeId);
  if (!recipe) return false;
  const elapsed = Date.now() - action.startTime;
  return elapsed >= action.duration;
}

export function getCraftingProgress(action: CraftingAction): number {
  const elapsed = Date.now() - action.startTime;
  return Math.min(1, elapsed / action.duration);
}

export function getCraftingTimeRemaining(action: CraftingAction): number {
  return Math.max(0, action.startTime + action.duration - Date.now());
}

export function completeCraftingAction(
  action: CraftingAction
): {
  xpGained: number;
  outputs: { itemId: string; quantity: number }[];
  consumedIngredients: { itemId: string; quantity: number }[];
  bonusTriggered: CraftingBonus | null;
} {
  const recipe = getRecipeById(action.recipeId);
  if (!recipe) throw new Error(`Recipe not found: ${action.recipeId}`);

  let xpGained = recipe.xp;
  const outputs: { itemId: string; quantity: number }[] = [];
  const bonusTriggered: CraftingBonus | null = null;

  // Process outputs
  for (const output of recipe.output) {
    let qty = output.quantity;
    const chance = output.chance ?? 1.0;
    if (Math.random() <= chance) {
      // Check bonuses
      if (recipe.bonuses) {
        for (const bonus of recipe.bonuses) {
          if (Math.random() <= bonus.chance) {
            if (bonus.type === 'extra_output') {
              qty += bonus.value ?? 1;
            } else if (bonus.type === 'double_output') {
              qty *= 2;
            } else if (bonus.type === 'bonus_xp') {
              xpGained += bonus.value ?? 0;
            }
          }
        }
      }
      outputs.push({ itemId: output.itemId, quantity: qty });
    }
  }

  // Consume ingredients
  const consumedIngredients = recipe.ingredients.map(i => ({
    itemId: i.itemId,
    quantity: i.quantity,
  }));

  return { xpGained, outputs, consumedIngredients, bonusTriggered };
}

// ─── CRAFTING QUEUE MANAGEMENT ─────────────────────────────────────

export function createCraftingState(): CraftingState {
  return {
    activeAction: null,
    queue: [],
    recipeBook: {},
  };
}

export function enqueueCrafting(
  state: CraftingState,
  recipeId: string,
  quantity: number = 1
): CraftingState {
  const recipe = getRecipeById(recipeId);
  if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

  const action = startCraftingAction(recipeId, quantity);

  if (!state.activeAction) {
    return { ...state, activeAction: action };
  }

  return { ...state, queue: [...state.queue, action] };
}

export function processCraftingQueue(
  state: CraftingState
): { state: CraftingState; completedActions: CraftingAction[] } {
  const completedActions: CraftingAction[] = [];

  if (!state.activeAction) {
    if (state.queue.length === 0) {
      return { state, completedActions };
    }
    const [next, ...rest] = state.queue;
    return {
      state: { ...state, activeAction: next, queue: rest },
      completedActions,
    };
  }

  if (isCraftingComplete(state.activeAction)) {
    completedActions.push(state.activeAction);

    const action = state.activeAction;
    const newCompleted = action.completed + 1;

    if (newCompleted < action.quantity) {
      // Start next iteration of the same recipe
      const nextAction: CraftingAction = {
        ...action,
        startTime: Date.now(),
        completed: newCompleted,
      };
      return {
        state: { ...state, activeAction: nextAction },
        completedActions,
      };
    }

    // Recipe fully complete, move to next in queue
    if (state.queue.length > 0) {
      const [next, ...rest] = state.queue;
      return {
        state: { ...state, activeAction: next, queue: rest },
        completedActions,
      };
    }

    return {
      state: { ...state, activeAction: null },
      completedActions,
    };
  }

  return { state, completedActions };
}

export function cancelCraftingAction(
  state: CraftingState
): CraftingState {
  return { ...state, activeAction: null };
}

export function clearCraftingQueue(
  state: CraftingState
): CraftingState {
  return { ...state, queue: [] };
}

export function removeFromQueue(
  state: CraftingState,
  index: number
): CraftingState {
  if (index < 0 || index >= state.queue.length) return state;
  const newQueue = [...state.queue];
  newQueue.splice(index, 1);
  return { ...state, queue: newQueue };
}

// ─── CRAFTING HELPERS ──────────────────────────────────────────────

export function formatCraftingTime(ms: number): string {
  if (ms < 1000) return '< 1s';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function getSkillColor(skill: CraftingSkill): string {
  const colors: Record<CraftingSkill, string> = {
    smithing: '#ef4444',
    cooking: '#f97316',
    fletching: '#84cc16',
    alchemy: '#a855f7',
    runecrafting: '#3b82f6',
    crafting: '#eab308',
  };
  return colors[skill];
}

export function getSkillEmoji(skill: CraftingSkill): string {
  const emojis: Record<CraftingSkill, string> = {
    smithing: '⚒️',
    cooking: '🍳',
    fletching: '🏹',
    alchemy: '⚗️',
    runecrafting: '🔮',
    crafting: '✂️',
  };
  return emojis[skill];
}
