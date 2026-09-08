import { describe, it, expect } from 'vitest';
import {
  classifyWidth,
  checkClipping,
  checkTableReadable,
  checkControlSize,
  checkHorizontalScroll,
  auditDeviceLayout,
  runResponsiveAudit,
  STANDARD_TARGETS,
} from '../src/responsive';
import type { LayoutElement } from '@premium-rpg/shared-types';

// ─── DEVICE CLASSIFICATION ──────────────────────────────────────

describe('classifyWidth', () => {
  it('classifies desktop', () => {
    expect(classifyWidth(1920)).toBe('desktop');
    expect(classifyWidth(1440)).toBe('desktop');
    expect(classifyWidth(1024)).toBe('desktop');
  });

  it('classifies tablet', () => {
    expect(classifyWidth(768)).toBe('tablet');
    expect(classifyWidth(640)).toBe('tablet');
  });

  it('classifies mobile', () => {
    expect(classifyWidth(639)).toBe('mobile');
    expect(classifyWidth(430)).toBe('mobile');
    expect(classifyWidth(360)).toBe('mobile');
  });
});

// ─── CLIPPING ───────────────────────────────────────────────────

describe('checkClipping', () => {
  it('passes element within viewport', () => {
    const r = checkClipping({ id: 'inventory', width: 300, left: 0 }, 1024);
    expect(r.passed).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it('fails element overflowing viewport', () => {
    const r = checkClipping({ id: 'table', width: 2000, left: 0 }, 1024);
    expect(r.passed).toBe(false);
    expect(r.reason).toBe('horizontal_clipping');
  });

  it('computes overflow px', () => {
    const r = checkClipping({ id: 'sidebar', width: 500, left: 600 }, 1024);
    expect(r.actual).toBe(76);
    expect(r.passed).toBe(false);
  });

  it('element at exact edge passes', () => {
    const r = checkClipping({ id: 'edge', width: 100, left: 924 }, 1024);
    expect(r.passed).toBe(true);
  });
});

// ─── TABLE READABILITY ──────────────────────────────────────────

describe('checkTableReadable', () => {
  it('passes readable table', () => {
    const r = checkTableReadable({ id: 'quests', isTable: true, columnCount: 4, minColumnWidth: 100 }, 768);
    expect(r.passed).toBe(true);
  });

  it('fails too-narrow columns', () => {
    const r = checkTableReadable({ id: 'stats', isTable: true, columnCount: 3, minColumnWidth: 20 }, 768);
    expect(r.passed).toBe(false);
    expect(r.reason).toBe('unreadable_table');
  });

  it('fails table exceeding viewport', () => {
    const r = checkTableReadable({ id: 'loot', isTable: true, columnCount: 10, minColumnWidth: 150 }, 768);
    expect(r.passed).toBe(false);
    expect(r.reason).toBe('unreadable_table');
  });
});

// ─── CONTROL SIZE ───────────────────────────────────────────────

describe('checkControlSize', () => {
  it('passes large control', () => {
    const r = checkControlSize({ id: 'btn', width: 60, height: 60, interactive: true });
    expect(r.passed).toBe(true);
  });

  it('passes 44x44 control', () => {
    const r = checkControlSize({ id: 'btn', width: 44, height: 44, interactive: true });
    expect(r.passed).toBe(true);
  });

  it('fails microscopic control', () => {
    const r = checkControlSize({ id: 'btn', width: 20, height: 20, interactive: true });
    expect(r.passed).toBe(false);
    expect(r.reason).toBe('microscopic_control');
  });
});

// ─── HORIZONTAL SCROLL ──────────────────────────────────────────

describe('checkHorizontalScroll', () => {
  it('passes no overflow', () => {
    const elements: LayoutElement[] = [
      { id: 'a', width: 300, left: 0 },
      { id: 'b', width: 300, left: 400 },
    ];
    const r = checkHorizontalScroll(elements, 1024);
    expect(r.passed).toBe(true);
  });

  it('fails unintended overflow', () => {
    const elements: LayoutElement[] = [
      { id: 'x', width: 2000, left: 0 },
    ];
    const r = checkHorizontalScroll(elements, 1024);
    expect(r.passed).toBe(false);
    expect(r.reason).toBe('horizontal_scroll');
  });

  it('ignores intentional scroll elements', () => {
    const elements: LayoutElement[] = [
      { id: 'carousel', width: 5000, left: 0, intentionalScroll: true },
    ];
    const r = checkHorizontalScroll(elements, 1024);
    expect(r.passed).toBe(true);
  });
});

// ─── DEVICE AUDIT ───────────────────────────────────────────────

describe('auditDeviceLayout', () => {
  it('audits a clean layout', () => {
    const elements: LayoutElement[] = [
      { id: 'nav', width: 200, left: 0 },
      { id: 'content', width: 800, left: 220 },
    ];
    const report = auditDeviceLayout(1366, elements);
    expect(report.device).toBe('desktop');
    expect(report.failures).toBe(0);
    expect(report.passed).toBe(true);
  });

  it('audits a desktop width as desktop', () => {
    const report = auditDeviceLayout(1024, []);
    expect(report.device).toBe('desktop');
  });

  it('audits a tablet width', () => {
    const report = auditDeviceLayout(768, []);
    expect(report.device).toBe('tablet');
  });

  it('audits a mobile width', () => {
    const report = auditDeviceLayout(430, []);
    expect(report.device).toBe('mobile');
  });

  it('detects failures', () => {
    const elements: LayoutElement[] = [
      { id: 'wide', width: 2000, left: 0 },
    ];
    const report = auditDeviceLayout(430, elements);
    expect(report.failures).toBeGreaterThan(0);
    expect(report.passed).toBe(false);
  });

  it('reports overflow x', () => {
    const elements: LayoutElement[] = [
      { id: 'wide', width: 2000, left: 0 },
    ];
    const report = auditDeviceLayout(430, elements);
    expect(report.overflowX).toBeGreaterThan(0);
    expect(report.overflowReason).toContain('overflow');
  });
});

// ─── FULL RESPONSIVE AUDIT ──────────────────────────────────────

describe('runResponsiveAudit', () => {
  it('has standard targets across device classes', () => {
    const devices = [...new Set(STANDARD_TARGETS.map((t) => t.device))];
    expect(devices).toContain('desktop');
    expect(devices).toContain('tablet');
    expect(devices).toContain('mobile');
  });

  it('audits all provided widths', () => {
    const report = runResponsiveAudit(
      [
        { width: 1920, elements: [{ id: 'nav', width: 232, left: 0 }] },
        { width: 768, elements: [{ id: 'nav', width: 100, left: 0 }] },
        { width: 430, elements: [{ id: 'nav', width: 50, left: 0 }] },
      ],
      STANDARD_TARGETS,
    );
    expect(report.deviceReports.length).toBe(STANDARD_TARGETS.length);
  });

  it('passes fully when everything fits', () => {
    const report = runResponsiveAudit(
      [
        { width: 1920, elements: [] },
        { width: 1440, elements: [] },
        { width: 1366, elements: [] },
        { width: 1024, elements: [] },
        { width: 768, elements: [] },
        { width: 430, elements: [] },
        { width: 390, elements: [] },
        { width: 360, elements: [] },
      ],
      STANDARD_TARGETS,
    );
    expect(report.totalFailures).toBe(0);
    expect(report.passRate).toBe(1);
    expect(report.primaryTargetsPass).toBe(true);
  });

  it('fails on clipping element', () => {
    const report = runResponsiveAudit(
      [
        { width: 1920, elements: [{ id: 'wide', width: 5000, left: 0 }] },
        { width: 1440, elements: [] },
        { width: 1366, elements: [] },
        { width: 1024, elements: [] },
        { width: 768, elements: [] },
        { width: 430, elements: [] },
        { width: 390, elements: [] },
        { width: 360, elements: [] },
      ],
      STANDARD_TARGETS,
    );
    expect(report.totalFailures).toBeGreaterThan(0);
    expect(report.summary.clipping).toBeGreaterThan(0);
    expect(report.primaryTargetsPass).toBe(false);
  });

  it('flags microscopic controls on mobile', () => {
    const report = runResponsiveAudit(
      [
        { width: 430, elements: [{ id: 'tiny', width: 20, height: 20, interactive: true }] },
      ],
      STANDARD_TARGETS,
    );
    expect(report.summary.controls).toBeGreaterThan(0);
    const rec = report.recommendations.find((r) => r.reason === 'microscopic_control');
    expect(rec).toBeDefined();
    expect(rec!.device).toBe('mobile');
  });

  it('flags unreadable tables', () => {
    const report = runResponsiveAudit(
      [
        { width: 430, elements: [{ id: 'table', isTable: true, columnCount: 10, minColumnWidth: 150 }] },
      ],
      STANDARD_TARGETS,
    );
    expect(report.summary.tables).toBeGreaterThan(0);
  });

  it('recommends remediation for failures', () => {
    const report = runResponsiveAudit(
      [
        { width: 430, elements: [{ id: 'wide', width: 5000, left: 0 }] },
      ],
      STANDARD_TARGETS,
    );
    const rec = report.recommendations.find((r) => r.reason === 'horizontal_clipping');
    expect(rec).toBeDefined();
    expect(rec!.remediation.length).toBeGreaterThan(0);
    expect(rec!.severity).toBe('critical');
  });
});
