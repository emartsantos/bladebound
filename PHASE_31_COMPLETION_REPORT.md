# Phase 31 — Accessibility (COMPLETED)

## Summary
WCAG compliance audit engine covering keyboard navigation, visible focus, semantics, tooltips, color-independence, contrast, screen-reader labels, reduced motion, scalable text, and accessible dialogs. Never sacrifice accessibility for the fantasy aesthetic.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/accessibility.ts` | Types: 14 guideline groups, audit rule results, element representation, contrast results, audit state, reports with recommendations |
| `packages/game-engine/src/accessibility.ts` | Engine: hex/RGB conversion, WCAG contrast ratio, 11 audit rules, full audit runner with severity counting and recommendations |
| `packages/game-engine/tests/accessibility.test.ts` | 44 tests: contrast math, audit state, all 11 rules, full audit orchestration |

## API

**Color Math** (`hexToRgb`, `computeContrast`)
- Hex parsing (3/6 digit) with luminance calculation
- WCAG contrast ratio with AA (4.5:1), AA large (3:1), AAA (7:1) checks

**Audit Rules** (11 rules)
- `checkKeyboardNavigation` — interactive elements must be focusable (WCAG 2.1.1)
- `checkVisibleFocus` — focus indicator visible with sufficient width (WCAG 2.4.7)
- `checkSemanticElement` — headings need accessible names (WCAG 1.3.1)
- `checkTooltipAccessible` — tooltips keyboard accessible with text (WCAG 1.3.1)
- `checkColorNotSoleIndicator` — state not conveyed by color alone (WCAG 1.4.1)
- `checkSufficientContrast` — WCAG AA/AAA contrast ratio (WCAG 1.4.3/1.4.6)
- `checkScreenReaderLabel` — interactive elements have accessible names (WCAG 4.1.2)
- `checkReducedMotion` — respects prefers-reduced-motion (WCAG 2.3.3)
- `checkScalableText` — relative font sizing (WCAG 1.4.4)
- `checkDialogAccessible` — dialogs have role + accessible name (WCAG 4.1.2)
- `checkFocusTrap` — all dialog content tab-reachable (WCAG 2.1.2)

**Full Audit** (`runA11yAudit`)
- Recursively flattens element tree
- Runs all applicable rules per element
- Counts failures by severity (critical/serious/moderate/minor)
- Computes pass rate and conformance (no critical/serious failures)
- Groups recommendations by guideline with WCAG criteria and remediation

**Audit State** (`createA11yAuditState`)
- Reduced motion preference, root font size, AA/AAA compliance mode, focus indicator config

## Design Decisions

- **WCAG-referenced rules**: every rule maps to a specific WCAG success criterion
- **No visual-only assumptions**: rules that require pixels (color, contrast) behave conservatively when data is absent
- **Severity tiers**: WCAG-focused `critical`/`serious`/`moderate`/`minor`, used to determine conformance
- **Configurable compliance mode**: audit can target AA or AAA
- **Recursive element traversal**: child elements are audited via nested structure
- **Native focusability preferred**: encourages native buttons/links over divs with click handlers
