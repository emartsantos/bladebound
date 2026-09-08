// ─── SECURITY AUDIT TYPES ───────────────────────────────────────
// Phase 29: Validation types for save integrity, anti-cheat,
// replay protection, and request tampering detection.
// Never trust the browser.

// ─── THREAT CATEGORIES ──────────────────────────────────────────

export type ThreatCategory =
  | 'save_manipulation'
  | 'item_duplication'
  | 'currency_duplication'
  | 'offline_time_manipulation'
  | 'replay_attack'
  | 'request_tampering'
  | 'admin_bypass'
  | 'rate_limit_violation'
  | 'database_constraint_violation'
  | 'authentication_bypass'
  | 'authorization_violation';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ThreatDetection {
  category: ThreatCategory;
  severity: ThreatSeverity;
  message: string;
  detectedAt: number;
  playerId?: string;
  details: Record<string, unknown>;
}

// ─── SAVE INTEGRITY ─────────────────────────────────────────────

export interface SaveIntegrityCheck {
  /** Check if save hash matches contents. */
  hashValid: boolean;
  /** Check if schema version is current. */
  schemaValid: boolean;
  /** Check if timestamps are monotonic. */
  timestampsValid: boolean;
  /** Check if player ID matches expected. */
  playerIdValid: boolean;
  /** Check if level/XP values are within bounds. */
  progressionValid: boolean;
  /** Check if inventory quantities are non-negative. */
  inventoryValid: boolean;
  /** Check if gold is non-negative. */
  currencyValid: boolean;
  /** Overall pass/fail. */
  passed: boolean;
  /** List of failures. */
  failures: string[];
}

// ─── ANTI-DUPLICATION ───────────────────────────────────────────

export interface ItemDuplicationCheck {
  /** No two inventory slots have the same item + stack beyond max. */
  stackOverflow: boolean;
  /** No negative quantities. */
  negativeQuantity: boolean;
  /** Total quantity matches expected delta. */
  quantityConsistent: boolean;
  passed: boolean;
}

export interface CurrencyDuplicationCheck {
  /** Gold is non-negative. */
  nonNegative: boolean;
  /** Gold delta matches expected. */
  deltaConsistent: boolean;
  /** No overflow. */
  noOverflow: boolean;
  passed: boolean;
}

// ─── OFFLINE TIME VALIDATION ────────────────────────────────────

export interface OfflineTimeValidation {
  /** Elapsed time claimed by client. */
  claimedMs: number;
  /** Maximum allowed offline time. */
  maxAllowedMs: number;
  /** Server-estimated elapsed time (if available). */
  serverEstimatedMs?: number;
  /** Whether claimed time exceeds maximum. */
  exceedsMaximum: boolean;
  /** Whether claimed time deviates significantly from server estimate. */
  deviatesFromServer: boolean;
  passed: boolean;
}

// ─── REPLAY PROTECTION ──────────────────────────────────────────

export interface ReplayProtection {
  /** Request nonce (unique per request). */
  nonce: string;
  /** Timestamp of the request. */
  timestamp: number;
  /** Maximum age of a request before it's stale (ms). */
  maxAgeMs: number;
  /** Whether the nonce has been used before. */
  nonceReused: boolean;
  /** Whether the request is too old. */
  stale: boolean;
  /** Whether the timestamp drifts too far from server time. */
  clockDrift: boolean;
  /** Max allowed clock drift in ms. */
  maxClockDriftMs: number;
  passed: boolean;
}

// ─── REQUEST TAMPERING ──────────────────────────────────────────

export interface RequestIntegrityCheck {
  /** Payload hash matches signature. */
  signatureValid: boolean;
  /** Required fields are present. */
  requiredFieldsPresent: boolean;
  /** Field types match expected schema. */
  typesValid: boolean;
  /** Numeric values are within bounds. */
  boundsValid: boolean;
  /** No injection attempts detected. */
  noInjection: boolean;
  passed: boolean;
  failures: string[];
}

// ─── ADMIN ACCESS CONTROL ───────────────────────────────────────

export interface AdminAccessCheck {
  /** Admin session is valid. */
  sessionValid: boolean;
  /** Admin role has required capability. */
  authorized: boolean;
  /** Operation is in allowed list. */
  operationAllowed: boolean;
  /** Admin is not targeting a higher-privileged user. */
  noHierarchyViolation: boolean;
  passed: boolean;
}

// ─── RATE LIMITING ──────────────────────────────────────────────

export interface RateLimitCheck {
  /** Current request count in window. */
  currentCount: number;
  /** Maximum allowed in window. */
  maxCount: number;
  /** Window duration in ms. */
  windowMs: number;
  /** Remaining requests. */
  remaining: number;
  /** Whether rate limit is exceeded. */
  exceeded: boolean;
  passed: boolean;
}

// ─── DATABASE INTEGRITY ─────────────────────────────────────────

export interface DatabaseConstraintCheck {
  /** All foreign keys resolve. */
  foreignKeysValid: boolean;
  /** No duplicate primary keys. */
  uniqueConstraintsValid: boolean;
  /** All required fields are non-null. */
  notNullValid: boolean;
  /** All values are within expected ranges. */
  checkConstraintsValid: boolean;
  passed: boolean;
  violations: string[];
}

// ─── SECURITY AUDIT REPORT ──────────────────────────────────────

export interface SecurityAuditReport {
  timestamp: number;
  playerId: string;
  saveIntegrity: SaveIntegrityCheck;
  itemDuplication: ItemDuplicationCheck;
  currencyDuplication: CurrencyDuplicationCheck;
  offlineTime: OfflineTimeValidation;
  replayProtection: ReplayProtection;
  requestIntegrity: RequestIntegrityCheck;
  adminAccess: AdminAccessCheck;
  rateLimit: RateLimitCheck;
  databaseConstraints: DatabaseConstraintCheck;
  threats: ThreatDetection[];
  overallPassed: boolean;
  criticalCount: number;
  highCount: number;
}

// ─── SECURITY POLICY ────────────────────────────────────────────

export interface SecurityPolicy {
  /** Maximum offline time allowed (ms). */
  maxOfflineTimeMs: number;
  /** Maximum clock drift allowed (ms). */
  maxClockDriftMs: number;
  /** Request max age before stale (ms). */
  requestMaxAgeMs: number;
  /** Rate limit: max requests per window. */
  rateLimitMaxRequests: number;
  /** Rate limit window duration (ms). */
  rateLimitWindowMs: number;
  /** Maximum inventory size. */
  maxInventorySize: number;
  /** Maximum gold amount. */
  maxGold: number;
  /** Maximum stack size. */
  maxStackSize: number;
  /** Whether to enforce strict mode (reject on any warning). */
  strictMode: boolean;
}
