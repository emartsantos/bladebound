import { describe, it, expect } from 'vitest';
import {
  validateAdminSession,
  hasCapability,
  canPerformOperation,
  lookupPlayers,
  executeAdminOperation,
  toggleGodMode,
  createAuditEntry,
  canOverrideRole,
} from '../src/admin';
import type {
  AdminSession,
  AdminOperation,
  PlayerStateSnapshot,
  PlayerLookupResult,
} from '@premium-rpg/shared-types';

// ─── HELPERS ────────────────────────────────────────────────────

function makeSession(role: AdminRole, overrides?: Partial<AdminSession>): AdminSession {
  return {
    adminId: 'admin_1',
    role,
    token: 'valid-token-abc123',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    ip: '127.0.0.1',
    ...overrides,
  };
}

function makePlayerState(overrides?: Partial<PlayerStateSnapshot>): PlayerStateSnapshot {
  return {
    playerId: 'player_1',
    name: 'Theron',
    level: 24,
    combatLevel: 26,
    totalLevel: 50,
    experience: 14750,
    gold: 12450,
    region: 'ashenvale',
    skills: { mining: { level: 18, xp: 4200 }, woodcutting: { level: 14, xp: 2800 } },
    equipment: { weapon: { itemId: 'iron_sword', durability: 80 } },
    inventory: [{ itemId: 'iron_ore', quantity: 20 }, { itemId: 'health_potion', quantity: 5 }],
    questProgress: { q1: { progress: 1, total: 1, active: true }, q2: { progress: 8, total: 15, active: true } },
    dungeonProgress: { d1: { completions: 3, bestTime: 120 } },
    achievements: { a1: true },
    collections: { c1: 5 },
    lastSavedAt: Date.now(),
    playtime: 3600,
    ...overrides,
  };
}

type AdminRole = 'viewer' | 'moderator' | 'admin' | 'superadmin';

// ─── SESSION VALIDATION ─────────────────────────────────────────

describe('validateAdminSession', () => {
  it('validates a normal session', () => {
    expect(validateAdminSession(makeSession('admin'))).toBe(true);
  });

  it('rejects expired session', () => {
    expect(validateAdminSession(makeSession('admin', { expiresAt: Date.now() - 1000 }))).toBe(false);
  });

  it('rejects empty token', () => {
    expect(validateAdminSession(makeSession('admin', { token: '' }))).toBe(false);
  });

  it('rejects empty adminId', () => {
    expect(validateAdminSession(makeSession('admin', { adminId: '' }))).toBe(false);
  });
});

// ─── CAPABILITIES ───────────────────────────────────────────────

describe('hasCapability', () => {
  it('viewer can lookup players', () => {
    expect(hasCapability(makeSession('viewer'), 'player_lookup')).toBe(true);
  });

  it('viewer cannot grant items', () => {
    expect(hasCapability(makeSession('viewer'), 'grant_item')).toBe(false);
  });

  it('moderator can grant items', () => {
    expect(hasCapability(makeSession('moderator'), 'grant_item')).toBe(true);
  });

  it('moderator cannot set level', () => {
    expect(hasCapability(makeSession('moderator'), 'set_level')).toBe(false);
  });

  it('admin can set level', () => {
    expect(hasCapability(makeSession('admin'), 'set_level')).toBe(true);
  });

  it('admin cannot toggle god mode', () => {
    expect(hasCapability(makeSession('admin'), 'god_mode')).toBe(false);
  });

  it('superadmin can toggle god mode', () => {
    expect(hasCapability(makeSession('superadmin'), 'god_mode')).toBe(true);
  });

  it('rejects invalid session', () => {
    expect(hasCapability(makeSession('admin', { expiresAt: 0 }), 'player_lookup')).toBe(false);
  });
});

// ─── OPERATION PERMISSIONS ──────────────────────────────────────

describe('canPerformOperation', () => {
  it('moderator can grant_item', () => {
    expect(canPerformOperation(makeSession('moderator'), 'grant_item')).toBe(true);
  });

  it('moderator cannot set_level', () => {
    expect(canPerformOperation(makeSession('moderator'), 'set_level')).toBe(false);
  });

  it('admin can set_level', () => {
    expect(canPerformOperation(makeSession('admin'), 'set_level')).toBe(true);
  });

  it('admin can spawn_enemy', () => {
    expect(canPerformOperation(makeSession('admin'), 'spawn_enemy')).toBe(true);
  });

  it('superadmin can toggle_god_mode', () => {
    expect(canPerformOperation(makeSession('superadmin'), 'toggle_god_mode')).toBe(true);
  });
});

// ─── PLAYER LOOKUP ──────────────────────────────────────────────

describe('lookupPlayers', () => {
  const players: PlayerLookupResult[] = [
    { playerId: 'p1', name: 'Theron', level: 24, combatLevel: 26, region: 'ashenvale', lastPlayedAt: Date.now(), playtime: 3600 },
    { playerId: 'p2', name: 'Theronia', level: 15, combatLevel: 18, region: 'starter', lastPlayedAt: Date.now(), playtime: 1200 },
    { playerId: 'p3', name: 'Grommash', level: 50, combatLevel: 55, region: 'dragonspine', lastPlayedAt: Date.now(), playtime: 10000 },
  ];

  it('finds players by name substring', () => {
    const results = lookupPlayers('ther', players);
    expect(results.length).toBe(2);
  });

  it('finds players by ID', () => {
    const results = lookupPlayers('p3', players);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Grommash');
  });

  it('returns empty for no match', () => {
    expect(lookupPlayers('zzz', players)).toHaveLength(0);
  });

  it('respects limit', () => {
    const results = lookupPlayers('t', players, 1);
    expect(results.length).toBe(1);
  });

  it('returns empty for empty query', () => {
    expect(lookupPlayers('', players)).toHaveLength(0);
  });
});

// ─── ADMIN OPERATIONS ───────────────────────────────────────────

describe('executeAdminOperation', () => {
  const session = makeSession('admin');
  const viewerSession = makeSession('viewer');

  it('rejects invalid session', () => {
    const result = executeAdminOperation(
      makeSession('admin', { expiresAt: 0 }),
      { type: 'grant_item', playerId: 'p1', itemId: 'sword', quantity: 1 },
      makePlayerState(),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid');
  });

  it('rejects unauthorized operation', () => {
    const result = executeAdminOperation(
      viewerSession,
      { type: 'set_level', playerId: 'p1', level: 50 },
      makePlayerState(),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('does not have permission');
  });

  it('grant_item succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'grant_item', playerId: 'p1', itemId: 'dragon_sword', quantity: 1 },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('dragon_sword');
    expect(result.previousState).toBeDefined();
  });

  it('remove_item succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'remove_item', playerId: 'p1', itemId: 'iron_ore', quantity: 5 },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
  });

  it('remove_item fails if insufficient quantity', () => {
    const result = executeAdminOperation(
      session,
      { type: 'remove_item', playerId: 'p1', itemId: 'iron_ore', quantity: 999 },
      makePlayerState(),
    );
    expect(result.success).toBe(false);
  });

  it('grant_currency succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'grant_currency', playerId: 'p1', currency: 'gold', amount: 1000 },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
  });

  it('remove_currency fails if insufficient', () => {
    const result = executeAdminOperation(
      session,
      { type: 'remove_currency', playerId: 'p1', currency: 'gold', amount: 99999 },
      makePlayerState(),
    );
    expect(result.success).toBe(false);
  });

  it('set_skill_xp succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'set_skill_xp', playerId: 'p1', skillId: 'mining', xp: 99999 },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
    expect(result.previousState).toEqual({ level: 18, xp: 4200 });
  });

  it('set_level succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'set_level', playerId: 'p1', level: 99 },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
    expect(result.previousState).toEqual({ level: 24, experience: 14750 });
  });

  it('unlock_region succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'unlock_region', playerId: 'p1', regionId: 'dragonspine' },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
  });

  it('reset_quest succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'reset_quest', playerId: 'p1', questId: 'q1' },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
    expect(result.previousState).toEqual({ progress: 1, total: 1, active: true });
  });

  it('grant_dungeon_key succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'grant_dungeon_key', playerId: 'p1', dungeonId: 'd2' },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
  });

  it('spawn_enemy succeeds', () => {
    const result = executeAdminOperation(
      session,
      { type: 'spawn_enemy', playerId: 'p1', enemyId: 'dragon', regionId: 'ashenvale' },
      makePlayerState(),
    );
    expect(result.success).toBe(true);
  });

  it('includes timestamp and adminId in result', () => {
    const result = executeAdminOperation(
      session,
      { type: 'grant_item', playerId: 'p1', itemId: 'test', quantity: 1 },
      makePlayerState(),
    );
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.adminId).toBe('admin_1');
  });
});

// ─── GOD MODE ───────────────────────────────────────────────────

describe('toggleGodMode', () => {
  it('superadmin can enable god mode in development', () => {
    const result = toggleGodMode(makeSession('superadmin'), 'p1', true, 'development');
    expect(result.state).not.toBeNull();
    expect(result.state!.enabled).toBe(true);
    expect(result.state!.environment).toBe('development');
  });

  it('cannot enable god mode in production', () => {
    const result = toggleGodMode(makeSession('superadmin'), 'p1', true, 'production');
    expect(result.state).toBeNull();
    expect(result.error).toContain('production');
  });

  it('admin cannot toggle god mode', () => {
    const result = toggleGodMode(makeSession('admin'), 'p1', true, 'development');
    expect(result.state).toBeNull();
    expect(result.error).toContain('Insufficient permissions');
  });

  it('can disable god mode in any environment', () => {
    const result = toggleGodMode(makeSession('superadmin'), 'p1', false, 'production');
    expect(result.state).not.toBeNull();
    expect(result.state!.enabled).toBe(false);
  });
});

// ─── AUDIT LOG ──────────────────────────────────────────────────

describe('createAuditEntry', () => {
  it('creates an audit entry', () => {
    const session = makeSession('admin');
    const op: AdminOperation = { type: 'grant_item', playerId: 'p1', itemId: 'sword', quantity: 1 };
    const result = executeAdminOperation(session, op, makePlayerState());
    const entry = createAuditEntry(session, op, result, '127.0.0.1');

    expect(entry.id).toContain('audit_');
    expect(entry.adminId).toBe('admin_1');
    expect(entry.operation).toBe('grant_item');
    expect(entry.playerId).toBe('p1');
    expect(entry.success).toBe(true);
    expect(entry.ipAddress).toBe('127.0.0.1');
    expect(entry.timestamp).toBeGreaterThan(0);
  });
});

// ─── ROLE HIERARCHY ─────────────────────────────────────────────

describe('canOverrideRole', () => {
  it('superadmin can override admin', () => {
    expect(canOverrideRole('superadmin', 'admin')).toBe(true);
  });

  it('admin can override moderator', () => {
    expect(canOverrideRole('admin', 'moderator')).toBe(true);
  });

  it('viewer cannot override moderator', () => {
    expect(canOverrideRole('viewer', 'moderator')).toBe(false);
  });

  it('same role cannot override', () => {
    expect(canOverrideRole('admin', 'admin')).toBe(false);
  });
});
