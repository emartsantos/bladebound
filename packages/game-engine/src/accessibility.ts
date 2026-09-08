// ─── ACCESSIBILITY AUDIT ENGINE ─────────────────────────────────
// Phase 31: Audit engine for WCAG compliance. Never sacrifice
// accessibility for the fantasy aesthetic.

import type {
  A11yGuideline,
  A11ySeverity,
  A11yRuleResult,
  A11yElement,
  ContrastResult,
  A11yAuditState,
  A11yReport,
  A11yRecommendation,
} from '@premium-rpg/shared-types';

// ─── CONTRAST RATIO ─────────────────────────────────────────────

/**
 * Convert hex color to RGB.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '');
  if (match.length === 3) {
    const r = parseInt(match[0] + match[0], 16);
    const g = parseInt(match[1] + match[1], 16);
    const b = parseInt(match[2] + match[2], 16);
    return { r, g, b };
  }
  if (match.length === 6) {
    return {
      r: parseInt(match.slice(0, 2), 16),
      g: parseInt(match.slice(2, 4), 16),
      b: parseInt(match.slice(4, 6), 16),
    };
  }
  return null;
}

function rgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  const r = rgbToLinear(rgb.r);
  const g = rgbToLinear(rgb.g);
  const b = rgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute WCAG contrast ratio between two colors.
 * Returns a ContrastResult.
 */
export function computeContrast(foreground: string, background: string): ContrastResult {
  const fg = luminance(foreground);
  const bg = luminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    passesAAA: ratio >= 7,
    foregroundLuminance: fg,
    backgroundLuminance: bg,
  };
}

// ─── AUDIT STATE ────────────────────────────────────────────────

export function createA11yAuditState(overrides?: Partial<A11yAuditState>): A11yAuditState {
  return {
    prefersReducedMotion: false,
    rootFontSize: 16,
    complianceMode: 'AA',
    focusIndicator: {
      outlineWidth: 2,
      visible: true,
      color: '#3b82f6',
    },
    ...overrides,
  };
}

// ─── INDIVIDUAL RULES ───────────────────────────────────────────

export function checkKeyboardNavigation(element: A11yElement): A11yRuleResult {
  // Interactive elements must be focusable
  const passes = !element.interactive || element.focusable === true;

  return {
    ruleId: 'keyboard_nav',
    guideline: 'keyboard_navigation',
    passed: passes,
    severity: passes ? undefined : 'critical',
    message: passes ? undefined : 'Interactive element is not keyboard focusable',
    target: element.elementType,
    wcagCriterion: '2.1.1',
    remediation: passes ? undefined : 'Add tabindex="0" or use a native focusable element',
  };
}

export function checkVisibleFocus(
  element: A11yElement,
  state: A11yAuditState,
): A11yRuleResult {
  if (!element.focusable) {
    return { ruleId: 'visible_focus_n/a', guideline: 'visible_focus', passed: true };
  }
  const passes = state.focusIndicator.visible && state.focusIndicator.outlineWidth >= 1;
  return {
    ruleId: 'visible_focus',
    guideline: 'visible_focus',
    passed: passes,
    severity: passes ? undefined : 'serious',
    message: passes ? undefined : 'Focus indicator not visible or too thin',
    target: element.elementType,
    wcagCriterion: '2.4.7',
    remediation: passes ? undefined : 'Ensure visible focus outline of at least 1px on all focusable elements',
  };
}

export function checkSemanticElement(element: A11yElement): A11yRuleResult {
  const headingAttrs = element.role === 'heading' || element.role?.startsWith('heading');
  const passes = !headingAttrs || element.hasAccessibleName === true;
  return {
    ruleId: 'semantic',
    guideline: 'semantic_elements',
    passed: passes,
    severity: passes ? undefined : 'serious',
    message: passes ? undefined : 'Element with heading role has no accessible name',
    target: element.elementType,
    wcagCriterion: '1.3.1',
    remediation: passes ? undefined : 'Provide an accessible label via text content or aria-label',
  };
}

export function checkTooltipAccessible(element: A11yElement): A11yRuleResult {
  // Tooltips must be keyboard accessible and not sole indicator
  if (element.role !== 'tooltip') {
    return { ruleId: 'tooltip_n/a', guideline: 'accessible_tooltips', passed: true };
  }
  const passes = !!(element.text || element.hasAccessibleName);
  return {
    ruleId: 'tooltip',
    guideline: 'accessible_tooltips',
    passed: passes,
    severity: passes ? undefined : 'moderate',
    message: passes ? undefined : 'Tooltip lacks accessible text',
    target: element.elementType,
    wcagCriterion: '1.3.1',
    remediation: passes ? undefined : 'Add text content or aria-label to the tooltip',
  };
}

export function checkColorNotSoleIndicator(element: A11yElement): A11yRuleResult {
  // Without seeing the visual, infer: if text has no aria/name, rely on additional signal
  if (element.interactive && !element.text && !element.hasAccessibleName) {
    return {
      ruleId: 'color_indicator',
      guideline: 'color_not_sole_indicator',
      passed: false,
      severity: 'serious',
      message: 'Element conveys state with color only, no text/aria alternative',
      target: element.elementType,
      wcagCriterion: '1.4.1',
      remediation: 'Add text, icon, or aria-label to convey the same information as color',
    };
  }
  return { ruleId: 'color_indicator_ok', guideline: 'color_not_sole_indicator', passed: true };
}

export function checkSufficientContrast(
  element: A11yElement,
  state: A11yAuditState,
): A11yRuleResult {
  if (!element.color || !element.backgroundColor) {
    // No colors provided, cannot evaluate — assume pass for non-visual evaluation
    return { ruleId: 'contrast_n/a', guideline: 'sufficient_contrast', passed: true };
  }
  const contrast = computeContrast(element.color, element.backgroundColor);
  const threshold = state.complianceMode === 'AAA' ? 7 : 4.5;
  const passes = contrast.ratio >= threshold;

  return {
    ruleId: 'contrast',
    guideline: 'sufficient_contrast',
    passed: passes,
    severity: passes ? undefined : passes === false && contrast.ratio >= 3 ? 'serious' : 'critical',
    message: passes ? undefined : `Contrast ${contrast.ratio.toFixed(1)}:1 below ${threshold}:1 (AA)`,
    target: element.elementType,
    wcagCriterion: state.complianceMode === 'AAA' ? '1.4.6' : '1.4.3',
    remediation: passes ? undefined : 'Increase foreground/background contrast to meet the required ratio',
  };
}

export function checkScreenReaderLabel(
  element: A11yElement,
  state: A11yAuditState,
): A11yRuleResult {
  // Interactive/input elements need accessible name
  const isFormControl = ['button', 'input', 'select', 'textarea', 'a'].includes(element.elementType.toLowerCase());
  const needsLabel = element.interactive || isFormControl;
  if (!needsLabel) {
    return { ruleId: 'label_n/a', guideline: 'screen_reader_labels', passed: true };
  }
  const passes = element.hasAccessibleName === true || !!element.aria?.['aria-label'] || !!element.aria?.['aria-labelledby'];

  return {
    ruleId: 'screen_reader_label',
    guideline: 'screen_reader_labels',
    passed: passes,
    severity: passes ? undefined : 'critical',
    message: passes ? undefined : 'Interactive element missing accessible name for screen readers',
    target: element.elementType,
    wcagCriterion: '4.1.2',
    remediation: passes ? undefined : 'Add aria-label, aria-labelledby, or text content to label the element',
  };
}

export function checkReducedMotion(
  element: A11yElement,
  state: A11yAuditState,
): A11yRuleResult {
  // Any element with continuous animation (indicated by 'animated' role/attr) must degrade
  const isAnimated = element.aria?.['aria-live'] === 'assertive' || element.role === 'marquee';
  const passes = !isAnimated || state.prefersReducedMotion === false;

  return {
    ruleId: 'reduced_motion',
    guideline: 'reduced_motion',
    passed: passes,
    severity: passes ? undefined : 'moderate',
    message: passes ? undefined : 'Element with continuous animation active under reduced motion preference',
    target: element.elementType,
    wcagCriterion: '2.3.3',
    remediation: passes ? undefined : 'Respect prefers-reduced-motion and disable or slow continuous animation',
  };
}

export function checkScalableText(
  element: A11yElement,
  state: A11yAuditState,
): A11yRuleResult {
  if (!element.fontSize) {
    return { ruleId: 'scale_n/a', guideline: 'scalable_text', passed: true };
  }
  // Text must be scalable (not fixed below a threshold relative to root)
  const passes = element.fontSize >= state.rootFontSize * 0.8;
  return {
    ruleId: 'scalable_text',
    guideline: 'scalable_text',
    passed: passes,
    severity: passes ? undefined : 'serious',
    message: passes ? undefined : `Font size ${element.fontSize}px may not scale adequately (root ${state.rootFontSize}px)`,
    target: element.elementType,
    wcagCriterion: '1.4.4',
    remediation: passes ? undefined : 'Use relative font sizes (rem/em) instead of fixed pixel sizes',
  };
}

export function checkDialogAccessible(element: A11yElement): A11yRuleResult {
  if (!element.isDialog) {
    return { ruleId: 'dialog_n/a', guideline: 'accessible_dialogs', passed: true };
  }
  // Dialog needs: role dialog, accessible name, focus trap
  const hasRole = element.role === 'dialog';
  const hasName = element.hasAccessibleName === true;
  const passes = hasRole && hasName;

  return {
    ruleId: 'dialog',
    guideline: 'accessible_dialogs',
    passed: passes,
    severity: passes ? undefined : 'critical',
    message: passes ? undefined : 'Dialog missing role="dialog" or accessible name',
    target: element.elementType,
    wcagCriterion: '4.1.2',
    remediation: passes ? undefined : 'Add role="dialog" and aria-label/aria-labelledby to the dialog',
  };
}

export function checkFocusTrap(element: A11yElement): A11yRuleResult {
  if (!element.inDialog) {
    return { ruleId: 'focus_trap_n/a', guideline: 'focus_trap', passed: true };
  }
  // Elements inside dialogs must be focusable (tabbable)
  const passes = !element.interactive || element.focusable === true;
  return {
    ruleId: 'focus_trap',
    guideline: 'focus_trap',
    passed: passes,
    severity: passes ? undefined : 'serious',
    message: passes ? undefined : 'Interactive element inside dialog is not focus-tabbable',
    target: element.elementType,
    wcagCriterion: '2.1.2',
    remediation: passes ? undefined : 'Ensure all interactive elements in dialog are reachable by tab',
  };
}

// ─── FULL AUDIT ─────────────────────────────────────────────────

export function runA11yAudit(
  elements: A11yElement[],
  state: A11yAuditState,
): A11yReport {
  // Recursively flatten
  const flat: A11yElement[] = [];
  const flatten = (el: A11yElement) => {
    flat.push(el);
    (el.children ?? []).forEach(flatten);
  };
  elements.forEach(flatten);

  const results: A11yRuleResult[] = [];
  for (const el of flat) {
    // Rule functions that depend on element (not element+state)
    const ruleChecks: Array<() => A11yRuleResult> = [
      () => checkKeyboardNavigation(el),
      () => checkVisibleFocus(el, state),
      () => checkSemanticElement(el),
      () => checkTooltipAccessible(el),
      () => checkColorNotSoleIndicator(el),
      () => checkSufficientContrast(el, state),
      () => checkScreenReaderLabel(el, state),
      () => checkReducedMotion(el, state),
      () => checkScalableText(el, state),
      () => checkDialogAccessible(el),
      () => checkFocusTrap(el),
    ];
    for (const check of ruleChecks) {
      const r = check();
      if (!r.ruleId.endsWith('_n/a')) {
        results.push(r);
      }
    }
  }

  const failures = results.filter((r) => !r.passed);
  const severityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const f of failures) {
    if (f.severity) severityCounts[f.severity]++;
  }

  const passRate = results.length > 0 ? 1 - failures.length / results.length : 1;

  // Recommendations grouped by guideline
  const recommendations: A11yRecommendation[] = [];
  const byGuideline = new Map<A11yGuideline, A11yRuleResult[]>();
  for (const f of failures) {
    const group = byGuideline.get(f.guideline) ?? [];
    group.push(f);
    byGuideline.set(f.guideline, group);
  }

  for (const [guideline, group] of byGuideline) {
    const worst = group.reduce<A11ySeverity>((worst, r) => {
      if (!r.severity) return worst;
      const order = ['critical', 'serious', 'moderate', 'minor'];
      return order.indexOf(r.severity) < order.indexOf(worst) ? r.severity : worst;
    }, 'minor');
    recommendations.push({
      guideline,
      severity: worst,
      title: `Fix ${guideline.replace(/_/g, ' ')}`,
      description: group[0].message ?? '',
      wcagCriterion: group[0].wcagCriterion,
      remediation: group[0].remediation ?? '',
      elementCount: group.length,
    });
  }

  return {
    generatedAt: Date.now(),
    elementCount: flat.length,
    results,
    failures: failures.length,
    severityCounts: severityCounts as A11yReport['severityCounts'],
    passRate,
    conformant: severityCounts.critical === 0 && severityCounts.serious === 0,
    recommendations,
  };
}
