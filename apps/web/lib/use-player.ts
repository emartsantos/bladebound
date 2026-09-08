'use client';

import { useAuth } from '@/context/auth-context';
import {
  PLAYER_SUMMARY,
  PLAYER_BASE_STATS,
  buildPlayerSummary,
  baseStatsForLevel,
} from '@/lib/player-summary';
import type { BaseStats, PlayerSummary } from '@premium-rpg/shared-types';

export interface PlayerView {
  player: PlayerSummary;
  baseStats: BaseStats;
  isDemoPlayer: boolean;
}

/**
 * The player the in-game shell renders. Registered/logged-in accounts see
 * their own character (name, levels, skills, equipment, gold); guest sessions
 * keep playing the demo character so the guest experience stays filled-out.
 */
export function usePlayer(): PlayerView {
  const { state } = useAuth();
  const isRegistered = state.isAuthenticated && !state.isGuest && state.character != null;

  if (!isRegistered) {
    return { player: PLAYER_SUMMARY, baseStats: PLAYER_BASE_STATS, isDemoPlayer: true };
  }

  const character = state.character!;
  const player = buildPlayerSummary(character);
  return { player, baseStats: baseStatsForLevel(player.combatLevel), isDemoPlayer: false };
}