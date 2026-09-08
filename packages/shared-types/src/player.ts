import type { EquipmentSlots } from './item';
import type { SkillId, SkillLevel } from './skill';

export type CurrencyId = 'gold';

export interface CurrencyMap {
  gold: number;
}

export interface PlayerSummary {
  id: string;
  name: string;
  combatLevel: number;
  totalLevel: number;
  skills: Record<SkillId, SkillLevel>;
  equipment: EquipmentSlots;
  currency: CurrencyMap;
}

export interface BaseStats {
  maxHealth: number;
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
}