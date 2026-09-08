// ─── RESPONSIVE WEB FINALIZATION TYPES ──────────────────────────
// Phase 32: Width audit for desktop/tablet/mobile with clipping,
// table, control-size, and horizontal-scroll checks.
// Desktop remains the richest experience.

// ─── TARGET WIDTHS ──────────────────────────────────────────────

export type DeviceClass = 'desktop' | 'tablet' | 'mobile';

export interface DeviceTarget {
  /** Device class. */
  device: DeviceClass;
  /** Nominal viewport width (px). */
  width: number;
  /** Whether this is the primary target for that class. */
  primary?: boolean;
}

export const STANDARD_TARGETS: DeviceTarget[] = [
  { device: 'desktop', width: 1920, primary: true },
  { device: 'desktop', width: 1440 },
  { device: 'desktop', width: 1366 },
  { device: 'tablet', width: 1024, primary: true },
  { device: 'tablet', width: 768 },
  { device: 'mobile', width: 430, primary: true },
  { device: 'mobile', width: 390 },
  { device: 'mobile', width: 360 },
];

// ─── LAYOUT ELEMENT ─────────────────────────────────────────────

export interface LayoutElement {
  /** Element identifier/selector. */
  id: string;
  /** Element size in px. */
  width: number;
  height?: number;
  /** Horizontal position (x, width in viewport). */
  left?: number;
  right?: number;
  /** Whether it's a table element. */
  isTable?: boolean;
  /** Whether it's an interactive control (button/input/link). */
  interactive?: boolean;
  /** For tables: number of columns. */
  columnCount?: number;
  /** For tables: min column width. */
  minColumnWidth?: number;
  /** Whether horizontal scroll is intentional. */
  intentionalScroll?: boolean;
}

// ─── CHECKS ─────────────────────────────────────────────────────

export type ResponsiveFailureReason =
  | 'horizontal_clipping'
  | 'unreadable_table'
  | 'microscopic_control'
  | 'horizontal_scroll'
  | 'overflow';

export interface ResponsiveCheckResult {
  /** Check identifier. */
  checkId: string;
  /** Viewport width at which check ran. */
  viewportWidth: number;
  /** Device class. */
  device: DeviceClass;
  /** Whether the check passed. */
  passed: boolean;
  /** Failure reason if failed. */
  reason?: ResponsiveFailureReason;
  /** Description. */
  message: string;
  /** Affected element. */
  target?: string;
  /** Actual value observed. */
  actual?: number;
  /** Expected threshold. */
  threshold?: number;
}

// ─── DEVICE LAYOUT REPORT ───────────────────────────────────────

export interface DeviceLayoutReport {
  device: DeviceClass;
  viewportWidth: number;
  /** Checks run at this width. */
  checks: ResponsiveCheckResult[];
  failures: number;
  passed: boolean;
  /** Horizontal overflow detected (px). */
  overflowX?: number;
  /** Reason for overflow. */
  overflowReason?: string;
}

// ─── FULL RESPONSIVE REPORT ─────────────────────────────────────

export interface ResponsiveAuditReport {
  generatedAt: number;
  /** Reports per target width. */
  deviceReports: DeviceLayoutReport[];
  /** Total checks run. */
  totalChecks: number;
  /** Total failures. */
  totalFailures: number;
  /** Overall pass rate 0-1. */
  passRate: number;
  /** Whether all primary targets pass. */
  primaryTargetsPass: boolean;
  /** Severity summary. */
  summary: {
    clipping: number;
    tables: number;
    controls: number;
    horizontalScroll: number;
    overflow: number;
  };
  /** Actionable recommendations. */
  recommendations: ResponsiveRecommendation[];
}

export interface ResponsiveRecommendation {
  device: DeviceClass;
  viewportWidth: number;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  reason: ResponsiveFailureReason;
  target?: string;
  remediation: string;
}
