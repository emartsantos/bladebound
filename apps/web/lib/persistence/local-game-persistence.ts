'use client';

import type { GamePersistence, GameSaveData } from './game-persistence';

const SAVE_PREFIX = 'premium-rpg:game:';

/**
 * Local (browser) game persistence. Appropriate for guest / demo play and for
 * a development client. Production authenticated progression is designed to
 * move behind a ServerGamePersistence with the same GamePersistence contract;
 * this implementation is never treated as authoritative for production
 * economy/progression data.
 */
export const localGamePersistence: GamePersistence = {
  load(playerId) {
    try {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${playerId}`);
      return raw ? (JSON.parse(raw) as GameSaveData) : null;
    } catch {
      return null;
    }
  },

  save(playerId, data) {
    try {
      localStorage.setItem(`${SAVE_PREFIX}${playerId}`, JSON.stringify(data));
    } catch {
      // quota / privacy-mode: ignore
    }
  },

  remove(playerId) {
    try {
      localStorage.removeItem(`${SAVE_PREFIX}${playerId}`);
    } catch {
      // ignore
    }
  },
};