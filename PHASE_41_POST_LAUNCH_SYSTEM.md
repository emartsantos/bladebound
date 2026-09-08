# Phase 41 — Post-Launch System

## Status: Implemented — `@premium-rpg/telemetry` (41 passing tests, typecheck-clean)

A new workspace package `packages/telemetry` delivers all four Phase 41 subsystems
as pure TypeScript modules (no DOM/RN deps, node-environment vitest suite):

### 1. Telemetry System (`src/telemetry.ts`)
- **Consent-gated, privacy-first**: events are only recorded once consent is
  `granted` (`pending` → `denied`/`granted`); denied => silent, nothing buffered.
  Consent persists via an injectable `StorageLike` (`premium-rpg-telemetry-consent`).
- **Event types**: `session_start`, `session_end`, `feature_used`, `milestone`,
  `purchase`, `error` — each carries `sessionId` + monotonic `ts` (injectable
  `now()` for deterministic tests).
- **Sensitive-field stripping**: keys like `token`/`auth`/`email`/`name`/
  `deviceId`/`password` are sanitized out of every event before storage.
- **Offline-safe batching**: configurable `batchSize` (default 20) triggers
  automatic flush; on transport failure the batch is re-buffered for retry
  (never dropped silently).
- **Aggregation helper**: `summarize()` → totals by event type, per-feature
  counts, milestone counts, purchase count/value (feeds Phase 13-style
  balancing/analytics reports).
- Integration points: `useFeature('combat'|'crafting'|'mining'|...)`,
  `reachMilestone('level_10')`, `logError(...)`, `recordPurchase(...)`.

### 2. Update Monitoring (`src/update-monitor.ts`)
- Strict version parsing (`1.2.3`, tolerates `-suffix`; rejects malformed).
- `compareVersions` / `checkForUpdate(current, latest, minRequired)` →
  `updateAvailable` + `required` (below minimum required).
- `shouldPromptUpdate(...)` with cooldown → `'prompt' | 'suppress-cooldown' | 'required'`
  (required bypasses cooldown; first-run prompts when no prior prompt).

### 3. Live-Ops Tools (`src/live-ops.ts`)
- `LiveOpsEvent`: scheduled `[startsAt, endsAt]` window + `enabled` toggle,
  bonus **multipliers**, **item rotations**, region/event **unlocks**.
- `isEventActive` / `getActiveEvents` (sorted); multipliers applied per-key at
  the **highest** factor across overlapping events (`applyMultipliers`);
  `getRotatedItems` / `getUnlockedRegions` — all strictly active-window aware.
- Ties into Phase 36 content expansion for event-driven drops/XP boosts.

### 4. Player Retention (`src/retention.ts`)
- **Daily login bonus**: week-cycling reward tiers (`DAILY_REWARD_TIERS`),
  UTC-safe day maths (`toDayKey`/`dayDifference`), reset-proof streak tracking.
- **Streak tracking**: consecutive-day extension, `graceDays` for near-misses,
  best-streak preservation, no double-claim same day, rollover via `newDay()`.
- **Achievement reminders**: `shouldShowAchievementReminder` cooldown logic.
- Push-notification framework integration intended via the outer app layers
  (web/mobile shells); scheduling primitives are pure and testable here.

### CI / Workspace
- `.github/workflows/ci.yml`: telemetry added to package type-check + unit-test steps.
- Root `typecheck:all` includes `packages/telemetry`.
- NOTE: as a new npm workspace, the root `package-lock.json` must be refreshed
  (`npm install`) once this monorepo is next installed — `npm ci` in CI will
  regenerate/validate against it.
- Crash reporting (Sentry/Crashlytics) remains an optional external wiring step;
  `Telemetry.logError` is the internal funnel for it.

### Tests
- `tests/telemetry.test.ts` (11), `tests/update-monitor.test.ts` (9),
  `tests/live-ops.test.ts` (8), `tests/retention.test.ts` (13) — 41 total, all passing.
- Typecheck: `tsc --noEmit -p packages/telemetry/tsconfig.json` → clean.

### Blocked See Details
- None locally. External services (analytics endpoint, Sentry, push provider,
  App Store/Play update channels) require deployment infrastructure from Phase 40.