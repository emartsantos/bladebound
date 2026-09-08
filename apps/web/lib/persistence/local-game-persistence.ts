'use client';

import type { GamePersistence, GameSaveData } from './game-persistence';

const SAVE_PREFIX = 'premium-rpg:game:';
const RECOVERY_PREFIX = 'premium-rpg:game-recovery:';

function readSave(key: string): GameSaveData | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as GameSaveData) : null;
  } catch {
    return null;
  }
}

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
      return readSave(`${SAVE_PREFIX}${playerId}`) ?? readSave(`${RECOVERY_PREFIX}${playerId}`);
    } catch {
      return null;
    }
  },

  save(playerId, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(`${SAVE_PREFIX}${playerId}`, serialized);
      // A separate recovery copy protects progress from an interrupted write
      // or a malformed primary value after an application update.
      localStorage.setItem(`${RECOVERY_PREFIX}${playerId}`, serialized);
    } catch {
      // quota / privacy-mode: ignore
    }
  },

  remove(playerId) {
    try {
      localStorage.removeItem(`${SAVE_PREFIX}${playerId}`);
      localStorage.removeItem(`${RECOVERY_PREFIX}${playerId}`);
    } catch {
      // ignore
    }
  },
};

/**
 * Move a save from an older, character-id-based key to a stable account key.
 * Existing data at the destination always wins, making this safe to run on
 * every boot and across future deployments.
 */
export function migrateLocalGameSave(fromPlayerId: string, toPlayerId: string): void {
  if (!fromPlayerId || !toPlayerId || fromPlayerId === toPlayerId) return;
  if (localGamePersistence.load(toPlayerId)) return;
  const legacySave = localGamePersistence.load(fromPlayerId);
  if (legacySave) localGamePersistence.save(toPlayerId, legacySave);
}
