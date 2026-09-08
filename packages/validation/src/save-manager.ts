import type { SaveSnapshot, PlayerSaveState } from '@premium-rpg/shared-types';
import { SAVE_SCHEMA_VERSION, MIGRATION_FUNCTIONS, migrateSave, validateSaveVersion } from '@premium-rpg/game-data';
import {
  checkSaveCorruption,
  provideSaveFallback,
  computeSaveChecksum,
  isSaveStale,
} from '@premium-rpg/validation';
import type { StatusEffectType } from '@premium-rpg/shared-types';

/**
 * Triggers an autosave after significant game events.
 * 
 * @param currentPlayerState The current player state before the event
 * @param eventType The type of event that triggered the autosave
 * @param additionalData Optional additional data to incorporate into the save
 * @returns The new save snapshot, or null if autosave was skipped
 */
export function triggerAutosave(
  currentPlayerState: PlayerSaveState,
  eventType: AutosaveEventType,
  additionalData?: Record<string, unknown>
): SaveSnapshot | null {
  // Determine playtime increment based on event
  const timeIncrement = getTimeIncrementForEvent(eventType);
  const newPlaytime = (currentPlayerState.playtime || 0) + timeIncrement;

  // Update timestamps
  const now = Date.now();
  const newLastValidActionTimestamp = now;
  let newLastActionStartTimestamp: number;

  // If there's an active action, mark when it started
  // Otherwise, use the last played at time
  if (currentPlayerState.lastActionStartTimestamp > 0) {
    newLastActionStartTimestamp = currentPlayerState.lastActionStartTimestamp;
  } else {
    newLastActionStartTimestamp = now;
  }

  // Build the updated player save state
  const updatedPlayer: PlayerSaveState = {
    id: currentPlayerState.id,
    name: currentPlayerState.name,
    createdAt: currentPlayerState.createdAt,
    lastPlayedAt: now,
    lastValidActionTimestamp: newLastValidActionTimestamp,
    lastActionStartTimestamp: newLastActionStartTimestamp,
    playtime: newPlaytime,
    region: currentPlayerState.region,
    experience: currentPlayerState.experience ?? 0,
    level: currentPlayerState.level ?? 1,
    skills: currentPlayerState.skills ?? {},
    totalLevel: currentPlayerState.totalLevel ?? 1,
  };

  // Build the save snapshot
  const save: SaveSnapshot = {
    id: `save_${currentPlayerState.id}_${now}`,
    version: SAVE_SCHEMA_VERSION,
    player: updatedPlayer,
    timestamp: now,
    checksum: '',
  };

  // Run corruption check
  const corruptionCheck = checkSaveCorruption(save);
  if (!corruptionCheck.isValid) {
    // Attempt to provide a fallback
    return provideSaveFallback(
      corruptionCheck.save || save,
      (fixedSave: SaveSnapshot) => fixedSave
    );
  }

  // Update checksum
  save.checksum = computeSaveChecksum(save);

  // Run corruption check again after checksum update
  const finalCheck = checkSaveCorruption(save);
  if (!finalCheck.isValid) {
    return provideSaveFallback(save, (fixedSave: SaveSnapshot) => fixedSave);
  }

  return save;
}

/**
 * Gets the playtime increment for a given autosave event.
 */
function getTimeIncrementForEvent(eventType: AutosaveEventType): number {
  switch (eventType) {
    case 'combat':
      return 5 * 60; // 5 minutes of combat
    case 'level_up':
      return 30 * 60; // 30 minutes of gameplay
    case 'quest_complete':
      return 10 * 60; // 10 minutes of gameplay
    case 'equipment_change':
      return 2 * 60; // 2 minutes of gameplay
    case 'offline_progression':
      return calculateOfflinePlaytime();
    default:
      return 1 * 60; // 1 minute default
  }
}

/**
 * Calculates playtime gained during offline period.
 * Uses lastValidActionTimestamp and lastActionStartTimestamp to determine
 * how long the player was actively playing vs idle.
 */
function calculateOfflinePlaytime(): number {
  // Get the time difference since last valid action
  // This is a simplification - in production would track more carefully
  const now = Date.now();
  // Default: assume some offline time, but cap it
  const maxOfflineMinutes = 480; // 8 hours max
  return maxOfflineMinutes * 60;
}

/**
 * Triggers a manual save (player-initiated).
 * 
 * This is similar to autosave but can be called directly
 * from the UI (e.g., player presses F5 or clicks "Save").
 * 
 * @param currentPlayerState The current player state
 * @returns The new save snapshot
 */
export function triggerManualSave(
  currentPlayerState: PlayerSaveState
): SaveSnapshot | null {
  const now = Date.now();

  // Update player state for manual save
  const updatedPlayer: PlayerSaveState = {
    id: currentPlayerState.id,
    name: currentPlayerState.name,
    createdAt: currentPlayerState.createdAt,
    lastPlayedAt: now,
    lastValidActionTimestamp: now,
    lastActionStartTimestamp: now,
    playtime: currentPlayerState.playtime || 0,
    region: currentPlayerState.region,
    experience: currentPlayerState.experience ?? 0,
    level: currentPlayerState.level ?? 1,
    skills: currentPlayerState.skills ?? {},
    totalLevel: currentPlayerState.totalLevel ?? 1,
  };

  // Build save snapshot
  const save: SaveSnapshot = {
    id: `save_manual_${currentPlayerState.id}_${now}`,
    version: SAVE_SCHEMA_VERSION,
    player: updatedPlayer,
    timestamp: now,
    checksum: '',
  };

  // Validate and check for corruption
  const corruptionCheck = checkSaveCorruption(save);
  if (!corruptionCheck.isValid) {
    return provideSaveFallback(
      corruptionCheck.save || save,
      (fixedSave: SaveSnapshot) => fixedSave
    );
  }

  // Compute and set checksum
  save.checksum = computeSaveChecksum(save);

  // Final validation
  const finalCheck = checkSaveCorruption(save);
  if (!finalCheck.isValid) {
    return provideSaveFallback(save, (fixedSave: SaveSnapshot) => fixedSave);
  }

  return save;
}

/**
 * Types of events that can trigger autosave.
 */
export enum AutosaveEventType {
  // Combat-related events
  combat = 'combat',

  // Progression events
  level_up = 'level_up',
  quest_complete = 'quest_complete',

  // Gameplay events
  equipment_change = 'equipment_change',

  // System events
  offline_progression = 'offline_progression',
  game_start = 'game_start',
  game_exit = 'game_exit',
}

/**
 * Saves the current player state to storage.
 * The storage mechanism (localStorage, AsyncStorage, etc.) 
 * is handled by the app layer; this function just prepares the save data.
 * 
 * @param playerState The current player state
 * @param slot The save slot number (for multi-slot saves)
 * @returns The prepared save snapshot, ready for storage
 */
export function savePlayerState(
  playerState: PlayerSaveState,
  slot: number = 0
): SaveSnapshot | null {
  const now = Date.now();

  const updatedPlayer: PlayerSaveState = {
    id: playerState.id,
    name: playerState.name,
    createdAt: playerState.createdAt,
    lastPlayedAt: now,
    lastValidActionTimestamp: now,
    lastActionStartTimestamp: now,
    playtime: playerState.playtime || 0,
    region: playerState.region,
    experience: playerState.experience ?? 0,
    level: playerState.level ?? 1,
    skills: playerState.skills ?? {},
    totalLevel: playerState.totalLevel ?? 1,
  };

  const save: SaveSnapshot = {
    id: `save_slot${slot}_${playerState.id}_${now}`,
    version: SAVE_SCHEMA_VERSION,
    player: updatedPlayer,
    timestamp: now,
    checksum: '',
  };

  // Check for corruption
  const corruptionCheck = checkSaveCorruption(save);
  if (!corruptionCheck.isValid) {
    return provideSaveFallback(
      corruptionCheck.save || save,
      (fixedSave: SaveSnapshot) => fixedSave
    );
  }

  // Compute checksum
  save.checksum = computeSaveChecksum(save);

  // Final validation
  const finalCheck = checkSaveCorruption(save);
  if (!finalCheck.isValid) {
    return provideSaveFallback(save, (fixedSave: SaveSnapshot) => fixedSave);
  }

  return save;
}

/**
 * Loads a save from raw data, running corruption checks and migration if needed.
 * 
 * @param rawSaveData The raw save data (could be from localStorage, server, etc.)
 * @returns A validated and potentially migrated SaveSnapshot, or null if save is invalid
 */
export function loadSave(rawSaveData: unknown): SaveSnapshot | null {
  // Step 1: Basic sanity check
  if (rawSaveData === null || typeof rawSaveData !== 'object') {
    return null;
  }

  const record = rawSaveData as Record<string, unknown>;

  // Step 2: Validate version
  if (typeof record.version !== 'number') {
    return null;
  }

  // Step 3: Attempt migration if version doesn't match current schema
  if (record.version !== SAVE_SCHEMA_VERSION) {
    const migrationPath = (MIGRATION_FUNCTIONS as any)[record.version];
    if (migrationPath) {
      let migrated = migrationPath(rawSaveData as SaveSnapshot);
      // Continue migrating through all intermediate versions
      for (let v = record.version; v < SAVE_SCHEMA_VERSION; v++) {
        const nextMigration = (MIGRATION_FUNCTIONS as any)[v];
        if (nextMigration) {
          migrated = nextMigration(migrated);
        } else {
          // Can't migrate further - try to load as-is with warning
          break;
        }
      }
      // Validate the migrated save
      const versionCheck = validateSaveVersion(migrated.version);
      if (versionCheck.valid) {
        return migrated;
      }
    }
    // If migration fails or isn't available, return null
    return null;
  }

  // Step 4: Run corruption check
  const corruptionCheck = checkSaveCorruption(rawSaveData as SaveSnapshot);
  if (!corruptionCheck.isValid) {
    // Attempt fallback
    const fixedSave = provideSaveFallback(
      corruptionCheck.save as SaveSnapshot | null,
      () => {}
    );
    return fixedSave || null;
  }

  return corruptionCheck.save as SaveSnapshot;
}