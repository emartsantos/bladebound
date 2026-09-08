import type {
  BestiaryState,
  BestiaryEntry,
  EnemyDefinition,
  ItemDefinition,
  LootTable,
  StatBlock,
} from '@premium-rpg/shared-types';

export function createEmptyBestiary(enemies: EnemyDefinition[]): BestiaryState {
  const entries: Record<string, BestiaryEntry> = {};
  for (const enemy of enemies) {
    entries[enemy.id] = {
      enemyId: enemy.id,
      discovered: false,
      defeated: false,
      killCount: 0,
      firstDefeatedAt: null,
      dropsDiscovered: [],
      completed: false,
    };
  }
  return {
    entries,
    totalDiscovered: 0,
    totalDefeated: 0,
    totalCompleted: 0,
  };
}

export function discoverEnemy(bestiary: BestiaryState, enemyId: string): BestiaryState {
  const entry = bestiary.entries[enemyId];
  if (!entry) return bestiary;
  if (entry.discovered) return bestiary;

  const updated: BestiaryState = {
    ...bestiary,
    entries: {
      ...bestiary.entries,
      [enemyId]: { ...entry, discovered: true },
    },
    totalDiscovered: bestiary.totalDiscovered + 1,
  };
  return updated;
}

export function recordEnemyDefeat(
  bestiary: BestiaryState,
  enemy: EnemyDefinition,
  droppedItemIds: string[],
  lootTables: Record<string, LootTable>,
  itemDefinitions: Record<string, ItemDefinition>,
  now: number = Date.now(),
): BestiaryState {
  const entry = bestiary.entries[enemy.id];
  if (!entry) return bestiary;

  const newDrops = new Set(entry.dropsDiscovered);
  for (const itemId of droppedItemIds) {
    const drop = lootTables[enemy.lootTableId]?.drops.find((d) => d.itemId === itemId);
    if (drop) newDrops.add(itemId);
  }

  const totalDrops = lootTables[enemy.lootTableId]?.drops.filter((d) => !d.guaranteed).length ?? 0;
  const completed = totalDrops > 0 && newDrops.size >= totalDrops;

  const updatedEntry: BestiaryEntry = {
    ...entry,
    defeated: true,
    killCount: entry.killCount + 1,
    firstDefeatedAt: entry.firstDefeatedAt ?? now,
    dropsDiscovered: [...newDrops],
    completed,
  };

  const wasDefeated = entry.defeated;
  const wasCompleted = entry.completed;

  return {
    ...bestiary,
    entries: {
      ...bestiary.entries,
      [enemy.id]: updatedEntry,
    },
    totalDefeated: bestiary.totalDefeated + (wasDefeated ? 0 : 1),
    totalCompleted: bestiary.totalCompleted + (wasCompleted ? 0 : completed ? 1 : 0),
  };
}

export function markEnemyDiscovered(
  bestiary: BestiaryState,
  enemyId: string,
): BestiaryState {
  return discoverEnemy(bestiary, enemyId);
}

export function isBestiaryEntryComplete(entry: BestiaryEntry | undefined): boolean {
  return !!entry?.completed;
}

export function getBestiaryCompletions(bestiary: BestiaryState): string[] {
  return Object.values(bestiary.entries)
    .filter((e) => e.completed)
    .map((e) => e.enemyId);
}

export function getBestiaryProgress(bestiary: BestiaryState): {
  discovered: number;
  defeated: number;
  completed: number;
  total: number;
  percentDiscovered: number;
  percentDefeated: number;
  percentCompleted: number;
} {
  const total = Object.keys(bestiary.entries).length;
  return {
    discovered: bestiary.totalDiscovered,
    defeated: bestiary.totalDefeated,
    completed: bestiary.totalCompleted,
    total,
    percentDiscovered: total === 0 ? 0 : Math.round((bestiary.totalDiscovered / total) * 100),
    percentDefeated: total === 0 ? 0 : Math.round((bestiary.totalDefeated / total) * 100),
    percentCompleted: total === 0 ? 0 : Math.round((bestiary.totalCompleted / total) * 100),
  };
}

export function getRecommendedDifficulty(playerLevel: number, enemy: EnemyDefinition): string {
  const diff = enemy.level - playerLevel;
  if (diff >= 10) return 'Extremely Dangerous';
  if (diff >= 5) return 'Very Dangerous';
  if (diff >= 2) return 'Dangerous';
  if (diff >= -3) return 'Fair';
  return 'Trivial';
}

export function estimateEnemyPower(enemy: EnemyDefinition): {
  total: number;
  stats: StatBlock;
} {
  const stats = enemy.stats;
  const total =
    stats.strength +
    stats.agility +
    stats.intelligence +
    stats.vitality +
    stats.maxHealth / 10 +
    stats.damage +
    stats.defense +
    stats.armor;

  return { total, stats };
}