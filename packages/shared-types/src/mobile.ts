// ─── MOBILE API READINESS TYPES ─────────────────────────────────
// Phase 33: Before React Native, audit every system. Confirm the
// mobile app can obtain game state via APIs without needing DOM
// logic. Share logic, not DOM.

// ─── API SYSTEM CONTRACT ────────────────────────────────────────

export type MobileApiSystem =
  | 'auth'
  | 'player_state'
  | 'inventory'
  | 'equipment'
  | 'skills'
  | 'quests'
  | 'world'
  | 'regions'
  | 'dungeons'
  | 'combat'
  | 'enemies'
  | 'loot'
  | 'economy'
  | 'crafting'
  | 'npc'
  | 'achievements'
  | 'collections'
  | 'tasks'
  | 'offline'
  | 'notifications'
  | 'settings';

export type ApiTransport = 'rest' | 'ws' | 'local';

export interface MobileApiContract {
  /** System name. */
  system: MobileApiSystem;
  /** Whether state is retrievable via API. */
  stateRetrievable: boolean;
  /** Whether mutations are possible via API. */
  mutable: boolean;
  /** Transport mechanisms. */
  transports: ApiTransport[];
  /** Whether DOM is required to obtain state. */
  requiresDom: boolean;
  /** Endpoint(s) exposing state. */
  endpoints: string[];
  /** Whether game formulas are shared (not duplicated in client). */
  sharedFormulas: boolean;
  /** Whether types are shared. */
  sharedTypes: boolean;
  /** Whether validation is shared. */
  sharedValidation: boolean;
}

export interface MobileApiAuditItem {
  system: MobileApiSystem;
  name: string;
  contract: MobileApiContract;
  /** What this API returns. */
  returnSummary: string;
  passed: boolean;
  failures: string[];
}

export interface MobileApiAuditReport {
  generatedAt: number;
  /** Systems audited. */
  auditedSystems: number;
  /** Systems passed. */
  passedSystems: number;
  /** Systems with DOM dependency (failures). */
  domDependentSystems: number;
  /** Overall pass rate. */
  passRate: number;
  /** All audit items. */
  items: MobileApiAuditItem[];
  /** Systems that are mobile-ready. */
  mobileReady: MobileApiSystem[];
  /** Systems blocking mobile. */
  blockedSystems: MobileApiSystem[];
  /** Recommendations. */
  recommendations: MobileApiRecommendation[];
}

export interface MobileApiRecommendation {
  system: MobileApiSystem;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  remediation: string;
}

// ─── API CLIENT ─────────────────────────────────────────────────

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEndpointDef {
  /** Unique path. */
  path: string;
  /** HTTP method. */
  method: ApiMethod;
  /** Auth requirement. */
  requiresAuth: boolean;
  /** Request body type (if any). */
  requestType?: string;
  /** Response type. */
  responseType: string;
  /** System associated. */
  system: MobileApiSystem;
  /** Whether this endpoint returns game state (not DOM). */
  returnsState: boolean;
}

export interface ApiClientConfig {
  /** Base URL. */
  baseUrl: string;
  /** Timeout in ms. */
  timeoutMs: number;
  /** Whether to inject auth token automatically. */
  autoAuth: boolean;
  /** Whether responses are validated against contracts. */
  validateResponses: boolean;
  /** Retry policy. */
  retries: number;
}

export interface ApiResult<T> {
  success: boolean;
  status?: number;
  data?: T;
  error?: string;
  /** Duration in ms. */
  durationMs: number;
}

// ─── MOBILE APP FEATURE AUDIT ───────────────────────────────────

export interface MobileFeatureAudit {
  /** Feature name. */
  feature: string;
  /** Whether the feature can be built without DOM. */
  domFree: boolean;
  /** Systems it depends on. */
  dependsOn: MobileApiSystem[];
  /** Whether all dependencies are mobile-ready. */
  dependenciesReady: boolean;
  passed: boolean;
  failures: string[];
}
