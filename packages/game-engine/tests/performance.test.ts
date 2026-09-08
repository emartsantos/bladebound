import { describe, it, expect } from 'vitest';
import {
  createProfiler,
  startProfiling,
  stopProfiling,
  startTimer,
  endTimer,
  recordTiming,
  wrapFunction,
  computeAggregates,
  createBudget,
  setBudget,
  profileRender,
  profileInventory,
  profileCombatTimer,
  profileBundle,
  profileCache,
  generatePerformanceReport,
} from '../src/performance';
import type { TimingEntry } from '@premium-rpg/shared-types';

// ─── PROFILER LIFECYCLE ─────────────────────────────────────────

describe('createProfiler', () => {
  it('creates idle profiler', () => {
    const p = createProfiler();
    expect(p.active).toBe(false);
    expect(p.entries).toHaveLength(0);
  });
});

describe('startProfiling', () => {
  it('activates profiler', () => {
    const p = startProfiling(createProfiler());
    expect(p.active).toBe(true);
    expect(p.sessionStartMs).toBeGreaterThan(0);
  });
});

describe('stopProfiling', () => {
  it('deactivates profiler', () => {
    const p = stopProfiling(startProfiling(createProfiler()));
    expect(p.active).toBe(false);
  });
});

// ─── TIMING ─────────────────────────────────────────────────────

describe('startTimer / endTimer', () => {
  it('measures elapsed time', () => {
    const start = startTimer();
    // simulate work
    const durations = Array.from({ length: 1000 }, (_, i) => i * i);
    void durations;
    const elapsed = endTimer(start);
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});

// ─── RECORD TIMING ──────────────────────────────────────────────

describe('recordTiming', () => {
  it('adds entry to state', () => {
    let state = startProfiling(createProfiler());
    state = recordTiming(state, 'test_op', 'inventory', 5);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].label).toBe('test_op');
    expect(state.totalEntries).toBe(1);
  });

  it('computes aggregates', () => {
    let state = startProfiling(createProfiler());
    state = recordTiming(state, 'op', 'combat_timer', 10);
    state = recordTiming(state, 'op', 'combat_timer', 20);
    state = recordTiming(state, 'op', 'combat_timer', 30);
    expect(state.aggregates['op']).toBeDefined();
    expect(state.aggregates['op'].sampleCount).toBe(3);
    expect(state.aggregates['op'].avgMs).toBe(20);
    expect(state.aggregates['op'].minMs).toBe(10);
    expect(state.aggregates['op'].maxMs).toBe(30);
  });

  it('stores metadata', () => {
    let state = startProfiling(createProfiler());
    state = recordTiming(state, 'meta', 'animation', 5, { key: 'value' });
    expect(state.entries[0].metadata).toEqual({ key: 'value' });
  });
});

// ─── WRAP FUNCTION ──────────────────────────────────────────────

describe('wrapFunction', () => {
  it('returns function result', () => {
    const state = startProfiling(createProfiler());
    const { result } = wrapFunction(state, 'add', 'event_processing', () => 2 + 3);
    expect(result).toBe(5);
  });

  it('records timing', () => {
    const state = startProfiling(createProfiler());
    const { newState } = wrapFunction(state, 'add', 'event_processing', () => 42);
    expect(newState.entries).toHaveLength(1);
    expect(newState.entries[0].label).toBe('add');
  });

  it('handles void functions', () => {
    const state = startProfiling(createProfiler());
    const { result } = wrapFunction(state, 'noop', 'event_processing', () => {});
    expect(result).toBeUndefined();
  });
});

// ─── AGGREGATION ────────────────────────────────────────────────

describe('computeAggregates', () => {
  it('computes correct stats', () => {
    const entries: TimingEntry[] = [
      { label: 'x', category: 'inventory', startMs: 0, endMs: 10, durationMs: 10 },
      { label: 'x', category: 'inventory', startMs: 10, endMs: 30, durationMs: 20 },
      { label: 'x', category: 'inventory', startMs: 30, endMs: 35, durationMs: 5 },
    ];
    const agg = computeAggregates(entries);
    expect(agg['x'].sampleCount).toBe(3);
    expect(agg['x'].avgMs).toBeCloseTo(11.667, 1);
    expect(agg['x'].minMs).toBe(5);
    expect(agg['x'].maxMs).toBe(20);
    expect(agg['x'].totalMs).toBe(35);
  });

  it('groups by label', () => {
    const entries: TimingEntry[] = [
      { label: 'a', category: 'inventory', startMs: 0, endMs: 5, durationMs: 5 },
      { label: 'b', category: 'combat_timer', startMs: 0, endMs: 10, durationMs: 10 },
    ];
    const agg = computeAggregates(entries);
    expect(Object.keys(agg)).toHaveLength(2);
    expect(agg['a'].category).toBe('inventory');
    expect(agg['b'].category).toBe('combat_timer');
  });

  it('handles empty entries', () => {
    expect(computeAggregates([])).toEqual({});
  });
});

// ─── BUDGETS ────────────────────────────────────────────────────

describe('createBudget', () => {
  it('creates a budget', () => {
    const b = createBudget('render', 'react_render', 16, 50);
    expect(b.name).toBe('render');
    expect(b.violated).toBe(false);
    expect(b.severity).toBe('info');
  });
});

describe('setBudget', () => {
  it('adds budget to state', () => {
    const state = startProfiling(createProfiler());
    const budget = createBudget('op', 'combat_timer', 10, 50);
    const updated = setBudget(state, budget);
    expect(updated.budgets).toHaveLength(1);
  });

  it('replaces existing budget with same name', () => {
    let state = startProfiling(createProfiler());
    state = setBudget(state, createBudget('op', 'combat_timer', 10, 50));
    state = setBudget(state, createBudget('op', 'combat_timer', 20, 100));
    expect(state.budgets).toHaveLength(1);
    expect(state.budgets[0].warningMs).toBe(20);
  });

  it('detects violations', () => {
    let state = startProfiling(createProfiler());
    state = setBudget(state, createBudget('slow_op', 'inventory', 5, 20));
    state = recordTiming(state, 'slow_op', 'inventory', 25);
    expect(state.violations.length).toBeGreaterThan(0);
    expect(state.violations[0].severity).toBe('critical');
  });

  it('no violation when within budget', () => {
    let state = startProfiling(createProfiler());
    state = setBudget(state, createBudget('fast_op', 'inventory', 50, 100));
    state = recordTiming(state, 'fast_op', 'inventory', 10);
    expect(state.violations).toHaveLength(0);
  });
});

// ─── RENDER PROFILING ───────────────────────────────────────────

describe('profileRender', () => {
  it('profiles a component', () => {
    const rp = profileRender('TestComp', 100, 500);
    expect(rp.componentName).toBe('TestComp');
    expect(rp.renderCount).toBe(100);
    expect(rp.avgRenderMs).toBe(5);
    expect(rp.exceedsFrameBudget).toBe(false);
  });

  it('detects over-budget renders', () => {
    const rp = profileRender('SlowComp', 10, 200);
    expect(rp.avgRenderMs).toBe(20);
    expect(rp.exceedsFrameBudget).toBe(true);
  });

  it('handles zero renders', () => {
    const rp = profileRender('Empty', 0, 0);
    expect(rp.avgRenderMs).toBe(0);
    expect(rp.rendersPerSecond).toBe(0);
  });
});

// ─── INVENTORY PROFILING ────────────────────────────────────────

describe('profileInventory', () => {
  it('profiles inventory', () => {
    const ip = profileInventory(100, 2, 1, 5);
    expect(ip.itemCount).toBe(100);
    expect(ip.sortTimeMs).toBe(2);
    expect(ip.memoryEstimateBytes).toBe(12800);
  });

  it('empty inventory', () => {
    const ip = profileInventory(0, 0, 0, 0);
    expect(ip.memoryEstimateBytes).toBe(0);
  });
});

// ─── COMBAT TIMER PROFILING ─────────────────────────────────────

describe('profileCombatTimer', () => {
  it('profiles combat timer', () => {
    const ctp = profileCombatTimer([5, 5, 5, 5], 10);
    expect(ctp.totalTicks).toBe(4);
    expect(ctp.avgTickDurationMs).toBe(5);
    expect(ctp.overBudgetTicks).toBe(0);
  });

  it('detects over-budget ticks', () => {
    const ctp = profileCombatTimer([5, 15, 5, 15], 10);
    expect(ctp.overBudgetTicks).toBe(2);
  });

  it('computes max tick duration', () => {
    const ctp = profileCombatTimer([1, 20, 3], 10);
    expect(ctp.maxTickDurationMs).toBe(20);
  });

  it('handles empty ticks', () => {
    const ctp = profileCombatTimer([], 10);
    expect(ctp.totalTicks).toBe(0);
  });
});

// ─── BUNDLE PROFILING ───────────────────────────────────────────

describe('profileBundle', () => {
  it('profiles bundle', () => {
    const bp = profileBundle(200000, 150000, 30000, 20000, 5, 2);
    expect(bp.totalSizeBytes).toBe(200000);
    expect(bp.chunkCount).toBe(5);
    expect(bp.lazyChunkCount).toBe(2);
    expect(bp.fcpEstimateMs).toBeGreaterThan(0);
  });
});

// ─── CACHE PROFILING ────────────────────────────────────────────

describe('profileCache', () => {
  it('profiles cache', () => {
    const cp = profileCache('items', 100, 80, 5, 50, 100, 100);
    expect(cp.hitRatio).toBe(0.8);
    expect(cp.misses).toBe(20);
    expect(cp.avgLookupMs).toBe(1);
  });

  it('handles zero lookups', () => {
    const cp = profileCache('empty', 0, 0, 0, 0, 100, 0);
    expect(cp.hitRatio).toBe(0);
    expect(cp.avgLookupMs).toBe(0);
  });
});

// ─── PERFORMANCE REPORT ─────────────────────────────────────────

describe('generatePerformanceReport', () => {
  it('generates report with no data', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state);
    expect(report.overallScore).toBe(100);
    expect(report.recommendations).toHaveLength(0);
  });

  it('includes aggregates', () => {
    let state = startProfiling(createProfiler());
    state = recordTiming(state, 'op', 'inventory', 5);
    const report = generatePerformanceReport(state);
    expect(report.aggregates['op']).toBeDefined();
  });

  it('penalizes score for slow operations', () => {
    let state = startProfiling(createProfiler());
    state = recordTiming(state, 'slow', 'combat_timer', 200);
    const report = generatePerformanceReport(state);
    expect(report.overallScore).toBeLessThan(100);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('penalizes for slow renders', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state, {
      renderProfiles: [profileRender('Slow', 10, 200)],
    });
    expect(report.recommendations.some((r) => r.category === 'react_render')).toBe(true);
  });

  it('penalizes for combat timer over budget', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state, {
      combatTimerProfile: profileCombatTimer([5, 20, 5, 20], 10),
    });
    expect(report.recommendations.some((r) => r.category === 'combat_timer')).toBe(true);
  });

  it('penalizes for large bundle', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state, {
      bundleProfile: profileBundle(600000, 500000, 50000, 50000, 10, 3),
    });
    expect(report.recommendations.some((r) => r.category === 'bundle_size')).toBe(true);
  });

  it('penalizes for low cache hit rate', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state, {
      cacheProfiles: [profileCache('items', 100, 20, 10, 50, 100, 50)],
    });
    expect(report.recommendations.some((r) => r.category === 'cache_behavior')).toBe(true);
  });

  it('score never goes below 0', () => {
    let state = startProfiling(createProfiler());
    for (let i = 0; i < 20; i++) {
      state = recordTiming(state, `slow_${i}`, 'combat_timer', 500);
    }
    const report = generatePerformanceReport(state);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('score never exceeds 100', () => {
    const state = startProfiling(createProfiler());
    const report = generatePerformanceReport(state);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });
});
