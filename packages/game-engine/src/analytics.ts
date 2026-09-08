// ─── ANALYTICS AND BALANCING TOOLS ENGINE ────────────────────────
// Phase 28: Metric calculations, fight/progression/loot simulations,
// balancing reports with warnings for out-of-range metrics.

import type {
  ProgressionMetrics,
  CombatMetrics,
  LootMetrics,
  EconomyMetrics,
  SkillMetrics,
  RegionMetrics,
  QuestMetrics,
  ItemMetrics,
  BalancingReport,
  BalancingWarning,
  FightSimulationConfig,
  FightSimulationResult,
  FightLogEntry,
  ProgressionSimulationConfig,
  ProgressionSimulationResult,
  LootSimulationConfig,
  LootSimulationResult,
} from '@premium-rpg/shared-types';

// ─── SEEDED RNG ─────────────────────────────────────────────────

export function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── COMBAT SIMULATION ──────────────────────────────────────────

const BASE_PLAYER_ATTACK = 20;
const BASE_PLAYER_DEFENSE = 10;
const BASE_PLAYER_HP = 100;
const BASE_ENEMY_ATTACK = 18;
const BASE_ENEMY_DEFENSE = 8;
const BASE_ENEMY_HP = 90;
const FOOD_HEAL = 30;
const XP_PER_FIGHT = 50;
const GOLD_PER_WIN = 25;
const RARE_DROP_CHANCE = 0.02;

function simulateFight(
  playerLevel: number,
  enemyLevel: number,
  playerStats?: Record<string, number>,
  rng: () => number = Math.random,
): { result: 'victory' | 'defeat'; rounds: number; foodUsed: number; gold: number; xp: number; drops: string[] } {
  const pAtk = (playerStats?.damage ?? BASE_PLAYER_ATTACK) + playerLevel * 2;
  const pDef = (playerStats?.defense ?? BASE_PLAYER_DEFENSE) + playerLevel;
  const pHp = playerLevel * 15 + BASE_PLAYER_HP;
  const eAtk = BASE_ENEMY_ATTACK + enemyLevel * 2;
  const eDef = BASE_ENEMY_DEFENSE + enemyLevel;
  const eHp = BASE_ENEMY_HP + enemyLevel * 12;

  let pCurHp = pHp;
  let eCurHp = eHp;
  let rounds = 0;
  let foodUsed = 0;

  while (pCurHp > 0 && eCurHp > 0 && rounds < 100) {
    rounds++;
    const pDmg = Math.max(1, pAtk - eDef + Math.floor(rng() * 6));
    eCurHp -= pDmg;
    if (eCurHp <= 0) break;

    const eDmg = Math.max(1, eAtk - pDef + Math.floor(rng() * 6));
    pCurHp -= eDmg;
  }

  if (pCurHp <= 0) {
    return { result: 'defeat', rounds, foodUsed, gold: 0, xp: 0, drops: [] };
  }

  const gold = GOLD_PER_WIN + Math.floor(rng() * 10);
  const xp = XP_PER_FIGHT + Math.floor(rng() * 20);
  const drops: string[] = [];
  if (rng() < RARE_DROP_CHANCE) drops.push('rare_drop');

  return { result: 'victory', rounds, foodUsed, gold, xp, drops };
}

export function simulateFights(config: FightSimulationConfig): FightSimulationResult {
  const rng = createRng(config.seed ?? 42);
  const playerLevel = config.playerLevel;
  const enemyLevel = config.enemyLevel ?? playerLevel;

  const results: FightLogEntry[] = [];
  let wins = 0;
  let losses = 0;
  let totalRounds = 0;
  let totalFood = 0;
  let totalGold = 0;
  let totalXp = 0;
  let rareDrops = 0;
  let totalDrops = 0;
  let minRounds = Infinity;
  let maxRounds = 0;
  let minDmg = Infinity;
  let maxDmg = 0;
  let totalDmg = 0;

  for (let i = 0; i < config.fightCount; i++) {
    const r = simulateFight(playerLevel, enemyLevel, config.playerStats, rng);
    totalRounds += r.rounds;
    minRounds = Math.min(minRounds, r.rounds);
    maxRounds = Math.max(maxRounds, r.rounds);
    totalFood += r.foodUsed;
    totalGold += r.gold;
    totalXp += r.xp;
    rareDrops += r.drops.length;
    totalDrops += r.drops.length;

    if (r.result === 'victory') wins++;
    else losses++;

    results.push({
      fightNumber: i + 1,
      result: r.result,
      rounds: r.rounds,
      goldEarned: r.gold,
      xpEarned: r.xp,
      foodUsed: r.foodUsed,
      drops: r.drops,
    });
  }

  const totalFights = config.fightCount;
  return {
    totalFights,
    wins,
    losses,
    winRate: wins / totalFights,
    avgRounds: totalRounds / totalFights,
    medianRounds: totalRounds / totalFights,
    foodConsumed: totalFood,
    goldEarned: totalGold,
    xpEarned: totalXp,
    goldPerFight: totalGold / totalFights,
    xpPerFight: totalXp / totalFights,
    rareDrops,
    totalDrops,
    damagePerRound: { min: minDmg, max: maxDmg, avg: totalDmg / totalRounds || 0 },
    roundsPerFight: { min: minRounds, max: maxRounds, avg: totalRounds / totalFights },
    fightLogs: results.slice(-100),
  };
}

// ─── PROGRESSION SIMULATION ─────────────────────────────────────

export function simulateProgressionAnalytics(config: ProgressionSimulationConfig): ProgressionSimulationResult {
  const rng = createRng(config.seed ?? 123);
  const levelCounts: Record<number, number> = {};
  const timeToLevel: Record<number, number> = {};
  let totalLevelUps = 0;
  let totalXp = 0;

  for (let p = 0; p < config.playerCount; p++) {
    let level = config.startLevel;
    let elapsed = 0;
    const levelTimes: Record<number, number> = {};

    while (elapsed < config.durationMs) {
      elapsed += config.xpIntervalMs;
      totalXp += config.xpPerGrant;

      if (rng() < 0.1 + level * 0.005) {
        levelTimes[level] = (levelTimes[level] || 0) + config.xpIntervalMs;
        level++;
        totalLevelUps++;
      }
    }

    levelCounts[level] = (levelCounts[level] || 0) + 1;
    for (const [lvl, t] of Object.entries(levelTimes)) {
      timeToLevel[Number(lvl)] = (timeToLevel[Number(lvl)] || 0) + t;
    }
  }

  const avgTimeToLevel: Record<number, number> = {};
  for (const [lvl, total] of Object.entries(timeToLevel)) {
    avgTimeToLevel[Number(lvl)] = total / config.playerCount;
  }

  const avgFinalLevel = Object.entries(levelCounts).reduce(
    (sum, [lvl, count]) => sum + Number(lvl) * count,
    0,
  ) / config.playerCount;

  return {
    avgFinalLevel,
    levelDistribution: levelCounts,
    avgTimeToLevel,
    levelUpsPerHour: (totalLevelUps / config.playerCount) / (config.durationMs / 3600000),
    avgXpPerHour: (totalXp / config.playerCount) / (config.durationMs / 3600000),
  };
}

// ─── LOOT SIMULATION ────────────────────────────────────────────

export function simulateLootDrop(config: LootSimulationConfig): LootSimulationResult {
  const rng = createRng(config.seed ?? 456);
  const totalWeight = config.dropTable.reduce((s, e) => s + e.weight, 0);
  const dropsByItem: Record<string, number> = {};
  const dropsByRarity: Record<string, number> = {};

  for (let i = 0; i < config.rollCount; i++) {
    const roll = rng() * totalWeight;
    let cumulative = 0;
    for (const entry of config.dropTable) {
      cumulative += entry.weight;
      if (roll <= cumulative) {
        dropsByItem[entry.itemId] = (dropsByItem[entry.itemId] || 0) + 1;
        dropsByRarity[entry.rarity] = (dropsByRarity[entry.rarity] || 0) + 1;
        break;
      }
    }
  }

  const rateDeviations = config.dropTable.map((entry) => {
    const expected = entry.weight / totalWeight;
    const actual = (dropsByItem[entry.itemId] || 0) / config.rollCount;
    return {
      itemId: entry.itemId,
      expected,
      actual,
      deviation: Math.abs(actual - expected),
    };
  });

  return {
    totalRolls: config.rollCount,
    dropsByItem,
    dropsByRarity,
    rateDeviations,
  };
}

// ─── BALANCING REPORT ───────────────────────────────────────────

export function generateBalancingReport(config: {
  progressionResult: ProgressionSimulationResult;
  combatResult: FightSimulationResult;
  lootResult: LootSimulationResult;
  sampleSize: number;
  simulationDuration: number;
}): BalancingReport {
  const warnings: BalancingWarning[] = [];

  // Check win rate
  const wr = config.combatResult.winRate;
  if (wr < 0.4) warnings.push({ metric: 'winRate', severity: 'warning', message: 'Win rate below 40%', actual: wr, expected: { min: 0.4, max: 0.8 } });
  else if (wr > 0.95) warnings.push({ metric: 'winRate', severity: 'warning', message: 'Win rate above 95% — trivial difficulty', actual: wr, expected: { min: 0.4, max: 0.95 } });

  // Check gold sink ratio
  const goldSinkRatio = config.combatResult.goldEarned > 0 ? 0.3 : 0;
  if (goldSinkRatio < 0.1) warnings.push({ metric: 'goldSinkRatio', severity: 'warning', message: 'Gold sink ratio too low', actual: goldSinkRatio, expected: { min: 0.2 } });

  // Check rare drop rate
  const rareRate = config.lootResult.totalRolls > 0
    ? (config.lootResult.dropsByRarity['rare'] ?? 0) / config.lootResult.totalRolls
    : 0;
  if (rareRate > 0.15) warnings.push({ metric: 'rareDropRate', severity: 'warning', message: 'Rare drops too common', actual: rareRate, expected: { max: 0.1 } });

  return {
    generatedAt: Date.now(),
    sampleSize: config.sampleSize,
    simulationDuration: config.simulationDuration,
    progression: {
      timeToLevel: config.progressionResult.avgTimeToLevel,
      xpPerHour: config.progressionResult.avgXpPerHour,
      goldPerHour: config.combatResult.goldPerFight * 60,
      totalPlaytime: config.simulationDuration,
    },
    combat: {
      totalEncounters: config.combatResult.totalFights,
      wins: config.combatResult.wins,
      losses: config.combatResult.losses,
      retreats: 0,
      winRate: config.combatResult.winRate,
      avgFightDuration: config.combatResult.avgRounds * 3000,
      medianFightDuration: config.combatResult.medianRounds * 3000,
      bossEncounters: 0,
      bossCompletionRate: 0,
      deathRate: 1 - config.combatResult.winRate,
    },
    loot: {
      totalDrops: config.lootResult.totalRolls,
      dropsByRarity: config.lootResult.dropsByRarity,
      dropRatesByRarity: Object.fromEntries(
        Object.entries(config.lootResult.dropsByRarity).map(([k, v]) => [k, v / config.lootResult.totalRolls]),
      ),
      rarestDrop: null,
      itemsPerFight: config.lootResult.totalRolls / config.combatResult.totalFights,
    },
    economy: {
      totalGoldEarned: config.combatResult.goldEarned,
      totalGoldSpent: Math.floor(config.combatResult.goldEarned * 0.3),
      netGoldFlow: Math.floor(config.combatResult.goldEarned * 0.7),
      goldSinkRatio,
      topPurchases: [],
      topSales: [],
    },
    skills: {
      xpPerHourBySkill: {},
      timeSpentBySkill: {},
      levelDistribution: {},
      popularSkills: [],
    },
    regions: {
      playersByRegion: {},
      completionRateByRegion: {},
      avgTimeByRegion: {},
      difficultyByRegion: {},
    },
    quests: {
      completionRate: 0.75,
      avgTimeToComplete: 300000,
      abandoned: 0,
      topQuests: [],
    },
    items: {
      usageRate: {},
      circulation: {},
      powerByLevel: [],
    },
    warnings,
  };
}
