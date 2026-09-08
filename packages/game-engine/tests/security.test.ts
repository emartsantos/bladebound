import { describe, it, expect } from 'vitest';
import {
  computeSaveHash,
  verifyRequestSignature,
  checkSaveIntegrity,
  checkItemDuplication,
  checkCurrencyDuplication,
  validateOfflineTime,
  checkReplayProtection,
  checkRequestIntegrity,
  checkAdminAccess,
  checkRateLimit,
  checkDatabaseConstraints,
  runSecurityAudit,
  DEFAULT_SECURITY_POLICY,
} from '../src/security';

// ─── HASH ───────────────────────────────────────────────────────

describe('computeSaveHash', () => {
  it('produces a string hash', () => {
    const hash = computeSaveHash({ a: 1, b: 'test' });
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('h_')).toBe(true);
  });

  it('same input gives same hash', () => {
    const h1 = computeSaveHash({ x: 10, y: 20 });
    const h2 = computeSaveHash({ x: 10, y: 20 });
    expect(h1).toBe(h2);
  });

  it('different input gives different hash', () => {
    const h1 = computeSaveHash({ a: 1 });
    const h2 = computeSaveHash({ a: 2 });
    expect(h1).not.toBe(h2);
  });

  it('key order does not matter', () => {
    const h1 = computeSaveHash({ b: 2, a: 1 });
    const h2 = computeSaveHash({ a: 1, b: 2 });
    expect(h1).toBe(h2);
  });
});

describe('verifyRequestSignature', () => {
  it('validates correct signature', () => {
    const payload = JSON.stringify({ action: 'test' });
    const secret = 'mysecret';
    const sig = computeSaveHash({ payload, secret });
    expect(verifyRequestSignature(payload, sig, secret)).toBe(true);
  });

  it('rejects wrong secret', () => {
    const payload = 'data';
    const sig = computeSaveHash({ payload, secret: 'right' });
    expect(verifyRequestSignature(payload, sig, 'wrong')).toBe(false);
  });

  it('rejects tampered payload', () => {
    const sig = computeSaveHash({ payload: 'original', secret: 's' });
    expect(verifyRequestSignature('tampered', sig, 's')).toBe(false);
  });
});

// ─── SAVE INTEGRITY ─────────────────────────────────────────────

describe('checkSaveIntegrity', () => {
  it('passes with valid save', () => {
    const result = checkSaveIntegrity({
      playerId: 'p1',
      expectedPlayerId: 'p1',
      version: 1,
      currentVersion: 1,
      lastSavedAt: 1000,
      previousSavedAt: 900,
      level: 10,
      experience: 500,
      inventory: [{ quantity: 5 }],
      gold: 1000,
    });
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('fails on hash mismatch', () => {
    const result = checkSaveIntegrity({
      hash: 'wrong_hash',
      hashData: { data: 'test' },
    });
    expect(result.hashValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on negative level', () => {
    const result = checkSaveIntegrity({ level: -1 });
    expect(result.progressionValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on negative gold', () => {
    const result = checkSaveIntegrity({ gold: -100 });
    expect(result.currencyValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on negative inventory quantity', () => {
    const result = checkSaveIntegrity({ inventory: [{ quantity: -5 }] });
    expect(result.inventoryValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on player ID mismatch', () => {
    const result = checkSaveIntegrity({ playerId: 'p1', expectedPlayerId: 'p2' });
    expect(result.playerIdValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on non-monotonic timestamps', () => {
    const result = checkSaveIntegrity({ lastSavedAt: 100, previousSavedAt: 200 });
    expect(result.timestampsValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on schema version mismatch', () => {
    const result = checkSaveIntegrity({ version: 1, currentVersion: 2 });
    expect(result.schemaValid).toBe(false);
    expect(result.passed).toBe(false);
  });
});

// ─── ITEM DUPLICATION ───────────────────────────────────────────

describe('checkItemDuplication', () => {
  it('passes with valid inventory', () => {
    const result = checkItemDuplication([
      { itemId: 'sword', quantity: 1 },
      { itemId: 'potion', quantity: 10 },
    ], 999);
    expect(result.passed).toBe(true);
  });

  it('detects negative quantity', () => {
    const result = checkItemDuplication([
      { itemId: 'sword', quantity: -1 },
    ], 999);
    expect(result.negativeQuantity).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('detects stack overflow', () => {
    const result = checkItemDuplication([
      { itemId: 'sword', quantity: 1000 },
    ], 999);
    expect(result.stackOverflow).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('passes empty inventory', () => {
    const result = checkItemDuplication([], 999);
    expect(result.passed).toBe(true);
  });
});

// ─── CURRENCY DUPLICATION ───────────────────────────────────────

describe('checkCurrencyDuplication', () => {
  it('passes with valid delta', () => {
    const result = checkCurrencyDuplication(1100, 100, 1000, 1000000);
    expect(result.passed).toBe(true);
  });

  it('detects negative gold', () => {
    const result = checkCurrencyDuplication(-100, 0, 0, 1000000);
    expect(result.nonNegative).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('detects inconsistent delta', () => {
    const result = checkCurrencyDuplication(1500, 100, 1000, 1000000);
    expect(result.deltaConsistent).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('detects overflow', () => {
    const result = checkCurrencyDuplication(2000000, 1000000, 1000000, 1000000);
    expect(result.noOverflow).toBe(false);
    expect(result.passed).toBe(false);
  });
});

// ─── OFFLINE TIME ───────────────────────────────────────────────

describe('validateOfflineTime', () => {
  it('passes within limits', () => {
    const result = validateOfflineTime(3600000, 28800000);
    expect(result.passed).toBe(true);
  });

  it('fails when exceeding maximum', () => {
    const result = validateOfflineTime(30000000, 28800000);
    expect(result.exceedsMaximum).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('detects server drift', () => {
    const result = validateOfflineTime(10000, 28800000, 5000, 1000);
    expect(result.deviatesFromServer).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('passes when within server estimate', () => {
    const result = validateOfflineTime(10000, 28800000, 10500, 1000);
    expect(result.deviatesFromServer).toBe(false);
    expect(result.passed).toBe(true);
  });
});

// ─── REPLAY PROTECTION ──────────────────────────────────────────

describe('checkReplayProtection', () => {
  it('passes with fresh unique nonce', () => {
    const used = new Set<string>();
    const result = checkReplayProtection('nonce1', Date.now(), Date.now(), 60000, 300000, used);
    expect(result.passed).toBe(true);
  });

  it('detects reused nonce', () => {
    const used = new Set(['nonce1']);
    const result = checkReplayProtection('nonce1', Date.now(), Date.now(), 60000, 300000, used);
    expect(result.nonceReused).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('detects stale request', () => {
    const old = Date.now() - 120000;
    const result = checkReplayProtection('nonce2', old, Date.now(), 60000, 300000, new Set());
    expect(result.stale).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('detects clock drift', () => {
    const farFuture = Date.now() + 600000;
    const result = checkReplayProtection('nonce3', farFuture, Date.now(), 3600000, 300000, new Set());
    expect(result.clockDrift).toBe(true);
    expect(result.passed).toBe(false);
  });
});

// ─── REQUEST INTEGRITY ──────────────────────────────────────────

describe('checkRequestIntegrity', () => {
  it('passes with valid request', () => {
    const result = checkRequestIntegrity(
      { name: 'test', count: 5 },
      ['name', 'count'],
      { name: 'string', count: 'number' },
      { count: { min: 0, max: 100 } },
    );
    expect(result.passed).toBe(true);
  });

  it('fails on missing field', () => {
    const result = checkRequestIntegrity(
      { name: 'test' },
      ['name', 'count'],
      { name: 'string', count: 'number' },
      {},
    );
    expect(result.requiredFieldsPresent).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on type mismatch', () => {
    const result = checkRequestIntegrity(
      { count: 'not_a_number' },
      ['count'],
      { count: 'number' },
      {},
    );
    expect(result.typesValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('fails on bounds violation', () => {
    const result = checkRequestIntegrity(
      { count: 200 },
      ['count'],
      { count: 'number' },
      { count: { min: 0, max: 100 } },
    );
    expect(result.boundsValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('detects injection', () => {
    const result = checkRequestIntegrity(
      { data: '<script>alert(1)</script>' },
      ['data'],
      { data: 'string' },
      {},
    );
    expect(result.noInjection).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('detects SQL injection', () => {
    const result = checkRequestIntegrity(
      { query: '; DROP TABLE users;' },
      ['query'],
      { query: 'string' },
      {},
    );
    expect(result.noInjection).toBe(false);
    expect(result.passed).toBe(false);
  });
});

// ─── ADMIN ACCESS ───────────────────────────────────────────────

describe('checkAdminAccess', () => {
  it('passes with valid admin', () => {
    const result = checkAdminAccess(true, true, true);
    expect(result.passed).toBe(true);
  });

  it('fails on invalid session', () => {
    const result = checkAdminAccess(false, true, true);
    expect(result.passed).toBe(false);
  });

  it('fails on unauthorized', () => {
    const result = checkAdminAccess(true, false, true);
    expect(result.passed).toBe(false);
  });

  it('fails on hierarchy violation', () => {
    const result = checkAdminAccess(true, true, true, 3, 2);
    expect(result.noHierarchyViolation).toBe(false);
    expect(result.passed).toBe(false);
  });
});

// ─── RATE LIMITING ──────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('passes within limit', () => {
    const result = checkRateLimit(50, 100, 60000);
    expect(result.passed).toBe(true);
    expect(result.remaining).toBe(50);
  });

  it('fails when exceeded', () => {
    const result = checkRateLimit(100, 100, 60000);
    expect(result.exceeded).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('remaining is 0 at limit', () => {
    const result = checkRateLimit(100, 100, 60000);
    expect(result.remaining).toBe(0);
  });
});

// ─── DATABASE CONSTRAINTS ───────────────────────────────────────

describe('checkDatabaseConstraints', () => {
  it('passes with valid records', () => {
    const result = checkDatabaseConstraints([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ], 'id');
    expect(result.passed).toBe(true);
  });

  it('detects duplicate primary keys', () => {
    const result = checkDatabaseConstraints([
      { id: '1', name: 'a' },
      { id: '1', name: 'b' },
    ], 'id');
    expect(result.uniqueConstraintsValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('detects null primary keys', () => {
    const result = checkDatabaseConstraints([
      { id: undefined, name: 'a' },
    ], 'id');
    expect(result.notNullValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('passes empty records', () => {
    const result = checkDatabaseConstraints([], 'id');
    expect(result.passed).toBe(true);
  });
});

// ─── FULL SECURITY AUDIT ────────────────────────────────────────

describe('runSecurityAudit', () => {
  const now = Date.now();
  const baseParams = {
    playerId: 'p1',
    save: { version: 1, currentVersion: 1 },
    inventory: [{ itemId: 'sword', quantity: 1 }],
    gold: 1000,
    previousGold: 900,
    claimedOfflineMs: 3600000,
    requestNonce: 'nonce_abc',
    requestTimestamp: now,
    serverTime: now,
    requestPayload: { action: 'test' },
    requiredFields: ['action'],
    typeSchema: { action: 'string' },
    boundsSchema: {},
    usedNonces: new Set<string>(),
    currentRequestCount: 10,
  };

  it('passes with clean state', () => {
    const report = runSecurityAudit(baseParams);
    expect(report.overallPassed).toBe(true);
    expect(report.threats).toHaveLength(0);
    expect(report.criticalCount).toBe(0);
  });

  it('detects save manipulation', () => {
    const report = runSecurityAudit({
      ...baseParams,
      gold: -1000,
    });
    expect(report.saveIntegrity.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'save_manipulation')).toBe(true);
    expect(report.criticalCount).toBeGreaterThan(0);
  });

  it('detects item duplication', () => {
    const report = runSecurityAudit({
      ...baseParams,
      inventory: [{ itemId: 'sword', quantity: -5 }],
    });
    expect(report.itemDuplication.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'item_duplication')).toBe(true);
    expect(report.highCount).toBeGreaterThan(0);
  });

  it('detects currency duplication', () => {
    const report = runSecurityAudit({
      ...baseParams,
      gold: 99999999,
      previousGold: 1000,
    });
    expect(report.currencyDuplication.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'currency_duplication')).toBe(true);
  });

  it('detects offline time manipulation', () => {
    const report = runSecurityAudit({
      ...baseParams,
      claimedOfflineMs: 999999999,
    });
    expect(report.offlineTime.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'offline_time_manipulation')).toBe(true);
  });

  it('detects replay attack', () => {
    const report = runSecurityAudit({
      ...baseParams,
      usedNonces: new Set(['nonce_abc']),
    });
    expect(report.replayProtection.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'replay_attack')).toBe(true);
  });

  it('detects rate limit violation', () => {
    const report = runSecurityAudit({
      ...baseParams,
      currentRequestCount: 100,
    });
    expect(report.rateLimit.passed).toBe(false);
    expect(report.threats.some((t) => t.category === 'rate_limit_violation')).toBe(true);
  });

  it('strict mode fails on any threat', () => {
    const report = runSecurityAudit({
      ...baseParams,
      policy: { strictMode: true },
      currentRequestCount: 100,
    });
    expect(report.overallPassed).toBe(false);
  });

  it('reports timestamp', () => {
    const report = runSecurityAudit(baseParams);
    expect(report.timestamp).toBeGreaterThan(0);
  });
});

// ─── DEFAULT POLICY ─────────────────────────────────────────────

describe('DEFAULT_SECURITY_POLICY', () => {
  it('has reasonable defaults', () => {
    expect(DEFAULT_SECURITY_POLICY.maxOfflineTimeMs).toBeGreaterThan(0);
    expect(DEFAULT_SECURITY_POLICY.maxGold).toBeGreaterThan(0);
    expect(DEFAULT_SECURITY_POLICY.rateLimitMaxRequests).toBeGreaterThan(0);
    expect(DEFAULT_SECURITY_POLICY.strictMode).toBe(false);
  });
});
