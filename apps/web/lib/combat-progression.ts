import type { BaseStats, EquipmentSlots, StatBlock } from '@premium-rpg/shared-types';
import { ITEM_BY_ID } from '@premium-rpg/game-data';
import { baseStatsForLevel } from '@/lib/player-summary';
import { getPlayerClass } from '@/lib/classes';

export const COMBAT_LEVEL_CAP = 100;

const CLASS_GROWTH = {
  warrior: { strength: 1.18, vitality: 1.15, armor: 1.12 },
  ranger: { agility: 1.2, accuracy: 1.15, evasion: 1.12 },
  mage: { intelligence: 1.25, critChance: 1.12, critDamage: 1.1 },
} as const;

export function classBaseStats(level: number, classId = 'warrior'): BaseStats {
  const base = baseStatsForLevel(Math.min(COMBAT_LEVEL_CAP, Math.max(1, level)));
  const growth = CLASS_GROWTH[classId as keyof typeof CLASS_GROWTH] ?? CLASS_GROWTH.warrior;
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [
    key,
    Math.round(value * (growth[key as keyof typeof growth] ?? 1) * 100) / 100,
  ])) as unknown as BaseStats;
}

export function equipmentStats(equipment: EquipmentSlots): Partial<StatBlock> {
  const totals: Partial<StatBlock> = {};
  for (const equipped of Object.values(equipment)) {
    if (!equipped || (equipped.durability ?? 100) <= 0) continue;
    const definition = ITEM_BY_ID[equipped.itemId];
    for (const [key, value] of Object.entries(definition?.stats ?? {})) {
      const stat = key as keyof StatBlock;
      totals[stat] = ((totals[stat] ?? 0) + (value ?? 0)) as never;
    }
  }
  return totals;
}

export function derivedCombatStats(level: number, classId: string, equipment: EquipmentSlots): BaseStats {
  const base = classBaseStats(level, classId);
  const gear = equipmentStats(equipment);
  const result = { ...base } as BaseStats;
  for (const key of Object.keys(base) as Array<keyof BaseStats>) {
    result[key] = Math.round((base[key] + (gear[key] ?? 0)) * 100) / 100;
  }
  return result;
}

export function equipmentPower(equipment: EquipmentSlots): number {
  const gear = equipmentStats(equipment);
  return Math.round(Object.entries(gear).reduce((sum, [key, value]) => {
    const weight = key === 'maxHealth' ? 0.2 : key === 'attackSpeed' ? 20 : key.includes('crit') ? 1.5 : 1;
    return sum + Math.max(0, value ?? 0) * weight;
  }, 0));
}

export function equipmentCompatibility(itemId: string, classId: string): { compatible: boolean; reason: string } {
  const item = ITEM_BY_ID[itemId];
  if (!item || item.equipmentSlot !== 'weapon') return { compatible: true, reason: 'Usable by every class' };
  const style = getPlayerClass(classId).attackStyle;
  const name = `${item.id} ${item.name}`.toLowerCase();
  const matches = style === 'melee'
    ? /sword|blade|axe|fang/.test(name)
    : style === 'ranged'
      ? /bow|crossbow|quiver/.test(name)
      : /staff|wand|tome|orb/.test(name);
  return matches
    ? { compatible: true, reason: `${style} class weapon` }
    : { compatible: false, reason: `Off-class weapon: 25% power penalty` };
}
