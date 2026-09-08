import type {
  AuthState,
  AuthLoginResponse,
  AuthRegisterResponse,
  CreateCharacterRequest,
  CreateCharacterResponse,
  RenameCharacterRequest,
  RenameCharacterResponse,
  GuestSessionData,
} from '@premium-rpg/shared-types';
import {
  developmentAuthClient,
  type PlayerClassId,
} from './development-auth-adapter';

/**
 * The authentication service boundary. The React context (AuthProvider) is the
 * only consumer and manages UI/session state; it never contains the actual
 * authentication/database implementation.
 *
 * The concrete implementation is selected by getAuthClient() and may be a
 * development adapter (local) today and a real server-backed client later —
 * the rest of the app does not care which is in use.
 */
export interface AuthClient {
  login(username: string, password: string): Promise<AuthLoginResponse>;
  register(
    username: string,
    password: string,
    characterClass?: PlayerClassId,
  ): Promise<AuthRegisterResponse>;
  loginAsGuest(characterClass?: PlayerClassId): Promise<AuthLoginResponse>;
  createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse>;
  renameCharacter(request: RenameCharacterRequest): Promise<RenameCharacterResponse>;
  /** Restore a session/state from the currently persisted session. */
  restoreSession(): AuthState;
  logout(): void;
  exportGuestSave(): string | null;
  importGuestSave(saveData: string): { success: boolean; guestSession: GuestSessionData | null };
}

let client: AuthClient | null = null;

/**
 * Resolve the active auth client. Today this is the isolated development
 * adapter (no real backend exists yet); the factory is the seam for a future
 * server-backed client so the context and every UI stays untouched.
 */
export function getAuthClient(): AuthClient {
  if (!client) {
    // Future: switch on a deployment flag (e.g. NEXT_PUBLIC_AUTH_BACKEND)
    // to return a server-backed AuthClient instead.
    client = developmentAuthClient;
  }
  return client;
}