import { describe, it, expect } from 'vitest';
import {
  createRng,
  simulateFights,
  simulateProgressionAnalytics,
  simulateLootDrop,
  generateBalancingReport,
} from '../src/analytics';
import type {
  FightSimulationConfig,
  ProgressionSimulationConfig,
  LootSimulationConfig,
} from '@premium-rpg/shared-types';

// ─── RNG ────────────────────────────────────────────────────────

describe('createRng', () => {
  it('produces values between 0 and 1', () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('same seed produces same sequence', () => {
    const rng1 = createRng(99);
    const rng2 = createRng(99);
    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    let same = 0;
    for (let i = 0; i < 20; i++) {
      if (rng1() === rng2()) same++;
    }
    expect(same).toBeLessThan(10);
  });
});

// ─── FIGHT SIMULATION ───────────────────────────────────────────

describe('simulateFights', () => {
  const baseConfig: FightSimulationConfig = {
    fightCount: 1000,
    playerLevel: 20,
    useFood: false,
    foodSupply: 0,
    seed: 42,
  };

  it('runs the requested number of fights', () => {
    const result = simulateFights(baseConfig);
    expect(result.totalFights).toBe(1000);
  });

  it('wins + losses = total fights', () => {
    const result = simulateFights(baseConfig);
    expect(result.wins + result.losses).toBe(result.totalFights);
  });

  it('win rate is between 0 and 1', () => {
    const result = simulateFights(baseConfig);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
  });

  it('avg rounds is positive', () => {
    const result = simulateFights(baseConfig);
    expect(result.avgRounds).toBeGreaterThan(0);
  });

  it('gold and xp are non-negative', () => {
    const result = simulateFights(baseConfig);
    expect(result.goldEarned).toBeGreaterThanOrEqual(0);
    expect(result.xpEarned).toBeGreaterThanOrEqual(0);
  });

  it('per-fight averages are consistent', () => {
    const result = simulateFights(baseConfig);
    expect(result.goldPerFight).toBeCloseTo(result.goldEarned / result.totalFights, 5);
    expect(result.xpPerFight).toBeCloseTo(result.xpEarned / result.totalFights, 5);
  });

  it('fight logs are capped at 100', () => {
    const result = simulateFights({ ...baseConfig, fightCount: 500 });
    expect(result.fightLogs.length).toBeLessThanOrEqual(100);
  });

  it('higher level player wins more often', () => {
    const weak = simulateFights({ ...baseConfig, playerLevel: 1, enemyLevel: 50, seed: 10 });
    const strong = simulateFights({ ...baseConfig, playerLevel: 50, enemyLevel: 1, seed: 11 });
    expect(strong.winRate).toBeGreaterThan(weak.winRate);
  });

  it('same seed gives identical results', () => {
    const r1 = simulateFights(baseConfig);
    const r2 = simulateFights(baseConfig);
    expect(r1.wins).toBe(r2.wins);
    expect(r1.goldEarned).toBe(r2.goldEarned);
    expect(r1.xpEarned).toBe(r2.xpEarned);
  });

  it('rounds min/max are valid', () => {
    const result = simulateFights(baseConfig);
    expect(result.roundsPerFight.min).toBeGreaterThan(0);
    expect(result.roundsPerFight.max).toBeGreaterThanOrEqual(result.roundsPerFight.min);
    expect(result.roundsPerFight.avg).toBeGreaterThanOrEqual(result.roundsPerFight.min);
    expect(result.roundsPerFight.avg).toBeLessThanOrEqual(result.roundsPerFight.max);
  });
});

// ─── PROGRESSION SIMULATION ─────────────────────────────────────

describe('simulateProgressionAnalytics', () => {
  const config: ProgressionSimulationConfig = {
    playerCount: 100,
    durationMs: 3600000,
    xpIntervalMs: 1000,
    xpPerGrant: 50,
    startLevel: 1,
    seed: 77,
  };

  it('average final level is positive', () => {
    const result = simulateProgressionAnalytics(config);
    expect(result.avgFinalLevel).toBeGreaterThan(0);
  });

  it('level-ups per hour is positive', () => {
    const result = simulateProgressionAnalytics(config);
    expect(result.levelUpsPerHour).toBeGreaterThan(0);
  });

  it('xp per hour is positive', () => {
    const result = simulateProgressionAnalytics(config);
    expect(result.avgXpPerHour).toBeGreaterThan(0);
  });

  it('same seed gives identical results', () => {
    const r1 = simulateProgressionAnalytics(config);
    const r2 = simulateProgressionAnalytics(config);
    expect(r1.avgFinalLevel).toBe(r2.avgFinalLevel);
    expect(r1.levelUpsPerHour).toBe(r2.levelUpsPerHour);
  });

  it('more players gives smoother distribution', () => {
    const few = simulateProgressionAnalytics({ ...config, playerCount: 10, seed: 1 });
    const many = simulateProgressionAnalytics({ ...config, playerCount: 1000, seed: 2 });
    expect(Object.keys(many.levelDistribution).length).toBeGreaterThanOrEqual(Object.keys(few.levelDistribution).length);
  });
});

// ─── LOOT SIMULATION ────────────────────────────────────────────

describe('simulateLootDrop', () => {
  const config: LootSimulationConfig = {
    rollCount: 10000,
    dropTable: [
      { itemId: 'common_sword', weight: 70, rarity: 'common' },
      { itemId: 'rare_gem', weight: 20, rarity: 'rare' },
      { itemId: 'legendary_blade', weight: 10, rarity: 'legendary' },
    ],
    seed: 55,
  };

  it('total rolls match', () => {
    const result = simulateLootDrop(config);
    expect(result.totalRolls).toBe(10000);
  });

  it('drops are distributed across items', () => {
    const result = simulateLootDrop(config);
    expect(Object.keys(result.dropsByItem).length).toBe(3);
  });

  it('rate deviations are non-negative', () => {
    const result = simulateLootDrop(config);
    for (const dev of result.rateDeviations) {
      expect(dev.deviation).toBeGreaterThanOrEqual(0);
    }
  });

  it('actual rates sum close to 1', () => {
    const result = simulateLootDrop(config);
    const totalActual = result.rateDeviations.reduce((s, d) => s + d.actual, 0);
    expect(totalActual).toBeCloseTo(1, 2);
  });

  it('common items drop most frequently', () => {
    const result = simulateLootDrop(config);
    expect(result.dropsByItem['common_sword']).toBeGreaterThan(result.dropsByItem['rare_gem']);
    expect(result.dropsByItem['rare_gem']).toBeGreaterThan(result.dropsByItem['legendary_blade']);
  });

  it('same seed is deterministic', () => {
    const r1 = simulateLootDrop(config);
    const r2 = simulateLootDrop(config);
    expect(r1.dropsByItem).toEqual(r2.dropsByItem);
  });
});

// ─── BALANCING REPORT ───────────────────────────────────────────

describe('generateBalancingReport', () => {
  const report = generateBalancingReport({
    progressionResult: {
      avgFinalLevel: 25,
      levelDistribution: { 25: 50, 26: 50 },
      avgTimeToLevel: { 1: 60000 },
      levelUpsPerHour: 10,
      avgXpPerHour: 5000,
    },
    combatResult: simulateFights({ fightCount: 500, playerLevel: 20, useFood: false, foodSupply: 0, seed: 1 }),
    lootResult: simulateLootDrop({
      rollCount: 500,
      dropTable: [
        { itemId: 'sword', weight: 80, rarity: 'common' },
        { itemId: 'gem', weight: 20, rarity: 'rare' },
      ],
      seed: 2,
    }),
    sampleSize: 100,
    simulationDuration: 3600000,
  });

  it('has a generated timestamp', () => {
    expect(report.generatedAt).toBeGreaterThan(0);
  });

  it('sample size matches', () => {
    expect(report.sampleSize).toBe(100);
  });

  it('combat metrics populated', () => {
    expect(report.combat.totalEncounters).toBe(500);
    expect(report.combat.winRate).toBeGreaterThanOrEqual(0);
    expect(report.combat.winRate).toBeLessThanOrEqual(1);
  });

  it('loot metrics populated', () => {
    expect(report.loot.totalDrops).toBe(500);
  });

  it('economy metrics populated', () => {
    expect(report.economy.totalGoldEarned).toBeGreaterThanOrEqual(0);
  });

  it('progression metrics populated', () => {
    expect(report.progression.xpPerHour).toBeGreaterThan(0);
  });

  it('warnings array exists', () => {
    expect(Array.isArray(report.warnings)).toBe(true);
  });

  it('warns on extreme win rate', () => {
    const extremeReport = generateBalancingReport({
      progressionResult: {
        avgFinalLevel: 10,
        levelDistribution: { 10: 100 },
        avgTimeToLevel: {},
        levelUpsPerHour: 5,
        avgXpPerHour: 1000,
      },
      combatResult: simulateFights({ fightCount: 200, playerLevel: 1, enemyLevel: 50, seed: 99 }),
      lootResult: simulateLootDrop({ rollCount: 200, dropTable: [{ itemId: 'x', weight: 1, rarity: 'common' }], seed: 1 }),
      sampleSize: 50,
      simulationDuration: 1800000,
    });
    const wrWarnings = extremeReport.warnings.filter((w) => w.metric === 'winRate');
    expect(wrWarnings.length).toBeGreaterThan(0);
  });
});
