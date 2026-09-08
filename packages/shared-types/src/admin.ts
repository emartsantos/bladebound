// ─── ADMIN / GAME MASTER TOOLS TYPES ───────────────────────────
// Phase 27: Protected admin interface types. Server authorization
// is mandatory — never expose via frontend-only flags.

// ─── ADMIN ROLES ────────────────────────────────────────────────

export type AdminRole = 'viewer' | 'moderator' | 'admin' | 'superadmin';

export interface AdminPermission {
  role: AdminRole;
  /** Which operations this role can perform. */
  capabilities: AdminCapability[];
}

export type AdminCapability =
  | 'player_lookup'
  | 'player_state_view'
  | 'grant_item'
  | 'remove_item'
  | 'grant_currency'
  | 'remove_currency'
  | 'set_skill_xp'
  | 'set_level'
  | 'unlock_region'
  | 'reset_quest'
  | 'grant_dungeon_key'
  | 'simulate_offline'
  | 'inspect_save'
  | 'inspect_events'
  | 'inspect_economy'
  | 'inspect_combat'
  | 'spawn_enemy'
  | 'god_mode'
  | 'manage_admins';

// ─── ADMIN SESSION ──────────────────────────────────────────────

export interface AdminSession {
  /** Admin user ID. */
  adminId: string;
  /** Admin role. */
  role: AdminRole;
  /** Session token (server-issued). */
  token: string;
  /** Issued at timestamp. */
  issuedAt: number;
  /** Expires at timestamp. */
  expiresAt: number;
  /** IP address (for audit). */
  ip: string;
}

// ─── PLAYER LOOKUP ──────────────────────────────────────────────

export interface PlayerLookupRequest {
  query: string; // name, ID, or partial match
  limit?: number;
}

export interface PlayerLookupResult {
  playerId: string;
  name: string;
  level: number;
  combatLevel: number;
  region: string;
  lastPlayedAt: number;
  playtime: number;
}

// ─── PLAYER STATE VIEWER ────────────────────────────────────────

export interface PlayerStateSnapshot {
  playerId: string;
  name: string;
  level: number;
  combatLevel: number;
  totalLevel: number;
  experience: number;
  gold: number;
  region: string;
  skills: Record<string, { level: number; xp: number }>;
  equipment: Record<string, { itemId: string | null; durability: number | null }>;
  inventory: Array<{ itemId: string; quantity: number }>;
  questProgress: Record<string, { progress: number; total: number; active: boolean }>;
  dungeonProgress: Record<string, { completions: number; bestTime: number }>;
  achievements: Record<string, boolean>;
  collections: Record<string, number>;
  lastSavedAt: number;
  playtime: number;
}

// ─── ADMIN OPERATIONS ───────────────────────────────────────────

export interface GrantItemOperation {
  type: 'grant_item';
  playerId: string;
  itemId: string;
  quantity: number;
}

export interface RemoveItemOperation {
  type: 'remove_item';
  playerId: string;
  itemId: string;
  quantity: number;
}

export interface GrantCurrencyOperation {
  type: 'grant_currency';
  playerId: string;
  currency: string;
  amount: number;
}

export interface RemoveCurrencyOperation {
  type: 'remove_currency';
  playerId: string;
  currency: string;
  amount: number;
}

export interface SetSkillXpOperation {
  type: 'set_skill_xp';
  playerId: string;
  skillId: string;
  xp: number;
}

export interface SetLevelOperation {
  type: 'set_level';
  playerId: string;
  level: number;
}

export interface UnlockRegionOperation {
  type: 'unlock_region';
  playerId: string;
  regionId: string;
}

export interface ResetQuestOperation {
  type: 'reset_quest';
  playerId: string;
  questId: string;
}

export interface GrantDungeonKeyOperation {
  type: 'grant_dungeon_key';
  playerId: string;
  dungeonId: string;
}

export interface SimulateOfflineOperation {
  type: 'simulate_offline';
  playerId: string;
  elapsedMs: number;
}

export interface SpawnEnemyOperation {
  type: 'spawn_enemy';
  playerId: string;
  enemyId: string;
  regionId: string;
}

export interface ToggleGodModeOperation {
  type: 'toggle_god_mode';
  playerId: string;
  enabled: boolean;
}

export type AdminOperation =
  | GrantItemOperation
  | RemoveItemOperation
  | GrantCurrencyOperation
  | RemoveCurrencyOperation
  | SetSkillXpOperation
  | SetLevelOperation
  | UnlockRegionOperation
  | ResetQuestOperation
  | GrantDungeonKeyOperation
  | SimulateOfflineOperation
  | SpawnEnemyOperation
  | ToggleGodModeOperation;

// ─── ADMIN OPERATION RESULT ─────────────────────────────────────

export interface AdminOperationResult {
  success: boolean;
  operation: AdminOperation['type'];
  playerId: string;
  message: string;
  /** Previous state before the operation (for undo). */
  previousState?: Record<string, unknown>;
  /** Timestamp of the operation. */
  timestamp: number;
  /** Admin who performed the operation. */
  adminId: string;
}

// ─── INSPECTION TYPES ───────────────────────────────────────────

export interface InspectSaveRequest {
  playerId: string;
  /** Optional version to inspect (latest if omitted). */
  version?: number;
}

export interface InspectSaveResult {
  playerId: string;
  version: number;
  timestamp: number;
  checksum: string;
  isValid: boolean;
  warnings: string[];
  snapshot: Record<string, unknown>;
}

export interface InspectEventsRequest {
  playerId: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  eventTypes?: string[];
  limit?: number;
}

export interface InspectEventEntry {
  type: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface InspectEventsResult {
  playerId: string;
  events: InspectEventEntry[];
  total: number;
}

export interface InspectEconomyRequest {
  playerId: string;
}

export interface InspectEconomyResult {
  playerId: string;
  gold: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  itemsSold: number;
  itemsBought: number;
  recentTransactions: Array<{
    type: string;
    amount: number;
    timestamp: number;
  }>;
}

export interface InspectCombatRequest {
  playerId: string;
  recentEncounters?: number;
}

export interface InspectCombatResult {
  playerId: string;
  totalEncounters: number;
  wins: number;
  losses: number;
  winRate: number;
  averageFightDuration: number;
  totalXpEarned: number;
  totalGoldEarned: number;
  recentEncounters: Array<{
    enemyId: string;
    result: 'victory' | 'defeat';
    duration: number;
    xpEarned: number;
    timestamp: number;
  }>;
}

// ─── GOD MODE ───────────────────────────────────────────────────

export interface GodModeState {
  enabled: boolean;
  /** God mode is only valid in dev/test environments. */
  environment: 'development' | 'test' | 'production';
  /** Who enabled it. */
  enabledBy: string;
  /** When it was enabled. */
  enabledAt: number;
}

// ─── ADMIN AUDIT LOG ────────────────────────────────────────────

export interface AdminAuditEntry {
  id: string;
  adminId: string;
  operation: AdminOperation['type'];
  playerId: string;
  details: Record<string, unknown>;
  timestamp: number;
  success: boolean;
  ipAddress: string;
}
