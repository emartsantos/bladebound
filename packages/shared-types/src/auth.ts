// Authentication and session types
import type { SaveSnapshot } from './domain';

export type AuthToken = string;

export interface AuthSession {
  token: AuthToken;
  playerId: string;
  createdAt: number;
  expiresAt: number;
  guest: boolean;
}

// Authentication response
export interface AuthLoginResponse {
  success: boolean;
  session: AuthSession | null;
  guestSession?: GuestSessionData | null;
  error?: string;
}

export interface AuthRegisterResponse {
  success: boolean;
  session: AuthSession | null;
  character?: CharacterMetadata | null;
  error?: string;
}

// Guest play support
export interface GuestSessionData {
  guestId: string;
  createdAt: number;
  lastPlayedAt: number;
  playtime: number;
  character: CharacterMetadata;
  saveState: SaveSnapshot;
}

// Character metadata - extended from existing types
export interface CharacterMetadata {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  playtime: number;
  combatLevel: number;
  totalLevel: number;
  region: string;
  avatar: string;
  class?: string;
  gold?: number;
  skills: Record<string, number>;
  equipment: {
    [slot in 'weapon' | 'offhand' | 'helmet' | 'chest' | 'gloves' | 'legs' | 'boots' | 'amulet' | 'ring' | 'cape']: {
      itemId: string | null;
      durability: number | null;
    };
  };
  inventory: {
    [key: string]: {
      itemId: string;
      quantity: number;
      durability: number | null;
    };
  };
}

// Character system types
export type CharacterId = string;

export interface CreateCharacterRequest {
  name: string;
  class?: string;
}

export interface CreateCharacterResponse {
  success: boolean;
  character?: CharacterMetadata | null;
  error?: string;
}

export interface RenameCharacterRequest {
  newName: string;
}

export interface RenameCharacterResponse {
  success: boolean;
  character?: CharacterMetadata | null;
  error?: string;
}

// Session management state
export interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  session: AuthSession | null;
  guestSession: GuestSessionData | null;
  character: CharacterMetadata | null;
  /** Registered-account hero roster. Guests have one implicit hero. */
  characters?: CharacterMetadata[];
  activeCharacterId?: string | null;
  loading: boolean;
}
