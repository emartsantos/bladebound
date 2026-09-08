export interface BestiaryEntry {
  enemyId: string;
  discovered: boolean;
  defeated: boolean;
  killCount: number;
  firstDefeatedAt: number | null;
  dropsDiscovered: string[];
  completed: boolean;
}

export interface BestiaryState {
  entries: Record<string, BestiaryEntry>;
  totalDiscovered: number;
  totalDefeated: number;
  totalCompleted: number;
}

export interface BestiaryCompletionReward {
  enemyId: string;
  xp: number;
  gold: number;
  titleUnlock: string | null;
}

export interface LootDrop {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
  guaranteed: boolean;
}

export interface LootTable {
  id: string;
  name: string;
  drops: LootDrop[];
}

export interface EnemyScaling {
  levelMultiplier: number;
  healthMultiplier: number;
  damageMultiplier: number;
  xpMultiplier: number;
}

export interface RegionEnemyPool {
  regionId: string;
  normalEnemies: string[];
  eliteEnemies: string[];
  rareEnemies: string[];
  bossEnemy: string | null;
  scaling: EnemyScaling;
}
