# Phase 29 — Security (COMPLETED)

## Summary
Comprehensive security audit framework covering 10 threat categories: save manipulation, item/currency duplication, offline-time manipulation, replay attacks, request tampering, admin bypass, rate limiting, database constraints, authentication/authorization. Never trust the browser.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/security.ts` | Types: 10 threat categories, save/integrity checks, audit report, security policy |
| `packages/game-engine/src/security.ts` | Engine: hash/signature verification, 10 validation functions, full audit runner |
| `packages/game-engine/tests/security.test.ts` | 58 tests: hash, save integrity, duplication, offline time, replay, request integrity, admin access, rate limiting, DB constraints, full audit |

## API

**Hash & Signature** (`computeSaveHash`, `verifyRequestSignature`)
- Deterministic hash for save tamper detection
- Request signature verification with shared secret

**Save Integrity** (`checkSaveIntegrity`)
- Validates: hash, schema version, timestamps monotonicity, player ID, progression bounds, inventory quantities, gold non-negative
- Returns failures array for specific issues

**Anti-Duplication** (`checkItemDuplication`, `checkCurrencyDuplication`)
- Item: stack overflow, negative quantity, quantity consistency
- Currency: non-negative, delta consistency, overflow against max

**Offline Time** (`validateOfflineTime`)
- Checks: exceeds maximum, deviates from server estimate
- Configurable max offline time and clock drift tolerance

**Replay Protection** (`checkReplayProtection`)
- Nonce reuse detection, stale request detection, clock drift detection
- Configurable max age and max clock drift

**Request Integrity** (`checkRequestIntegrity`)
- Required fields present, type validation, bounds checking
- Basic injection detection (XSS, SQL injection patterns)

**Admin Access** (`checkAdminAccess`)
- Session validity, capability authorization, operation allowance, hierarchy enforcement

**Rate Limiting** (`checkRateLimit`)
- Request count vs max in time window, remaining count

**Database Constraints** (`checkDatabaseConstraints`)
- Unique primary keys, not-null constraints, foreign key validation

**Full Audit** (`runSecurityAudit`)
- Runs all 10 checks in sequence, collects `ThreatDetection[]` with severity levels
- `overallPassed`: in strict mode requires all checks pass; in normal mode requires zero critical threats

## Design Decisions

- **Seeded hash for integrity**: not cryptographic but sufficient for client-side tamper detection; server should use proper HMAC in production
- **Configurable policy**: all thresholds (max offline time, rate limits, gold caps) are in `SecurityPolicy`
- **Threat severity levels**: critical (save manipulation), high (duplication, replay), medium (offline time, tampering, rate limit), low (database)
- **Strict vs normal mode**: strict mode fails on ANY check failure; normal mode only on critical threats
- **Injection detection**: basic pattern matching for XSS and SQL injection in request payloads
