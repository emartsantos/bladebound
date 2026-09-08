import type { EquipmentSlot, EquipmentSlots, InventoryItem, ItemDefinition, Rarity, StatBlock, ItemPassive } from '@premium-rpg/shared-types';
import { resolveItemStats } from './itemization';

export interface EquipmentModifier {
  stat: keyof StatBlock;
  value: number;
}

export interface EquipmentStats {
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
  maxHealth: number;
  damage: number;
  defense: number;
}

export interface EquippedItemInfo {
  slot: EquipmentSlot;
  item: InventoryItem | null;
  baseStats: EquipmentStats;
  modifiers: EquipmentModifier[];
  rarity: Rarity;
  passives?: ItemPassive[];
  durability?: { current: number; max: number };
  requirements?: { level: number; stats?: Partial<StatBlock> };
  setBonus?: string;
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon', 'offhand', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'amulet', 'ring', 'cape'
];

function zeroEquipmentStats(): EquipmentStats {
  return { strength: 0, agility: 0, intelligence: 0, vitality: 0, accuracy: 0, evasion: 0, critChance: 0, critDamage: 0, attackSpeed: 0, armor: 0, maxHealth: 0, damage: 0, defense: 0 };
}

function addModifier(target: EquipmentModifier[], newMod: EquipmentModifier): void {
  const existing = target.find((m) => m.stat === newMod.stat);
  if (existing) {
    existing.value += newMod.value;
  } else {
    target.push(newMod);
  }
}

// Derive stat lines + passives for an item using the itemization engine.
// This replaces the old rarity-multiplier approach: stats come from
// slot archetypes + tier budgets, and rarity adds stat COMBINATIONS and
// load-bearing passives rather than scaling a single multiplier.
function getModifiersForItem(definition: ItemDefinition): EquipmentModifier[] {
  const resolved = resolveItemStats(definition);
  return resolved.statLines.map((line) => ({ stat: line.stat, value: line.value }));
}

function getPassivesForItem(definition: ItemDefinition): ItemPassive[] {
  return resolveItemStats(definition).passives;
}

// Equipment stat calculation from equipped slots
export function calculateEquipmentStats(
  slots: EquipmentSlots,
  itemDefinitions: Record<string, ItemDefinition>
): EquipmentStats {
  let strength = 0;
  let agility = 0;
  let intelligence = 0;
  let vitality = 0;
  let accuracy = 0;
  let evasion = 0;
  let critChance = 0;
  let critDamage = 0;
  let attackSpeed = 0;
  let armor = 0;
  let maxHealth = 0;
  let damage = 0;
  let defense = 0;

  const modifiers: EquipmentModifier[] = [];

  const slotItems = Object.values(slots).filter(
    (i): i is InventoryItem => i !== null && i !== undefined && 'itemId' in i
  );

  for (const item of slotItems) {
    const definition = itemDefinitions[item.itemId];
    if (!definition) continue;

    const itemMods = getModifiersForItem(definition);

    for (const m of itemMods) {
      addModifier(modifiers, m);
      switch (m.stat) {
        case 'strength': strength += m.value; break;
        case 'agility': agility += m.value; break;
        case 'intelligence': intelligence += m.value; break;
        case 'vitality': vitality += m.value; break;
        case 'accuracy': accuracy += m.value; break;
        case 'evasion': evasion += m.value; break;
        case 'critChance': critChance += m.value; break;
        case 'critDamage': critDamage += m.value; break;
        case 'attackSpeed': attackSpeed += m.value; break;
        case 'armor': armor += m.value; break;
        case 'maxHealth': maxHealth += m.value; break;
        case 'damage': damage += m.value; break;
        case 'defense': defense += m.value; break;
      }
    }
  }

  return { strength, agility, intelligence, vitality, accuracy, evasion, critChance, critDamage, attackSpeed, armor, maxHealth, damage, defense };
}

// Get info for equipped item set
export function getEquippedItemInfo(
  slots: EquipmentSlots,
  itemDefinitions: Record<string, ItemDefinition>
): EquippedItemInfo[] {
  const results: EquippedItemInfo[] = [];

  for (const slot of EQUIPMENT_SLOTS) {
    const item = slots[slot] as InventoryItem | null;
    const definition = item?.itemId ? itemDefinitions[item.itemId] : undefined;
    
    if (!definition) {
      results.push({
        slot,
        item: item ?? null,
        baseStats: zeroEquipmentStats(),
        modifiers: [],
        rarity: 'common' as Rarity,
      });
      continue;
    }

    const equipped = item as InventoryItem;
    const stats = calculateEquipmentStats({ [slot]: equipped } as unknown as EquipmentSlots, { [equipped.itemId]: definition });
    const mods = getModifiersForItem(definition);
    
    const durability = (equipped.metadata as Record<string, unknown> | undefined)?.durability as { current: number; max: number } | undefined;
    const requirements = (equipped.metadata as Record<string, unknown> | undefined)?.requirements as { level: number; stats?: Partial<StatBlock> } | undefined;
    const setBonus = (equipped.metadata as Record<string, unknown> | undefined)?.setBonus as string | undefined;

    results.push({
      slot,
      item,
      baseStats: stats,
      modifiers: mods,
      rarity: definition.rarity ?? 'common',
      passives: getPassivesForItem(definition),
      durability,
      requirements,
      setBonus,
    });
  }

  return results;
}

// Calculate derived stats: base + equipment + buffs
export function calculateDerivedStats(
  baseStats: StatBlock,
  equipmentStats: EquipmentStats,
  buffs: ReadonlyArray<{ stat: keyof StatBlock; value: number }> = []
): StatBlock {
  return {
    strength: baseStats.strength + equipmentStats.strength,
    agility: baseStats.agility + equipmentStats.agility,
    intelligence: baseStats.intelligence + equipmentStats.intelligence,
    vitality: baseStats.vitality + equipmentStats.vitality,
    accuracy: baseStats.accuracy + equipmentStats.accuracy,
    evasion: baseStats.evasion + equipmentStats.evasion,
    critChance: baseStats.critChance + equipmentStats.critChance,
    critDamage: baseStats.critDamage + equipmentStats.critDamage,
    attackSpeed: baseStats.attackSpeed + equipmentStats.attackSpeed,
    armor: baseStats.armor + equipmentStats.armor,
    maxHealth: baseStats.maxHealth + equipmentStats.maxHealth,
    damage: baseStats.damage + equipmentStats.damage,
    defense: baseStats.defense + equipmentStats.defense,
  };
}

// Compare equipped item vs candidate item
export function itemComparisonData(
  equipped: EquippedItemInfo,
  candidate: InventoryItem,
  itemDefinitions: Record<string, ItemDefinition>
): {
  improvements: EquipmentModifier[];
  reductions: EquipmentModifier[];
  specialBonuses: string[];
  requirementsMet: boolean;
  missingRequirements: string[];
  durabilityComparison?: { current: number; max: number; candidateMax: number };
} {
  const improvements: EquipmentModifier[] = [];
  const reductions: EquipmentModifier[] = [];
  const specialBonuses: string[] = [];
  const missingRequirements: string[] = [];

  if (!candidate.itemId) {
    return { improvements, reductions, specialBonuses, requirementsMet: false, missingRequirements: ['No item selected'] };
  }

  const candidateDef = itemDefinitions[candidate.itemId];
  if (!candidateDef) {
    return { improvements, reductions, specialBonuses, requirementsMet: false, missingRequirements: ['Item definition not found'] };
  }

  const req = candidateDef.metadata?.requirements as { level: number; stats?: Partial<StatBlock> } | undefined;
  if (req) {
    if (req.level) missingRequirements.push(`Level ${req.level} required`);
    if (req.stats) {
      for (const [stat, value] of Object.entries(req.stats)) {
        missingRequirements.push(`${stat} ${value} required`);
      }
    }
  }

  const currentDurability = equipped.durability;
  const candidateDurability = candidate.metadata?.durability as { current: number; max: number } | undefined;
  let durabilityComparison: { current: number; max: number; candidateMax: number } | undefined;
  if (currentDurability && candidateDurability) {
    durabilityComparison = { current: currentDurability.current, max: currentDurability.max, candidateMax: candidateDurability.max };
  } else if (candidateDurability) {
    durabilityComparison = { current: 0, max: 0, candidateMax: candidateDurability.max };
  }

  const equippedMods = equipped.modifiers;
  const candidateMods = getModifiersForItem(candidateDef);

  const allStats = new Set([...equippedMods.map(m => m.stat), ...candidateMods.map(m => m.stat)]);

  for (const stat of allStats) {
    const eqValue = equippedMods.find(m => m.stat === stat)?.value ?? 0;
    const candValue = candidateMods.find(m => m.stat === stat)?.value ?? 0;
    const diff = candValue - eqValue;

    if (diff > 0) {
      improvements.push({ stat, value: diff });
    } else if (diff < 0) {
      reductions.push({ stat, value: -diff });
    }
  }

  if (candidate.metadata) {
    const meta = candidate.metadata as Record<string, unknown>;
    if ('uniqueEffect' in meta && meta.uniqueEffect !== null) {
      specialBonuses.push(String(meta.uniqueEffect));
    }
    if ('setBonus' in meta && meta.setBonus !== null) {
      specialBonuses.push(`Set Bonus: ${meta.setBonus}`);
    }
  }

  return {
    improvements,
    reductions,
    specialBonuses,
    requirementsMet: missingRequirements.length === 0,
    missingRequirements,
    durabilityComparison,
  };
}

// Get all equipment stats as a flat array for display
export function getEquipmentStatsArray(equipmentStats: EquipmentStats): EquipmentModifier[] {
  return Object.entries(equipmentStats)
    .filter(([, value]) => value !== 0)
    .map(([stat, value]) => ({ stat: stat as keyof StatBlock, value }));
}

// Apply durability damage to equipped item
export function applyDurabilityDamage(
  slots: EquipmentSlots,
  slot: EquipmentSlot,
  damage: number
): { broken: boolean; remaining: number } {
  const item = slots[slot] as InventoryItem | undefined;
  if (!item || !item.itemId) return { broken: false, remaining: 0 };

  const durability = item.metadata?.durability as { current: number; max: number } | undefined;
  if (!durability) return { broken: false, remaining: 0 };

  const newCurrent = Math.max(0, durability.current - damage);
  item.metadata!.durability = { current: newCurrent, max: durability.max };

  return { broken: newCurrent <= 0, remaining: newCurrent };
}

// Repair item
export function repairItem(item: InventoryItem, amount: number): number {
  const durability = item.metadata?.durability as { current: number; max: number } | undefined;
  if (!durability) return 0;

  const repaired = Math.min(amount, durability.max - durability.current);
  const meta = item.metadata as Record<string, unknown> | undefined;
  if (meta) {
    const d = meta.durability as { current: number; max: number };
    d.current += repaired;
  }
  return repaired;
}

// Check if item can be equipped (requirements)
export function canEquipItem(
  item: InventoryItem,
  itemDefinitions: Record<string, ItemDefinition>,
  playerLevel: number,
  playerStats: StatBlock
): { canEquip: boolean; missingRequirements: string[] } {
  const definition = itemDefinitions[item.itemId];
  if (!definition) return { canEquip: false, missingRequirements: ['Unknown item'] };

  const missingRequirements: string[] = [];

  if (definition.metadata?.requirements) {
    const req = definition.metadata.requirements as { level: number; stats?: Partial<StatBlock> };
    if (req.level && playerLevel < req.level) {
      missingRequirements.push(`Level ${req.level} required`);
    }
    if (req.stats) {
      for (const [stat, value] of Object.entries(req.stats)) {
        const playerValue = playerStats[stat as keyof StatBlock] ?? 0;
        if (playerValue < (value as number)) {
          missingRequirements.push(`${stat}: ${value} required (have ${playerValue})`);
        }
      }
    }
  }

  return { canEquip: missingRequirements.length === 0, missingRequirements };
}

// Aggregate all active passives across the equipped item set.
// Important: passive stacks are handled here so combat can consume them
// without owning equipment internals.
export function getEquippedPassives(
  slots: EquipmentSlots,
  itemDefinitions: Record<string, ItemDefinition>
): ItemPassive[] {
  const passives: ItemPassive[] = [];
  const slotItems = Object.values(slots).filter(
    (i): i is InventoryItem => i !== null && i !== undefined && 'itemId' in i
  );
  for (const item of slotItems) {
    const definition = itemDefinitions[item.itemId];
    if (!definition) continue;
    passives.push(...getPassivesForItem(definition));
  }
  return passives;
}
