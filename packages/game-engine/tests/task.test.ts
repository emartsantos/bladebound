import { describe, it, expect } from 'vitest';
import {
  createTaskState,
  dailyKey,
  weeklyKey,
  ensureCurrentTasks,
  getCurrentTasks,
  processTaskEvent,
  isAssignmentCompletable,
  claimTask,
  bankExpiredCompletions,
  claimCatchUp,
  getActiveTaskSummaries,
} from '../src/task';
import type {
  TaskAssignment,
  TaskDefinition,
  TaskObjectiveType,
  TaskSeedingOptions,
} from '@premium-rpg/shared-types';

function task(id: string, group: 'daily' | 'weekly', levelRequirement: number | undefined, objectiveType: TaskDefinition['objective']['type'], required: number, targetId?: string): TaskDefinition {
  return {
    id, name: id, group,
    kind: group === 'daily' ? 'daily' : 'weekly',
    description: id,
    levelRequirement,
    objective: { type: objectiveType, required, targetId },
    reward: { experience: 100, gold: 50 },
    weight: 1,
  } as TaskDefinition;
}

function makeAssignment(partial: {
  taskId: string;
  objectiveType: TaskObjectiveType;
  objectiveTarget: string | null;
  required: number;
  group?: 'daily' | 'weekly';
  regionId?: string | null;
  skillId?: string | null;
}): TaskAssignment {
  return {
    taskId: partial.taskId,
    group: partial.group ?? 'daily',
    objectiveType: partial.objectiveType,
    objectiveTarget: partial.objectiveTarget,
    skillId: partial.skillId ?? null,
    regionId: partial.regionId ?? null,
    required: partial.required,
    current: 0,
    completed: false,
    claimed: false,
    assignedAt: 0,
  };
}

const POOL: TaskDefinition[] = [
  task('d_a', 'daily', 1, 'kill', 10, 'goblin'),
  task('d_b', 'daily', 1, 'kill', 8, 'wolf'),
  task('d_c', 'daily', 1, 'gather', 12, 'copper_ore'),
  task('d_d', 'daily', 1, 'craft', 3, 'bronze_bar'),
  task('d_e', 'daily', 5, 'kill', 6, 'darkwood_spider'), // level gated
  task('w_a', 'weekly', 1, 'complete_dungeon', 1, 'darkwood-caverns'),
  task('w_b', 'weekly', 1, 'kill', 1, 'count_vlad'),
];

const SEL: TaskSeedingOptions = { dailyCount: 3, weeklyCount: 1 };

function rewardFor(id: string): TaskDefinition['reward'] {
  const found = POOL.find((p) => p.id === id);
  return found ? found.reward : { experience: 0, gold: 0 };
}

describe('cycle keys', () => {
  it('produces stable daily keys', () => {
    expect(dailyKey(new Date(2026, 8, 3))).toBe('D-2026-09-03');
    expect(dailyKey(new Date(2026, 8, 3))).toBe(dailyKey(new Date(2026, 8, 3)));
  });

  it('produces weekly keys', () => {
    expect(weeklyKey(new Date(2026, 8, 3))).toMatch(/^W-\d{4}-\d{2}$/);
  });
});

describe('selection', () => {
  it('seeds today deterministically and idempotently', () => {
    const state = createTaskState();
    const today = new Date(2026, 8, 3, 15, 0);
    const a = ensureCurrentTasks(state, POOL, SEL, today, 1);
    expect(a.daily).toHaveLength(3);
    expect(a.weekly).toHaveLength(1);

    const b = ensureCurrentTasks(state, POOL, SEL, today, 1);
    expect(b.daily).toHaveLength(3);
    expect(b.daily.map((x) => x.taskId).sort()).toEqual(a.daily.map((x) => x.taskId).sort());
    expect(state.daily[dailyKey(today)]).toHaveLength(3);
  });

  it('reproduces the same day assignment across independent states', () => {
    const s1 = createTaskState();
    const s2 = createTaskState();
    const today = new Date(2026, 8, 3, 15, 0);
    const r1 = ensureCurrentTasks(s1, POOL, SEL, today, 1);
    const r2 = ensureCurrentTasks(s2, POOL, SEL, today, 1);
    expect(r1.daily.map((x) => x.taskId).sort()).toEqual(r2.daily.map((x) => x.taskId).sort());
    expect(r1.weekly.map((x) => x.taskId)).toEqual(r2.weekly.map((x) => x.taskId));
  });

  it('gates daily selection by player level', () => {
    const state = createTaskState();
    const today = new Date(2026, 8, 3);
    const low = ensureCurrentTasks(state, POOL, SEL, today, 1);
    expect(low.daily.map((x) => x.taskId)).not.toContain('d_e');
    // At a higher level, the gated task becomes eligible in some cycle.
    const highState = createTaskState();
    let seen = false;
    for (let d = 1; d <= 14; d++) {
      const r = ensureCurrentTasks(highState, POOL, SEL, new Date(2026, 8, d), 10);
      if (r.daily.some((x) => x.taskId === 'd_e')) seen = true;
    }
    expect(seen).toBe(true);
  });
});

describe('progress & completion', () => {
  it('advances a kill assignment and completes it', () => {
    const state = createTaskState();
    const today = new Date(2026, 8, 3);
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    for (let i = 0; i < 10; i++) {
      const r = processTaskEvent(state, today, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' });
      expect(r.changed).toContain(goblin);
    }
    expect(goblin.current).toBe(10);
    expect(goblin.completed).toBe(true);
    expect(isAssignmentCompletable(goblin)).toBe(true);
  });

  it('only advances matching objectives', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    processTaskEvent(state, today, { type: 'enemy_killed', enemyId: 'alpha_wolf', regionId: 'starter-frontier' });
    expect(goblin.current).toBe(0);
  });

  it('captures newly completed assignments', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    const r = processTaskEvent(state, today, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier', quantity: 10 });
    expect(r.newlyCompleted).toContain(goblin);
  });

  it('handles gather, craft, collect and dungeon objective events', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const craft = makeAssignment({ taskId: 'd_d', objectiveType: 'craft', objectiveTarget: 'bronze_bar', required: 3 });
    const mine = makeAssignment({ taskId: 'd_c', objectiveType: 'gather', objectiveTarget: 'copper_ore', required: 12, skillId: 'mining' });
    const dungeon = makeAssignment({ taskId: 'w_a', objectiveType: 'complete_dungeon', objectiveTarget: 'darkwood-caverns', required: 1, group: 'weekly' });
    state.daily[dailyKey(today)] = [craft, mine];
    state.weekly[weeklyKey(today)] = [dungeon];

    processTaskEvent(state, today, { type: 'item_crafted', itemId: 'bronze_bar' });
    processTaskEvent(state, today, { type: 'item_crafted', itemId: 'bronze_bar' });
    processTaskEvent(state, today, { type: 'item_crafted', itemId: 'bronze_bar' });
    expect(craft.completed).toBe(true);

    processTaskEvent(state, today, { type: 'resource_gathered', resourceId: 'copper_ore', skillId: 'mining', quantity: 12 });
    expect(mine.completed).toBe(true);

    processTaskEvent(state, today, { type: 'dungeon_completed', dungeonId: 'darkwood-caverns' });
    expect(dungeon.completed).toBe(true);
  });

  it('does not advance a gather task on a wrong skill', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const mine = makeAssignment({ taskId: 'd_c', objectiveType: 'gather', objectiveTarget: 'copper_ore', required: 12, skillId: 'mining' });
    state.daily[dailyKey(today)] = [mine];
    processTaskEvent(state, today, { type: 'resource_gathered', resourceId: 'copper_ore', skillId: 'woodcutting', quantity: 12 });
    expect(mine.current).toBe(0);
  });
});

describe('claiming & non-FOMO catch-up', () => {
  it('claims a completed task reward once', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    processTaskEvent(state, today, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier', quantity: 10 });

    const result = claimTask(state, goblin, rewardFor, 100);
    expect(result).not.toBeNull();
    expect(result!.reward.experience).toBe(100);
    expect(goblin.claimed).toBe(true);
    expect(state.totalTasksCompleted).toBe(1);
    expect(claimTask(state, goblin, rewardFor, 101)).toBeNull();
  });

  it('refuses to claim an incomplete task', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    expect(claimTask(state, goblin, rewardFor, 100)).toBeNull();
  });

  it('banks completed-but-unclaimed completions from past cycles (non-FOMO)', () => {
    const today = new Date(2026, 8, 3);
    const state = createTaskState();
    const goblin = makeAssignment({ taskId: 'd_a', objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 });
    state.daily[dailyKey(today)] = [goblin];
    processTaskEvent(state, today, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier', quantity: 10 });
    // NOT claimed yet.

    const tomorrow = new Date(2026, 8, 4);
    const banked = bankExpiredCompletions(state, dailyKey(tomorrow), weeklyKey(tomorrow), 10);
    expect(banked).toBe(1);
    expect(state.catchUpClaims.some((c) => c.taskId === 'd_a')).toBe(true);

    const idx = state.catchUpClaims.findIndex((c) => c.taskId === 'd_a');
    const caughtUp = claimCatchUp(state, idx, rewardFor, 200);
    expect(caughtUp).not.toBeNull();
    expect(caughtUp!.reward.experience).toBe(100);
    expect(state.totalTasksCompleted).toBe(1);
  });

  it('caps the catch-up bank size', () => {
    const state = createTaskState();
    for (const day of [1, 2]) {
      const d = new Date(2026, 8, day);
      const assignments = [
        makeAssignment({ taskId: `goblin_${day}`, objectiveType: 'kill', objectiveTarget: 'goblin', required: 10 }),
        makeAssignment({ taskId: `wolf_${day}`, objectiveType: 'kill', objectiveTarget: 'wolf', required: 8 }),
      ];
      for (const a of assignments) { a.current = a.required; a.completed = true; }
      state.daily[dailyKey(d)] = assignments;
    }
    const today = new Date(2026, 8, 3);
    const banked = bankExpiredCompletions(state, dailyKey(today), weeklyKey(today), 3);
    expect(banked).toBe(3);
    expect(state.catchUpClaims.length).toBe(3);
  });
});

describe('queries', () => {
  it('lists active assignments including multiple cycles', () => {
    const state = createTaskState();
    const today = new Date(2026, 8, 3);
    const prev = new Date(2026, 8, 2);
    ensureCurrentTasks(state, POOL, SEL, today, 1);
    ensureCurrentTasks(state, POOL, SEL, prev, 1);
    const summaries = getActiveTaskSummaries(state, today);
    expect(summaries.length).toBeGreaterThanOrEqual(4);
    const cur = getCurrentTasks(state, today);
    expect(cur.daily.length).toBe(3);
    expect(cur.weekly.length).toBe(1);
  });
});
