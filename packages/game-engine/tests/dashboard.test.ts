import { describe, it, expect } from 'vitest';
import { buildDashboardPanel, formatDuration } from '../src/dashboard';
import { MINING_NODES } from '../src/progression/gathering';
import type { DashboardContextInput } from '@premium-rpg/shared-types';

const SECS = 1000;
const MINS = 60 * SECS;

function baseInput(overrides: Partial<DashboardContextInput> = {}): DashboardContextInput {
  return {
    activity: 'gathering',
    player: {
      level: 10,
      experience: 5000,
      currentRegionId: 'starter-frontier',
      health: 80,
      maxHealth: 100,
      attackStyle: 'melee',
      attackSpeedMs: 2000,
    },
    skills: { mining: 200, woodcutting: 50, fishing: 10 },
    ...overrides,
  };
}

// ── formatDuration ────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats sub-second as ms', () => {
    expect(formatDuration(500)).toBe('500ms');
  });
  it('formats seconds', () => {
    expect(formatDuration(3000)).toBe('3s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });
  it('formats exact minutes', () => {
    expect(formatDuration(120000)).toBe('2m');
  });
});

// ── Gathering panel ────────────────────────────────────────────────

describe('gathering panel', () => {
  it('produces empty state when no active gathering', () => {
    const result = buildDashboardPanel(baseInput());
    expect(result.activity).toBe('gathering');
    expect(result.activeNode).toBeNull();
    expect(result.timePerActionMs).toBe(0);
    expect(result.xpPerHour).toBe(0);
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions[0].question).toContain('What');
    expect(result.questions[0].tone).toBe('warning');
  });

  it('computes correct rates for copper vein (no tool)', () => {
    const node = MINING_NODES.find((n) => n.id === 'copper_vein')!;
    const result = buildDashboardPanel(baseInput({
      activeGathering: {
        nodeId: 'copper_vein',
        nodeName: node.name,
        skill: 'mining',
        baseDurationMs: node.baseDuration,
        baseXp: node.baseXp,
        resources: node.resources.map((r) => ({
          itemId: r.itemId,
          name: r.name,
          minQuantity: r.minQuantity,
          maxQuantity: r.maxQuantity,
          chance: r.chance,
          rare: r.rare,
        })),
      },
    }));
    expect(result.activeNode?.id).toBe('copper_vein');
    expect(result.timePerActionMs).toBe(node.baseDuration);
    expect(result.xpPerAction).toBe(node.baseXp);
    expect(result.xpPerHour).toBeGreaterThan(0);
    expect(result.toolBonus).toBeNull();
    expect(result.resourceRates.length).toBeGreaterThan(0);
    expect(result.resourceRates.some((r) => r.itemId === 'copper_ore')).toBe(true);
  });

  it('applies tool speed multiplier', () => {
    const node = MINING_NODES.find((n) => n.id === 'copper_vein')!;
    const result = buildDashboardPanel(baseInput({
      activeGathering: {
        nodeId: 'copper_vein',
        nodeName: node.name,
        skill: 'mining',
        baseDurationMs: node.baseDuration,
        baseXp: node.baseXp,
        toolId: 'steel_pickaxe',
        toolBonus: { speedMultiplier: 1.5, xpBonus: 5, extraResourceChance: 0.1 },
        resources: node.resources.map((r) => ({
          itemId: r.itemId, name: r.name, minQuantity: r.minQuantity,
          maxQuantity: r.maxQuantity, chance: r.chance, rare: r.rare,
        })),
      },
    }));
    expect(result.timePerActionMs).toBe(Math.round(node.baseDuration / 1.5));
    expect(result.xpPerAction).toBe(node.baseXp + 5);
    expect(result.toolBonus).not.toBeNull();
    expect(result.toolBonus!.toolId).toBe('steel_pickaxe');
    expect(result.toolBonus!.speedMultiplier).toBe(1.5);
  });

  it('reports next unlock when available', () => {
    const result = buildDashboardPanel(baseInput({
      skills: { mining: 200 },
      nextGatheringNode: { name: 'Gold Vein', requiredLevel: 15, xpToUnlock: 500 },
    }));
    expect(result.nextUnlock).not.toBeNull();
    expect(result.nextUnlock!.target).toBe('Gold Vein');
    expect(result.nextUnlock!.requiredLevel).toBe(15);
  });

  it('indicates unlock already available', () => {
    const result = buildDashboardPanel(baseInput({
      skills: { mining: 10000 },
      nextGatheringNode: { name: 'Iron Vein', requiredLevel: 1, xpToUnlock: 0 },
    }));
    const q = result.questions.find((q) => q.question.includes('unlock'));
    expect(q).toBeDefined();
    expect(q!.progress).toBe(1);
    expect(q!.tone).toBe('good');
  });

  it('computes correct unlock progress', () => {
    const result = buildDashboardPanel(baseInput({
      skills: { mining: 300 },
      nextGatheringNode: { name: 'Iron Vein', requiredLevel: 20, xpToUnlock: 1000 },
    }));
    const unlockQ = result.questions.find((q) => q.question.includes('unlock'));
    expect(unlockQ?.progress).toBeGreaterThan(0);
    expect(unlockQ?.progress).toBeLessThan(1);
  });
});

// ── Combat panel ──────────────────────────────────────────────────

describe('combat panel', () => {
  it('produces idle state when no combat', () => {
    const result = buildDashboardPanel(baseInput({ activity: 'combat' }));
    expect(result.activity).toBe('combat');
    expect(result.combat).toBeNull();
    expect(result.questions.some((q) => q.primary.includes('No active combat'))).toBe(true);
  });

  it('shows combat data when fighting', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'combat',
      combat: {
        enemyName: 'Goblin',
        playerHp: 80,
        playerMaxHp: 100,
        enemyHp: 30,
        enemyMaxHp: 60,
        attackTimerMs: 500,
        enemyAttackTimerMs: 1000,
        buffs: [{ name: 'Accuracy Boost', stacks: 1, duration: 5 }],
        food: { name: 'Bread', quantity: 5, healAmount: 20 },
        log: ['You hit the goblin for 12 damage.', 'Goblin misses you.'],
      },
    }));
    expect(result.combat).not.toBeNull();
    expect(result.combat!.enemyName).toBe('Goblin');
    expect(result.combat!.playerHp).toBe(80);
    expect(result.combat!.buffs.length).toBe(1);
    expect(result.combat!.food?.name).toBe('Bread');
    const hpQ = result.questions.find((q) => q.question.includes('healthy am I'));
    expect(hpQ).toBeDefined();
    expect(hpQ!.progress).toBe(0.8);
    const foodQ = result.questions.find((q) => q.question.includes('food'));
    expect(foodQ).toBeDefined();
    expect(foodQ!.primary).toContain('Bread');
  });

  it('shows recommended enemy when not fighting', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'combat',
      recommendedEnemy: {
        enemyName: 'Werewolf',
        regionId: 'darkwood-forest',
        recommendedLevel: 12,
        bestLoot: 'Vampire Fang',
      },
    }));
    expect(result.recommended).not.toBeNull();
    expect(result.recommended!.enemyName).toBe('Werewolf');
    const recQ = result.questions.find((q) => q.question.includes('fight next'));
    expect(recQ).toBeDefined();
    expect(recQ!.primary).toBe('Werewolf');
  });

  it('warns when underleveled for recommended enemy', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'combat',
      player: {
        level: 5,
        experience: 500,
        currentRegionId: 'starter-frontier',
        health: 100,
        maxHealth: 100,
        attackStyle: 'melee',
        attackSpeedMs: 2000,
      },
      recommendedEnemy: {
        enemyName: 'Ancient Lich',
        regionId: 'ruined-province',
        recommendedLevel: 15,
        bestLoot: 'Lich Philactery',
      },
    }));
    const recQ = result.questions.find((q) => q.question.includes('fight next'));
    expect(recQ?.tone).toBe('warning');
  });

  it('warns about low food supply', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'combat',
      combat: {
        enemyName: 'Zombie',
        playerHp: 50,
        playerMaxHp: 100,
        enemyHp: 40,
        enemyMaxHp: 80,
        attackTimerMs: 300,
        enemyAttackTimerMs: 800,
        buffs: [],
        food: { name: 'Bread', quantity: 1, healAmount: 20 },
        log: [],
      },
    }));
    const foodQ = result.questions.find((q) => q.question.includes('food'));
    expect(foodQ?.tone).toBe('warning');
  });
});

// ── Crafting panel ────────────────────────────────────────────────

describe('crafting panel', () => {
  it('produces idle state when no active recipe', () => {
    const result = buildDashboardPanel(baseInput({ activity: 'crafting' }));
    expect(result.activity).toBe('crafting');
    expect(result.activeRecipe).toBeNull();
    expect(result.xpPerHour).toBe(0);
    expect(result.questions.some((q) => q.primary.includes('No active recipe'))).toBe(true);
  });

  it('computes rates for active crafting recipe', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'crafting',
      activeCrafting: {
        recipeId: 'bronze_sword',
        recipeName: 'Bronze Sword',
        skill: 'smithing',
        durationMs: 6000,
        xp: 50,
      },
    }));
    expect(result.activeRecipe!.id).toBe('bronze_sword');
    expect(result.xpPerHour).toBeGreaterThan(0);
    expect(result.questions.some((q) => q.question.includes('What am I crafting'))).toBe(true);
  });

  it('reports queue count', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'crafting',
      activeCrafting: {
        recipeId: 'iron_sword',
        recipeName: 'Iron Sword',
        skill: 'smithing',
        durationMs: 8000,
        xp: 80,
      },
      craftingQueueLength: 5,
    }));
    expect(result.queueLength).toBe(5);
    const q = result.questions.find((q) => q.question.includes('How many in queue'));
    expect(q).toBeDefined();
    expect(q!.primary).toBe('5');
  });

  it('reports total XP from queue', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'crafting',
      activeCrafting: {
        recipeId: 'iron_sword',
        recipeName: 'Iron Sword',
        skill: 'smithing',
        durationMs: 8000,
        xp: 100,
      },
      craftingQueueLength: 9,
    }));
    const q = result.questions.find((q) => q.question.includes('Total XP'));
    expect(q).toBeDefined();
    expect(q!.primary).toBe('1,000 XP');
  });

  it('reports next recipe unlock', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'crafting',
      nextRecipe: { name: 'Steel Sword', levelRequired: 20 },
    }));
    const q = result.questions.find((q) => q.question.includes('recipe unlocks'));
    expect(q).toBeDefined();
    expect(q!.primary).toBe('Steel Sword');
  });
});

// ── Data integrity ────────────────────────────────────────────────

describe('dashboard data integrity', () => {
  it('every question has a non-empty primary', () => {
    const inputs: DashboardContextInput[] = [
      baseInput(),
      baseInput({ activity: 'combat' }),
      baseInput({ activity: 'crafting' }),
      baseInput({
        activeGathering: {
          nodeId: 'copper_vein', nodeName: 'Copper Vein', skill: 'mining',
          baseDurationMs: 4000, baseXp: 15,
          resources: [{ itemId: 'copper_ore', name: 'Copper Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 }],
        },
      }),
    ];
    for (const input of inputs) {
      const panel = buildDashboardPanel(input);
      for (const q of panel.questions) {
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.primary.length).toBeGreaterThan(0);
      }
    }
  });

  it('resource rates are non-negative', () => {
    const result = buildDashboardPanel(baseInput({
      activeGathering: {
        nodeId: 'iron_vein', nodeName: 'Iron Vein', skill: 'mining',
        baseDurationMs: 6000, baseXp: 40,
        resources: [
          { itemId: 'iron_ore', name: 'Iron Ore', minQuantity: 1, maxQuantity: 3, chance: 1.0 },
          { itemId: 'gold_ore', name: 'Gold Ore', minQuantity: 1, maxQuantity: 1, chance: 0.03, rare: true },
        ],
      },
    }));
    for (const r of result.resourceRates) {
      expect(r.perHour).toBeGreaterThanOrEqual(0);
    }
  });

  it('combat health progress is between 0 and 1', () => {
    const result = buildDashboardPanel(baseInput({
      activity: 'combat',
      combat: {
        enemyName: 'Wolf', playerHp: 30, playerMaxHp: 100,
        enemyHp: 50, enemyMaxHp: 80,
        attackTimerMs: 1000, enemyAttackTimerMs: 1500,
        buffs: [], food: null, log: [],
      },
    }));
    const hpQ = result.questions.find((q) => q.question.includes('healthy am I'));
    expect(hpQ!.progress).toBeGreaterThanOrEqual(0);
    expect(hpQ!.progress).toBeLessThanOrEqual(1);
  });
});
