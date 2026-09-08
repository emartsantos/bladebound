# Phase 33 — Mobile API Readiness (COMPLETED)

## Summary
Audit of every game system for mobile API readiness before React Native. Confirms game state is obtainable via APIs without needing DOM logic. Provides a framework-independent API client and shared-logic audit. Share logic, not DOM.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/mobile.ts` | Types: 21 systems, API contracts, audit reports, endpoint defs, API client config/results, feature audit |
| `packages/game-engine/src/mobile.ts` | Engine: contract audit, full system audit, URL builder, response validation, dispatchable API client, feature audit, shared-logic audit |
| `packages/game-engine/tests/mobile.test.ts` | 24 tests: contract audit, full audit, URL building, response validation, API dispatch, feature audit, shared logic |

## API

**Contract Audit** (`auditSystemContract`)
- Rules: state must be retrievable via API, no DOM dependency, at least one transport, at least one endpoint

**Full System Audit** (`runMobileApiAudit`)
- Audits every game system (21 systems: auth, player_state, inventory, equipment, skills, quests, world, regions, dungeons, combat, enemies, loot, economy, crafting, npc, achievements, collections, tasks, offline, notifications, settings)
- Returns mobile-ready vs blocked systems, pass rate, severity-tagged recommendations

**API Client** (`buildEndpointUrl`, `validateApiResponse`, `dispatchApiRequest`)
- URL building with query params (no DOM globals, framework-independent)
- Response validation against required fields
- Injected fetch function (makes it usable in React Native, Node, browser)
- Retry policy with configurable retries
- Returns structured `ApiResult<T>` with status, data, error, duration

**Feature Audit** (`auditMobileFeature`)
- Verifies all dependencies of a mobile feature are mobile-ready

**Shared-Logic Audit** (`auditSharedLogic`)
- Categorizes systems by what's shared: types, formulas, validation

## Design Decisions

- **No DOM globals**: the engine uses `Date.now()`, `encodeURIComponent`, and injected fetch — no `URLSearchParams`, `AbortSignal`, `performance`, or DOM. Works identically in React Native and Node.
- **Injected transport**: `dispatchApiRequest` takes a fetch function, decoupling it from any platform's fetch implementation.
- **Share logic, not DOM**: contracts require `requiresDom:false`; shared types/formulas/validation are all via the existing monorepo packages.
- **Injected fetch**: keeps the API client testable and platform-agnostic.

## Known Issue
The pre-existing flaky `itemization.test.ts` ("generates distinct stat combos") is unrelated to this phase — it's a source-level RNG test that passes on most reruns. All 27 other test files (648 tests) pass.
