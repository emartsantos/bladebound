import { describe, it, expect } from 'vitest';
import {
  computeContrast,
  hexToRgb,
  createA11yAuditState,
  checkKeyboardNavigation,
  checkVisibleFocus,
  checkSemanticElement,
  checkTooltipAccessible,
  checkColorNotSoleIndicator,
  checkSufficientContrast,
  checkScreenReaderLabel,
  checkReducedMotion,
  checkScalableText,
  checkDialogAccessible,
  checkFocusTrap,
  runA11yAudit,
} from '../src/accessibility';
import type { A11yElement } from '@premium-rpg/shared-types';

// ─── CONTRAST ───────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns null for invalid', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
});

describe('computeContrast', () => {
  it('black on white passes AA', () => {
    const r = computeContrast('#000000', '#ffffff');
    expect(r.ratio).toBeGreaterThan(17);
    expect(r.passesAA).toBe(true);
    expect(r.passesAALarge).toBe(true);
    expect(r.passesAAA).toBe(true);
  });

  it('white on black passes AA', () => {
    const r = computeContrast('#ffffff', '#000000');
    expect(r.passesAA).toBe(true);
  });

  it('low contrast fails AA', () => {
    const r = computeContrast('#777777', '#888888');
    expect(r.ratio).toBeLessThan(2);
    expect(r.passesAA).toBe(false);
  });

  it('ratio is symmetric', () => {
    const a = computeContrast('#112233', '#aabbcc');
    const b = computeContrast('#aabbcc', '#112233');
    expect(a.ratio).toBeCloseTo(b.ratio, 5);
  });
});

// ─── AUDIT STATE ────────────────────────────────────────────────

describe('createA11yAuditState', () => {
  it('has defaults', () => {
    const s = createA11yAuditState();
    expect(s.rootFontSize).toBe(16);
    expect(s.complianceMode).toBe('AA');
    expect(s.focusIndicator.visible).toBe(true);
  });

  it('accepts overrides', () => {
    const s = createA11yAuditState({ rootFontSize: 14, complianceMode: 'AAA' });
    expect(s.rootFontSize).toBe(14);
    expect(s.complianceMode).toBe('AAA');
  });
});

// ─── INDIVIDUAL RULES ───────────────────────────────────────────

describe('checkKeyboardNavigation', () => {
  it('passes interactive focusable element', () => {
    const r = checkKeyboardNavigation({ elementType: 'button', interactive: true, focusable: true });
    expect(r.passed).toBe(true);
  });

  it('fails interactive non-focusable element', () => {
    const r = checkKeyboardNavigation({ elementType: 'div', interactive: true, focusable: false });
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('critical');
    expect(r.wcagCriterion).toBe('2.1.1');
  });

  it('passes non-interactive element', () => {
    const r = checkKeyboardNavigation({ elementType: 'p', interactive: false });
    expect(r.passed).toBe(true);
  });
});

describe('checkVisibleFocus', () => {
  it('passes with visible focus', () => {
    const state = createA11yAuditState();
    const r = checkVisibleFocus({ elementType: 'a', focusable: true }, state);
    expect(r.passed).toBe(true);
  });

  it('fails with hidden focus', () => {
    const state = createA11yAuditState({ focusIndicator: { outlineWidth: 0, visible: false, color: '#000' } });
    const r = checkVisibleFocus({ elementType: 'a', focusable: true }, state);
    expect(r.passed).toBe(false);
  });

  it('skips non-focusable', () => {
    const r = checkVisibleFocus({ elementType: 'p', focusable: false }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });
});

describe('checkSemanticElement', () => {
  it('passes heading with name', () => {
    const r = checkSemanticElement({ elementType: 'h1', role: 'heading', hasAccessibleName: true });
    expect(r.passed).toBe(true);
  });

  it('fails heading without name', () => {
    const r = checkSemanticElement({ elementType: 'h2', role: 'heading', hasAccessibleName: false });
    expect(r.passed).toBe(false);
  });
});

describe('checkTooltipAccessible', () => {
  it('passes tooltip with text', () => {
    const r = checkTooltipAccessible({ elementType: 'div', role: 'tooltip', text: 'Info' });
    expect(r.passed).toBe(true);
  });

  it('fails tooltip without text', () => {
    const r = checkTooltipAccessible({ elementType: 'div', role: 'tooltip' });
    expect(r.passed).toBe(false);
  });

  it('skips non-tooltip', () => {
    const r = checkTooltipAccessible({ elementType: 'p' });
    expect(r.passed).toBe(true);
  });
});

describe('checkColorNotSoleIndicator', () => {
  it('passes interactive element with text', () => {
    const r = checkColorNotSoleIndicator({ elementType: 'button', interactive: true, text: 'Attack' });
    expect(r.passed).toBe(true);
  });

  it('fails interactive element with color only', () => {
    const r = checkColorNotSoleIndicator({ elementType: 'button', interactive: true });
    expect(r.passed).toBe(false);
    expect(r.wcagCriterion).toBe('1.4.1');
  });
});

describe('checkSufficientContrast', () => {
  it('passes high contrast', () => {
    const r = checkSufficientContrast(
      { elementType: 'p', color: '#000000', backgroundColor: '#ffffff' },
      createA11yAuditState(),
    );
    expect(r.passed).toBe(true);
  });

  it('fails low contrast', () => {
    const r = checkSufficientContrast(
      { elementType: 'p', color: '#eeeeee', backgroundColor: '#ffffff' },
      createA11yAuditState(),
    );
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('critical');
  });

  it('uses AAA threshold in AAA mode', () => {
    const r = checkSufficientContrast(
      { elementType: 'p', color: '#999999', backgroundColor: '#ffffff' },
      createA11yAuditState({ complianceMode: 'AAA' }),
    );
    expect(r.passed).toBe(false);
    expect(r.wcagCriterion).toBe('1.4.6');
  });

  it('skips without colors', () => {
    const r = checkSufficientContrast({ elementType: 'p' }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });
});

describe('checkScreenReaderLabel', () => {
  it('passes button with aria-label', () => {
    const r = checkScreenReaderLabel(
      { elementType: 'button', interactive: true, aria: { 'aria-label': 'Close' } },
      createA11yAuditState(),
    );
    expect(r.passed).toBe(true);
  });

  it('passes input with accessible name', () => {
    const r = checkScreenReaderLabel({ elementType: 'input', hasAccessibleName: true }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });

  it('fails unlabeled button', () => {
    const r = checkScreenReaderLabel({ elementType: 'button', interactive: true }, createA11yAuditState());
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('critical');
  });

  it('skips non-interactive', () => {
    const r = checkScreenReaderLabel({ elementType: 'p' }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });
});

describe('checkReducedMotion', () => {
  it('passes when reduced motion off', () => {
    const r = checkReducedMotion({ elementType: 'div', role: 'marquee' }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });

  it('fails animated element under reduced motion', () => {
    const r = checkReducedMotion(
      { elementType: 'div', role: 'marquee' },
      createA11yAuditState({ prefersReducedMotion: true }),
    );
    expect(r.passed).toBe(false);
  });
});

describe('checkScalableText', () => {
  it('passes adequate font size', () => {
    const r = checkScalableText({ elementType: 'p', fontSize: 14 }, createA11yAuditState());
    expect(r.passed).toBe(true);
  });

  it('fails too-small font', () => {
    const r = checkScalableText({ elementType: 'p', fontSize: 8 }, createA11yAuditState());
    expect(r.passed).toBe(false);
  });
});

describe('checkDialogAccessible', () => {
  it('passes valid dialog', () => {
    const r = checkDialogAccessible({ elementType: 'div', isDialog: true, role: 'dialog', hasAccessibleName: true });
    expect(r.passed).toBe(true);
  });

  it('fails dialog without role', () => {
    const r = checkDialogAccessible({ elementType: 'div', isDialog: true });
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('critical');
  });
});

describe('checkFocusTrap', () => {
  it('passes focusable element in dialog', () => {
    const r = checkFocusTrap({ elementType: 'button', inDialog: true, interactive: true, focusable: true });
    expect(r.passed).toBe(true);
  });

  it('fails non-focusable interactive in dialog', () => {
    const r = checkFocusTrap({ elementType: 'button', inDialog: true, interactive: true, focusable: false });
    expect(r.passed).toBe(false);
  });

  it('skips outside dialog', () => {
    const r = checkFocusTrap({ elementType: 'button', interactive: true, focusable: false });
    expect(r.passed).toBe(true);
  });
});

// ─── FULL AUDIT ─────────────────────────────────────────────────

describe('runA11yAudit', () => {
  it('passes on clean elements', () => {
    const elements: A11yElement[] = [
      {
        elementType: 'button',
        interactive: true,
        focusable: true,
        hasAccessibleName: true,
        text: 'Attack',
        color: '#000000',
        backgroundColor: '#ffffff',
      },
      {
        elementType: 'h1',
        role: 'heading',
        hasAccessibleName: true,
        text: 'Title',
      },
    ];
    const report = runA11yAudit(elements, createA11yAuditState());
    expect(report.failures).toBe(0);
    expect(report.conformant).toBe(true);
    expect(report.passRate).toBe(1);
  });

  it('flags accessible-unfriendly elements', () => {
    const elements: A11yElement[] = [
      {
        elementType: 'div',
        interactive: true,
        focusable: false,
        hasAccessibleName: false,
      },
      {
        elementType: 'p',
        color: '#eeeeee',
        backgroundColor: '#ffffff',
      },
    ];
    const report = runA11yAudit(elements, createA11yAuditState());
    expect(report.failures).toBeGreaterThan(0);
    expect(report.severityCounts.critical).toBeGreaterThan(0);
    expect(report.conformant).toBe(false);
  });

  it('counts elements recursively', () => {
    const elements: A11yElement[] = [
      { elementType: 'div', children: [
        { elementType: 'button', interactive: true, focusable: true, hasAccessibleName: true, text: 'X' },
        { elementType: 'button', interactive: true, focusable: true, hasAccessibleName: true, text: 'Y' },
      ]},
    ];
    const report = runA11yAudit(elements, createA11yAuditState());
    expect(report.elementCount).toBe(3);
  });

  it('produces recommendations grouped by guideline', () => {
    const elements: A11yElement[] = [
      { elementType: 'button', interactive: true, focusable: false },
      { elementType: 'button', interactive: true, focusable: false },
    ];
    const report = runA11yAudit(elements, createA11yAuditState());
    const kb = report.recommendations.find((r) => r.guideline === 'keyboard_navigation');
    expect(kb).toBeDefined();
    expect(kb!.elementCount).toBe(2);
  });

  it('is conformant when no critical/serious', () => {
    const elements: A11yElement[] = [
      { elementType: 'button', interactive: true, focusable: true, hasAccessibleName: true, text: 'ok' },
    ];
    const report = runA11yAudit(elements, createA11yAuditState());
    expect(report.conformant).toBe(true);
  });
});
