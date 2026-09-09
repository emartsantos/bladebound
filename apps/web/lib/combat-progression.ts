import type { BaseStats, EquipmentSlots, StatBlock, Rarity } from '@premium-rpg/shared-types';
import { ITEM_BY_ID } from '@premium-rpg/game-data';
import { baseStatsForLevel } from '@/lib/player-summary';
import { getPlayerClass } from '@/lib/classes';
import type { InvestmentState } from '@/lib/persistence/game-persistence';

export const COMBAT_LEVEL_CAP = 100;
const FORGED_QUALITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1, uncommon: 1.05, rare: 1.12, epic: 1.22, legendary: 1.35,
};

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
    const forgeLevel = Number(equipped.metadata?.forgeLevel ?? 0);
    const awakening = Number(equipped.metadata?.awakening ?? 0);
    const forgedRarity = equipped.metadata?.forgedRarity as Rarity | undefined;
    const qualityMultiplier = forgedRarity ? FORGED_QUALITY_MULTIPLIER[forgedRarity] : 1;
    const investmentMultiplier = definition?.equipmentSlot === 'weapon' ? 1 + forgeLevel * 0.04 + awakening * 0.08 : 1;
    const multiplier = qualityMultiplier * investmentMultiplier;
    for (const [key, value] of Object.entries(definition?.stats ?? {})) {
      const stat = key as keyof StatBlock;
      totals[stat] = ((totals[stat] ?? 0) + (value ?? 0) * multiplier) as never;
    }
    const bonusStat = equipped.metadata?.bonusStat as keyof StatBlock | undefined;
    const bonusValue = Number(equipped.metadata?.bonusValue ?? 0);
    if (bonusStat && bonusValue > 0) totals[bonusStat] = ((totals[bonusStat] ?? 0) + bonusValue) as never;
  }
  return totals;
}

export function derivedCombatStats(level: number, classId: string, equipment: EquipmentSlots, investment?: InvestmentState): BaseStats {
  const base = classBaseStats(level, classId);
  const gear = equipmentStats(equipment);
  const result = { ...base } as BaseStats;
  const rebirthMultiplier = 1 + (investment?.heroRebirth ?? 0) * 0.05;
  for (const key of Object.keys(base) as Array<keyof BaseStats>) {
    const reforge = investment?.heroBonusStat === key ? investment.heroBonusValue : 0;
    result[key] = Math.round((base[key] * rebirthMultiplier + (gear[key] ?? 0) + reforge) * 100) / 100;
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
