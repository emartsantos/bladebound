import type { SaveSnapshot } from '@premium-rpg/shared-types';

// Release version identifier
export const GAME_VERSION = '0.1.0';

// Save schema version — tracks the structure of save payloads
// v1: Initial release — player, basic equipment, inventory, currency, skills level 1-10
// v2: Add offline progression, status effects, buffs
// v3: Add dungeon data, quest progress tracking
// v4: Add collections, achievements
// v5: Add crafting recipes, tasks
export const SAVE_SCHEMA_VERSION = 5;

// Migration function type
type MigrationFunction = (save: SaveSnapshot) => SaveSnapshot;

// Individual migration functions (internal, not exported as variables)
function migrateV1ToV2internal(save: SaveSnapshot): SaveSnapshot {
  const player = save.player as any;

  const migratedPlayer: any = {
    id: player.id,
    name: player.name,
    createdAt: player.createdAt,
    lastPlayedAt: player.lastPlayedAt,
    playtime: player.playtime,
    region: player.region,
    // New v2 fields
    lastValidActionTimestamp: player.lastPlayedAt,
    activeAction: player.activeAction || null,
    lastActionStartTimestamp: player.lastPlayedAt,
    statusEffects: {} as Record<string, any>,
    buffs: [] as any[],
  };

  return {
    ...save,
    player: migratedPlayer,
    version: 2,
  };
}

function migrateV2ToV3internal(save: SaveSnapshot): SaveSnapshot {
  const player = save.player as any;

  const migratedPlayer: any = {
    ...player,
    // New v3 fields
    dungeonProgress: {} as Record<string, any>,
    questProgress: {} as Record<string, any>,
    lastSaveTimestamp: player.lastValidActionTimestamp || player.lastPlayedAt,
  };

  return {
    ...save,
    player: migratedPlayer,
    version: 3,
  };
}

function migrateV3ToV4internal(save: SaveSnapshot): SaveSnapshot {
  const player = save.player as any;

  const migratedPlayer: any = {
    ...player,
    // New v4 fields
    collections: {} as Record<string, number>,
    achievements: {} as Record<string, boolean>,
    dateLastPlayed: new Date(player.lastSaveTimestamp || Date.now()).toISOString().split('T')[0],
  };

  return {
    ...save,
    player: migratedPlayer,
    version: 4,
  };
}

function migrateV4ToV5internal(save: SaveSnapshot): SaveSnapshot {
  const player = save.player as any;

  const migratedPlayer: any = {
    ...player,
    // New v5 fields
    craftingRecipes: {} as Record<string, { learned: boolean; progress: number }>,
    taskQueue: [] as any[],
    migrationVersion: 5,
  };

  return {
    ...save,
    player: migratedPlayer,
    version: 5,
  };
}

// Exported migration functions — each maps version N → N+1
export const migrateV1ToV2: MigrationFunction = migrateV1ToV2internal;
export const migrateV2ToV3: MigrationFunction = migrateV2ToV3internal;
export const migrateV3ToV4: MigrationFunction = migrateV3ToV4internal;
export const migrateV4ToV5: MigrationFunction = migrateV4ToV5internal;

// Migration functions record — maps version number to migration function
export const MIGRATION_FUNCTIONS: Record<number, MigrationFunction> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
};

// Migration path from any version to any target version
export function getMigrationPath(fromVersion: number, toVersion: number): ((save: SaveSnapshot) => SaveSnapshot)[] {
  const path: ((save: SaveSnapshot) => SaveSnapshot)[] = [];

  if (fromVersion >= toVersion) {
    return path;
  }

  for (let v = fromVersion; v < toVersion; v++) {
    const migration = MIGRATION_FUNCTIONS[v];
    if (migration) {
      path.push(migration);
    } else {
      // No migration available for this version pair
      break;
    }
  }

  return path;
}

export function migrateSave(save: SaveSnapshot, targetVersion: number): SaveSnapshot | null {
  if (save.version === targetVersion) {
    return save;
  }

  if (targetVersion > SAVE_SCHEMA_VERSION) {
    return null; // Target version beyond current schema
  }

  const migrationPath = getMigrationPath(save.version, targetVersion);

  if (migrationPath.length === targetVersion - save.version) {
    let result = save;
    for (const migration of migrationPath) {
      result = migration(result);
    }
    result.version = targetVersion;
    return result;
  }

  return null;
}

// Validate save payload version against current schema
export function validateSaveVersion(version: number): { valid: boolean; maxVersion: number; error?: string } {
  const maxVersion = SAVE_SCHEMA_VERSION;

  if (version < 1) {
    return { valid: false, maxVersion, error: `Save version must be at least 1` };
  }

  if (version > maxVersion) {
    return { valid: false, maxVersion, error: `Save version ${version} is future. Current max is ${maxVersion}. Migration may be required.` };
  }

  return { valid: true, maxVersion };
}