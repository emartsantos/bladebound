'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
import { getAuthClient } from '@/lib/auth/auth-client';
import type { PlayerClassId } from '@/lib/auth/development-auth-adapter';

/**
 * AuthProvider owns UI/session state only. All authentication work (login,
 * register, guest sessions, restore, logout, session persistence) is delegated
 * to the AuthClient selected by getAuthClient() — the context never contains a
 * mock database or an actual auth implementation.
 */

export const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isGuest: false,
  session: null,
  guestSession: null,
  character: null,
  loading: true,
};

interface AuthContextValue {
  state: AuthState;
  login: (username: string, password: string) => Promise<AuthLoginResponse>;
  register: (
    username: string,
    password: string,
    characterClass?: PlayerClassId,
  ) => Promise<AuthRegisterResponse>;
  loginAsGuest: (characterClass?: PlayerClassId) => Promise<AuthLoginResponse>;
  createCharacter: (request: CreateCharacterRequest) => Promise<CreateCharacterResponse>;
  renameCharacter: (request: RenameCharacterRequest) => Promise<RenameCharacterResponse>;
  logout: () => void;
  exportGuestSave: () => string | null;
  importGuestSave: (saveData: string) => { success: boolean; guestSession: GuestSessionData | null };
}

const authContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(authContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize to the shared DEFAULT_AUTH_STATE on both server and client so
  // SSR HTML matches; hydrate from the auth client only after the client has
  // mounted.
  const [state, setState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  const client = useMemo(() => getAuthClient(), []);

  useEffect(() => {
    let active = true;
    Promise.resolve(client.restoreSession()).then((next) => { if (active) setState(next); });
    return () => { active = false; };
  }, [client]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthLoginResponse> => {
      const result = await client.login(username, password);
      if (result.success) setState(await client.restoreSession());
      return result;
    },
    [client],
  );

  const register = useCallback(
    async (
      username: string,
      password: string,
      characterClass?: PlayerClassId,
    ): Promise<AuthRegisterResponse> => {
      const result = await client.register(username, password, characterClass);
      if (result.success) setState(await client.restoreSession());
      return result;
    },
    [client],
  );

  const loginAsGuest = useCallback(
    async (characterClass?: PlayerClassId): Promise<AuthLoginResponse> => {
      const result = await client.loginAsGuest(characterClass);
      if (result.success) setState(await client.restoreSession());
      return result;
    },
    [client],
  );

  const createCharacter = useCallback(
    async (request: CreateCharacterRequest): Promise<CreateCharacterResponse> => {
      const result = await client.createCharacter(request);
      if (result.success) setState(await client.restoreSession());
      return result;
    },
    [client],
  );

  const renameCharacter = useCallback(
    async (request: RenameCharacterRequest): Promise<RenameCharacterResponse> => {
      const result = await client.renameCharacter(request);
      if (result.success) setState(await client.restoreSession());
      return result;
    },
    [client],
  );

  const logout = useCallback(() => {
    client.logout();
    setState({ ...DEFAULT_AUTH_STATE, loading: false });
  }, [client]);

  return (
    <authContext.Provider
      value={{
        state,
        login,
        register,
        loginAsGuest,
        createCharacter,
        renameCharacter,
        logout,
        exportGuestSave: client.exportGuestSave,
        importGuestSave: client.importGuestSave,
      }}
    >
      {children}
    </authContext.Provider>
  );
}
