import type { SectionId } from '@premium-rpg/ui-tokens';

export interface MockPlayer {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  health: number;
  maxHealth: number;
  combatLevel: number;
  region: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
    accuracy: number;
    evasion: number;
    critChance: number;
    critDamage: number;
    attackSpeed: number;
    armor: number;
    damage: number;
    defense: number;
  };
}

export interface MockSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  icon: string;
}

export interface MockItem {
  id: string;
  name: string;
  type: string;
  slot?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  power: number;
  icon: string;
}

export interface MockQuest {
  id: string;
  name: string;
  description: string;
  progress: number;
  total: number;
  reward: { gold: number; xp: number };
  active: boolean;
}

export interface MockNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'ember';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface MockRegion {
  id: string;
  name: string;
  description: string;
  level: number;
  discovered: boolean;
  progress: number;
}

export const MOCK_PLAYER: MockPlayer = {
  name: 'Theron',
  level: 24,
  xp: 14750,
  xpToNext: 18200,
  gold: 12450,
  health: 342,
  maxHealth: 410,
  combatLevel: 26,
  region: 'Ashenvale',
  stats: {
    strength: 48,
    agility: 35,
    intelligence: 22,
    vitality: 41,
    accuracy: 67,
    evasion: 28,
    critChance: 12.5,
    critDamage: 185,
    attackSpeed: 1.2,
    armor: 89,
    damage: 156,
    defense: 72,
  },
};

export const MOCK_SKILLS: MockSkill[] = [
  { name: 'Mining', level: 18, xp: 4200, xpToNext: 5500, icon: '⛏' },
  { name: 'Woodcutting', level: 14, xp: 2800, xpToNext: 3600, icon: '🪓' },
  { name: 'Fishing', level: 11, xp: 1500, xpToNext: 2200, icon: '🎣' },
  { name: 'Smithing', level: 9, xp: 980, xpToNext: 1800, icon: '🔨' },
  { name: 'Enchanting', level: 6, xp: 420, xpToNext: 1100, icon: '✨' },
  { name: 'Cooking', level: 12, xp: 2100, xpToNext: 2800, icon: '🍳' },
  { name: 'Herbalism', level: 8, xp: 750, xpToNext: 1500, icon: '🌿' },
  { name: 'Alchemy', level: 5, xp: 300, xpToNext: 900, icon: '⚗️' },
];

export const MOCK_INVENTORY: MockItem[] = [
  { id: 'i1', name: 'Iron Longsword', type: 'weapon', slot: 'weapon', rarity: 'common', power: 45, icon: '⚔️' },
  { id: 'i2', name: 'Oak Shield', type: 'offhand', slot: 'offhand', rarity: 'common', power: 32, icon: '🛡️' },
  { id: 'i3', name: 'Leather Helm', type: 'helmet', slot: 'helmet', rarity: 'uncommon', power: 28, icon: '⛑️' },
  { id: 'i4', name: 'Chainmail Vest', type: 'chest', slot: 'chest', rarity: 'uncommon', power: 56, icon: '🦺' },
  { id: 'i5', name: 'Steel Gauntlets', type: 'gloves', slot: 'gloves', rarity: 'rare', power: 38, icon: '🧤' },
  { id: 'i6', name: 'Ember Ring', type: 'ring', slot: 'ring', rarity: 'epic', power: 22, icon: '💍' },
  { id: 'i7', name: 'Health Potion', type: 'consumable', rarity: 'common', power: 0, icon: '🧪' },
  { id: 'i8', name: 'Iron Ore', type: 'material', rarity: 'common', power: 0, icon: '🪨' },
  { id: 'i9', name: 'Ancient Tome', type: 'quest', rarity: 'legendary', power: 0, icon: '📖' },
  { id: 'i10', name: 'Wolf Pelt', type: 'material', rarity: 'common', power: 0, icon: '🐺' },
  { id: 'i11', name: 'Moonstone Amulet', type: 'amulet', slot: 'amulet', rarity: 'rare', power: 34, icon: '📿' },
  { id: 'i12', name: 'Shadow Cloak', type: 'cape', slot: 'cape', rarity: 'epic', power: 41, icon: '🧥' },
];

export const MOCK_QUESTS: MockQuest[] = [
  { id: 'q1', name: 'The Lost Mines', description: 'Discover the entrance to the Ashenvale mines.', progress: 1, total: 1, reward: { gold: 500, xp: 1200 }, active: true },
  { id: 'q2', name: 'Wolf Problem', description: 'Defeat 15 dire wolves threatening the village.', progress: 8, total: 15, reward: { gold: 350, xp: 800 }, active: true },
  { id: 'q3', name: 'Herb Gathering', description: 'Collect moonroot from the eastern forest.', progress: 3, total: 10, reward: { gold: 200, xp: 500 }, active: false },
  { id: 'q4', name: 'Smiths Request', description: 'Deliver 20 iron ore to Smith Harrin.', progress: 14, total: 20, reward: { gold: 400, xp: 600 }, active: true },
  { id: 'q5', name: 'The Dark Seal', description: 'Find and break the dark seal in Shadowfen.', progress: 0, total: 1, reward: { gold: 2000, xp: 5000 }, active: false },
];

export const MOCK_REGIONS: MockRegion[] = [
  { id: 'starter-frontier', name: 'Starter Frontier', description: 'Where every journey begins.', level: 1, discovered: true, progress: 100 },
  { id: 'ashenvale', name: 'Ashenvale', description: 'Ancient forests and forgotten ruins.', level: 10, discovered: true, progress: 72 },
  { id: 'ironpeak', name: 'Ironpeak Mountains', description: 'Mines rich with ore and danger.', level: 20, discovered: true, progress: 35 },
  { id: 'shadowfen', name: 'Shadowfen', description: 'A cursed marshland shrouded in mist.', level: 30, discovered: false, progress: 0 },
  { id: 'dragonspine', name: 'Dragonspine Ridge', description: 'Where dragons once roamed.', level: 40, discovered: false, progress: 0 },
  { id: 'hollowdeep', name: 'Hollowdeep', description: 'The underworld beneath the world.', level: 50, discovered: false, progress: 0 },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: 'n1', type: 'success', title: 'Quest Complete', message: 'You finished "The Lost Mines"!', timestamp: Date.now() - 300000, read: false },
  { id: 'n2', type: 'warning', title: 'Low Health', message: 'Your health is below 50%.', timestamp: Date.now() - 600000, read: false },
  { id: 'n3', type: 'ember', title: 'Rare Drop!', message: 'You found Ember Ring!', timestamp: Date.now() - 900000, read: true },
  { id: 'n4', type: 'info', title: 'New Region', message: 'Ironpeak Mountains unlocked.', timestamp: Date.now() - 1200000, read: true },
  { id: 'n5', type: 'danger', title: 'Durability Warning', message: 'Iron Longsword durability low.', timestamp: Date.now() - 1500000, read: false },
];
