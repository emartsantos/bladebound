export interface StatBlock {
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

export type AttackStyle = 'melee' | 'ranged' | 'magic';

export type EnemyCategory = 'normal' | 'elite' | 'rare' | 'boss';

export interface EnemyAbility {
  id: string;
  name: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'stun' | 'dot';
  description: string;
  cooldown: number;
  intensity: number;
  duration?: number;
  chance: number; // 0-1, chance to use each turn
}

export interface EnemyDefinition {
  id: string;
  name: string;
  regionId: string;
  level: number;
  maxHealth: number;
  stats: StatBlock;
  attackStyle: AttackStyle;
  category: EnemyCategory;
  abilities: EnemyAbility[];
  lootTableId: string;
  xpReward: number;
  goldReward: number;
  loreSnippet: string;
  bestiaryMetadata: {
    title: string;
    description: string;
    difficulty: 'easy' | 'normal' | 'hard' | 'deadly';
    recommendedLevel: number | null;
    family: string;
  };
}

export type EncounterResult = 'victory' | 'defeat' | 'retreat';

export interface CombatLogEntry {
  tick: number;
  actor: 'player' | 'enemy' | 'system';
  text: string;
  isCritical?: boolean;
  type?: 'damage' | 'heal' | 'miss' | 'effect' | 'death' | 'loot' | 'xp' | 'food' | 'retreat' | 'info';
}

export interface CombatSummary {
  result: EncounterResult;
  rounds: number;
  damageDealt: number;
  damageTaken: number;
  playerHealthRemaining: number;
  xpGained: number;
  goldGained: number;
  itemsGained: { itemId: string; quantity: number }[];
  log: CombatLogEntry[];
}

export interface CombatParticipant {
  id: string;
  name: string;
  level: number;
  maxHealth: number;
  health: number;
  stats: StatBlock;
  attackStyle: AttackStyle;
  buffs: ActiveBuff[];
  abilityCooldowns: Record<string, number>;
  // Enemy abilities (copied from EnemyDefinition when creating an enemy
  // participant). Players have none.
  abilities?: EnemyAbility[];
  // Effects system (Phase 21)
  effects: import('./effects').ActiveEffect[];
  resistanceProfile: import('./effects').EffectResistanceProfile;
}

export interface ActiveBuff {
  type: string;
  duration: number;
  intensity: number;
  source: 'player' | 'enemy' | 'item' | 'food';
}

export interface CombatEncounter {
  player: CombatParticipant;
  enemy: CombatParticipant;
  round: number;
  log: CombatLogEntry[];
  finished: boolean;
  result: EncounterResult | null;
}

export interface FoodItem {
  itemId: string;
  healAmount: number;
  healPercent?: number; // percentage of max health
  energyRestore?: number;
  levelRequired?: number;
}

export interface DeathPenalty {
  xpLossPercent: number;
  goldLossPercent: number;
  XP_LOSS_PERCENT: number;
  GOLD_LOSS_PERCENT: number;
}

export const DEFAULT_DEATH_PENALTY: DeathPenalty = {
  xpLossPercent: 5,
  goldLossPercent: 10,
  XP_LOSS_PERCENT: 5,
  GOLD_LOSS_PERCENT: 10,
};
