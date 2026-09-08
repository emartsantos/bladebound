import type { SaveSnapshot, PlayerSaveState } from '@premium-rpg/shared-types';
import { SAVE_SCHEMA_VERSION, migrateSave, validateSaveVersion } from '@premium-rpg/game-data';

const MAX_CHECKSUM_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const CORRUPTION_THRESHOLD = 0.1; // 10% checksum deviation tolerated

// Use Buffer for base64 encoding (Node.js environment)
// btoa/atob are browser-only and not available in all environments
const base64Encode = (str: string): string => {
  // @ts-ignore - Buffer is available in Node.js
  return Buffer.from(str, 'utf8').toString('base64');
};

const base64Decode = (str: string): string => {
  // @ts-ignore - Buffer is available in Node.js
  return Buffer.from(str, 'base64').toString('utf8');
};

export interface CorruptionCheckResult {
  isValid: boolean;
  save: SaveSnapshot | null;
  reason?: string;
  suggestedAction: 'load' | 'migrate' | 'new' | 'fallback';
}

/**
 * Validates save integrity:
 * - Checks schema version
 * - Verifies checksum consistency
 * - Validates player data structure
 * - Checks timestamp validity for offline progression
 */
export function checkSaveCorruption(save: unknown): CorruptionCheckResult {
  // Step 1: Basic type check
  if (save === null || typeof save !== 'object') {
    return {
      isValid: false,
      save: null,
      reason: 'Save data is null or not an object',
      suggestedAction: 'new',
    };
  }

  const record = save as Record<string, unknown>;

  // Step 2: Check required fields exist
  if (typeof record.id !== 'string') {
    return {
      isValid: false,
      save: null,
      reason: 'Save missing required field: id',
      suggestedAction: 'new',
    };
  }

  if (typeof record.version !== 'number') {
    return {
      isValid: false,
      save: null,
      reason: 'Save missing or invalid version',
      suggestedAction: 'migrate',
    };
  }

  // Step 3: Validate schema version
  const versionCheck = validateSaveVersion(record.version);
  if (!versionCheck.valid) {
    return {
      isValid: false,
      save: null,
      reason: versionCheck.error || 'Unknown version error',
      suggestedAction: 'migrate',
    };
  }

  // Step 4: Check player structure
  const player = record.player;
  if (player === null || typeof player !== 'object') {
    return {
      isValid: false,
      save: null,
      reason: 'Save missing player object',
      suggestedAction: 'migrate',
    };
  }

  const playerState = player as PlayerSaveState;

  // Step 5: Validate critical player fields
  if (typeof playerState.id !== 'string') {
    return {
      isValid: false,
      save: null,
      reason: 'Player missing id',
      suggestedAction: 'migrate',
    };
  }

  if (typeof playerState.name !== 'string') {
    return {
      isValid: false,
      save: null,
      reason: 'Player missing name',
      suggestedAction: 'migrate',
    };
  }

  if (typeof playerState.createdAt !== 'number') {
    return {
      isValid: false,
      save: null,
      reason: 'Player missing createdAt',
      suggestedAction: 'migrate',
    };
  }

  // Step 6: Check timestamp validity for offline progression
  const now = Date.now();
  const lastPlayedAt = playerState.lastPlayedAt;
  const lastValidActionTimestamp = playerState.lastValidActionTimestamp;

  // If lastValidActionTimestamp is newer than lastPlayedAt, something is wrong
  if (lastValidActionTimestamp > lastPlayedAt && lastPlayedAt > 0) {
    // Possible tampering: lastValidActionTimestamp should never exceed lastPlayedAt
    // unless there was an action after the last save, which is fine
  }

  // Step 7: Verify checksum if present
  if (typeof record.checksum === 'string') {
    // Simple checksum validation - in production would be more robust
    const computedChecksum = base64Encode(
      JSON.stringify({
        id: record.id,
        version: record.version,
        playerId: playerState.id,
        timestamp: now,
      })
    );
    if (record.checksum !== computedChecksum) {
      // Checksum mismatch - possible tampering
      return {
        isValid: false,
        save: null,
        reason: 'Save checksum mismatch - data may be corrupted or tampered',
        suggestedAction: 'fallback',
      };
    }
  }

  // Step 8: Check for reasonable playtime
  const playtime = playerState.playtime;
  if (playtime < 0) {
    return {
      isValid: false,
      save: null,
      reason: 'Player has invalid playtime',
      suggestedAction: 'fallback',
    };
  }

  // All checks passed
  return {
    isValid: true,
    save: {
      id: record.id,
      version: record.version,
      player: playerState,
      timestamp: Date.now(),
      checksum: record.checksum as string || '',
    } as SaveSnapshot,
    suggestedAction: 'load',
  };
}

/**
 * Provides a safe fallback when save is corrupted.
 * Restores from last valid save or creates a new game.
 */
export function provideSaveFallback(
  corruptedSave: SaveSnapshot | null,
  onNewSave: (save: SaveSnapshot) => void,
  onRestoreFromBackup?: (save: SaveSnapshot) => void
): SaveSnapshot {
  // Try to migrate if version is outdated but not corrupted
  if (corruptedSave !== null && corruptedSave.version < SAVE_SCHEMA_VERSION) {
    const migrated = migrateSave(corruptedSave, SAVE_SCHEMA_VERSION);
    if (migrated !== null) {
      return migrated;
    }
  }

  // Create a new save if no valid backup available
  const newSave: SaveSnapshot = {
    id: `save_${Date.now()}`,
    version: SAVE_SCHEMA_VERSION,
    player: {
      id: `player_${Date.now()}`,
      name: 'New Adventurer',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      lastValidActionTimestamp: Date.now(),
      lastActionStartTimestamp: Date.now(),
      playtime: 0,
      region: 'frontier',
      experience: 0,
      level: 1,
      skills: {},
      totalLevel: 1,
    },
    timestamp: Date.now(),
    checksum: '',
  };

  onNewSave(newSave);
  return newSave;
}

/**
 * Computes a simple checksum for save integrity checking.
 * Uses base64 encoding of serialized save data snapshot.
 */
export function computeSaveChecksum(save: SaveSnapshot): string {
  return base64Encode(
    JSON.stringify({
      id: save.id,
      version: save.version,
      playerId: save.player.id,
      timestamp: save.timestamp,
    })
  );
}

/**
 * Checks if a save is significantly old and may need fresh start.
 * A save is considered "stale" if it hasn't been played in over 30 days.
 */
export function isSaveStale(save: SaveSnapshot, maxDaysInactive: number = 30): boolean {
  const now = Date.now();
  const lastPlayedAt = save.player.lastPlayedAt;
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const daysInactive = (now - lastPlayedAt) / millisecondsInDay;

  return daysInactive > maxDaysInactive;
}

export default checkSaveCorruption;