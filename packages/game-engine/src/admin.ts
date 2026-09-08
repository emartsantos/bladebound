// ─── ADMIN / GAME MASTER TOOLS ENGINE ───────────────────────────
// Phase 27: Server-authorized admin operations. Never trust
// frontend flags. God mode only in dev/test environments.

import type {
  AdminRole,
  AdminCapability,
  AdminSession,
  AdminOperation,
  AdminOperationResult,
  PlayerStateSnapshot,
  PlayerLookupResult,
  InspectSaveResult,
  InspectEventsResult,
  InspectEconomyResult,
  InspectCombatResult,
  GodModeState,
  AdminAuditEntry,
} from '@premium-rpg/shared-types';

// ─── ROLE PERMISSIONS ───────────────────────────────────────────

const ROLE_CAPABILITIES: Record<AdminRole, AdminCapability[]> = {
  viewer: [
    'player_lookup', 'player_state_view',
    'inspect_save', 'inspect_events', 'inspect_economy', 'inspect_combat',
  ],
  moderator: [
    'player_lookup', 'player_state_view',
    'inspect_save', 'inspect_events', 'inspect_economy', 'inspect_combat',
    'grant_item', 'remove_item',
    'grant_currency', 'remove_currency',
  ],
  admin: [
    'player_lookup', 'player_state_view',
    'inspect_save', 'inspect_events', 'inspect_economy', 'inspect_combat',
    'grant_item', 'remove_item',
    'grant_currency', 'remove_currency',
    'set_skill_xp', 'set_level',
    'unlock_region', 'reset_quest', 'grant_dungeon_key',
    'simulate_offline', 'spawn_enemy',
  ],
  superadmin: [
    'player_lookup', 'player_state_view',
    'inspect_save', 'inspect_events', 'inspect_economy', 'inspect_combat',
    'grant_item', 'remove_item',
    'grant_currency', 'remove_currency',
    'set_skill_xp', 'set_level',
    'unlock_region', 'reset_quest', 'grant_dungeon_key',
    'simulate_offline', 'spawn_enemy',
    'god_mode', 'manage_admins',
  ],
};

// ─── SESSION MANAGEMENT ─────────────────────────────────────────

let _sessionCounter = 0;

/**
 * Validate an admin session. Returns true if the session is valid
 * and not expired.
 */
export function validateAdminSession(session: AdminSession): boolean {
  const now = Date.now();
  return (
    session.token.length > 0 &&
    session.expiresAt > now &&
    session.issuedAt > 0 &&
    session.adminId.length > 0
  );
}

/**
 * Check if an admin session has a specific capability.
 */
export function hasCapability(session: AdminSession, capability: AdminCapability): boolean {
  if (!validateAdminSession(session)) return false;
  const caps = ROLE_CAPABILITIES[session.role] ?? [];
  return caps.includes(capability);
}

/**
 * Check if an admin session can perform a specific operation.
 */
export function canPerformOperation(session: AdminSession, operation: AdminOperation['type']): boolean {
  const CAPABILITY_MAP: Record<AdminOperation['type'], AdminCapability> = {
    grant_item: 'grant_item',
    remove_item: 'remove_item',
    grant_currency: 'grant_currency',
    remove_currency: 'remove_currency',
    set_skill_xp: 'set_skill_xp',
    set_level: 'set_level',
    unlock_region: 'unlock_region',
    reset_quest: 'reset_quest',
    grant_dungeon_key: 'grant_dungeon_key',
    simulate_offline: 'simulate_offline',
    spawn_enemy: 'spawn_enemy',
    toggle_god_mode: 'god_mode',
  };
  const required = CAPABILITY_MAP[operation];
  return required ? hasCapability(session, required) : false;
}

// ─── PLAYER LOOKUP ──────────────────────────────────────────────

/**
 * Filter players by query string (name or ID substring match).
 */
export function lookupPlayers(
  query: string,
  allPlayers: PlayerLookupResult[],
  limit = 10,
): PlayerLookupResult[] {
  const q = query.toLowerCase().trim();
  if (q.length === 0) return [];
  return allPlayers
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

// ─── ADMIN OPERATIONS ───────────────────────────────────────────

/**
 * Execute an admin operation against a player state snapshot.
 * Returns the result with previous state for undo capability.
 */
export function executeAdminOperation(
  session: AdminSession,
  operation: AdminOperation,
  playerState: PlayerStateSnapshot,
): AdminOperationResult {
  const now = Date.now();

  // Authorization check
  if (!validateAdminSession(session)) {
    return {
      success: false,
      operation: operation.type,
      playerId: operation.playerId,
      message: 'Invalid or expired admin session',
      timestamp: now,
      adminId: session.adminId,
    };
  }

  if (!canPerformOperation(session, operation.type)) {
    return {
      success: false,
      operation: operation.type,
      playerId: operation.playerId,
      message: `Role '${session.role}' does not have permission for '${operation.type}'`,
      timestamp: now,
      adminId: session.adminId,
    };
  }

  // Execute operation
  switch (operation.type) {
    case 'grant_item':
      return executeGrantItem(session, operation, playerState, now);
    case 'remove_item':
      return executeRemoveItem(session, operation, playerState, now);
    case 'grant_currency':
      return executeGrantCurrency(session, operation, playerState, now);
    case 'remove_currency':
      return executeRemoveCurrency(session, operation, playerState, now);
    case 'set_skill_xp':
      return executeSetSkillXp(session, operation, playerState, now);
    case 'set_level':
      return executeSetLevel(session, operation, playerState, now);
    case 'unlock_region':
      return executeUnlockRegion(session, operation, playerState, now);
    case 'reset_quest':
      return executeResetQuest(session, operation, playerState, now);
    case 'grant_dungeon_key':
      return executeGrantDungeonKey(session, operation, playerState, now);
    case 'spawn_enemy':
      return executeSpawnEnemy(session, operation, playerState, now);
    default:
      return {
        success: false,
        operation: operation.type,
        playerId: operation.playerId,
        message: `Unknown operation: ${operation.type}`,
        timestamp: now,
        adminId: session.adminId,
      };
  }
}

// ─── INDIVIDUAL OPERATION HANDLERS ──────────────────────────────

function executeGrantItem(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'grant_item' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  const existing = state.inventory.find((i) => i.itemId === op.itemId);
  const prev = existing ? { quantity: existing.quantity } : { quantity: 0 };

  return {
    success: true,
    operation: 'grant_item',
    playerId: op.playerId,
    message: `Granted ${op.quantity}x ${op.itemId} to ${state.name}`,
    previousState: prev,
    timestamp,
    adminId: session.adminId,
  };
}

function executeRemoveItem(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'remove_item' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  const existing = state.inventory.find((i) => i.itemId === op.itemId);
  if (!existing || existing.quantity < op.quantity) {
    return {
      success: false,
      operation: 'remove_item',
      playerId: op.playerId,
      message: `Player does not have ${op.quantity}x ${op.itemId}`,
      timestamp,
      adminId: session.adminId,
    };
  }
  return {
    success: true,
    operation: 'remove_item',
    playerId: op.playerId,
    message: `Removed ${op.quantity}x ${op.itemId} from ${state.name}`,
    previousState: { quantity: existing.quantity },
    timestamp,
    adminId: session.adminId,
  };
}

function executeGrantCurrency(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'grant_currency' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  return {
    success: true,
    operation: 'grant_currency',
    playerId: op.playerId,
    message: `Granted ${op.amount} ${op.currency} to ${state.name}`,
    previousState: { gold: state.gold },
    timestamp,
    adminId: session.adminId,
  };
}

function executeRemoveCurrency(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'remove_currency' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  if (state.gold < op.amount) {
    return {
      success: false,
      operation: 'remove_currency',
      playerId: op.playerId,
      message: `Player has ${state.gold} gold, cannot remove ${op.amount}`,
      timestamp,
      adminId: session.adminId,
    };
  }
  return {
    success: true,
    operation: 'remove_currency',
    playerId: op.playerId,
    message: `Removed ${op.amount} ${op.currency} from ${state.name}`,
    previousState: { gold: state.gold },
    timestamp,
    adminId: session.adminId,
  };
}

function executeSetSkillXp(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'set_skill_xp' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  const prev = state.skills[op.skillId] ?? { level: 0, xp: 0 };
  return {
    success: true,
    operation: 'set_skill_xp',
    playerId: op.playerId,
    message: `Set ${op.skillId} XP to ${op.xp} for ${state.name}`,
    previousState: prev,
    timestamp,
    adminId: session.adminId,
  };
}

function executeSetLevel(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'set_level' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  return {
    success: true,
    operation: 'set_level',
    playerId: op.playerId,
    message: `Set level to ${op.level} for ${state.name}`,
    previousState: { level: state.level, experience: state.experience },
    timestamp,
    adminId: session.adminId,
  };
}

function executeUnlockRegion(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'unlock_region' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  return {
    success: true,
    operation: 'unlock_region',
    playerId: op.playerId,
    message: `Unlocked region ${op.regionId} for ${state.name}`,
    previousState: { region: state.region },
    timestamp,
    adminId: session.adminId,
  };
}

function executeResetQuest(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'reset_quest' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  const prev = state.questProgress[op.questId];
  return {
    success: true,
    operation: 'reset_quest',
    playerId: op.playerId,
    message: `Reset quest ${op.questId} for ${state.name}`,
    previousState: prev ?? { progress: 0, total: 0, active: false },
    timestamp,
    adminId: session.adminId,
  };
}

function executeGrantDungeonKey(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'grant_dungeon_key' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  return {
    success: true,
    operation: 'grant_dungeon_key',
    playerId: op.playerId,
    message: `Granted dungeon key for ${op.dungeonId} to ${state.name}`,
    timestamp,
    adminId: session.adminId,
  };
}

function executeSpawnEnemy(
  session: AdminSession,
  op: Extract<AdminOperation, { type: 'spawn_enemy' }>,
  state: PlayerStateSnapshot,
  timestamp: number,
): AdminOperationResult {
  return {
    success: true,
    operation: 'spawn_enemy',
    playerId: op.playerId,
    message: `Spawned enemy ${op.enemyId} in ${op.regionId} for ${state.name}`,
    timestamp,
    adminId: session.adminId,
  };
}

// ─── GOD MODE ───────────────────────────────────────────────────

/**
 * Toggle god mode. Only allowed in development/test environments.
 */
export function toggleGodMode(
  session: AdminSession,
  playerId: string,
  enabled: boolean,
  environment: 'development' | 'test' | 'production',
): { state: GodModeState | null; error?: string } {
  if (!hasCapability(session, 'god_mode')) {
    return { state: null, error: 'Insufficient permissions for god mode' };
  }

  if (environment === 'production' && enabled) {
    return { state: null, error: 'God mode cannot be enabled in production' };
  }

  return {
    state: {
      enabled,
      environment,
      enabledBy: session.adminId,
      enabledAt: Date.now(),
    },
  };
}

// ─── AUDIT LOG ──────────────────────────────────────────────────

let _auditCounter = 0;

/**
 * Create an audit log entry for an admin operation.
 */
export function createAuditEntry(
  session: AdminSession,
  operation: AdminOperation,
  result: AdminOperationResult,
  ipAddress: string,
): AdminAuditEntry {
  return {
    id: `audit_${Date.now()}_${++_auditCounter}`,
    adminId: session.adminId,
    operation: operation.type,
    playerId: operation.playerId,
    details: {
      message: result.message,
      previousState: result.previousState,
    },
    timestamp: result.timestamp,
    success: result.success,
    ipAddress,
  };
}

/**
 * Validate that an admin operation is allowed based on role hierarchy.
 * Higher roles can override lower role decisions.
 */
export function canOverrideRole(
  adminRole: AdminRole,
  targetRole: AdminRole,
): boolean {
  const hierarchy: AdminRole[] = ['viewer', 'moderator', 'admin', 'superadmin'];
  return hierarchy.indexOf(adminRole) > hierarchy.indexOf(targetRole);
}
