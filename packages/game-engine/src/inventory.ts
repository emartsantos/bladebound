import { ToolType } from '@premium-rpg/shared-types';

export type ItemCategory = 
  | 'weapon' 
  | 'armor' 
  | 'tool' 
  | 'resource' 
  | 'consumable' 
  | 'quest' 
  | 'currency' 
  | 'misc';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

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

export interface ItemStats {
  attack?: number;
  defense?: number;
  strength?: number;
  accuracy?: number;
  evasion?: number;
  critChance?: number;
  critDamage?: number;
  hp?: number;
  mp?: number;
  hpRegen?: number;
  mpRegen?: number;
  miningSpeed?: number;
  woodcuttingSpeed?: number;
  fishingSpeed?: number;
  xpBonus?: number;
  luck?: number;
  [key: string]: number | undefined;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  weight: number;
  value: number; // base sell price
  levelRequired: number;
  stats?: ItemStats;
  equipmentSlot?: EquipmentSlot;
  toolType?: ToolType;
  gatherBonus?: {
    skill: 'mining' | 'woodcutting' | 'fishing';
    speedMultiplier: number;
    xpBonus: number;
  };
  consumableEffect?: {
    type: 'heal' | 'mana' | 'buff' | 'teleport';
    value: number;
    duration?: number;
    buffType?: string;
  };
  tooltip?: string;
  icon?: string;
  tags?: string[];
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  locked: boolean;
  favorite: boolean;
  metadata?: Record<string, unknown>; // for durability, enchantments, etc.
}

export interface InventoryState {
  items: InventoryItem[];
  capacity: number;
  usedSlots: number;
  gold: number;
}

export interface InventoryConfig {
  startingCapacity: number;
  maxCapacity: number;
  capacityPerLevel: number;
  startingGold: number;
}

export const DEFAULT_INVENTORY_CONFIG: InventoryConfig = {
  startingCapacity: 28,
  maxCapacity: 100,
  capacityPerLevel: 2,
  startingGold: 0,
};

export interface ItemComparisonResult {
  itemA: ItemDefinition;
  itemB: ItemDefinition;
  differences: StatDifference[];
  recommendation: 'A' | 'B' | 'situational';
}

export interface StatDifference {
  stat: string;
  valueA: number;
  valueB: number;
  diff: number;
  better: 'A' | 'B' | 'equal';
}

export type SortOption = 
  | 'name' 
  | 'category' 
  | 'rarity' 
  | 'value' 
  | 'weight' 
  | 'level' 
  | 'quantity' 
  | 'recent';

export type FilterOption = {
  categories?: ItemCategory[];
  rarities?: ItemRarity[];
  search?: string;
  onlyEquippable?: boolean;
  onlyStackable?: boolean;
  minLevel?: number;
  maxLevel?: number;
  onlyFavorites?: boolean;
  excludeLocked?: boolean;
};

export function createEmptyInventory(config: InventoryConfig = DEFAULT_INVENTORY_CONFIG): InventoryState {
  return {
    items: [],
    capacity: config.startingCapacity,
    usedSlots: 0,
    gold: config.startingGold,
  };
}

export function calculateUsedSlots(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity > 0 ? 1 : 0), 0);
}

export function getTotalWeight(items: InventoryItem[], definitions: Map<string, ItemDefinition>): number {
  return items.reduce((sum, item) => {
    const def = definitions.get(item.itemId);
    return sum + (def?.weight ?? 0) * item.quantity;
  }, 0);
}

export function canAddItem(
  inventory: InventoryState,
  itemId: string,
  quantity: number,
  definitions: Map<string, ItemDefinition>
): boolean {
  const def = definitions.get(itemId);
  if (!def) return false;

  const existingIndex = inventory.items.findIndex(i => i.itemId === itemId);
  
  if (existingIndex >= 0) {
    const existing = inventory.items[existingIndex];
    if (def.stackable) {
      const maxStack = def.maxStack;
      return existing.quantity + quantity <= maxStack;
    }
    return false; // non-stackable, already have one
  }

  // New item needs a slot
  return inventory.usedSlots < inventory.capacity;
}

export function addItem(
  inventory: InventoryState,
  itemId: string,
  quantity: number,
  definitions: Map<string, ItemDefinition>,
  options?: { metadata?: Record<string, unknown> }
): { success: boolean; added: number; remaining: number; message?: string } {
  const def = definitions.get(itemId);
  if (!def) return { success: false, added: 0, remaining: quantity, message: 'Item not found' };

  const existingIndex = inventory.items.findIndex(i => i.itemId === itemId);
  let remaining = quantity;

  if (existingIndex >= 0 && def.stackable) {
    const existing = inventory.items[existingIndex];
    const maxStack = def.maxStack;
    const space = maxStack - existing.quantity;
    const added = Math.min(space, remaining);
    existing.quantity += added;
    remaining -= added;
    inventory.usedSlots = calculateUsedSlots(inventory.items);
    return { 
      success: added > 0, 
      added, 
      remaining,
      message: remaining > 0 ? `Inventory full (max stack ${def.maxStack})` : undefined 
    };
  }

  // Need new slot
  if (inventory.usedSlots >= inventory.capacity) {
    return { success: false, added: 0, remaining: quantity, message: 'Inventory full' };
  }

  const newItem: InventoryItem = {
    itemId,
    quantity: Math.min(quantity, def.maxStack),
    locked: false,
    favorite: false,
    metadata: options?.metadata,
  };
  inventory.items.push(newItem);
  remaining -= newItem.quantity;
  inventory.usedSlots = calculateUsedSlots(inventory.items);
  return { success: true, added: newItem.quantity, remaining };
}

export function removeItem(
  inventory: InventoryState,
  itemId: string,
  quantity: number
): { success: boolean; removed: number; item?: InventoryItem } {
  const index = inventory.items.findIndex(i => i.itemId === itemId);
  if (index === -1) return { success: false, removed: 0 };

  const item = inventory.items[index];
  if (item.locked) return { success: false, removed: 0, item };

  const removed = Math.min(quantity, item.quantity);
  item.quantity -= removed;

  if (item.quantity <= 0) {
    inventory.items.splice(index, 1);
  }
  inventory.usedSlots = calculateUsedSlots(inventory.items);
  return { success: true, removed, item };
}

export function moveItem(
  inventory: InventoryState,
  fromIndex: number,
  toIndex: number
): boolean {
  if (fromIndex < 0 || fromIndex >= inventory.items.length) return false;
  if (toIndex < 0 || toIndex >= inventory.items.length) return false;
  
  const [item] = inventory.items.splice(fromIndex, 1);
  inventory.items.splice(toIndex, 0, item);
  return true;
}

export function stackItems(inventory: InventoryState, definitions: Map<string, ItemDefinition>): number {
  let stacked = 0;
  const seen = new Map<string, number>();

  for (let i = inventory.items.length - 1; i >= 0; i--) {
    const item = inventory.items[i];
    const def = definitions.get(item.itemId);
    if (!def?.stackable) continue;

    const existingIndex = seen.get(item.itemId);
    if (existingIndex !== undefined) {
      const existing = inventory.items[existingIndex];
      const space = def.maxStack - existing.quantity;
      if (space > 0) {
        const moved = Math.min(space, item.quantity);
        existing.quantity += moved;
        item.quantity -= moved;
        stacked += moved;
        if (item.quantity <= 0) {
          inventory.items.splice(i, 1);
        }
      }
    } else {
      seen.set(item.itemId, i);
    }
  }
  inventory.usedSlots = calculateUsedSlots(inventory.items);
  return stacked;
}

export function sortItems(
  inventory: InventoryState,
  option: SortOption,
  definitions: Map<string, ItemDefinition>,
  ascending = true
): void {
  const multiplier = ascending ? 1 : -1;
  
  inventory.items.sort((a, b) => {
    const defA = definitions.get(a.itemId);
    const defB = definitions.get(b.itemId);
    
    if (!defA || !defB) return 0;

    let comparison = 0;
    switch (option) {
      case 'name':
        comparison = defA.name.localeCompare(defB.name);
        break;
      case 'category':
        comparison = defA.category.localeCompare(defB.category);
        break;
      case 'rarity':
        comparison = RARITY_ORDER[defA.rarity] - RARITY_ORDER[defB.rarity];
        break;
      case 'value':
        comparison = defA.value - defB.value;
        break;
      case 'weight':
        comparison = defA.weight - defB.weight;
        break;
      case 'level':
        comparison = defA.levelRequired - defB.levelRequired;
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'recent':
        comparison = 0; // Would need timestamp tracking
        break;
    }
    return comparison * multiplier;
  });
}

export function filterItems(
  items: InventoryItem[],
  definitions: Map<string, ItemDefinition>,
  filter: FilterOption
): InventoryItem[] {
  return items.filter(item => {
    const def = definitions.get(item.itemId);
    if (!def) return false;

    if (filter.categories?.length && !filter.categories.includes(def.category)) return false;
    if (filter.rarities?.length && !filter.rarities.includes(def.rarity)) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      if (!def.name.toLowerCase().includes(search) && 
          !def.description.toLowerCase().includes(search)) return false;
    }
    if (filter.onlyEquippable && !def.equipmentSlot) return false;
    if (filter.onlyStackable && !def.stackable) return false;
    if (filter.minLevel && def.levelRequired < filter.minLevel) return false;
    if (filter.maxLevel && def.levelRequired > filter.maxLevel) return false;
    if (filter.onlyFavorites && !item.favorite) return false;
    if (filter.excludeLocked && item.locked) return false;
    return true;
  });
}

export function toggleLock(inventory: InventoryState, index: number): boolean {
  if (index < 0 || index >= inventory.items.length) return false;
  inventory.items[index].locked = !inventory.items[index].locked;
  return true;
}

export function toggleFavorite(inventory: InventoryState, index: number): boolean {
  if (index < 0 || index >= inventory.items.length) return false;
  inventory.items[index].favorite = !inventory.items[index].favorite;
  return true;
}

export function canSell(inventory: InventoryState, index: number): boolean {
  if (index < 0 || index >= inventory.items.length) return false;
  const item = inventory.items[index];
  return !item.locked && !item.favorite;
}

export function sellItem(
  inventory: InventoryState,
  index: number,
  quantity: number,
  definitions: Map<string, ItemDefinition>
): { success: boolean; goldGained: number } {
  if (!canSell(inventory, index)) return { success: false, goldGained: 0 };
  
  const item = inventory.items[index];
  const def = definitions.get(item.itemId);
  if (!def) return { success: false, goldGained: 0 };

  const sellQty = Math.min(quantity, item.quantity);
  const goldGained = sellQty * Math.floor(def.value * 0.5); // 50% sell value
  
  const result = removeItem(inventory, item.itemId, sellQty);
  if (result.success) {
    return { success: true, goldGained };
  }
  return { success: false, goldGained: 0 };
}

export function expandCapacity(inventory: InventoryState, amount: number, maxCapacity: number): boolean {
  if (inventory.capacity >= maxCapacity) return false;
  inventory.capacity = Math.min(inventory.capacity + amount, maxCapacity);
  return true;
}

export function compareItems(
  itemA: ItemDefinition,
  itemB: ItemDefinition,
  statWeights?: Record<string, number>
): ItemComparisonResult {
  const allStats = new Set([
    ...Object.keys(itemA.stats ?? {}),
    ...Object.keys(itemB.stats ?? {}),
  ]);

  const differences: StatDifference[] = [];
  let scoreA = 0;
  let scoreB = 0;

  for (const stat of allStats) {
    const valueA = itemA.stats?.[stat] ?? 0;
    const valueB = itemB.stats?.[stat] ?? 0;
    const diff = valueA - valueB;
    const weight = statWeights?.[stat] ?? 1;
    
    differences.push({
      stat,
      valueA,
      valueB,
      diff,
      better: diff > 0 ? 'A' : diff < 0 ? 'B' : 'equal',
    });

    if (diff > 0) scoreA += diff * weight;
    else if (diff < 0) scoreB += -diff * weight;
  }

  let recommendation: 'A' | 'B' | 'situational' = 'situational';
  if (scoreA > scoreB * 1.2) recommendation = 'A';
  else if (scoreB > scoreA * 1.2) recommendation = 'B';

  return { itemA, itemB, differences, recommendation };
}

export function getItemTooltip(itemId: string, definitions: Map<string, ItemDefinition>): string | null {
  const def = definitions.get(itemId);
  if (!def) return null;

  let tooltip = `${def.name} (${def.rarity})\n${def.description}\n`;
  
  if (def.category === 'weapon' || def.category === 'armor') {
    tooltip += `\nLevel Required: ${def.levelRequired}`;
    if (def.stats) {
      tooltip += '\nStats:';
      for (const [stat, value] of Object.entries(def.stats)) {
        if (value && value > 0) tooltip += `\n  +${value} ${formatStatName(stat)}`;
      }
    }
  }

  if (def.category === 'tool' && def.gatherBonus) {
    tooltip += `\n${def.gatherBonus.skill} speed: ${def.gatherBonus.speedMultiplier}x`;
    if (def.gatherBonus.xpBonus) tooltip += `, +${def.gatherBonus.xpBonus} XP`;
  }

  tooltip += `\nValue: ${def.value} gold | Weight: ${def.weight}`;
  if (def.stackable) tooltip += ` | Max Stack: ${def.maxStack}`;

  return tooltip;
}

function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

const RARITY_ORDER: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  tool: '🔧',
  resource: '📦',
  consumable: '🧪',
  quest: '📜',
  currency: '💰',
  misc: '📦',
};