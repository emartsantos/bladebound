// ─── PERFORMANCE PROFILING ENGINE ────────────────────────────────
// Phase 30: Timing, aggregation, budgets, profiling hooks.
// Profile before optimizing. Do not update entire React tree every tick.

import type {
  TimingEntry,
  AggregateMetric,
  PerformanceCategory,
  PerformanceBudget,
  BudgetSeverity,
  BudgetViolation,
  ProfilerState,
  RenderProfile,
  InventoryProfile,
  CombatTimerProfile,
  BundleProfile,
  CacheProfile,
  PerformanceReport,
  PerformanceRecommendation,
} from '@premium-rpg/shared-types';

// ─── PROFILER ───────────────────────────────────────────────────

export function createProfiler(): ProfilerState {
  return {
    active: false,
    entries: [],
    aggregates: {},
    budgets: [],
    violations: [],
    sessionStartMs: 0,
    totalEntries: 0,
  };
}

export function startProfiling(state: ProfilerState): ProfilerState {
  return {
    ...state,
    active: true,
    sessionStartMs: Date.now(),
    entries: [],
    aggregates: {},
    violations: [],
    totalEntries: 0,
  };
}

export function stopProfiling(state: ProfilerState): ProfilerState {
  return { ...state, active: false };
}

// ─── TIMING ─────────────────────────────────────────────────────

export function startTimer(): number {
  return Date.now();
}

export function endTimer(startMs: number): number {
  return Date.now() - startMs;
}

export function recordTiming(
  state: ProfilerState,
  label: string,
  category: PerformanceCategory,
  durationMs: number,
  metadata?: Record<string, unknown>,
): ProfilerState {
  const entry: TimingEntry = {
    label,
    category,
    startMs: Date.now() - durationMs,
    endMs: Date.now(),
    durationMs,
    metadata,
  };

  const entries = [...state.entries, entry];
  const aggregates = computeAggregates(entries);
  const { violations, budgets } = checkBudgets(state.budgets, entries);

  return {
    ...state,
    entries,
    aggregates,
    violations,
    budgets,
    totalEntries: entries.length,
  };
}

export function wrapFunction<T extends (...args: unknown[]) => unknown>(
  state: ProfilerState,
  label: string,
  category: PerformanceCategory,
  fn: T,
): { result: ReturnType<T>; newState: ProfilerState } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  const newState = recordTiming(state, label, category, duration);
  return { result: result as ReturnType<T>, newState };
}

// ─── AGGREGATION ────────────────────────────────────────────────

export function computeAggregates(entries: TimingEntry[]): Record<string, AggregateMetric> {
  const byLabel = new Map<string, TimingEntry[]>();
  for (const entry of entries) {
    const existing = byLabel.get(entry.label) ?? [];
    existing.push(entry);
    byLabel.set(entry.label, existing);
  }

  const result: Record<string, AggregateMetric> = {};
  for (const [label, group] of byLabel) {
    const durations = group.map((e) => e.durationMs).sort((a, b) => a - b);
    const n = durations.length;
    const total = durations.reduce((s, d) => s + d, 0);
    const avg = total / n;
    const variance = durations.reduce((s, d) => s + (d - avg) ** 2, 0) / n;

    result[label] = {
      name: label,
      category: group[0].category,
      sampleCount: n,
      minMs: durations[0],
      maxMs: durations[n - 1],
      avgMs: avg,
      medianMs: percentile(durations, 0.5),
      p95Ms: percentile(durations, 0.95),
      p99Ms: percentile(durations, 0.99),
      stdDevMs: Math.sqrt(variance),
      totalMs: total,
    };
  }
  return result;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── BUDGETS ────────────────────────────────────────────────────

export function createBudget(
  name: string,
  category: PerformanceCategory,
  warningMs: number,
  criticalMs: number,
): PerformanceBudget {
  return {
    name,
    category,
    warningMs,
    criticalMs,
    violated: false,
    severity: 'info',
  };
}

export function setBudget(
  state: ProfilerState,
  budget: PerformanceBudget,
): ProfilerState {
  const budgets = [...state.budgets.filter((b) => b.name !== budget.name), budget];
  const { violations, budgets: updatedBudgets } = checkBudgets(budgets, state.entries);
  return { ...state, budgets: updatedBudgets, violations };
}

function checkBudgets(
  budgets: PerformanceBudget[],
  entries: TimingEntry[],
): { violations: BudgetViolation[]; budgets: PerformanceBudget[] } {
  const aggregates = computeAggregates(entries);
  const violations: BudgetViolation[] = [];
  const updatedBudgets = budgets.map((budget) => {
    const agg = aggregates[budget.name];
    if (!agg) return budget;

    let severity: BudgetSeverity = 'info';
    let violated = false;

    if (agg.maxMs >= budget.criticalMs) {
      severity = 'critical';
      violated = true;
    } else if (agg.maxMs >= budget.warningMs) {
      severity = 'warning';
      violated = true;
    }

    if (violated) {
      violations.push({
        budget: budget.name,
        category: budget.category,
        severity,
        thresholdMs: severity === 'critical' ? budget.criticalMs : budget.warningMs,
        actualMs: agg.maxMs,
        timestamp: Date.now(),
      });
    }

    return { ...budget, violated, severity };
  });

  return { violations, budgets: updatedBudgets };
}

// ─── RENDER PROFILING ───────────────────────────────────────────

export function profileRender(
  componentName: string,
  renderCount: number,
  totalRenderMs: number,
): RenderProfile {
  const avgRenderMs = renderCount > 0 ? totalRenderMs / renderCount : 0;
  const fps60Budget = 16.67;
  return {
    componentName,
    renderCount,
    totalRenderMs,
    avgRenderMs,
    rendersPerSecond: avgRenderMs > 0 ? 1000 / avgRenderMs : 0,
    exceedsFrameBudget: avgRenderMs > fps60Budget,
  };
}

// ─── INVENTORY PROFILING ────────────────────────────────────────

export function profileInventory(
  itemCount: number,
  sortTimeMs: number,
  searchTimeMs: number,
  renderTimeMs: number,
): InventoryProfile {
  return {
    itemCount,
    sortTimeMs,
    searchTimeMs,
    renderTimeMs,
    memoryEstimateBytes: itemCount * 128,
  };
}

// ─── COMBAT TIMER PROFILING ─────────────────────────────────────

export function profileCombatTimer(
  tickDurations: number[],
  expectedIntervalMs: number,
): CombatTimerProfile {
  const n = tickDurations.length;
  const avgTickDurationMs = n > 0 ? tickDurations.reduce((s, d) => s + d, 0) / n : 0;
  const maxTickDurationMs = n > 0 ? Math.max(...tickDurations) : 0;
  const overBudgetTicks = tickDurations.filter((d) => d > expectedIntervalMs).length;
  const totalTicks = n;

  let tickDriftMs = 0;
  for (let i = 1; i < n; i++) {
    const expected = expectedIntervalMs * i;
    const actual = tickDurations.slice(0, i + 1).reduce((s, d) => s + d, 0);
    tickDriftMs = Math.max(tickDriftMs, Math.abs(actual - expected));
  }

  return {
    tickIntervalMs: expectedIntervalMs,
    avgTickDurationMs,
    maxTickDurationMs,
    overBudgetTicks,
    totalTicks,
    tickDriftMs,
  };
}

// ─── BUNDLE PROFILING ───────────────────────────────────────────

export function profileBundle(
  totalSizeBytes: number,
  jsSizeBytes: number,
  cssSizeBytes: number,
  imageSizeBytes: number,
  chunkCount: number,
  lazyChunkCount: number,
): BundleProfile {
  const fcpEstimateMs = totalSizeBytes / 50000; // rough estimate
  const lcpEstimateMs = totalSizeBytes / 30000;
  return {
    totalSizeBytes,
    jsSizeBytes,
    cssSizeBytes,
    imageSizeBytes,
    chunkCount,
    lazyChunkCount,
    fcpEstimateMs,
    lcpEstimateMs,
  };
}

// ─── CACHE PROFILING ────────────────────────────────────────────

export function profileCache(
  name: string,
  totalLookups: number,
  hits: number,
  evictions: number,
  currentSize: number,
  maxSize: number,
  totalLookupTimeMs: number,
): CacheProfile {
  const misses = totalLookups - hits;
  return {
    name,
    totalLookups,
    hits,
    misses,
    hitRatio: totalLookups > 0 ? hits / totalLookups : 0,
    avgLookupMs: totalLookups > 0 ? totalLookupTimeMs / totalLookups : 0,
    evictions,
    currentSize,
    maxSize,
  };
}

// ─── PERFORMANCE REPORT ─────────────────────────────────────────

export function generatePerformanceReport(state: ProfilerState, extras?: {
  renderProfiles?: RenderProfile[];
  inventoryProfile?: InventoryProfile;
  combatTimerProfile?: CombatTimerProfile;
  bundleProfile?: BundleProfile;
  cacheProfiles?: CacheProfile[];
}): PerformanceReport {
  const recommendations: PerformanceRecommendation[] = [];

  // Check aggregates for recommendations
  for (const [name, agg] of Object.entries(state.aggregates)) {
    if (agg.p95Ms > 16.67) {
      recommendations.push({
        category: agg.category,
        severity: agg.p95Ms > 100 ? 'critical' : 'warning',
        title: `Slow operation: ${name}`,
        description: `p95 is ${agg.p95Ms.toFixed(1)}ms (target: <16.67ms)`,
        metric: name,
        currentValue: agg.p95Ms,
        targetValue: 16.67,
      });
    }
  }

  // Check render profiles
  const renderProfiles = extras?.renderProfiles ?? [];
  for (const rp of renderProfiles) {
    if (rp.exceedsFrameBudget) {
      recommendations.push({
        category: 'react_render',
        severity: 'warning',
        title: `Slow render: ${rp.componentName}`,
        description: `Avg ${rp.avgRenderMs.toFixed(1)}ms exceeds 16.67ms frame budget`,
        metric: rp.componentName,
        currentValue: rp.avgRenderMs,
        targetValue: 16.67,
      });
    }
  }

  // Check combat timer
  if (extras?.combatTimerProfile) {
    const ctp = extras.combatTimerProfile;
    if (ctp.overBudgetTicks > 0) {
      recommendations.push({
        category: 'combat_timer',
        severity: ctp.overBudgetTicks > ctp.totalTicks * 0.1 ? 'critical' : 'warning',
        title: 'Combat timer over budget',
        description: `${ctp.overBudgetTicks}/${ctp.totalTicks} ticks exceeded interval`,
        metric: 'combat_tick_over_budget',
        currentValue: ctp.overBudgetTicks,
        targetValue: 0,
      });
    }
  }

  // Check bundle
  if (extras?.bundleProfile) {
    const bp = extras.bundleProfile;
    if (bp.totalSizeBytes > 500000) {
      recommendations.push({
        category: 'bundle_size',
        severity: bp.totalSizeBytes > 1000000 ? 'critical' : 'warning',
        title: 'Bundle too large',
        description: `${(bp.totalSizeBytes / 1000).toFixed(0)}KB exceeds 500KB target`,
        metric: 'bundle_size',
        currentValue: bp.totalSizeBytes,
        targetValue: 500000,
      });
    }
  }

  // Check caches
  const cacheProfiles = extras?.cacheProfiles ?? [];
  for (const cp of cacheProfiles) {
    if (cp.hitRatio < 0.5 && cp.totalLookups > 10) {
      recommendations.push({
        category: 'cache_behavior',
        severity: 'warning',
        title: `Low cache hit rate: ${cp.name}`,
        description: `Hit ratio ${(cp.hitRatio * 100).toFixed(0)}% (target: >50%)`,
        metric: cp.name,
        currentValue: cp.hitRatio,
        targetValue: 0.5,
      });
    }
  }

  // Score: 100 minus deductions
  let score = 100;
  for (const r of recommendations) {
    score -= r.severity === 'critical' ? 20 : r.severity === 'warning' ? 10 : 2;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    timestamp: Date.now(),
    sessionDurationMs: Date.now() - state.sessionStartMs,
    aggregates: state.aggregates,
    budgets: state.budgets,
    violations: state.violations,
    renderProfiles,
    inventoryProfile: extras?.inventoryProfile,
    combatTimerProfile: extras?.combatTimerProfile,
    bundleProfile: extras?.bundleProfile,
    cacheProfiles,
    overallScore: score,
    recommendations,
  };
}
