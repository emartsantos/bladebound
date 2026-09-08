// Item-name & metadata resolution the shell uses for idle-game content.
// `@premium-rpg/game-data` catalogs equipment; gathering/crafting/food ids
// are resolved here so the idle loop can render human-readable names without
// touching shared packages.

import { ITEM_BY_ID } from '@premium-rpg/game-data';

// Ores, bars, logs, fish, food, and combat materials referenced across
// `game-engine` gathering/crafting content and `game-data` loot tables.
const EXTRA_ITEM_NAMES: Record<string, string> = {
  // Ores & bars
  copper_ore: 'Copper Ore',
  tin_ore: 'Tin Ore',
  iron_ore: 'Iron Ore',
  gold_ore: 'Gold Ore',
  coal: 'Coal',
  mithril_ore: 'Mithril Ore',
  adamant_ore: 'Adamantite Ore',
  runite_ore: 'Runite Ore',
  dragon_ore: 'Dragon Ore',
  infernal_ore: 'Infernal Ore',
  void_ore: 'Void Ore',
  bronze_bar: 'Bronze Bar',
  iron_bar: 'Iron Bar',
  steel_bar: 'Steel Bar',
  mithril_bar: 'Mithril Bar',
  adamant_bar: 'Adamant Bar',
  rune_bar: 'Rune Bar',
  // Logs & wood
  logs: 'Logs',
  oak_logs: 'Oak Logs',
  willow_logs: 'Willow Logs',
  maple_logs: 'Maple Logs',
  yew_logs: 'Yew Logs',
  magic_logs: 'Magic Logs',
  elder_logs: 'Elder Logs',
  obsidian_logs: 'Obsidian Logs',
  spirit_logs: 'Spirit Logs',
  abyssal_log: 'Abyssal Log',
  ethereal_wood: 'Ethereal Wood',
  darkwood_log: 'Darkwood Log',
  // Fish & food
  shrimp: 'Shrimp',
  sardine: 'Sardine',
  trout: 'Trout',
  salmon: 'Salmon',
  bass: 'Bass',
  tuna: 'Tuna',
  swordfish: 'Swordfish',
  shark: 'Shark',
  lobster: 'Lobster',
  sea_turtle: 'Sea Turtle',
  poison_fish: 'Poison Fish',
  moonfish: 'Moonfish',
  lava_trout: 'Lava Trout',
  magma_gar: 'Magma Gar',
  molten_carp: 'Molten Carp',
  abyss_fish: 'Abyss Fish',
  elder_fish: 'Elder Fish',
  void_pike: 'Void Pike',
  cooked_shrimp: 'Cooked Shrimp',
  cooked_sardine: 'Cooked Sardine',
  cooked_trout: 'Cooked Trout',
  cooked_salmon: 'Cooked Salmon',
  cooked_bass: 'Cooked Bass',
  cooked_tuna: 'Cooked Tuna',
  cooked_swordfish: 'Cooked Swordfish',
  cooked_shark: 'Cooked Shark',
  cooked_lobster: 'Cooked Lobster',
  raw_wolf_meat: 'Raw Wolf Meat',
  // Combat materials
  goblin_teeth: 'Goblin Teeth',
  wolf_pelt: 'Wolf Pelt',
  wolf_fang: 'Wolf Fang',
  bone: 'Bone',
  cracked_bone: 'Cracked Bone',
  sharp_fang: 'Sharp Fang',
  monster_hide: 'Monster Hide',
  arcane_essence: 'Arcane Essence',
  iron_arrows: 'Iron Arrows',
  skeleton_helmet: 'Skeleton Helmet',
  shade_essence: 'Shade Essence',
  spider_silk: 'Spider Silk',
  lich_philactery: 'Lich Philactery',
  soul_essence: 'Soul Essence',
  wyvern_scale: 'Wyvern Scale',
  frost_crown: 'Frost Crown',
  cosmic_crystal: 'Cosmic Crystal',
  // Fletching materials
  arrow_shaft: 'Arrow Shaft',
  headless_arrow: 'Headless Arrow',
  bronze_arrow: 'Bronze Arrow',
  iron_arrow: 'Iron Arrow',
  steel_arrow: 'Steel Arrow',
  shortbow_shaft: 'Shortbow Shaft',
  shortbow_u: 'Shortbow (u)',
  shortbow: 'Shortbow',
  oak_shortbow: 'Oak Shortbow',
  willow_shortbow: 'Willow Shortbow',
  // Alchemy materials
  herb: 'Herb',
  gilded_herb: 'Gilded Herb',
  lesser_potion: 'Lesser Potion',
  greater_potion: 'Greater Potion',
  minor_elixir: 'Minor Elixir',
  major_elixir: 'Major Elixir',
  // Runecrafting materials
  rune_essence: 'Rune Essence',
  mind_rune: 'Mind Rune',
  chaos_rune: 'Chaos Rune',
  death_rune: 'Death Rune',
  blood_rune: 'Blood Rune',
  soul_rune: 'Soul Rune',
};

const FOOD_HEAL: Record<string, number> = {
  shrimp: 30,
  sardine: 40,
  trout: 60,
  salmon: 80,
  bass: 100,
  tuna: 120,
  swordfish: 150,
  shark: 200,
  lobster: 160,
  sea_turtle: 220,
  cooked_shrimp: 70,
  cooked_sardine: 90,
  cooked_trout: 100,
  cooked_salmon: 130,
  cooked_bass: 150,
  cooked_tuna: 170,
  cooked_swordfish: 210,
  cooked_shark: 260,
  cooked_lobster: 220,
  lava_trout: 240,
  magma_gar: 280,
  molten_carp: 320,
  abyss_fish: 360,
  elder_fish: 300,
  void_pike: 380,
};

export function itemName(id: string): string {
  const known = ITEM_BY_ID[id]?.name ?? EXTRA_ITEM_NAMES[id];
  if (known) return known;
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function itemHeal(id: string): number | undefined {
  return FOOD_HEAL[id];
}

export type ItemBucket = 'equipment' | 'food' | 'material';

export function itemBucket(id: string): ItemBucket {
  const def = ITEM_BY_ID[id];
  if (def && (def.type === 'weapon' || def.type === 'armor')) return 'equipment';
  if (FOOD_HEAL[id]) return 'food';
  return 'material';
}