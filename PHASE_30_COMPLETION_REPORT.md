# Phase 30 — Performance (COMPLETED)

## Summary
Profiling framework with timing, aggregation, budgets, and specialized profilers for renders, inventory, combat timers, bundles, and caches. Score-based reporting with actionable recommendations. Profile before optimizing.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/performance.ts` | Types: 13 performance categories, timing entries, aggregates, budgets, profiler state, render/inventory/combat/bundle/cache profiles, reports with recommendations |
| `packages/game-engine/src/performance.ts` | Engine: profiler lifecycle, timing, aggregation with percentiles, budget checking, specialized profilers, report generation with scoring |
| `packages/game-engine/tests/performance.test.ts` | 39 tests: profiler lifecycle, timing, aggregation, budgets, render/inventory/combat/bundle/cache profiling, reports |

## API

**Profiler Lifecycle** (`createProfiler`, `startProfiling`, `stopProfiling`)
- Create, start, stop profiling sessions

**Timing** (`startTimer`, `endTimer`, `recordTiming`, `wrapFunction`)
- Measure duration of any operation
- `wrapFunction` profiles a function call automatically

**Aggregation** (`computeAggregates`)
- Computes min/max/avg/median/p95/p99/stdDev across samples by label
- Percentile calculation on sorted durations

**Budgets** (`createBudget`, `setBudget`)
- Define warning/critical thresholds per metric
- Automatic violation detection when recordings exceed thresholds

**Specialized Profilers**
- `profileRender` — component render count, avg time, frame budget check (16.67ms)
- `profileInventory` — sort/search/render times, memory estimate
- `profileCombatTimer` — tick durations, over-budget detection, drift measurement
- `profileBundle` — size breakdown, chunk counts, FCP/LCP estimates
- `profileCache` — hit ratio, eviction count, lookup time

**Performance Report** (`generatePerformanceReport`)
- Combines all profiling data into unified report
- Automatic recommendations for slow operations, over-budget renders, combat timer issues, large bundles, low cache hit rates
- 0-100 score with deductions per issue severity

## Design Decisions

- **Profile before optimizing**: no premature optimization; the profiler identifies actual bottlenecks
- **Budget-based thresholds**: warnings at 16.67ms (60fps frame budget), critical at 100ms
- **Percentile-based aggregation**: p95/p99 capture tail latency, not just averages
- **Specialized profilers**: each performance domain has its own profiler with domain-specific metrics
- **Score-based reporting**: single 0-100 score for quick assessment, with detailed recommendations
- **No `performance.now()`**: uses `Date.now()` for Node.js compatibility
