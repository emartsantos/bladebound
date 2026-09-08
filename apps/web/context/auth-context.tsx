'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthSession,
  AuthLoginResponse,
  AuthRegisterResponse,
  GuestSessionData,
  CharacterMetadata,
  CreateCharacterRequest,
  CreateCharacterResponse,
  RenameCharacterRequest,
  RenameCharacterResponse,
  AuthState,
  SaveSnapshot,
} from '@premium-rpg/shared-types';
import { migrateSave, SAVE_SCHEMA_VERSION, validateSaveVersion } from '@premium-rpg/game-data';
import { checkSaveCorruption, provideSaveFallback, computeSaveChecksum } from '@premium-rpg/validation';
import { DEFAULT_STARTING_GOLD } from '@/lib/player-summary';

// Types for auth state persistence
interface AuthPersistence {
  token: string | null;
  playerId: string | null;
  guestId: string | null;
  characterId: string | null;
  version: number;
}

// Mock API functions - these would connect to a real backend
const MOCK_USERS: Record<string, { password: string; characters: CharacterMetadata[] }> = {};

const AUTH_KEY = 'premium-rpg-auth';

const loadAuthFromStorage = (): AuthPersistence => {
  try {
    const serialized = localStorage.getItem(AUTH_KEY);
    if (serialized) return JSON.parse(serialized);
  } catch {
    // ignore
  }
  return { token: null, playerId: null, guestId: null, characterId: null, version: 0 };
};

const saveAuthToStorage = (persist: AuthPersistence) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(persist));
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

// Real starting state for a freshly registered/create character. Item ids
// resolve in `@premium-rpg/game-data` ITEM_BY_ID.
const STARTER_SKILLS: Record<string, number> = {
  mining: 1, woodcutting: 1, fishing: 1, smelting: 1,
  smithing: 1, cooking: 1, fletching: 1, alchemy: 1, runecrafting: 1,
};
const STARTER_TOTAL_LEVEL = Object.values(STARTER_SKILLS).reduce((a, b) => a + b, 0);

const starterEquipment = (): CharacterMetadata['equipment'] => {
  const base = emptyEquipment();
  base.weapon = { itemId: 'iron_sword', durability: 100 };
  base.chest = { itemId: 'iron_platebody', durability: 100 };
  return base;
};

const starterCharacter = (
  id: string,
  name: string
): CharacterMetadata => ({
  id,
  name,
  createdAt: Date.now(),
  lastPlayedAt: Date.now(),
  playtime: 0,
  combatLevel: 1,
  totalLevel: STARTER_TOTAL_LEVEL,
  region: 'starter-frontier',
  avatar: '',
  gold: DEFAULT_STARTING_GOLD,
  skills: { ...STARTER_SKILLS },
  equipment: starterEquipment(),
  inventory: {},
});

const mockLogin = async (username: string, password: string): Promise<AuthLoginResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const entry = Object.values(MOCK_USERS).find(
    (u) => u.password === password && u.characters.length > 0
  );

  if (!entry) {
    return { success: false, session: null, error: 'Invalid credentials' };
  }

  const token = `token-${username}-${Date.now()}`;
  const session: AuthSession = {
    token,
    playerId: username,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    guest: false,
  };

  const persist: AuthPersistence = {
    token,
    playerId: username,
    guestId: null,
    characterId: entry.characters[0].id,
    version: 1,
  };
  saveAuthToStorage(persist);

  return { success: true, session };
};

const mockRegister = async (username: string, password: string): Promise<AuthRegisterResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (MOCK_USERS[username]) {
    return { success: false, session: null, error: 'Username already exists' };
  }

  const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, username);

  MOCK_USERS[username] = {
    password,
    characters: [character],
  };

  const token = `token-${username}-${Date.now()}`;
  const session: AuthSession = {
    token,
    playerId: username,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    guest: false,
  };

  const persist: AuthPersistence = {
    token,
    playerId: username,
    guestId: null,
    characterId: character.id,
    version: 1,
  };
  saveAuthToStorage(persist);

  return { success: true, session, character };
};

const mockCreateCharacter = async (request: CreateCharacterRequest): Promise<CreateCharacterResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

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

  const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, request.name);

  user.characters.push(character);

  return { success: true, character };
};

const mockRenameCharacter = async (request: RenameCharacterRequest): Promise<RenameCharacterResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const persist = loadAuthFromStorage();
  if (!persist.characterId) {
    return { success: false, error: 'No character selected' };
  }

  const user = Object.values(MOCK_USERS).find((u) =>
    u.characters.some((c) => c.id === persist.characterId)
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
  }

  return { success: true, character };
};

const mockGuestLogin = async (): Promise<AuthLoginResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const character: CharacterMetadata = starterCharacter(`char-${Date.now()}`, 'Guest');

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

  const persist: AuthPersistence = {
    token: `guest-${guestId}`,
    playerId: '',
    guestId,
    characterId: character.id,
    version: SAVE_SCHEMA_VERSION,
  };
  saveAuthToStorage(persist);

  return { success: true, session, guestSession };
};

/**
 * Exports the current guest save state as JSON string.
 */
export function exportGuestSave(): string | null {
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
export function importGuestSave(saveData: string): { success: boolean; guestSession: GuestSessionData | null } {
  try {
    const parsed = JSON.parse(saveData) as SaveSnapshot;

    const corruptionCheck = checkSaveCorruption(parsed);
    if (!corruptionCheck.isValid) {
      provideSaveFallback(
        corruptionCheck.save || parsed,
        () => {},
        () => {}
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

interface AuthContextValue {
  state: AuthState;
  login: (username: string, password: string) => Promise<AuthLoginResponse>;
  register: (username: string, password: string) => Promise<AuthRegisterResponse>;
  loginAsGuest: () => Promise<AuthLoginResponse>;
  createCharacter: (request: CreateCharacterRequest) => Promise<CreateCharacterResponse>;
  renameCharacter: (request: RenameCharacterRequest) => Promise<RenameCharacterResponse>;
  logout: () => void;
  exportGuestSave: () => string | null;
  importGuestSave: (saveData: string) => { success: boolean; guestSession: GuestSessionData | null };
}

const DEFAULT_STATE: AuthState = {
  isAuthenticated: false,
  isGuest: false,
  session: null,
  guestSession: null,
  character: null,
  loading: true,
};

const authContext = createContext<AuthContextValue>({
  state: DEFAULT_STATE,
  login: mockLogin,
  register: mockRegister,
  loginAsGuest: mockGuestLogin,
  createCharacter: mockCreateCharacter,
  renameCharacter: mockRenameCharacter,
  logout: () => {},
  exportGuestSave,
  importGuestSave,
});

export const useAuth = () => {
  return useContext(authContext);
};

const stateFromPersistence = (persisted: AuthPersistence): AuthState => {
  if (persisted.token && persisted.characterId) {
      return {
        isAuthenticated: true,
        isGuest: persisted.guestId !== null,
        session: {
          token: persisted.token,
          playerId: persisted.playerId || '',
          createdAt: 0,
          expiresAt: 0,
          guest: persisted.guestId !== null,
        },
        guestSession: persisted.guestId
          ? {
              guestId: persisted.guestId,
              createdAt: 0,
              lastPlayedAt: 0,
              playtime: 0,
              character: {
                id: persisted.characterId,
                name: 'Guest',
                createdAt: 0,
                lastPlayedAt: 0,
                playtime: 0,
                combatLevel: 0,
                totalLevel: 0,
                region: 'starter-frontier',
                avatar: '',
                skills: {},
                equipment: emptyEquipment(),
                inventory: {},
              },
              saveState: {
                id: 'guest',
                version: 0,
                player: {
                  id: '',
                  name: '',
                  createdAt: 0,
                  lastPlayedAt: 0,
                  lastValidActionTimestamp: 0,
                  lastActionStartTimestamp: 0,
                  playtime: 0,
                  region: '',
                  experience: 0,
                  level: 1,
                  skills: {},
                  totalLevel: 1,
                },
                timestamp: 0,
                checksum: '',
              },
            }
          : null,
        character: starterCharacter(persisted.characterId, 'Player'),
        loading: false,
      };
    }
    return { ...DEFAULT_STATE, loading: false };
  };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize to the shared DEFAULT_STATE on both server and client so SSR
  // HTML matches; hydrate from localStorage only after the client has mounted.
  const [state, setState] = useState<AuthState>(DEFAULT_STATE);

  useEffect(() => {
    setState(stateFromPersistence(loadAuthFromStorage()));
  }, []);

  const logout = () => {
    saveAuthToStorage({ token: null, playerId: null, guestId: null, characterId: null, version: 0 });
    setState({ ...DEFAULT_STATE, loading: false });
  };

  return (
    <authContext.Provider
      value={{
        state,
        login: mockLogin,
        register: mockRegister,
        loginAsGuest: mockGuestLogin,
        createCharacter: mockCreateCharacter,
        renameCharacter: mockRenameCharacter,
        logout,
        exportGuestSave,
        importGuestSave,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
