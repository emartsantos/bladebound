// ─── RESPONSIVE WEB FINALIZATION ENGINE ─────────────────────────
// Phase 32: Width audit for desktop/tablet/mobile. No clipping, no
// unreadable tables, no microscopic controls, no horizontal scroll
// unless intentional. Desktop remains the richest experience.

import type {
  DeviceClass,
  DeviceTarget,
  DeviceLayoutReport,
  LayoutElement,
  ResponsiveCheckResult,
  ResponsiveFailureReason,
  ResponsiveAuditReport,
  ResponsiveRecommendation,
} from '@premium-rpg/shared-types';

import { STANDARD_TARGETS } from '@premium-rpg/shared-types';

export { STANDARD_TARGETS } from '@premium-rpg/shared-types';

// ─── DEVICE CLASSIFICATION ──────────────────────────────────────

export function classifyWidth(width: number): DeviceClass {
  if (width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

// ─── CHECKS ─────────────────────────────────────────────────────

export function checkClipping(element: LayoutElement, viewportWidth: number): ResponsiveCheckResult {
  const overflowX = (element.left ?? 0) + element.width - viewportWidth;
  const passed = overflowX <= 0;

  return {
    checkId: `clip_${element.id}`,
    viewportWidth,
    device: classifyWidth(viewportWidth),
    passed,
    reason: passed ? undefined : 'horizontal_clipping',
    message: passed
      ? `${element.id} fits within viewport width`
      : `${element.id} overflows viewport by ${overflowX}px (clips on the right)`,
    target: element.id,
    actual: overflowX,
    threshold: 0,
  };
}

export function checkTableReadable(
  element: LayoutElement,
  viewportWidth: number,
): ResponsiveCheckResult {
  const tableTotalWidth = (element.columnCount ?? 0) * (element.minColumnWidth ?? 0);
  // For tables, an "unreadable" table is one whose content width exceeds available
  // space without horizontal scroll, OR min column width too small to read text.
  const minReadable = 60; // px minimum comfortable column width
  const tooSmallColumns = element.minColumnWidth !== undefined && element.minColumnWidth < minReadable;
  const overflowWidth = tableTotalWidth - viewportWidth;

  const passed = !tooSmallColumns && overflowWidth <= 0;

  return {
    checkId: `table_${element.id}`,
    viewportWidth,
    device: classifyWidth(viewportWidth),
    passed,
    reason: passed ? undefined : tooSmallColumns ? 'unreadable_table' : 'unreadable_table',
    message: passed
      ? `${element.id} table is readable`
      : tooSmallColumns
        ? `${element.id} columns too narrow to read (${element.minColumnWidth}px < ${minReadable}px)`
        : `${element.id} table content width (${tableTotalWidth}px) exceeds viewport (${viewportWidth}px)`,
    target: element.id,
    actual: Math.max(tooSmallColumns ? element.minColumnWidth ?? 0 : tableTotalWidth, 0),
    threshold: tooSmallColumns ? minReadable : viewportWidth,
  };
}

export function checkControlSize(element: LayoutElement): ResponsiveCheckResult {
  // WCAG 2.5.5 target size minimum
  const minTarget = 44;
  const minHeight = 32;
  const widthOk = element.width >= minHeight;
  const heightOk = element.height === undefined || element.height >= minHeight;
  const passesTarget = element.width >= minTarget && (element.height === undefined || element.height >= minTarget);
  const passed = passesTarget;

  return {
    checkId: `control_${element.id}`,
    viewportWidth: 0,
    device: 'mobile',
    passed,
    reason: passed ? undefined : 'microscopic_control',
    message: passed
      ? `${element.id} is a usable control size`
      : widthOk || heightOk
        ? `${element.id} control below 44px target size (recommend ≥44px)`
        : `${element.id} control too small to interact reliably (${element.width}px)`,
    target: element.id,
    actual: Math.min(element.width, element.height ?? element.width),
    threshold: minTarget,
  };
}

export function checkHorizontalScroll(
  elements: LayoutElement[],
  viewportWidth: number,
): ResponsiveCheckResult {
  let maxRight = 0;
  for (const el of elements) {
    const right = (el.left ?? 0) + el.width;
    if (right > maxRight && !el.intentionalScroll) {
      maxRight = right;
    }
  }
  const overflowX = maxRight - viewportWidth;
  const passed = overflowX <= 0;

  return {
    checkId: `scroll_${viewportWidth}`,
    viewportWidth,
    device: classifyWidth(viewportWidth),
    passed,
    reason: passed ? undefined : 'horizontal_scroll',
    message: passed
      ? `No unintended horizontal scrolling at ${viewportWidth}px`
      : `${overflowX}px of horizontal scroll detected at ${viewportWidth}px`,
    actual: overflowX,
    threshold: 0,
  };
}

// ─── DEVICE-SPECIFIC AUDIT ──────────────────────────────────────

export function auditDeviceLayout(
  viewportWidth: number,
  elements: LayoutElement[],
  target?: DeviceTarget,
): DeviceLayoutReport {
  const device = target?.device ?? classifyWidth(viewportWidth);
  const checks: ResponsiveCheckResult[] = [];

  for (const el of elements) {
    checks.push(checkClipping(el, viewportWidth));
    // Only run table check where tables actually show this width's preference
    if (el.isTable) {
      checks.push(checkTableReadable(el, viewportWidth));
    }
  }
  checks.push(checkHorizontalScroll(elements, viewportWidth));

  const failures = checks.filter((c) => !c.passed).length;

  // Compute overflow to report
  let overflowX: number | undefined;
  let overflowReason: string | undefined;
  const overflowChecks = checks.filter((c) => c.reason === 'horizontal_clipping' || c.reason === 'horizontal_scroll');
  if (overflowChecks.length > 0) {
    overflowX = Math.max(0, ...overflowChecks.map((c) => c.actual ?? 0));
    overflowReason = `${overflowChecks.length} element(s) overflow`;
  }

  return {
    device,
    viewportWidth,
    checks,
    failures,
    passed: failures === 0,
    overflowX,
    overflowReason,
  };
}

// ─── FULL RESPONSIVE AUDIT ──────────────────────────────────────

export function runResponsiveAudit(
  elementsByWidth: Array<{ width: number; elements: LayoutElement[] }>,
  targets: DeviceTarget[] = STANDARD_TARGETS,
): ResponsiveAuditReport {
  const deviceReports: DeviceLayoutReport[] = [];
  const recommendations: ResponsiveRecommendation[] = [];
  const summary = { clipping: 0, tables: 0, controls: 0, horizontalScroll: 0, overflow: 0 };

  // Run control-size checks once (device-independent) against mobile targets
  for (const [i, widthTarget] of targets.entries()) {
    const elements = elementsByWidth.find((e) => e.width === widthTarget.width)?.elements ?? [];
    const report = auditDeviceLayout(widthTarget.width, elements, widthTarget);
    deviceReports.push(report);

    for (const check of report.checks) {
      if (check.passed) continue;
      switch (check.reason) {
        case 'horizontal_clipping': summary.clipping++; break;
        case 'unreadable_table': summary.tables++; break;
        case 'horizontal_scroll': summary.horizontalScroll++; break;
        case 'overflow': summary.overflow++; break;
      }

      const severity = widthTarget.primary
        ? check.reason === 'horizontal_clipping' || check.reason === 'microscopic_control'
          ? 'critical'
          : 'warning'
        : 'info';
      recommendations.push({
        device: report.device,
        viewportWidth: widthTarget.width,
        severity,
        title: `${check.message}`,
        description: `Failing target at ${widthTarget.width}px on ${report.device}`,
        reason: check.reason ?? 'overflow',
        target: check.target,
        remediation: remediationFor(check.reason),
      });
    }
  }

  // Control-size check against mobile element set regardless of targets
  const mobileSet = elementsByWidth.find((e) => e.width === 430)?.elements ?? [];
  for (const el of mobileSet) {
    if (el.interactive) {
      const controlCheck = checkControlSize(el);
      if (!controlCheck.passed) {
        summary.controls++;
        recommendations.push({
          device: 'mobile',
          viewportWidth: 430,
          severity: 'warning',
          title: controlCheck.message,
          description: `Interactive control ${el.id} too small on mobile`,
          reason: 'microscopic_control',
          target: el.id,
          remediation: 'Increase touch target to at least 44x44px',
        });
      }
    }
  }

  const totalChecks = deviceReports.reduce((s, r) => s + r.checks.length, 0);
  const totalFailures = deviceReports.reduce((s, r) => s + r.failures, 0);
  const passRate = totalChecks > 0 ? 1 - totalFailures / totalChecks : 1;

  const primaryTargets = targets.filter((t) => t.primary);
  const primaryReports = deviceReports.filter((r) => primaryTargets.some((t) => t.width === r.viewportWidth && t.device === r.device));
  const primaryTargetsPass = primaryReports.every((r) => r.passed);

  return {
    generatedAt: Date.now(),
    deviceReports,
    totalChecks,
    totalFailures,
    passRate,
    primaryTargetsPass,
    summary,
    recommendations,
  };
}

function remediationFor(reason?: ResponsiveFailureReason): string {
  switch (reason) {
    case 'horizontal_clipping':
      return 'Use fluid/percentage widths or wrap content; ensure elements reflow within available width';
    case 'unreadable_table':
      return 'Convert wide tables to stacked cards, or allow horizontal scroll with visible affordance';
    case 'microscopic_control':
      return 'Increase touch target to at least 44x44px with adequate spacing';
    case 'horizontal_scroll':
      return 'Prevent unintended overflow with min-width:0, overflow-wrap, and flexible layouts';
    case 'overflow':
      return 'Reflow overflowing containers with responsive grid/flexbox';
    default:
      return 'Review layout at this viewport width';
  }
}
