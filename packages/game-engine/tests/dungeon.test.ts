import { describe, it, expect } from 'vitest';
import {
  createEmptyDungeonState,
  checkDungeonEntry,
  startDungeonRun,
  getCurrentEncounter,
  getRunProgress,
  resolveDungeonEncounter,
  computeDungeonRewards,
  abandonDungeonRun,
  clearDungeonRun,
  addRunHistory,
} from '../src/dungeon';
import type { DungeonDefinition } from '@premium-rpg/shared-types';

const TEST_DUNGEON: DungeonDefinition = {
  id: 'test-dungeon',
  name: 'Test Dungeon',
  regionId: 'test-region',
  description: 'A test dungeon',
  recommendedLevel: 10,
  maxFloor: 3,
  entryRequirement: { level: 8, keyId: 'test_key', keyConsumedOnEntry: true },
  encounters: [
    { id: 'e1', type: 'trash', name: 'Pack', description: 'trash', enemyIds: ['a', 'a'] },
    { id: 'e2', type: 'elite', name: 'Elite', description: 'elite', enemyId: 'b', modifiers: ['offensive'] },
    { id: 'e3', type: 'boss', name: 'Boss', description: 'boss', enemyId: 'c' },
  ],
  reward: {
    guaranteed: [{ itemId: 'mat', quantity: 2 }],
    weightedLootTableId: 'dungeon_test',
    xp: 300,
    gold: 100,
    firstClearBonus: [{ itemId: 'rare_item', quantity: 1 }],
  },
  repeatable: true,
  repeatRewardMultiplier: 0.5,
};

describe('dungeon engine', () => {
  it('creates empty dungeon state for all dungeons', () => {
    const state = createEmptyDungeonState(['d1', 'd2']);
    expect(state.currentRun).toBeNull();
    expect(Object.keys(state.progress)).toEqual(['d1', 'd2']);
    expect(state.progress.d1.clears).toBe(0);
    expect(state.progress.d1.firstClearDone).toBe(false);
  });

  it('checks entry requirements by level', () => {
    expect(checkDungeonEntry(TEST_DUNGEON, 8, { hasKey: true }).allowed).toBe(true);
    expect(checkDungeonEntry(TEST_DUNGEON, 7, { hasKey: true }).allowed).toBe(false);
    expect(checkDungeonEntry(TEST_DUNGEON, 9, { hasKey: false }).allowed).toBe(false);
    expect(checkDungeonEntry(TEST_DUNGEON, 9, { hasKey: true }).allowed).toBe(true);
  });

  it('starts a run and places player on floor 1', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    const result = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    expect(result.success).toBe(true);
    expect(result.run?.currentFloor).toBe(1);
    expect(result.run?.currentEncounterId).toBe('e1');
    expect(result.run?.status).toBe('active');
    expect(result.run?.isFirstClear).toBe(true);
  });

  it('rejects starting a run while one is active', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    const started = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    const result = startDungeonRun(started.state!, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/already in progress/);
  });

  it('gets the current encounter and run progress', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    const { run } = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    const progress = getRunProgress(run!, TEST_DUNGEON);
    expect(progress.currentFloor).toBe(1);
    expect(progress.totalFloors).toBe(3);
    expect(progress.floorsRemaining).toBe(2);
    expect(progress.currentEncounter?.id).toBe('e1');
    expect(progress.bossEncounter?.id).toBe('e3');
    expect(progress.isOnBoss).toBe(false);
    expect(getCurrentEncounter(run!, TEST_DUNGEON)?.name).toBe('Pack');
  });

  it('advances floors on victory and completes on boss clear', () => {
    let state = createEmptyDungeonState([TEST_DUNGEON.id]);
    let started = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    state = started.state!;

    // clear e1
    let res = resolveDungeonEncounter(state, TEST_DUNGEON, 'victory', { now: 1100 });
    expect(res.runFinished).toBe(false);
    expect(res.run?.currentFloor).toBe(2);
    state = res.state;

    // clear e2
    res = resolveDungeonEncounter(state, TEST_DUNGEON, 'victory', { now: 1200 });
    expect(res.run?.currentFloor).toBe(3);
    state = res.state;

    // clear boss e3 -> run completes
    res = resolveDungeonEncounter(state, TEST_DUNGEON, 'victory', { now: 1300 });
    expect(res.runFinished).toBe(true);
    expect(res.run?.status).toBe('completed');
    expect(res.run?.result).toBe('victory');
    expect(res.run?.encountersCleared).toEqual(['e1', 'e2', 'e3']);
    const progress = res.state!.progress[TEST_DUNGEON.id];
    expect(progress.clears).toBe(1);
    expect(progress.firstClearDone).toBe(true);
    expect(progress.firstClearAt).toBe(1300);
    expect(progress.bestTimeMs).toBe(300);
  });

  it('fails the run on defeat', () => {
    let state = createEmptyDungeonState([TEST_DUNGEON.id]);
    let started = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    state = started.state!;
    const res = resolveDungeonEncounter(state, TEST_DUNGEON, 'defeat', { now: 1100 });
    expect(res.runFinished).toBe(true);
    expect(res.run?.status).toBe('failed');
    expect(res.run?.result).toBe('defeat');
  });

  it('computes first-clear rewards with bonus', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    const started = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    const rewards = computeDungeonRewards(started.run!, TEST_DUNGEON);
    expect(rewards.isFirstClear).toBe(true);
    expect(rewards.xp).toBe(300);
    expect(rewards.gold).toBe(100);
    expect(rewards.items).toContainEqual({ itemId: 'mat', quantity: 2 });
    expect(rewards.items).toContainEqual({ itemId: 'rare_item', quantity: 1 });
  });

  it('computes repeat rewards with multiplier and no first-clear bonus', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    const started = startDungeonRun(state, TEST_DUNGEON, 10, {
      hasKey: true, now: 1000, isFirstClear: false,
    });
    const rewards = computeDungeonRewards(started.run!, TEST_DUNGEON);
    expect(rewards.isFirstClear).toBe(false);
    expect(rewards.xp).toBe(150);
    expect(rewards.gold).toBe(50);
    expect(rewards.items).toContainEqual({ itemId: 'mat', quantity: 1 });
    expect(rewards.items.find((i) => i.itemId === 'rare_item')).toBeUndefined();
  });

  it('abandons a run but preserves progress', () => {
    let state = createEmptyDungeonState([TEST_DUNGEON.id]);
    let started = startDungeonRun(state, TEST_DUNGEON, 10, { hasKey: true, now: 1000 });
    state = started.state!;
    state = resolveDungeonEncounter(state, TEST_DUNGEON, 'victory', { now: 1100 }).state;
    const abandoned = abandonDungeonRun(state);
    expect(abandoned.currentRun?.status).toBe('abandoned');
    const cleared = clearDungeonRun(abandoned);
    expect(cleared.currentRun).toBeNull();
    expect(cleared.progress[TEST_DUNGEON.id].bestFloor).toBe(2);
  });

  it('tracks run history via addRunHistory', () => {
    const state = createEmptyDungeonState([TEST_DUNGEON.id]);
    let progress = state.progress[TEST_DUNGEON.id];
    progress = addRunHistory(progress, {
      dungeonId: TEST_DUNGEON.id,
      completedAt: 1000,
      floorsCleared: 3,
      success: true,
      isFirstClear: true,
      xpGained: 300,
      goldGained: 100,
      itemsGained: [],
      timeTakenMs: 200,
    });
    expect(progress.history).toHaveLength(1);
    expect(progress.history[0].success).toBe(true);
  });
});
