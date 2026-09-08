import { describe, it, expect } from 'vitest';
import {
  createAchievementState,
  processAchievementEvent,
  isAchievementCompleted,
  getTotalPoints,
  getCompletionRatio,
  getCategoryCompletion,
  getCategoryPercentages,
} from '../src/achievement';
import type { AchievementSnapshot } from '../src/achievement';
import type { AchievementDefinition } from '@premium-rpg/shared-types';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENT_POINTS } from '@premium-rpg/game-data';

// ── helpers ──────────────────────────────────────────────────────────

function snapshot(partial: Partial<AchievementSnapshot>): AchievementSnapshot {
  return {
    level: 1,
    totalLevel: 1,
    skillLevel: () => 1,
    bestiaryDefeated: 0,
    bestiaryCompleted: 0,
    bestiaryKillCount: () => 0,
    regionVisitedCount: 0,
    questCompleted: 0,
    collectionEntryCount: 0,
    titleCount: 0,
    playtimeHours: 0,
    ...partial,
  };
}

function def(partial: Partial<AchievementDefinition>): AchievementDefinition {
  return {
    id: 'x',
    name: 'x',
    description: 'x',
    category: 'progression',
    conditions: [],
    reward: { points: 10 },
    ...partial,
  } as AchievementDefinition;
}

describe('state factory', () => {
  it('initializes progress for every definition with zero state', () => {
    const defs = [
      def({ id: 'a' }),
      def({ id: 'b', category: 'combat' }),
      def({ id: 'c', hidden: true, category: 'hidden' }),
    ];
    const state = createAchievementState(defs);
    expect(Object.keys(state.progress)).toHaveLength(3);
    expect(state.totalPoints).toBe(0);
    expect(state.totalCompleted).toBe(0);
    expect(state.counters.kills_total).toBe(0);
  });
});

describe('progression achievements', () => {
  it('awards a level achievement when the threshold is reached and only once', () => {
    const defs = [def({ id: 'lvl10', conditions: [{ metric: 'level', target: 10 }], reward: { points: 10 } })];
    const state = createAchievementState(defs);

    processAchievementEvent(state, defs, snapshot({ level: 5 }), { type: 'enemy_killed', enemyId: 'goblin' }, 1);
    expect(isAchievementCompleted(state, 'lvl10')).toBe(false);

    const r = processAchievementEvent(state, defs, snapshot({ level: 10 }), { type: 'enemy_killed', enemyId: 'goblin' }, 2);
    expect(isAchievementCompleted(state, 'lvl10')).toBe(true);
    expect(r.newlyAwarded).toHaveLength(1);
    expect(r.newlyAwarded[0].points).toBe(10);

    // Subsequent events do not re-award and the total does not inflate.
    const r2 = processAchievementEvent(state, defs, snapshot({ level: 20 }), { type: 'enemy_killed', enemyId: 'goblin' }, 3);
    expect(r2.newlyAwarded).toHaveLength(0);
    expect(getTotalPoints(state)).toBe(10);
  });
});

describe('combat achievements', () => {
  it('accumulates total and elite kills from events', () => {
    const defs = [
      def({ id: 'k100', category: 'combat', conditions: [{ metric: 'kills_total', target: 100 }], reward: { points: 5 } }),
      def({ id: 'elite20', category: 'combat', conditions: [{ metric: 'kills_elite', target: 20 }], reward: { points: 5 } }),
    ];
    const state = createAchievementState(defs);
    for (let i = 0; i < 100; i++) {
      processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'goblin', quantity: 1 }, 1);
    }
    expect(isAchievementCompleted(state, 'k100')).toBe(true);
    expect(isAchievementCompleted(state, 'elite20')).toBe(false);

    for (let i = 0; i < 20; i++) {
      processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'elite_x', isElite: true, quantity: 1 }, 1);
    }
    expect(isAchievementCompleted(state, 'elite20')).toBe(true);
  });
});

describe('boss achievements (live bestiary)', () => {
  it('awards when bestiary records the boss kill', () => {
    const defs = [
      def({ id: 'vlad', category: 'boss', conditions: [{ metric: 'boss', targetId: 'count_vlad', target: 1 }], reward: { points: 20, title: 'Lichbane' } }),
    ];
    const state = createAchievementState(defs);
    const snap = snapshot({ bestiaryKillCount: (id: string) => (id === 'count_vlad' ? 1 : 0) });
    const r = processAchievementEvent(state, defs, snap, { type: 'enemy_killed', enemyId: 'count_vlad' }, 1);
    expect(isAchievementCompleted(state, 'vlad')).toBe(true);
    expect(state.earnedTitles).toContain('Lichbane');
    expect(r.newlyAwarded[0].title).toBe('Lichbane');
  });
});

describe('skill achievements', () => {
  it('reads skill level from the snapshot', () => {
    const defs = [def({ id: 'smith50', category: 'skill', conditions: [{ metric: 'skill', targetId: 'smithing', target: 50 }], reward: { points: 15 } })];
    const state = createAchievementState(defs);
    const snap = snapshot({ skillLevel: (id: string) => (id === 'smithing' ? 50 : 1) });
    processAchievementEvent(state, defs, snap, { type: 'item_crafted', itemId: 'bronze_bar' }, 1);
    expect(isAchievementCompleted(state, 'smith50')).toBe(true);
  });

  it('awards only when ALL multiple conditions are met', () => {
    const defs = [def({
      id: 'all50',
      category: 'skill',
      conditions: [
        { metric: 'skill', targetId: 'smithing', target: 50 },
        { metric: 'skill', targetId: 'cooking', target: 50 },
      ],
      reward: { points: 20 },
    })];
    const state = createAchievementState(defs);
    processAchievementEvent(state, defs, snapshot({ skillLevel: (id: string) => (id === 'smithing' ? 50 : 49) }), { type: 'item_crafted', itemId: 'x' }, 1);
    expect(isAchievementCompleted(state, 'all50')).toBe(false);
    processAchievementEvent(state, defs, snapshot({ skillLevel: () => 50 }), { type: 'item_crafted', itemId: 'x' }, 2);
    expect(isAchievementCompleted(state, 'all50')).toBe(true);
  });
});

describe('economy achievements', () => {
  it('accumulates lifetime gold earned from money_earned events', () => {
    const defs = [def({ id: 'gold10k', category: 'economy', conditions: [{ metric: 'gold_earned_lifetime', target: 10000 }], reward: { points: 10 } })];
    const state = createAchievementState(defs);
    processAchievementEvent(state, defs, snapshot(), { type: 'money_earned', amount: 6000 }, 1);
    expect(isAchievementCompleted(state, 'gold10k')).toBe(false);
    processAchievementEvent(state, defs, snapshot(), { type: 'money_earned', amount: 5000 }, 2);
    expect(isAchievementCompleted(state, 'gold10k')).toBe(true);
  });
});

describe('collection achievements', () => {
  it('tracks per-dungeon completions', () => {
    const defs = [def({ id: 'caverns', category: 'collection', conditions: [{ metric: 'dungeon_specific', targetId: 'darkwood-caverns', target: 3 }], reward: { points: 5 } })];
    const state = createAchievementState(defs);
    for (let i = 0; i < 3; i++) processAchievementEvent(state, defs, snapshot(), { type: 'dungeon_completed', dungeonId: 'darkwood-caverns' }, 1);
    expect(isAchievementCompleted(state, 'caverns')).toBe(true);
  });

  it('counts collection entries and titles from the snapshot', () => {
    const defs = [
      def({ id: 'entries20', category: 'collection', conditions: [{ metric: 'collection_entries', target: 20 }], reward: { points: 5 } }),
      def({ id: 'titles10', category: 'collection', conditions: [{ metric: 'titles_owned', target: 10 }], reward: { points: 5 } }),
    ];
    const state = createAchievementState(defs);
    processAchievementEvent(state, defs, snapshot({ collectionEntryCount: 20, titleCount: 10 }), { type: 'item_collected', itemId: 'x' }, 1);
    expect(isAchievementCompleted(state, 'entries20')).toBe(true);
    expect(isAchievementCompleted(state, 'titles10')).toBe(true);
  });
});

describe('hidden achievements', () => {
  it('still awards hidden achievements when conditions are met', () => {
    const defs = [def({ id: 'secret', hidden: true, category: 'hidden', conditions: [{ metric: 'kills_total', target: 5 }], reward: { points: 25, cosmetic: 'shroud' } })];
    const state = createAchievementState(defs);
    for (let i = 0; i < 5; i++) processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'marsh_wraith' }, 1);
    expect(isAchievementCompleted(state, 'secret')).toBe(true);
    expect(state.earnedCosmetics).toContain('shroud');
  });
});

describe('queries & percentages', () => {
  it('computes overall and per-category completion', () => {
    const defs = [
      def({ id: 'p1', category: 'progression', conditions: [{ metric: 'level', target: 10 }], reward: { points: 1 } }),
      def({ id: 'p2', category: 'progression', conditions: [{ metric: 'level', target: 25 }], reward: { points: 1 } }),
      def({ id: 'c1', category: 'combat', conditions: [{ metric: 'kills_total', target: 100 }], reward: { points: 1 } }),
    ];
    const state = createAchievementState(defs);
    processAchievementEvent(state, defs, snapshot({ level: 10 }), { type: 'enemy_killed' }, 1);
    expect(getCompletionRatio(state, defs)).toBeCloseTo(1 / 3);
    const prog = getCategoryCompletion(state, defs, 'progression');
    expect(prog.completed).toBe(1);
    expect(prog.total).toBe(2);
    expect(getCategoryPercentages(state, defs)['progression']).toBe(50);
    expect(getCategoryPercentages(state, defs)['combat']).toBe(0);
  });
});

describe('progress ratio', () => {
  it('exposes the least-progressed condition ratio', () => {
    const defs = [def({
      id: 'two',
      category: 'combat',
      conditions: [
        { metric: 'kills_total', target: 100 },
        { metric: 'kills_elite', target: 50 },
      ],
      reward: { points: 5 },
    })];
    const state = createAchievementState(defs);
    for (let i = 0; i < 50; i++) processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'goblin' }, 1);
    // kills_total=50/100=0.5, kills_elite=0/50=0 -> ratio should be 0.
    expect(state.progress['two'].current).toBe(0);
    for (let i = 0; i < 25; i++) processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'elite', isElite: true }, 1);
    // ratio min(100/100, 25/50) = 0.5
    expect(state.progress['two'].current).toBeCloseTo(0.5);
    for (let i = 0; i < 25; i++) processAchievementEvent(state, defs, snapshot(), { type: 'enemy_killed', enemyId: 'elite', isElite: true }, 1);
    expect(state.progress['two'].current).toBe(1);
    expect(state.progress['two'].completed).toBe(true);
  });
});

describe('integration with authored game-data database', () => {
  it('drives the full achievement DB through the engine without errors', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30);
    expect(TOTAL_ACHIEVEMENT_POINTS).toBeGreaterThan(0);

    const state = createAchievementState(ACHIEVEMENTS);
    expect(Object.keys(state.progress)).toHaveLength(ACHIEVEMENTS.length);

    // All ids unique.
    expect(new Set(ACHIEVEMENTS.map((x: AchievementDefinition) => x.id)).size).toBe(ACHIEVEMENTS.length);

    // Simulate a veteran player who has progressed widely.
    const snap: AchievementSnapshot = {
      level: 120,
      totalLevel: 600,
      skillLevel: (id: string) => (['mining', 'smithing', 'cooking', 'fletching', 'alchemy'].includes(id) ? 60 : 20),
      bestiaryDefeated: 55,
      bestiaryCompleted: 30,
      bestiaryKillCount: (id: string) =>
        (['forest_troll_king', 'count_vlad', 'ancient_lich', 'frost_giant_king', 'tyrant_of_the_deep', 'arch_demon', 'magma_tyrant', 'the_unmaker'].includes(id) ? 1 : id === 'marsh_wraith' ? 30 : 20),
      regionVisitedCount: 8,
      questCompleted: 25,
      collectionEntryCount: 30,
      titleCount: 15,
      playtimeHours: 150,
    };
    const dungeons = ['darkwood-caverns', 'crumbling-citadel', 'frozen-summit', 'sunken-catacombs', 'citadel-depths', 'molten-core', 'abyssal-throne'];

    processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'enemy_killed', enemyId: 'proke', quantity: 99999 }, 1);
    for (let i = 0; i < 1300; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'enemy_killed', enemyId: 'x', isElite: true }, 1);
    for (let i = 0; i < 1100; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'item_crafted', itemId: 'x' }, 1);
    for (let i = 0; i < 11000; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'item_collected', itemId: 'x' }, 1);
    for (let i = 0; i < 110000; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'resource_gathered', skillId: 'mining' }, 1);
    for (let i = 0; i < 20; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'money_earned', amount: 1000000 }, 1);
    for (const d of dungeons) for (let i = 0; i < 3; i++) processAchievementEvent(state, ACHIEVEMENTS, snap, { type: 'dungeon_completed', dungeonId: d }, 1);

    expect(isAchievementCompleted(state, 'col_dungeon_7')).toBe(true);
    expect(isAchievementCompleted(state, 'boss_unmaker')).toBe(true);
    expect(isAchievementCompleted(state, 'combat_kills_10000')).toBe(true);
    expect(isAchievementCompleted(state, 'econ_gold_1_000_000')).toBe(true);
    expect(isAchievementCompleted(state, 'hidden_shadow_kill')).toBe(true);

    const pct = getCategoryPercentages(state, ACHIEVEMENTS);
    expect(pct['progression']).toBeGreaterThan(0);
    expect(getTotalPoints(state)).toBeGreaterThan(0);
  });
});
