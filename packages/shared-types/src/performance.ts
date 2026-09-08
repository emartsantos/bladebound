// ─── PERFORMANCE PROFILING TYPES ────────────────────────────────
// Phase 30: Timing, metrics, budgets, and profiling for all
// performance-critical paths. Profile before optimizing.

// ─── PERFORMANCE CATEGORIES ─────────────────────────────────────

export type PerformanceCategory =
  | 'react_render'
  | 'inventory'
  | 'loot_table'
  | 'combat_timer'
  | 'animation'
  | 'database_query'
  | 'api_payload'
  | 'image_loading'
  | 'bundle_size'
  | 'dynamic_import'
  | 'cache_behavior'
  | 'state_update'
  | 'event_processing';

// ─── TIMING MEASUREMENT ─────────────────────────────────────────

export interface TimingEntry {
  /** Label for this measurement. */
  label: string;
  /** Category. */
  category: PerformanceCategory;
  /** Start time (ms). */
  startMs: number;
  /** End time (ms). */
  endMs: number;
  /** Duration (ms). */
  durationMs: number;
  /** Optional metadata. */
  metadata?: Record<string, unknown>;
}

// ─── AGGREGATE METRICS ──────────────────────────────────────────

export interface AggregateMetric {
  /** Metric name. */
  name: string;
  /** Category. */
  category: PerformanceCategory;
  /** Number of samples. */
  sampleCount: number;
  /** Minimum duration (ms). */
  minMs: number;
  /** Maximum duration (ms). */
  maxMs: number;
  /** Average duration (ms). */
  avgMs: number;
  /** Median duration (ms). */
  medianMs: number;
  /** 95th percentile (ms). */
  p95Ms: number;
  /** 99th percentile (ms). */
  p99Ms: number;
  /** Standard deviation. */
  stdDevMs: number;
  /** Total time across all samples (ms). */
  totalMs: number;
}

// ─── PERFORMANCE BUDGET ─────────────────────────────────────────

export type BudgetSeverity = 'info' | 'warning' | 'critical';

export interface PerformanceBudget {
  /** What this budget measures. */
  name: string;
  /** Category. */
  category: PerformanceCategory;
  /** Warning threshold (ms). */
  warningMs: number;
  /** Critical threshold (ms). */
  criticalMs: number;
  /** Whether this budget is currently violated. */
  violated: boolean;
  /** Current severity. */
  severity: BudgetSeverity;
}

export interface BudgetViolation {
  budget: string;
  category: PerformanceCategory;
  severity: BudgetSeverity;
  thresholdMs: number;
  actualMs: number;
  timestamp: number;
  label?: string;
}

// ─── PROFILER STATE ─────────────────────────────────────────────

export interface ProfilerState {
  /** Whether profiling is active. */
  active: boolean;
  /** All recorded timing entries. */
  entries: TimingEntry[];
  /** Aggregate metrics by label. */
  aggregates: Record<string, AggregateMetric>;
  /** Active budgets. */
  budgets: PerformanceBudget[];
  /** Recorded violations. */
  violations: BudgetViolation[];
  /** Start time of current profiling session. */
  sessionStartMs: number;
  /** Total entries recorded. */
  totalEntries: number;
}

// ─── RENDER PROFILING ───────────────────────────────────────────

export interface RenderProfile {
  /** Component name. */
  componentName: string;
  /** Render count. */
  renderCount: number;
  /** Total render time (ms). */
  totalRenderMs: number;
  /** Average render time (ms). */
  avgRenderMs: number;
  /** Renders per second (in typical frame budget). */
  rendersPerSecond: number;
  /** Whether this component exceeds frame budget (16.67ms). */
  exceedsFrameBudget: boolean;
}

// ─── INVENTORY PROFILING ────────────────────────────────────────

export interface InventoryProfile {
  /** Number of items in inventory. */
  itemCount: number;
  /** Time to sort inventory (ms). */
  sortTimeMs: number;
  /** Time to search inventory (ms). */
  searchTimeMs: number;
  /** Time to render inventory (ms). */
  renderTimeMs: number;
  /** Memory estimate (bytes). */
  memoryEstimateBytes: number;
}

// ─── COMBAT TIMER PROFILING ─────────────────────────────────────

export interface CombatTimerProfile {
  /** Timer tick interval (ms). */
  tickIntervalMs: number;
  /** Actual average tick duration (ms). */
  avgTickDurationMs: number;
  /** Max tick duration observed (ms). */
  maxTickDurationMs: number;
  /** Number of ticks that exceeded frame budget. */
  overBudgetTicks: number;
  /** Total ticks. */
  totalTicks: number;
  /** Tick drift (ms). */
  tickDriftMs: number;
}

// ─── BUNDLE ANALYSIS ────────────────────────────────────────────

export interface BundleProfile {
  /** Total bundle size (bytes). */
  totalSizeBytes: number;
  /** JavaScript size (bytes). */
  jsSizeBytes: number;
  /** CSS size (bytes). */
  cssSizeBytes: number;
  /** Image size (bytes). */
  imageSizeBytes: number;
  /** Number of chunks. */
  chunkCount: number;
  /** Lazy-loaded chunks. */
  lazyChunkCount: number;
  /** First Contentful Paint estimate (ms). */
  fcpEstimateMs: number;
  /** Largest Contentful Paint estimate (ms). */
  lcpEstimateMs: number;
}

// ─── CACHE PROFILING ────────────────────────────────────────────

export interface CacheProfile {
  /** Cache name. */
  name: string;
  /** Total lookups. */
  totalLookups: number;
  /** Cache hits. */
  hits: number;
  /** Cache misses. */
  misses: number;
  /** Hit ratio 0-1. */
  hitRatio: number;
  /** Average lookup time (ms). */
  avgLookupMs: number;
  /** Eviction count. */
  evictions: number;
  /** Current cache size (entries). */
  currentSize: number;
  /** Max cache size. */
  maxSize: number;
}

// ─── FULL PERFORMANCE REPORT ────────────────────────────────────

export interface PerformanceReport {
  timestamp: number;
  sessionDurationMs: number;
  aggregates: Record<string, AggregateMetric>;
  budgets: PerformanceBudget[];
  violations: BudgetViolation[];
  renderProfiles: RenderProfile[];
  inventoryProfile?: InventoryProfile;
  combatTimerProfile?: CombatTimerProfile;
  bundleProfile?: BundleProfile;
  cacheProfiles: CacheProfile[];
  overallScore: number; // 0-100
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceRecommendation {
  category: PerformanceCategory;
  severity: BudgetSeverity;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
}
