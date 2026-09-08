'use client';

import type {
  AuthSession,
  AuthLoginResponse,
  AuthRegisterResponse,
  AuthState,
  GuestSessionData,
  CharacterMetadata,
  CreateCharacterRequest,
  CreateCharacterResponse,
  RenameCharacterRequest,
  RenameCharacterResponse,
  SaveSnapshot,
} from '@premium-rpg/shared-types';
import { migrateSave, SAVE_SCHEMA_VERSION, validateSaveVersion } from '@premium-rpg/game-data';
import { checkSaveCorruption, provideSaveFallback, computeSaveChecksum } from '@premium-rpg/validation';
import { DEFAULT_STARTING_GOLD } from '@/lib/player-summary';
import { getPlayerClass, DEFAULT_PLAYER_CLASS } from '@/lib/classes';
import type { PlayerClassId } from '@/lib/classes';
export type { PlayerClassId };

/**
 * DEVELOPMENT authentication adapter.
 *
 * This is a local, in-browser stand-in for a real auth service so the game
 * can run without a backend. It is deliberately isolated behind the AuthClient
 * interface. Production limitations, by design:
 *
 *  - registered users are held in in-memory MOCK_USERS (volatile), and only a
 *    non-secret character *snapshot* is kept in localStorage so a reload can
 *    restore the last known profile
 *  - passwords are NEVER stored (not in memory after reload, never in
 *    localStorage); logging in after a reload therefore requires re-registering
 *  - tokens are client-generated and must never be treated as production auth
 *  - guest sessions persist locally for the demo
 *
 * Nothing in the app reads this adapter directly; go through getAuthClient().
 */

interface AuthPersistence {
  token: string | null;
  playerId: string | null;
  guestId: string | null;
  characterId: string | null;
  version: number;
}

const DEFAULT_PERSISTENCE: AuthPersistence = {
  token: null,
  playerId: null,
  guestId: null,
  characterId: null,
  version: 0,
};

/** Last-known registered character snapshot, keyed by account username. */
interface AccountSnapshot {
  character: CharacterMetadata;
  savedAt: number;
}

/** Last-known guest snapshot. */
interface GuestSnapshot {
  guestId: string;
  character: CharacterMetadata;
  createdAt: number;
  lastPlayedAt: number;
}

/** Volatile in-memory user store (dev only). Never persisted. */
const MOCK_USERS: Record<string, { password: string; characters: CharacterMetadata[] }> = {};

const AUTH_KEY = 'premium-rpg-auth';
const ACCOUNT_KEY_PREFIX = 'premium-rpg:dev:account:';
const GUEST_KEY_PREFIX = 'premium-rpg:dev:guest:';

const loadAuthFromStorage = (): AuthPersistence => {
  try {
    const serialized = localStorage.getItem(AUTH_KEY);
    if (serialized) return JSON.parse(serialized);
  } catch {
    // ignore
  }
  return { ...DEFAULT_PERSISTENCE };
};

const saveAuthToStorage = (persist: AuthPersistence) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(persist));
  } catch {
    // ignore
  }
};

const loadAccountSnapshot = (username: string): AccountSnapshot | null => {
  try {
    const raw = localStorage.getItem(`${ACCOUNT_KEY_PREFIX}${username}`);
    return raw ? (JSON.parse(raw) as AccountSnapshot) : null;
  } catch {
    return null;
  }
};

const saveAccountSnapshot = (username: string, snapshot: AccountSnapshot) => {
  try {
    localStorage.setItem(`${ACCOUNT_KEY_PREFIX}${username}`, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
};

const loadGuestSnapshot = (guestId: string): GuestSnapshot | null => {
  try {
    const raw = localStorage.getItem(`${GUEST_KEY_PREFIX}${guestId}`);
    return raw ? (JSON.parse(raw) as GuestSnapshot) : null;
  } catch {
    return null;
  }
};

const saveGuestSnapshot = (guestId: string, snapshot: GuestSnapshot) => {
  try {
    localStorage.setItem(`${GUEST_KEY_PREFIX}${guestId}`, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
};

const emptyEquipment = (): CharacterMetadata['equipment'] => ({
  weapon: { itemId: null, durability: null },
  offhand: { itemId: null, durability: null },
  helmet: { itemId: null, durability: null },
  chest: { itemId: null, durability: null },
  gloves: { itemId: null, durability: null },
  legs: { itemId: null, durability: null },
  boots: { itemId: null, durability: null },
  amulet: { itemId: null, durability: null },
  ring: { itemId: null, durability: null },
  cape: { itemId: null, durability: null },
});

// Real starting state for a freshly registered/created character. Item ids
// resolve in `@premium-rpg/game-data` ITEM_BY_ID. Class selection alters the
// starter weapon/chest and gives a small trade-skill lean so the choice is
// visible from level 1.
const STARTER_SKILLS: Record<string, number> = {
  mining: 1, woodcutting: 1, fishing: 1, smelting: 1,
  smithing: 1, cooking: 1, fletching: 1, alchemy: 1, runecrafting: 1,
};

const starterEquipment = (characterClass: PlayerClassId): CharacterMetadata['equipment'] => {
  const base = emptyEquipment();
  const def = getPlayerClass(characterClass);
  base.weapon = { itemId: def.weaponId, durability: 100 };
  base.chest = { itemId: def.chestId, durability: 100 };
  return base;
};

export const starterCharacter = (id: string, name: string, characterClass: PlayerClassId = DEFAULT_PLAYER_CLASS): CharacterMetadata => {
  const def = getPlayerClass(characterClass);
  const skills = { ...STARTER_SKILLS };
  for (const [skill, lean] of Object.entries(def.skillLean)) {
    skills[skill] = Math.max(skills[skill] ?? 1, (lean ?? 0) + 1);
  }
  const totalLevel = Object.values(skills).reduce((a, b) => a + b, 0);
  return {
    id,
    name,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    playtime: 0,
    combatLevel: 1,
    totalLevel,
    region: 'starter-frontier',
    avatar: '',
    class: def.id,
    gold: DEFAULT_STARTING_GOLD,
    skills,
    equipment: starterEquipment(characterClass),
    inventory: {},
  };
};

const withDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const makeSession = (username: string): AuthSession => ({
  token: `token-${username}-${Date.now()}`,
  playerId: username,
  createdAt: Date.now(),
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  guest: false,
});

async function login(username: string, password: string): Promise<AuthLoginResponse> {
  await withDelay(500);

  const entry = MOCK_USERS[username];
  if (!entry || entry.password !== password || entry.characters.length === 0) {
    return { success: false, session: null, error: 'Invalid credentials' };
  }

  const session = makeSession(username);
  saveAuthToStorage({
    token: session.token,
    playerId: username,
    guestId: null,
    characterId: entry.characters[0].id,
    version: 1,
  });
  saveAccountSnapshot(username, { character: entry.characters[0], savedAt: Date.now() });

  return { success: true, session };
}

async function register(
  username: string,
  password: string,
  characterClass?: PlayerClassId,
): Promise<AuthRegisterResponse> {
  await withDelay(500);

  if (MOCK_USERS[username]) {
    return { success: false, session: null, error: 'Username already exists' };
  }

  const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, username, characterClass);

  MOCK_USERS[username] = { password, characters: [character] };

  const session = makeSession(username);
  saveAuthToStorage({
    token: session.token,
    playerId: username,
    guestId: null,
    characterId: character.id,
    version: 1,
  });
  saveAccountSnapshot(username, { character, savedAt: Date.now() });

  return { success: true, session, character };
}

async function createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse> {
  await withDelay(300);

  const persist = loadAuthFromStorage();
  if (!persist.playerId) {
    return { success: false, error: 'User not found' };
  }

  const user = MOCK_USERS[persist.playerId];
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.characters.length >= 3) {
    return { success: false, error: 'Maximum characters reached' };
  }

  const character: CharacterMetadata = starterCharacter(
    `char-${Date.now()}`,
    request.name,
    request.class as PlayerClassId | undefined,
  );
  user.characters.push(character);
  saveAccountSnapshot(persist.playerId, { character, savedAt: Date.now() });

  return { success: true, character };
}

async function renameCharacter(request: RenameCharacterRequest): Promise<RenameCharacterResponse> {
  await withDelay(300);

  const persist = loadAuthFromStorage();
  if (!persist.characterId) {
    return { success: false, error: 'No character selected' };
  }

  const user = Object.values(MOCK_USERS).find((u) =>
    u.characters.some((c) => c.id === persist.characterId),
  );
  if (!user) {
    return { success: false, error: 'Character not found' };
  }

  if (user.characters.some((c) => c.name === request.newName && c.id !== persist.characterId)) {
    return { success: false, error: 'Name already in use' };
  }

  const character = user.characters.find((c) => c.id === persist.characterId);
  if (character) {
    character.name = request.newName;
    character.lastPlayedAt = Date.now();
    if (persist.playerId) {
      saveAccountSnapshot(persist.playerId, { character, savedAt: Date.now() });
    }
  }

  return { success: true, character };
}

async function loginAsGuest(characterClass?: PlayerClassId): Promise<AuthLoginResponse> {
  await withDelay(200);

  const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, 'Guest', characterClass);

  const guestSave: SaveSnapshot = {
    id: `guest_${guestId}`,
    version: SAVE_SCHEMA_VERSION,
    player: {
      id: `player_${guestId}`,
      name: 'Guest',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      lastValidActionTimestamp: Date.now(),
      lastActionStartTimestamp: Date.now(),
      playtime: 0,
      region: 'starter-frontier',
      experience: 0,
      level: 1,
      skills: {},
      totalLevel: 1,
    },
    timestamp: Date.now(),
    checksum: '',
  };

  const guestSession: GuestSessionData = {
    guestId,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    playtime: 0,
    character,
    saveState: guestSave,
  };

  const session: AuthSession = {
    token: `guest-${guestId}`,
    playerId: '',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    guest: true,
  };

  saveAuthToStorage({
    token: session.token,
    playerId: '',
    guestId,
    characterId: character.id,
    version: SAVE_SCHEMA_VERSION,
  });
  saveGuestSnapshot(guestId, {
    guestId,
    character,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  });

  return { success: true, session, guestSession };
}

function restoreSession(): AuthState {
  const persisted = loadAuthFromStorage();

  if (!persisted.token || !persisted.characterId) {
    return { isAuthenticated: false, isGuest: false, session: null, guestSession: null, character: null, loading: false };
  }

  if (persisted.guestId) {
    const snapshot = loadGuestSnapshot(persisted.guestId);
    const character =
      snapshot?.character ?? starterCharacter(persisted.characterId, 'Guest');
    return {
      isAuthenticated: true,
      isGuest: true,
      session: {
        token: persisted.token,
        playerId: '',
        createdAt: 0,
        expiresAt: 0,
        guest: true,
      },
      guestSession: {
        guestId: persisted.guestId,
        createdAt: snapshot?.createdAt ?? 0,
        lastPlayedAt: snapshot?.lastPlayedAt ?? 0,
        playtime: 0,
        character,
        saveState: {
          id: `guest_${persisted.guestId}`,
          version: persisted.version || SAVE_SCHEMA_VERSION,
          player: {
            id: `player_${persisted.guestId}`,
            name: character.name,
            createdAt: character.createdAt,
            lastPlayedAt: character.lastPlayedAt,
            lastValidActionTimestamp: character.lastPlayedAt,
            lastActionStartTimestamp: character.lastPlayedAt,
            playtime: character.playtime,
            region: character.region,
            experience: 0,
            level: character.combatLevel,
            skills: { ...character.skills },
            totalLevel: character.totalLevel,
          },
          timestamp: character.lastPlayedAt,
          checksum: '',
        },
      },
      character,
      loading: false,
    };
  }

  const account = persisted.playerId ? loadAccountSnapshot(persisted.playerId) : null;
  const character = account?.character ?? starterCharacter(persisted.characterId, 'Player');

  return {
    isAuthenticated: true,
    isGuest: false,
    session: {
      token: persisted.token,
      playerId: persisted.playerId || '',
      createdAt: 0,
      expiresAt: 0,
      guest: false,
    },
    guestSession: null,
    character,
    loading: false,
  };
}

function logout(): void {
  saveAuthToStorage({ ...DEFAULT_PERSISTENCE });
}

/**
 * Exports the current guest save state as JSON string.
 */
function exportGuestSave(): string | null {
  try {
    const persistence = loadAuthFromStorage();
    if (!persistence.guestId || !persistence.token) {
      return null;
    }

    const guestSave: SaveSnapshot = {
      id: `guest_${persistence.guestId}`,
      version: persistence.version || 0,
      player: {
        id: `player_${persistence.guestId}`,
        name: 'Guest Player',
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        lastValidActionTimestamp: Date.now(),
        lastActionStartTimestamp: Date.now(),
        playtime: 0,
        region: 'starter-frontier',
        experience: 0,
        level: 1,
        skills: {},
        totalLevel: 1,
      },
      timestamp: Date.now(),
      checksum: '',
    };

    guestSave.checksum = computeSaveChecksum(guestSave);

    const versionCheck = validateSaveVersion(guestSave.version);
    let migratedSave = guestSave;

    if (!versionCheck.valid && guestSave.version < SAVE_SCHEMA_VERSION) {
      migratedSave = migrateSave(guestSave, SAVE_SCHEMA_VERSION) || guestSave;
    }

    return JSON.stringify(migratedSave);
  } catch {
    return null;
  }
}

/**
 * Imports a guest save state from JSON string.
 */
function importGuestSave(saveData: string): { success: boolean; guestSession: GuestSessionData | null } {
  try {
    const parsed = JSON.parse(saveData) as SaveSnapshot;

    const corruptionCheck = checkSaveCorruption(parsed);
    if (!corruptionCheck.isValid) {
      provideSaveFallback(
        corruptionCheck.save || parsed,
        () => {},
        () => {},
      );
    }

    const versionCheck = validateSaveVersion(parsed.version);
    let migratedSave = parsed;

    if (!versionCheck.valid && parsed.version < SAVE_SCHEMA_VERSION) {
      migratedSave = migrateSave(parsed, SAVE_SCHEMA_VERSION) || parsed;
    }

    const guestId = `guest-import-${Date.now()}`;
    const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, 'Imported Guest');

    const guestSession: GuestSessionData = {
      guestId,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      playtime: 0,
      character,
      saveState: migratedSave,
    };

    return { success: true, guestSession };
  } catch {
    return { success: false, guestSession: null };
  }
}

export const developmentAuthClient = {
  login,
  register,
  loginAsGuest,
  createCharacter,
  renameCharacter,
  restoreSession,
  logout,
  exportGuestSave,
  importGuestSave,
};
