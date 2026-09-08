// ─── ACCESSIBILITY AUDIT TYPES ──────────────────────────────────
// Phase 31: Audit types for keyboard navigation, focus, semantics,
// contrast, labels, reduced motion, scalable text, accessible
// dialogs. Never sacrifice accessibility for the fantasy aesthetic.

// ─── ACCESSIBILITY GUIDELINE GROUPS ─────────────────────────────

export type A11yGuideline =
  | 'keyboard_navigation'
  | 'visible_focus'
  | 'semantic_elements'
  | 'accessible_tooltips'
  | 'color_not_sole_indicator'
  | 'sufficient_contrast'
  | 'screen_reader_labels'
  | 'reduced_motion'
  | 'scalable_text'
  | 'accessible_dialogs'
  | 'focus_trap'
  | 'aria_live_regions'
  | 'touch_targets'
  | 'keyboard_shortcuts';

export type A11ySeverity = 'critical' | 'serious' | 'moderate' | 'minor';

// ─── AUDIT RULE RESULT ──────────────────────────────────────────

export interface A11yRuleResult {
  /** Rule identifier. */
  ruleId: string;
  /** Which guideline this rule belongs to. */
  guideline: A11yGuideline;
  /** Whether the rule passed. */
  passed: boolean;
  /** Severity if failed. */
  severity?: A11ySeverity;
  /** Human-readable message. */
  message?: string;
  /** Element selector / identifier. */
  target?: string;
  /** WCAG success criterion (e.g. "2.1.1"). */
  wcagCriterion?: string;
  /** Suggested fix. */
  remediation?: string;
}

// ─── ELEMENT REPRESENTATION ─────────────────────────────────────

export interface A11yElement {
  /** Element tag/role. */
  elementType: string;
  /** ARIA role. */
  role?: string;
  /** Whether it has tabindex (focusable). */
  focusable?: boolean;
  /** Whether it has accessible name (aria-label/text). */
  hasAccessibleName?: boolean;
  /** Text content. */
  text?: string;
  /** CSS color value. */
  color?: string;
  /** CSS background color value. */
  backgroundColor?: string;
  /** Font size. */
  fontSize?: number;
  /** Is an interactive control (button/link/input). */
  interactive?: boolean;
  /** Is it a dialog. */
  isDialog?: boolean;
  /** Is inside a dialog. */
  inDialog?: boolean;
  /** Children elements. */
  children?: A11yElement[];
  /** ARIA attributes. */
  aria?: Record<string, string>;
  /** On-screen coordinates for touch targets. */
  touchTargetSize?: { width: number; height: number };
}

// ─── CONTRAST RATIO ─────────────────────────────────────────────

export interface ContrastResult {
  /** Contrast ratio (e.g. 4.5). */
  ratio: number;
  /** Whether it passes WCAG AA for normal text (4.5:1). */
  passesAA: boolean;
  /** Whether it passes WCAG AA for large text (3:1). */
  passesAALarge: boolean;
  /** Whether it passes WCAG AAA (7:1). */
  passesAAA: boolean;
  /** Relative luminance of foreground. */
  foregroundLuminance: number;
  /** Relative luminance of background. */
  backgroundLuminance: number;
}

// ─── AUDIT STATE ────────────────────────────────────────────────

export interface A11yAuditState {
  /** Whether reduced motion is enabled. */
  prefersReducedMotion: boolean;
  /** Current root font size (px). */
  rootFontSize: number;
  /** WCAG compliance mode. */
  complianceMode: 'AA' | 'AAA';
  /** Focus indicator configuration. */
  focusIndicator: {
    /** Focus outline width (px). */
    outlineWidth: number;
    /** Whether focus indicator is visible. */
    visible: boolean;
    /** Focus indicator color. */
    color: string;
  };
}

// ─── ACCESSIBILITY REPORT ───────────────────────────────────────

export interface A11yReport {
  generatedAt: number;
  /** Element audited. */
  elementCount: number;
  /** All rule results. */
  results: A11yRuleResult[];
  /** Total failures. */
  failures: number;
  /** Counts by severity. */
  severityCounts: Record<Exclude<A11ySeverity, 'minor'> | 'minor', number>;
  /** Passed ratio 0-1. */
  passRate: number;
  /** W3C-conformant if no critical/serious failures. */
  conformant: boolean;
  /** Actionable recommendations. */
  recommendations: A11yRecommendation[];
}

export interface A11yRecommendation {
  guideline: A11yGuideline;
  severity: A11ySeverity;
  title: string;
  description: string;
  wcagCriterion?: string;
  remediation: string;
  elementCount: number;
}
