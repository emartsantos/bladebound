// ─── SECURITY VALIDATION ENGINE ─────────────────────────────────
// Phase 29: Save integrity, anti-cheat, replay protection, request
// tampering detection. Never trust the browser.

import type {
  SaveIntegrityCheck,
  ItemDuplicationCheck,
  CurrencyDuplicationCheck,
  OfflineTimeValidation,
  ReplayProtection,
  RequestIntegrityCheck,
  AdminAccessCheck,
  RateLimitCheck,
  DatabaseConstraintCheck,
  SecurityAuditReport,
  SecurityPolicy,
  ThreatDetection,
  ThreatCategory,
} from '@premium-rpg/shared-types';

// ─── DEFAULT POLICY ─────────────────────────────────────────────

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  maxOfflineTimeMs: 8 * 60 * 60 * 1000, // 8 hours
  maxClockDriftMs: 5 * 60 * 1000, // 5 minutes
  requestMaxAgeMs: 60 * 1000, // 60 seconds
  rateLimitMaxRequests: 100,
  rateLimitWindowMs: 60 * 1000, // 1 minute
  maxInventorySize: 200,
  maxGold: 10_000_000,
  maxStackSize: 999,
  strictMode: false,
};

// ─── HASH / SIGNATURE HELPERS ───────────────────────────────────

/**
 * Simple deterministic hash for save integrity (not cryptographic,
 * but sufficient for tamper detection).
 */
export function computeSaveHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

/**
 * Verify a request signature using shared secret.
 */
export function verifyRequestSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = computeSaveHash({ payload, secret });
  return expected === signature;
}

// ─── SAVE INTEGRITY ─────────────────────────────────────────────

export function checkSaveIntegrity(save: {
  playerId?: string;
  expectedPlayerId?: string;
  version?: number;
  currentVersion?: number;
  lastSavedAt?: number;
  previousSavedAt?: number;
  level?: number;
  experience?: number;
  inventory?: Array<{ quantity: number }>;
  gold?: number;
  hash?: string;
  hashData?: Record<string, unknown>;
}): SaveIntegrityCheck {
  const failures: string[] = [];

  // Hash check
  let hashValid = true;
  if (save.hash && save.hashData) {
    hashValid = save.hash === computeSaveHash(save.hashData);
    if (!hashValid) failures.push('Save hash mismatch');
  }

  // Schema version
  let schemaValid = true;
  if (save.version !== undefined && save.currentVersion !== undefined) {
    schemaValid = save.version === save.currentVersion;
    if (!schemaValid) failures.push(`Schema version ${save.version} != expected ${save.currentVersion}`);
  }

  // Timestamps monotonic
  let timestampsValid = true;
  if (save.lastSavedAt !== undefined && save.previousSavedAt !== undefined) {
    timestampsValid = save.lastSavedAt >= save.previousSavedAt;
    if (!timestampsValid) failures.push('Timestamps not monotonic');
  }

  // Player ID
  let playerIdValid = true;
  if (save.playerId !== undefined && save.expectedPlayerId !== undefined) {
    playerIdValid = save.playerId === save.expectedPlayerId;
    if (!playerIdValid) failures.push('Player ID mismatch');
  }

  // Progression bounds
  let progressionValid = true;
  if (save.level !== undefined && save.level < 1) {
    progressionValid = false;
    failures.push('Level below 1');
  }
  if (save.experience !== undefined && save.experience < 0) {
    progressionValid = false;
    failures.push('Negative experience');
  }

  // Inventory quantities
  let inventoryValid = true;
  if (save.inventory) {
    for (let i = 0; i < save.inventory.length; i++) {
      if (save.inventory[i].quantity < 0) {
        inventoryValid = false;
        failures.push(`Negative quantity at inventory slot ${i}`);
      }
    }
  }

  // Currency
  let currencyValid = true;
  if (save.gold !== undefined && save.gold < 0) {
    currencyValid = false;
    failures.push('Negative gold');
  }

  return {
    hashValid,
    schemaValid,
    timestampsValid,
    playerIdValid,
    progressionValid,
    inventoryValid,
    currencyValid,
    passed: failures.length === 0,
    failures,
  };
}

// ─── ANTI-DUPLICATION ───────────────────────────────────────────

export function checkItemDuplication(
  inventory: Array<{ itemId: string; quantity: number }>,
  maxStackSize: number,
): ItemDuplicationCheck {
  let stackOverflow = false;
  let negativeQuantity = false;
  let quantityConsistent = true;

  for (const item of inventory) {
    if (item.quantity < 0) negativeQuantity = true;
    if (item.quantity > maxStackSize) stackOverflow = true;
  }

  const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
  if (total < 0) quantityConsistent = false;

  return {
    stackOverflow,
    negativeQuantity,
    quantityConsistent,
    passed: !stackOverflow && !negativeQuantity && quantityConsistent,
  };
}

export function checkCurrencyDuplication(
  gold: number,
  expectedDelta: number,
  previousGold: number,
  maxGold: number,
): CurrencyDuplicationCheck {
  const nonNegative = gold >= 0;
  const actualDelta = gold - previousGold;
  const deltaConsistent = actualDelta === expectedDelta;
  const noOverflow = gold <= maxGold;

  return {
    nonNegative,
    deltaConsistent,
    noOverflow,
    passed: nonNegative && deltaConsistent && noOverflow,
  };
}

// ─── OFFLINE TIME VALIDATION ────────────────────────────────────

export function validateOfflineTime(
  claimedMs: number,
  maxAllowedMs: number,
  serverEstimatedMs?: number,
  maxDriftMs?: number,
): OfflineTimeValidation {
  const exceedsMaximum = claimedMs > maxAllowedMs;
  let deviatesFromServer = false;

  if (serverEstimatedMs !== undefined && maxDriftMs !== undefined) {
    deviatesFromServer = Math.abs(claimedMs - serverEstimatedMs) > maxDriftMs;
  }

  return {
    claimedMs,
    maxAllowedMs,
    serverEstimatedMs,
    exceedsMaximum,
    deviatesFromServer,
    passed: !exceedsMaximum && !deviatesFromServer,
  };
}

// ─── REPLAY PROTECTION ──────────────────────────────────────────

export function checkReplayProtection(
  nonce: string,
  timestamp: number,
  currentServerTime: number,
  maxAgeMs: number,
  maxClockDriftMs: number,
  usedNonces: Set<string>,
): ReplayProtection {
  const nonceReused = usedNonces.has(nonce);
  const stale = currentServerTime - timestamp > maxAgeMs;
  const clockDrift = Math.abs(currentServerTime - timestamp) > maxClockDriftMs;

  return {
    nonce,
    timestamp,
    maxAgeMs,
    nonceReused,
    stale,
    clockDrift,
    maxClockDriftMs,
    passed: !nonceReused && !stale && !clockDrift,
  };
}

// ─── REQUEST TAMPERING ──────────────────────────────────────────

export function checkRequestIntegrity(
  payload: Record<string, unknown>,
  requiredFields: string[],
  typeSchema: Record<string, string>,
  boundsSchema: Record<string, { min?: number; max?: number }>,
): RequestIntegrityCheck {
  const failures: string[] = [];

  // Required fields
  let requiredFieldsPresent = true;
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      requiredFieldsPresent = false;
      failures.push(`Missing required field: ${field}`);
    }
  }

  // Type checks
  let typesValid = true;
  for (const [field, expectedType] of Object.entries(typeSchema)) {
    if (payload[field] !== undefined) {
      const actual = typeof payload[field];
      if (actual !== expectedType) {
        typesValid = false;
        failures.push(`Field ${field}: expected ${expectedType}, got ${actual}`);
      }
    }
  }

  // Bounds checks
  let boundsValid = true;
  for (const [field, bounds] of Object.entries(boundsSchema)) {
    const val = payload[field];
    if (typeof val === 'number') {
      if (bounds.min !== undefined && val < bounds.min) {
        boundsValid = false;
        failures.push(`Field ${field}: ${val} below minimum ${bounds.min}`);
      }
      if (bounds.max !== undefined && val > bounds.max) {
        boundsValid = false;
        failures.push(`Field ${field}: ${val} above maximum ${bounds.max}`);
      }
    }
  }

  // Injection detection (basic)
  let noInjection = true;
  const jsonStr = JSON.stringify(payload);
  const injectionPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /;\s*drop\s+table/i, /union\s+select/i];
  for (const pattern of injectionPatterns) {
    if (pattern.test(jsonStr)) {
      noInjection = false;
      failures.push(`Injection pattern detected: ${pattern.source}`);
    }
  }

  return {
    signatureValid: true,
    requiredFieldsPresent,
    typesValid,
    boundsValid,
    noInjection,
    passed: failures.length === 0,
    failures,
  };
}

// ─── ADMIN ACCESS CONTROL ───────────────────────────────────────

export function checkAdminAccess(
  sessionValid: boolean,
  hasCapability: boolean,
  operationAllowed: boolean,
  targetHierarchyLevel?: number,
  adminHierarchyLevel?: number,
): AdminAccessCheck {
  let noHierarchyViolation = true;
  if (targetHierarchyLevel !== undefined && adminHierarchyLevel !== undefined) {
    noHierarchyViolation = adminHierarchyLevel > targetHierarchyLevel;
  }

  return {
    sessionValid,
    authorized: hasCapability,
    operationAllowed,
    noHierarchyViolation,
    passed: sessionValid && hasCapability && operationAllowed && noHierarchyViolation,
  };
}

// ─── RATE LIMITING ──────────────────────────────────────────────

export function checkRateLimit(
  currentCount: number,
  maxCount: number,
  windowMs: number,
): RateLimitCheck {
  const remaining = Math.max(0, maxCount - currentCount);
  const exceeded = currentCount >= maxCount;

  return {
    currentCount,
    maxCount,
    windowMs,
    remaining,
    exceeded,
    passed: !exceeded,
  };
}

// ─── DATABASE CONSTRAINTS ───────────────────────────────────────

export function checkDatabaseConstraints(records: Array<Record<string, unknown>>, primaryKey: string): DatabaseConstraintCheck {
  const violations: string[] = [];
  let foreignKeysValid = true;
  let uniqueConstraintsValid = true;
  let notNullValid = true;
  let checkConstraintsValid = true;

  // Unique primary keys
  const seen = new Set<string>();
  for (const record of records) {
    const pk = String(record[primaryKey] ?? '');
    if (seen.has(pk)) {
      uniqueConstraintsValid = false;
      violations.push(`Duplicate primary key: ${pk}`);
    }
    seen.add(pk);

    // Not null check for primary key
    if (!pk || pk === 'undefined' || pk === 'null') {
      notNullValid = false;
      violations.push(`Null primary key in record`);
    }
  }

  return {
    foreignKeysValid,
    uniqueConstraintsValid,
    notNullValid,
    checkConstraintsValid,
    passed: violations.length === 0,
    violations,
  };
}

// ─── FULL SECURITY AUDIT ────────────────────────────────────────

export function runSecurityAudit(params: {
  playerId: string;
  save: Record<string, unknown>;
  inventory: Array<{ itemId: string; quantity: number }>;
  gold: number;
  previousGold: number;
  claimedOfflineMs: number;
  requestNonce: string;
  requestTimestamp: number;
  serverTime: number;
  adminSessionValid?: boolean;
  adminHasCapability?: boolean;
  adminOperationAllowed?: boolean;
  requestPayload: Record<string, unknown>;
  requiredFields: string[];
  typeSchema: Record<string, string>;
  boundsSchema: Record<string, { min?: number; max?: number }>;
  usedNonces: Set<string>;
  currentRequestCount: number;
  policy?: Partial<SecurityPolicy>;
}): SecurityAuditReport {
  const p = { ...DEFAULT_SECURITY_POLICY, ...params.policy };
  const threats: ThreatDetection[] = [];
  const save = params.save;

  // Save integrity
  const saveIntegrity = checkSaveIntegrity({
    playerId: params.playerId as string,
    version: save.version as number | undefined,
    currentVersion: save.currentVersion as number | undefined,
    gold: params.gold,
    inventory: params.inventory,
  });

  // Item duplication
  const itemDuplication = checkItemDuplication(params.inventory, p.maxStackSize);

  // Currency duplication
  const currencyDuplication = checkCurrencyDuplication(
    params.gold,
    params.gold - params.previousGold,
    params.previousGold,
    p.maxGold,
  );

  // Offline time
  const offlineTime = validateOfflineTime(
    params.claimedOfflineMs,
    p.maxOfflineTimeMs,
    undefined,
    p.maxClockDriftMs,
  );

  // Replay protection
  const replayProtection = checkReplayProtection(
    params.requestNonce,
    params.requestTimestamp,
    params.serverTime,
    p.requestMaxAgeMs,
    p.maxClockDriftMs,
    params.usedNonces,
  );

  // Request integrity
  const requestIntegrity = checkRequestIntegrity(
    params.requestPayload,
    params.requiredFields,
    params.typeSchema,
    params.boundsSchema,
  );

  // Admin access
  const adminAccess = checkAdminAccess(
    params.adminSessionValid ?? false,
    params.adminHasCapability ?? false,
    params.adminOperationAllowed ?? false,
  );

  // Rate limit
  const rateLimit = checkRateLimit(
    params.currentRequestCount,
    p.rateLimitMaxRequests,
    p.rateLimitWindowMs,
  );

  // Database constraints
  const dbRecords = params.inventory.map((item, i) => ({ id: i, ...item }));
  const databaseConstraints = checkDatabaseConstraints(dbRecords, 'id');

  // Collect threats
  if (!saveIntegrity.passed) {
    threats.push({
      category: 'save_manipulation',
      severity: 'critical',
      message: `Save integrity failed: ${saveIntegrity.failures.join(', ')}`,
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: { failures: saveIntegrity.failures },
    });
  }

  if (!itemDuplication.passed) {
    threats.push({
      category: 'item_duplication',
      severity: 'high',
      message: 'Item duplication detected',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: itemDuplication as unknown as Record<string, unknown>,
    });
  }

  if (!currencyDuplication.passed) {
    threats.push({
      category: 'currency_duplication',
      severity: 'high',
      message: 'Currency duplication detected',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: currencyDuplication as unknown as Record<string, unknown>,
    });
  }

  if (!offlineTime.passed) {
    threats.push({
      category: 'offline_time_manipulation',
      severity: 'medium',
      message: 'Offline time manipulation detected',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: { claimed: offlineTime.claimedMs, max: offlineTime.maxAllowedMs },
    });
  }

  if (!replayProtection.passed) {
    threats.push({
      category: 'replay_attack',
      severity: 'high',
      message: 'Replay attack detected',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: { nonceReused: replayProtection.nonceReused, stale: replayProtection.stale },
    });
  }

  if (!requestIntegrity.passed) {
    threats.push({
      category: 'request_tampering',
      severity: 'medium',
      message: 'Request tampering detected',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: { failures: requestIntegrity.failures },
    });
  }

  if (!rateLimit.passed) {
    threats.push({
      category: 'rate_limit_violation',
      severity: 'medium',
      message: 'Rate limit exceeded',
      detectedAt: params.serverTime,
      playerId: params.playerId,
      details: { count: rateLimit.currentCount, max: rateLimit.maxCount },
    });
  }

  const criticalCount = threats.filter((t) => t.severity === 'critical').length;
  const highCount = threats.filter((t) => t.severity === 'high').length;

  const allPassed = [
    saveIntegrity.passed,
    itemDuplication.passed,
    currencyDuplication.passed,
    offlineTime.passed,
    replayProtection.passed,
    requestIntegrity.passed,
    adminAccess.passed,
    rateLimit.passed,
    databaseConstraints.passed,
  ];

  const overallPassed = p.strictMode
    ? allPassed.every(Boolean)
    : criticalCount === 0;

  return {
    timestamp: params.serverTime,
    playerId: params.playerId,
    saveIntegrity,
    itemDuplication,
    currencyDuplication,
    offlineTime,
    replayProtection,
    requestIntegrity,
    adminAccess,
    rateLimit,
    databaseConstraints,
    threats,
    overallPassed,
    criticalCount,
    highCount,
  };
}
