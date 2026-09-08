# Phase 35 — Mobile Quality

## Status: Unit test suite implemented; Detox E2E scaffolding added (requires CI simulator)

### Automated unit tests (runnable)
- **19 tests pass** across 3 files under `apps/mobile/__tests__/` (vitest, node env):
  - `player-data.test.ts` — `MOCK_PLAYER` snapshot integrity + `buildOfflineSummary` policy behavior (1-min minimum, 8h hard cap, determinism)
  - `regions-display.test.ts` — `buildRegionsDisplay()` projection from real `ALL_REGIONS` (enemy counts, unlock rules, boss fallback)
  - `onboarding.test.ts` — 5-step onboarding data (unique ids, non-empty copy, valid color keys, ordering)
- Config: `apps/mobile/vitest.config.ts`; script: `npm test` → `vitest run`
- Run: `npm test` from `apps/mobile` (or `npx vitest run`).

### Refactors that made logic testable
- Extracted `src/data/regions.ts` — `buildRegionsDisplay()` pure projection used by `AdventureScreen`
- Extracted `src/data/onboarding.ts` — `ONBOARDING_STEPS` data used by `OnboardingScreen`

### Bugs fixed during this phase
- `App.tsx` imported `AsyncStorage` from `expo-status-bar` → now from `@react-native-async-storage/async-storage`
- Onboarding step 4 used `colorKey: 'verdantBright'` which was not a `theme.colors` key → replaced with `'success'`
- `AdventureScreen` referenced `MOCK_PLAYER` without importing it (dungeon progress card)
- Added missing theme color tokens used by screens/components: `ember`, `bone`, `iron`, `amber`, `blackened`
- `buildRegionsDisplay` accepted mutable `Region[]` but `ALL_REGIONS` is `readonly Region[]`

### Detox E2E scaffolding
- `.detoxrc.json` — iOS simulator configuration
- `e2e/jest.config.js` — Detox jest runner wiring
- `e2e/smoke.e2e.js` — core flows: onboarding completion, home summary, region travel, inventory list, settings toggle
- Script: `npm run test:e2e`

### Blocked in this environment
- Detox can only execute against a built iOS binary on a simulator — no native build toolchain here (documented limitation). The unit suite above runs in CI without any simulator.
- The `react-navigation`, `async-storage`, `safe-area-context`, and `react-native` package installs in `apps/mobile/node_modules` are incomplete stubs (no `package.json`); a fresh `npm install` is required for a full `tsc` typecheck of the screens. Unit tests do not depend on those packages.

### CI integration
- Root `npm run test` includes this suite once workspaces resolve vitest (vitest is declared in `devDependencies`).
- Recommended GitHub Actions step later (Phase 40): `npm ci && npx vitest run` per workspace.