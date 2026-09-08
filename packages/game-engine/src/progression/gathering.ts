import { xpForLevel, levelForXp, gainExperience } from './xp';

export type SkillName = 'mining' | 'woodcutting' | 'fishing';

export interface GatheringNode {
  id: string;
  name: string;
  skill: SkillName;
  levelRequired: number;
  baseDuration: number; // milliseconds
  baseXp: number;
  resources: GatheringResource[];
  toolRequired: boolean;
  toolBonus?: ToolBonus;
}

export interface GatheringResource {
  itemId: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  chance: number; // 0-1
  rare?: boolean;
}

export interface ToolBonus {
  speedMultiplier: number; // e.g., 1.5 = 50% faster
  xpBonus: number; // flat XP bonus per action
  extraResourceChance: number; // 0-1
}

export interface GatheringTool {
  id: string;
  name: string;
  skill: SkillName;
  levelRequired: number;
  bonus: ToolBonus;
}

export interface GatheringAction {
  nodeId: string;
  skill: SkillName;
  startTime: number;
  duration: number;
  toolId?: string;
}

// Mining nodes
export const MINING_NODES: GatheringNode[] = [
  {
    id: 'copper_vein',
    name: 'Copper Vein',
    skill: 'mining',
    levelRequired: 1,
    baseDuration: 4000, // 4 seconds
    baseXp: 15,
    resources: [
      { itemId: 'copper_ore', name: 'Copper Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'tin_ore', name: 'Tin Ore', minQuantity: 1, maxQuantity: 1, chance: 0.1, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'tin_vein',
    name: 'Tin Vein',
    skill: 'mining',
    levelRequired: 5,
    baseDuration: 5000,
    baseXp: 25,
    resources: [
      { itemId: 'tin_ore', name: 'Tin Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'copper_ore', name: 'Copper Ore', minQuantity: 1, maxQuantity: 2, chance: 0.3 },
      { itemId: 'iron_ore', name: 'Iron Ore', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'iron_vein',
    name: 'Iron Vein',
    skill: 'mining',
    levelRequired: 15,
    baseDuration: 6000,
    baseXp: 40,
    resources: [
      { itemId: 'iron_ore', name: 'Iron Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'coal', name: 'Coal', minQuantity: 1, maxQuantity: 2, chance: 0.5 },
      { itemId: 'gold_ore', name: 'Gold Ore', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'coal_vein',
    name: 'Coal Vein',
    skill: 'mining',
    levelRequired: 20,
    baseDuration: 5000,
    baseXp: 35,
    resources: [
      { itemId: 'coal', name: 'Coal', minQuantity: 2, maxQuantity: 4, chance: 1.0 },
      { itemId: 'iron_ore', name: 'Iron Ore', minQuantity: 1, maxQuantity: 2, chance: 0.3 },
      { itemId: 'mithril_ore', name: 'Mithril Ore', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'mithril_vein',
    name: 'Mithril Vein',
    skill: 'mining',
    levelRequired: 35,
    baseDuration: 7000,
    baseXp: 55,
    resources: [
      { itemId: 'mithril_ore', name: 'Mithril Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'adamant_ore', name: 'Adamantite Ore', minQuantity: 1, maxQuantity: 2, chance: 0.2 },
      { itemId: 'gold_ore', name: 'Gold Ore', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'adamant_vein',
    name: 'Adamant Vein',
    skill: 'mining',
    levelRequired: 45,
    baseDuration: 8000,
    baseXp: 70,
    resources: [
      { itemId: 'adamant_ore', name: 'Adamantite Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'runite_ore', name: 'Runite Ore', minQuantity: 1, maxQuantity: 1, chance: 0.1, rare: true },
      { itemId: 'mithril_ore', name: 'Mithril Ore', minQuantity: 1, maxQuantity: 2, chance: 0.2 },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'rune_vein',
    name: 'Rune Vein',
    skill: 'mining',
    levelRequired: 55,
    baseDuration: 9000,
    baseXp: 90,
    resources: [
      { itemId: 'runite_ore', name: 'Runite Ore', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'dragon_ore', name: 'Dragon Ore', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
      { itemId: 'adamant_ore', name: 'Adamantite Ore', minQuantity: 1, maxQuantity: 2, chance: 0.2 },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'dragon_vein',
    name: 'Dragon Vein',
    skill: 'mining',
    levelRequired: 70,
    baseDuration: 10000,
    baseXp: 120,
    resources: [
      { itemId: 'dragon_ore', name: 'Dragon Ore', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'runite_ore', name: 'Runite Ore', minQuantity: 1, maxQuantity: 2, chance: 0.3 },
      { itemId: 'infernal_ore', name: 'Infernal Ore', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'infernal_vein',
    name: 'Infernal Vein',
    skill: 'mining',
    levelRequired: 85,
    baseDuration: 11000,
    baseXp: 150,
    resources: [
      { itemId: 'infernal_ore', name: 'Infernal Ore', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'dragon_ore', name: 'Dragon Ore', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
      { itemId: 'void_ore', name: 'Void Ore', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
  {
    id: 'void_vein',
    name: 'Void Vein',
    skill: 'mining',
    levelRequired: 95,
    baseDuration: 12000,
    baseXp: 180,
    resources: [
      { itemId: 'void_ore', name: 'Void Ore', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'infernal_ore', name: 'Infernal Ore', minQuantity: 1, maxQuantity: 2, chance: 0.3 },
      { itemId: 'cosmic_crystal', name: 'Cosmic Crystal', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
  },
];

// Woodcutting nodes
export const WOODCUTTING_NODES: GatheringNode[] = [
  {
    id: 'regular_tree',
    name: 'Regular Tree',
    skill: 'woodcutting',
    levelRequired: 1,
    baseDuration: 3000,
    baseXp: 12,
    resources: [
      { itemId: 'logs', name: 'Logs', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'oak_logs', name: 'Oak Logs', minQuantity: 1, maxQuantity: 1, chance: 0.1, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'oak_tree',
    name: 'Oak Tree',
    skill: 'woodcutting',
    levelRequired: 10,
    baseDuration: 4500,
    baseXp: 28,
    resources: [
      { itemId: 'oak_logs', name: 'Oak Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'willow_logs', name: 'Willow Logs', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
      { itemId: 'maple_logs', name: 'Maple Logs', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'willow_tree',
    name: 'Willow Tree',
    skill: 'woodcutting',
    levelRequired: 20,
    baseDuration: 5500,
    baseXp: 42,
    resources: [
      { itemId: 'willow_logs', name: 'Willow Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'maple_logs', name: 'Maple Logs', minQuantity: 1, maxQuantity: 2, chance: 0.3 },
      { itemId: 'yew_logs', name: 'Yew Logs', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'maple_tree',
    name: 'Maple Tree',
    skill: 'woodcutting',
    levelRequired: 30,
    baseDuration: 6500,
    baseXp: 58,
    resources: [
      { itemId: 'maple_logs', name: 'Maple Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'yew_logs', name: 'Yew Logs', minQuantity: 1, maxQuantity: 2, chance: 0.2 },
      { itemId: 'magic_logs', name: 'Magic Logs', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'yew_tree',
    name: 'Yew Tree',
    skill: 'woodcutting',
    levelRequired: 45,
    baseDuration: 7500,
    baseXp: 80,
    resources: [
      { itemId: 'yew_logs', name: 'Yew Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'magic_logs', name: 'Magic Logs', minQuantity: 1, maxQuantity: 2, chance: 0.15 },
      { itemId: 'elder_logs', name: 'Elder Logs', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'magic_tree',
    name: 'Magic Tree',
    skill: 'woodcutting',
    levelRequired: 60,
    baseDuration: 8500,
    baseXp: 110,
    resources: [
      { itemId: 'magic_logs', name: 'Magic Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'elder_logs', name: 'Elder Logs', minQuantity: 1, maxQuantity: 1, chance: 0.1, rare: true },
      { itemId: 'spirit_logs', name: 'Spirit Logs', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'elder_tree',
    name: 'Elder Tree',
    skill: 'woodcutting',
    levelRequired: 75,
    baseDuration: 9500,
    baseXp: 140,
    resources: [
      { itemId: 'elder_logs', name: 'Elder Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'spirit_logs', name: 'Spirit Logs', minQuantity: 1, maxQuantity: 1, chance: 0.1, rare: true },
      { itemId: 'abyssal_log', name: 'Abyssal Log', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'obsidian_tree',
    name: 'Obsidian Tree',
    skill: 'woodcutting',
    levelRequired: 85,
    baseDuration: 10500,
    baseXp: 170,
    resources: [
      { itemId: 'obsidian_logs', name: 'Obsidian Logs', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'abyssal_log', name: 'Abyssal Log', minQuantity: 1, maxQuantity: 1, chance: 0.08, rare: true },
      { itemId: 'elder_logs', name: 'Elder Logs', minQuantity: 1, maxQuantity: 2, chance: 0.2 },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
  {
    id: 'abyssal_tree',
    name: 'Abyssal Tree',
    skill: 'woodcutting',
    levelRequired: 95,
    baseDuration: 11500,
    baseXp: 200,
    resources: [
      { itemId: 'abyssal_log', name: 'Abyssal Log', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
      { itemId: 'obsidian_logs', name: 'Obsidian Logs', minQuantity: 1, maxQuantity: 2, chance: 0.25 },
      { itemId: 'ethereal_wood', name: 'Ethereal Wood', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.5, xpBonus: 4, extraResourceChance: 0.15 },
  },
];

// Fishing nodes
export const FISHING_NODES: GatheringNode[] = [
  {
    id: 'fishing_spot_1',
    name: 'Shallow Pond',
    skill: 'fishing',
    levelRequired: 1,
    baseDuration: 5000,
    baseXp: 10,
    resources: [
      { itemId: 'shrimp', name: 'Shrimp', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'sardine', name: 'Sardine', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'fishing_spot_2',
    name: 'River Bank',
    skill: 'fishing',
    levelRequired: 10,
    baseDuration: 6000,
    baseXp: 25,
    resources: [
      { itemId: 'trout', name: 'Trout', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'salmon', name: 'Salmon', minQuantity: 1, maxQuantity: 1, chance: 0.3 },
      { itemId: 'bass', name: 'Bass', minQuantity: 1, maxQuantity: 1, chance: 0.05, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'fishing_spot_3',
    name: 'Deep Lake',
    skill: 'fishing',
    levelRequired: 25,
    baseDuration: 7000,
    baseXp: 45,
    resources: [
      { itemId: 'salmon', name: 'Salmon', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'tuna', name: 'Tuna', minQuantity: 1, maxQuantity: 1, chance: 0.25 },
      { itemId: 'swordfish', name: 'Swordfish', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'fishing_spot_4',
    name: 'Ocean Shore',
    skill: 'fishing',
    levelRequired: 40,
    baseDuration: 8000,
    baseXp: 65,
    resources: [
      { itemId: 'tuna', name: 'Tuna', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'swordfish', name: 'Swordfish', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
      { itemId: 'shark', name: 'Shark', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'deep_ocean',
    name: 'Deep Ocean',
    skill: 'fishing',
    levelRequired: 55,
    baseDuration: 9000,
    baseXp: 95,
    resources: [
      { itemId: 'shark', name: 'Shark', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'lobster', name: 'Lobster', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
      { itemId: 'sea_turtle', name: 'Sea Turtle', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'marsh_waters',
    name: 'Marsh Waters',
    skill: 'fishing',
    levelRequired: 65,
    baseDuration: 9500,
    baseXp: 120,
    resources: [
      { itemId: 'shark', name: 'Shark', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'poison_fish', name: 'Poison Fish', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
      { itemId: 'moonfish', name: 'Moonfish', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'volcanic_waters',
    name: 'Volcanic Waters',
    skill: 'fishing',
    levelRequired: 80,
    baseDuration: 10500,
    baseXp: 145,
    resources: [
      { itemId: 'lava_trout', name: 'Lava Trout', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'magma_gar', name: 'Magma Gar', minQuantity: 1, maxQuantity: 1, chance: 0.2 },
      { itemId: 'molten_carp', name: 'Molten Carp', minQuantity: 1, maxQuantity: 1, chance: 0.02, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
  {
    id: 'abyssal_fishing',
    name: 'Abyssal Fishing Spot',
    skill: 'fishing',
    levelRequired: 92,
    baseDuration: 11500,
    baseXp: 175,
    resources: [
      { itemId: 'abyss_fish', name: 'Abyss Fish', minQuantity: 1, maxQuantity: 2, chance: 1.0 },
      { itemId: 'elder_fish', name: 'Elder Fish', minQuantity: 1, maxQuantity: 1, chance: 0.15, rare: true },
      { itemId: 'void_pike', name: 'Void Pike', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
    ],
    toolRequired: true,
    toolBonus: { speedMultiplier: 1.3, xpBonus: 3, extraResourceChance: 0.1 },
  },
];

// Tools
export const MINING_TOOLS: GatheringTool[] = [
  { id: 'bronze_pickaxe', name: 'Bronze Pickaxe', skill: 'mining', levelRequired: 1, bonus: { speedMultiplier: 1.2, xpBonus: 2, extraResourceChance: 0.05 } },
  { id: 'iron_pickaxe', name: 'Iron Pickaxe', skill: 'mining', levelRequired: 10, bonus: { speedMultiplier: 1.3, xpBonus: 4, extraResourceChance: 0.1 } },
  { id: 'steel_pickaxe', name: 'Steel Pickaxe', skill: 'mining', levelRequired: 20, bonus: { speedMultiplier: 1.5, xpBonus: 6, extraResourceChance: 0.15 } },
  { id: 'mithril_pickaxe', name: 'Mithril Pickaxe', skill: 'mining', levelRequired: 30, bonus: { speedMultiplier: 1.8, xpBonus: 8, extraResourceChance: 0.2 } },
  { id: 'adamant_pickaxe', name: 'Adamant Pickaxe', skill: 'mining', levelRequired: 40, bonus: { speedMultiplier: 2.0, xpBonus: 10, extraResourceChance: 0.25 } },
  { id: 'rune_pickaxe', name: 'Rune Pickaxe', skill: 'mining', levelRequired: 50, bonus: { speedMultiplier: 2.5, xpBonus: 15, extraResourceChance: 0.3 } },
  { id: 'dragon_pickaxe', name: 'Dragon Pickaxe', skill: 'mining', levelRequired: 60, bonus: { speedMultiplier: 2.8, xpBonus: 18, extraResourceChance: 0.35 } },
  { id: 'infernal_pickaxe', name: 'Infernal Pickaxe', skill: 'mining', levelRequired: 80, bonus: { speedMultiplier: 3.2, xpBonus: 22, extraResourceChance: 0.4 } },
  { id: 'void_pickaxe', name: 'Void Pickaxe', skill: 'mining', levelRequired: 90, bonus: { speedMultiplier: 3.5, xpBonus: 25, extraResourceChance: 0.45 } },
];

export const WOODCUTTING_TOOLS: GatheringTool[] = [
  { id: 'bronze_axe', name: 'Bronze Axe', skill: 'woodcutting', levelRequired: 1, bonus: { speedMultiplier: 1.2, xpBonus: 2, extraResourceChance: 0.05 } },
  { id: 'iron_axe', name: 'Iron Axe', skill: 'woodcutting', levelRequired: 10, bonus: { speedMultiplier: 1.3, xpBonus: 4, extraResourceChance: 0.1 } },
  { id: 'steel_axe', name: 'Steel Axe', skill: 'woodcutting', levelRequired: 20, bonus: { speedMultiplier: 1.5, xpBonus: 6, extraResourceChance: 0.15 } },
  { id: 'mithril_axe', name: 'Mithril Axe', skill: 'woodcutting', levelRequired: 30, bonus: { speedMultiplier: 1.8, xpBonus: 8, extraResourceChance: 0.2 } },
  { id: 'adamant_axe', name: 'Adamant Axe', skill: 'woodcutting', levelRequired: 40, bonus: { speedMultiplier: 2.0, xpBonus: 10, extraResourceChance: 0.25 } },
  { id: 'rune_axe', name: 'Rune Axe', skill: 'woodcutting', levelRequired: 50, bonus: { speedMultiplier: 2.5, xpBonus: 15, extraResourceChance: 0.3 } },
  { id: 'dragon_axe', name: 'Dragon Axe', skill: 'woodcutting', levelRequired: 60, bonus: { speedMultiplier: 2.8, xpBonus: 18, extraResourceChance: 0.35 } },
  { id: 'infernal_axe', name: 'Infernal Axe', skill: 'woodcutting', levelRequired: 80, bonus: { speedMultiplier: 3.2, xpBonus: 22, extraResourceChance: 0.4 } },
  { id: 'abyssal_axe', name: 'Abyssal Axe', skill: 'woodcutting', levelRequired: 90, bonus: { speedMultiplier: 3.5, xpBonus: 25, extraResourceChance: 0.45 } },
];

export const FISHING_TOOLS: GatheringTool[] = [
  { id: 'small_net', name: 'Small Net', skill: 'fishing', levelRequired: 1, bonus: { speedMultiplier: 1.1, xpBonus: 1, extraResourceChance: 0.05 } },
  { id: 'fishing_rod', name: 'Fishing Rod', skill: 'fishing', levelRequired: 5, bonus: { speedMultiplier: 1.2, xpBonus: 2, extraResourceChance: 0.08 } },
  { id: 'fly_fishing_rod', name: 'Fly Fishing Rod', skill: 'fishing', levelRequired: 20, bonus: { speedMultiplier: 1.3, xpBonus: 4, extraResourceChance: 0.12 } },
  { id: 'harpoon', name: 'Harpoon', skill: 'fishing', levelRequired: 35, bonus: { speedMultiplier: 1.4, xpBonus: 6, extraResourceChance: 0.15 } },
  { id: 'barb_tail_harpoon', name: 'Barb-tail Harpoon', skill: 'fishing', levelRequired: 50, bonus: { speedMultiplier: 1.6, xpBonus: 8, extraResourceChance: 0.2 } },
  { id: 'void_harpoon', name: 'Void Harpoon', skill: 'fishing', levelRequired: 70, bonus: { speedMultiplier: 1.8, xpBonus: 10, extraResourceChance: 0.25 } },
  { id: 'abyssal_harpoon', name: 'Abyssal Harpoon', skill: 'fishing', levelRequired: 90, bonus: { speedMultiplier: 2.0, xpBonus: 12, extraResourceChance: 0.3 } },
];

export const ALL_GATHERING_NODES = [...MINING_NODES, ...WOODCUTTING_NODES, ...FISHING_NODES];
export const ALL_GATHERING_TOOLS = [...MINING_TOOLS, ...WOODCUTTING_TOOLS, ...FISHING_TOOLS];

export function getNodesForSkill(skill: SkillName): GatheringNode[] {
  switch (skill) {
    case 'mining': return MINING_NODES;
    case 'woodcutting': return WOODCUTTING_NODES;
    case 'fishing': return FISHING_NODES;
  }
}

export function getToolsForSkill(skill: SkillName): GatheringTool[] {
  switch (skill) {
    case 'mining': return MINING_TOOLS;
    case 'woodcutting': return WOODCUTTING_TOOLS;
    case 'fishing': return FISHING_TOOLS;
  }
}

export function getAvailableNodes(skill: SkillName, level: number): GatheringNode[] {
  return getNodesForSkill(skill).filter(node => node.levelRequired <= level);
}

export function getAvailableTools(skill: SkillName, level: number): GatheringTool[] {
  return getToolsForSkill(skill).filter(tool => tool.levelRequired <= level);
}

export function getBestTool(skill: SkillName, level: number): GatheringTool | null {
  const tools = getAvailableTools(skill, level);
  if (tools.length === 0) return null;
  return tools.reduce((best, tool) => tool.bonus.speedMultiplier > best.bonus.speedMultiplier ? tool : best);
}

export function calculateActionDuration(node: GatheringNode, tool?: GatheringTool): number {
  let duration = node.baseDuration;
  if (tool && tool.bonus.speedMultiplier) {
    duration = Math.floor(duration / tool.bonus.speedMultiplier);
  }
  return duration;
}

export function calculateXpReward(node: GatheringNode, tool?: GatheringTool): number {
  let xp = node.baseXp;
  if (tool && tool.bonus.xpBonus) {
    xp += tool.bonus.xpBonus;
  }
  return xp;
}

export function rollResources(node: GatheringNode, tool?: GatheringTool): { itemId: string; quantity: number; rare: boolean }[] {
  const results: { itemId: string; quantity: number; rare: boolean }[] = [];
  const extraChance = tool?.bonus.extraResourceChance ?? 0;

  for (const resource of node.resources) {
    if (Math.random() <= resource.chance) {
      const qty = Math.floor(Math.random() * (resource.maxQuantity - resource.minQuantity + 1)) + resource.minQuantity;
      results.push({ itemId: resource.itemId, quantity: qty, rare: resource.rare ?? false });
    }
  }

  // Extra resource chance from tool
  if (extraChance > 0 && node.resources.length > 0) {
    const resource = node.resources[Math.floor(Math.random() * node.resources.length)];
    if (Math.random() <= extraChance) {
      const qty = Math.floor(Math.random() * (resource.maxQuantity - resource.minQuantity + 1)) + resource.minQuantity;
      results.push({ itemId: resource.itemId, quantity: qty, rare: resource.rare ?? false });
    }
  }

  return results;
}

export function startGatheringAction(nodeId: string, skill: SkillName, toolId?: string): GatheringAction {
  const nodes = getNodesForSkill(skill);
  const node = nodes.find(n => n.id === nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  const tool = toolId ? ALL_GATHERING_TOOLS.find(t => t.id === toolId) : undefined;
  const duration = calculateActionDuration(node, tool);

  return {
    nodeId,
    skill,
    startTime: Date.now(),
    duration,
    toolId,
  };
}

export function completeGatheringAction(action: GatheringAction): { xpGained: number; resources: { itemId: string; quantity: number; rare: boolean }[] } {
  const nodes = getNodesForSkill(action.skill);
  const node = nodes.find(n => n.id === action.nodeId);
  if (!node) throw new Error(`Node not found: ${action.nodeId}`);

  const tool = action.toolId ? ALL_GATHERING_TOOLS.find(t => t.id === action.toolId) : undefined;
  const xpGained = calculateXpReward(node, tool);
  const resources = rollResources(node, tool);

  return { xpGained, resources };
}

export function isActionComplete(action: GatheringAction): boolean {
  return Date.now() >= action.startTime + action.duration;
}

export function getActionProgress(action: GatheringAction): number {
  const elapsed = Date.now() - action.startTime;
  return Math.min(1, elapsed / action.duration);
}

export function getActionTimeRemaining(action: GatheringAction): number {
  return Math.max(0, action.startTime + action.duration - Date.now());
}

export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) return '< 1s';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}