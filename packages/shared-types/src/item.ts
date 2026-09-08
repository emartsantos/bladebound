export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'material'
  | 'food'
  | 'tool'
  | 'quest'
  | 'currency'
  | 'consumable';

// Equipment tiers represent the progression of craftable/found gear power.
// Higher tiers do NOT simply multiply stats — they enable new stat
// archetypes and load-bearing passive slots (see ItemizationEngine).
export type EquipmentTier =
  | 'bronze'
  | 'iron'
  | 'steel'
  | 'mithril'
  | 'adamant'
  | 'rune'
  | 'dragon'
  | 'infernal'
  | 'void';

// A passive is a conditional, build-defining effect — the "meat" of rarity.
export interface ItemPassive {
  id: string;
  name: string;
  // Short human-readable description, e.g. "+15% crit damage while full HP"
  description: string;
  // Machine-readable hook the combat/equipment layers can evaluate
  category:
    | 'damage'
    | 'defense'
    | 'healing'
    | 'crit'
    | 'speed'
    | 'lifesteal'
    | 'resource'
    | 'utility';
  // Numeric payload consumed by the hook when active
  value: number;
  // Optional condition (evaluated by the game layer)
  condition?: 'always' | 'full_hp' | 'low_hp' | 'after_kill' | 'while_buffed';
}

// Unique affixes label a named unique item (overrides normal generation).
export interface UniqueItemAffix {
  name: string;
  description: string;
  passives: ItemPassive[];
  // Counts toward a set when several share the same set name.
  set?: string;
  // If true the item is tradeable only with its drop source (boss-bound).
  soulbound?: boolean;
}

// Acquisition source classification — drives where the item comes from.
export type AcquisitionSource =
  | 'crafting'
  | 'boss'
  | 'dungeon'
  | 'region'
  | 'enemy'
  | 'gathering'
  | 'quest'
  | 'vendor'
  | 'event';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  stackable: boolean;
  maxStack: number;
  weight: number;
  metadata: Record<string, unknown>;
  // Itemization-specific fields
  tier?: EquipmentTier;
  equipmentSlot?: 'weapon' | 'offhand' | 'helmet' | 'chest' | 'gloves' | 'legs' | 'boots' | 'amulet' | 'ring' | 'cape';
  // Optional explicit stat lines (precomputed at definition time)
  stats?: Partial<Record<keyof import('./combat').StatBlock, number>>;
  // Passives carried when equipped (rare+ gear typically has 1+).
  passives?: ItemPassive[];
  // Present when this is a bespoke named unique item.
  unique?: UniqueItemAffix;
  // Where this item can be obtained.
  acquisition?: AcquisitionSource[];
  // Level required to equip/use.
  levelRequired?: number;
  // Selling/value multiplier per rarity is handled by the engine, not here.
}

export interface InventoryItem {
  uid: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  durability: number | null;
  metadata?: Record<string, unknown>;
}

export type EquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'helmet'
  | 'chest'
  | 'gloves'
  | 'legs'
  | 'boots'
  | 'amulet'
  | 'ring'
  | 'cape';

export interface EquipmentSlots {
  weapon: InventoryItem | null;
  offhand: InventoryItem | null;
  helmet: InventoryItem | null;
  chest: InventoryItem | null;
  gloves: InventoryItem | null;
  legs: InventoryItem | null;
  boots: InventoryItem | null;
  amulet: InventoryItem | null;
  ring: InventoryItem | null;
  cape: InventoryItem | null;
}