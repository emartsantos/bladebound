import {
  computeRewardedElapsed,
  DEFAULT_OFFLINE_POLICIES,
} from '@premium-rpg/game-engine';
import type { PlayerStateSnapshot, OfflineSessionStart } from '@premium-rpg/shared-types';

/**
 * In a production build this data comes from the shared API client
 * (dispatchApiRequest from @premium-rpg/game-engine). For Phase 34 we
 * provide a representative snapshot built from the shared types so the
 * mobile interface can be exercised without DOM or a running server.
 *
 * Formulas are NOT re-implemented here — anything computational (offline
 * reward calc) delegates to the shared game-engine.
 */

export const MOCK_PLAYER: PlayerStateSnapshot = {
  playerId: 'player_mobile_demo',
  name: 'Theron',
  level: 24,
  combatLevel: 26,
  totalLevel: 50,
  experience: 14750,
  gold: 12450,
  region: 'ashenvale',
  skills: {
    mining: { level: 18, xp: 4200 },
    woodcutting: { level: 14, xp: 2800 },
    fishing: { level: 9, xp: 900 },
    foraging: { level: 12, xp: 1800 },
  },
  equipment: {
    weapon: { itemId: 'iron_sword', durability: 80 },
    armor: { itemId: 'leather_armor', durability: 65 },
    offhand: { itemId: null, durability: null },
  },
  inventory: [
    { itemId: 'iron_ore', quantity: 20 },
    { itemId: 'health_potion', quantity: 5 },
    { itemId: 'maple_log', quantity: 12 },
    { itemId: 'wolf_pelt', quantity: 3 },
  ],
  questProgress: {
    'first_blade': { progress: 3, total: 3, active: true },
    'ashen_contract': { progress: 8, total: 15, active: true },
  },
  dungeonProgress: {
    'gloomvault': { completions: 3, bestTime: 120 },
  },
  achievements: {
    'first_level': true,
    'first_kill': true,
  },
  collections: {
    beasts: 5,
    minerals: 3,
  },
  lastSavedAt: Date.now(),
  playtime: 3600,
};

export interface OfflineSummary {
  elapsedMs: number;
  rewardMs: number;
  capped: boolean;
}

/**
 * Compute offline reward using the SHARED engine formula (no duplication).
 */
export function buildOfflineSummary(elapsedMs: number): OfflineSummary {
  const nowMs = Date.now();
  const leftAt = nowMs - elapsedMs;
  const session: OfflineSessionStart = {
    leftAt,
    action: {
      kind: 'gathering',
      startedAt: leftAt,
      lastValidActionTimestamp: leftAt,
      durationMs: 5000,
    },
    baseline: {
      skills: {
        mining: { level: 18, xp: 4200 },
        woodcutting: { level: 14, xp: 2800 },
      },
      resourcesHeld: {},
    },
  };
  const rewarded = computeRewardedElapsed(session, DEFAULT_OFFLINE_POLICIES, {
    nowMs,
  });
  return {
    elapsedMs,
    rewardMs: rewarded.elapsedMs,
    capped: rewarded.cappedByPolicy || rewarded.reason !== 'ok',
  };
}
