'use client';

import type { AuthLoginResponse, AuthRegisterResponse, AuthSession, AuthState, CharacterMetadata, CreateCharacterRequest, CreateCharacterResponse, RenameCharacterRequest, RenameCharacterResponse } from '@premium-rpg/shared-types';
import type { AuthClient } from './auth-client';
import type { PlayerClassId } from './development-auth-adapter';
import { developmentAuthClient, starterCharacter } from './development-auth-adapter';
import { DEFAULT_PLAYER_CLASS } from '@/lib/classes';
import { clearSupabaseSession, loadSupabaseSession, saveSupabaseSession, supabaseFetch, type StoredSupabaseSession } from '@/lib/supabase/session';
import { pullSupabaseGameSave } from '@/lib/persistence/supabase-game-sync';

interface TokenResponse { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string; user_metadata?: Record<string, string> } }
interface CharacterRow { id: string; name: string; class: string; created_at: string; updated_at: string }

const emptyState = (): AuthState => ({ isAuthenticated: false, isGuest: false, session: null, guestSession: null, character: null, loading: false });
const authSession = (s: StoredSupabaseSession): AuthSession => ({ token: s.accessToken, playerId: s.email, createdAt: 0, expiresAt: s.expiresAt, guest: false });
const characterFromRow = (row: CharacterRow): CharacterMetadata => ({ ...starterCharacter(row.id, row.name, row.class as PlayerClassId), createdAt: Date.parse(row.created_at), lastPlayedAt: Date.parse(row.updated_at) });

async function readError(response: Response): Promise<string> {
  try { const body = await response.json() as { msg?: string; message?: string; error_description?: string }; return body.msg ?? body.message ?? body.error_description ?? 'Authentication failed'; }
  catch { return 'Authentication failed'; }
}

async function ensureCharacter(token: TokenResponse): Promise<CharacterMetadata | null> {
  const rowsResponse = await supabaseFetch('/rest/v1/characters?select=id,name,class,created_at,updated_at&order=created_at.asc&limit=1', {}, token.access_token);
  if (!rowsResponse.ok) return null;
  let rows = await rowsResponse.json() as CharacterRow[];
  if (!rows.length) {
    const metadata = token.user.user_metadata ?? {};
    const insert = await supabaseFetch('/rest/v1/characters', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ owner_id: token.user.id, name: metadata.username ?? token.user.email?.split('@')[0] ?? 'Hunter', class: metadata.character_class ?? DEFAULT_PLAYER_CLASS }),
    }, token.access_token);
    if (!insert.ok) return null;
    rows = await insert.json() as CharacterRow[];
  }
  return rows[0] ? characterFromRow(rows[0]) : null;
}

async function storeToken(token: TokenResponse): Promise<StoredSupabaseSession | null> {
  const character = await ensureCharacter(token);
  if (!character) return null;
  const session: StoredSupabaseSession = { accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + token.expires_in * 1000, userId: token.user.id, email: token.user.email ?? '', character };
  saveSupabaseSession(session);
  await pullSupabaseGameSave(session.email, character.id);
  return session;
}

async function login(email: string, password: string): Promise<AuthLoginResponse> {
  const response = await supabaseFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  if (!response.ok) return { success: false, session: null, error: await readError(response) };
  const stored = await storeToken(await response.json() as TokenResponse);
  return stored ? { success: true, session: authSession(stored) } : { success: false, session: null, error: 'Could not load character' };
}

async function register(email: string, password: string, characterClass: PlayerClassId = DEFAULT_PLAYER_CLASS): Promise<AuthRegisterResponse> {
  const username = email.trim().split('@')[0] || 'Hunter';
  const response = await supabaseFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: email.trim(), password, data: { username, character_class: characterClass } }) });
  if (!response.ok) return { success: false, session: null, error: await readError(response) };
  const token = await response.json() as Partial<TokenResponse>;
  if (!token.access_token || !token.user) return { success: false, session: null, error: 'Check your email to confirm the account, then log in.' };
  const stored = await storeToken(token as TokenResponse);
  return stored ? { success: true, session: authSession(stored), character: stored.character } : { success: false, session: null, error: 'Could not create character' };
}

async function restoreSession(): Promise<AuthState> {
  let stored = loadSupabaseSession();
  if (!stored) return emptyState();
  if (stored.expiresAt <= Date.now() + 30_000) {
    const response = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: stored.refreshToken }) });
    if (!response.ok) { clearSupabaseSession(); return emptyState(); }
    stored = await storeToken(await response.json() as TokenResponse);
    if (!stored) return emptyState();
  }
  return { isAuthenticated: true, isGuest: false, session: authSession(stored), guestSession: null, character: stored.character ?? null, loading: false };
}

async function createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse> {
  const stored = loadSupabaseSession(); if (!stored) return { success: false, error: 'Not authenticated' };
  const response = await supabaseFetch('/rest/v1/characters', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ owner_id: stored.userId, name: request.name, class: request.class ?? DEFAULT_PLAYER_CLASS }) }, stored.accessToken);
  if (!response.ok) return { success: false, error: await readError(response) };
  const row = (await response.json() as CharacterRow[])[0]; return { success: true, character: row ? characterFromRow(row) : null };
}

async function renameCharacter(request: RenameCharacterRequest): Promise<RenameCharacterResponse> {
  const stored = loadSupabaseSession(); if (!stored?.character) return { success: false, error: 'No character selected' };
  const response = await supabaseFetch(`/rest/v1/characters?id=eq.${stored.character.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: request.newName, updated_at: new Date().toISOString() }) }, stored.accessToken);
  if (!response.ok) return { success: false, error: await readError(response) };
  const row = (await response.json() as CharacterRow[])[0]; if (!row) return { success: false, error: 'Character not found' };
  stored.character = characterFromRow(row); saveSupabaseSession(stored); return { success: true, character: stored.character };
}

export const supabaseAuthClient: AuthClient = {
  login, register, restoreSession, createCharacter, renameCharacter,
  loginAsGuest: developmentAuthClient.loginAsGuest,
  logout: () => { const stored = loadSupabaseSession(); if (stored) void supabaseFetch('/auth/v1/logout', { method: 'POST' }, stored.accessToken); clearSupabaseSession(); },
  exportGuestSave: developmentAuthClient.exportGuestSave,
  importGuestSave: developmentAuthClient.importGuestSave,
};
