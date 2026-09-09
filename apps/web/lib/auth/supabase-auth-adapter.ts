'use client';

import type { AuthLoginResponse, AuthRegisterResponse, AuthSession, AuthState, CharacterMetadata, CreateCharacterRequest, CreateCharacterResponse, RenameCharacterRequest, RenameCharacterResponse } from '@premium-rpg/shared-types';
import type { AuthClient } from './auth-client';
import type { PlayerClassId } from './development-auth-adapter';
import { developmentAuthClient, starterCharacter } from './development-auth-adapter';
import { DEFAULT_PLAYER_CLASS } from '@/lib/classes';
import { clearSupabaseSession, loadSupabaseSession, saveSupabaseSession, supabaseFetch, type StoredSupabaseSession } from '@/lib/supabase/session';
import { applyBHCGrants, pullSupabaseGameSave } from '@/lib/persistence/supabase-game-sync';
import { migrateLocalGameSave } from '@/lib/persistence/local-game-persistence';
import { HERO_CAP } from '@/lib/game/service';

interface TokenResponse { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string; user_metadata?: Record<string, string> } }
interface CharacterRow { id: string; name: string; class: string; rarity: string | null; created_at: string; updated_at: string }

const emptyState = (): AuthState => ({ isAuthenticated: false, isGuest: false, session: null, guestSession: null, character: null, loading: false });
const authSession = (s: StoredSupabaseSession): AuthSession => ({ token: s.accessToken, playerId: s.email, createdAt: 0, expiresAt: s.expiresAt, guest: false });
const characterFromRow = (row: CharacterRow): CharacterMetadata => ({ ...starterCharacter(row.id, row.name, row.class as PlayerClassId), rarity: (row.rarity as CharacterMetadata['rarity']) ?? 'common', createdAt: Date.parse(row.created_at), lastPlayedAt: Date.parse(row.updated_at) });

async function readError(response: Response): Promise<string> {
  try { const body = await response.json() as { msg?: string; message?: string; error_description?: string }; return body.msg ?? body.message ?? body.error_description ?? 'Authentication failed'; }
  catch { return 'Authentication failed'; }
}

async function ensureCharacters(token: TokenResponse, preferredId?: string): Promise<{ active: CharacterMetadata; characters: CharacterMetadata[] } | null> {
  const rowsResponse = await supabaseFetch(`/rest/v1/characters?select=id,name,class,rarity,created_at,updated_at&archived_at=is.null&order=created_at.asc&limit=${HERO_CAP}`, {}, token.access_token);
  if (!rowsResponse.ok) return null;
  let rows = await rowsResponse.json() as CharacterRow[];
  if (!rows.length) {
    const metadata = token.user.user_metadata ?? {};
    const insert = await supabaseFetch('/rest/v1/characters', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ owner_id: token.user.id, name: metadata.username ?? token.user.email?.split('@')[0] ?? 'Hunter', class: metadata.character_class ?? DEFAULT_PLAYER_CLASS, rarity: 'common' }),
    }, token.access_token);
    if (!insert.ok) return null;
    rows = await insert.json() as CharacterRow[];
  }
  const characters = rows.map(characterFromRow);
  const active = characters.find((character) => character.id === preferredId) ?? characters[0];
  return active ? { active, characters } : null;
}

async function storeToken(token: TokenResponse): Promise<StoredSupabaseSession | null> {
  const previous = loadSupabaseSession();
  const result = await ensureCharacters(token, previous?.activeCharacterId);
  if (!result) return null;
  const character = result.active;
  const session: StoredSupabaseSession = { accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + token.expires_in * 1000, userId: token.user.id, email: token.user.email ?? '', character, characters: result.characters, activeCharacterId: character.id };
  // Preserve progress created before Supabase auth, when registered saves were
  // keyed by the development username or generated character id.
  try {
    const legacyRaw = localStorage.getItem('premium-rpg-auth');
    const legacy = legacyRaw ? JSON.parse(legacyRaw) as { playerId?: string; characterId?: string } : null;
    if (legacy?.playerId) migrateLocalGameSave(`account:${legacy.playerId}`, `account:${session.email}`);
    if (legacy?.characterId) migrateLocalGameSave(legacy.characterId, `account:${session.email}`);
  } catch { /* malformed legacy auth data is safely ignored */ }
  saveSupabaseSession(session);
  migrateLocalGameSave(`account:${session.email}`, `character:${character.id}`);
  await applyBHCGrants(character.id);
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
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const redirectTo = `${window.location.origin}${basePath}/`;
  const response = await supabaseFetch(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { method: 'POST', body: JSON.stringify({ email: email.trim(), password, data: { username, character_class: characterClass } }) });
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
  const rosterResponse = await supabaseFetch(`/rest/v1/characters?select=id,name,class,rarity,created_at,updated_at&archived_at=is.null&order=created_at.asc&limit=${HERO_CAP}`, {}, stored.accessToken);
  if (rosterResponse.ok) {
    const characters = (await rosterResponse.json() as CharacterRow[]).map(characterFromRow);
    if (characters.length) {
      stored.characters = characters;
      stored.character = characters.find((entry) => entry.id === stored?.activeCharacterId) ?? characters[0];
      stored.activeCharacterId = stored.character.id;
      saveSupabaseSession(stored);
    }
  }
  if (stored.character) await applyBHCGrants(stored.character.id);
  return { isAuthenticated: true, isGuest: false, session: authSession(stored), guestSession: null, character: stored.character ?? null, characters: stored.characters ?? (stored.character ? [stored.character] : []), activeCharacterId: stored.character?.id ?? null, loading: false };
}

async function createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse> {
  const stored = loadSupabaseSession(); if (!stored) return { success: false, error: 'Not authenticated' };
  if ((stored.characters?.length ?? 1) >= HERO_CAP) return { success: false, error: `All ${HERO_CAP} hero slots are occupied` };
  const response = await supabaseFetch('/rest/v1/characters', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ owner_id: stored.userId, name: request.name, class: request.class ?? DEFAULT_PLAYER_CLASS, rarity: request.rarity ?? 'common', summon_id: request.summonId ?? null }) }, stored.accessToken);
  if (!response.ok) return { success: false, error: await readError(response) };
  const row = (await response.json() as CharacterRow[])[0];
  if (!row) return { success: false, error: 'Character could not be created' };
  const character = characterFromRow(row);
  stored.character = character; stored.activeCharacterId = character.id; stored.characters = [...(stored.characters ?? []), character]; saveSupabaseSession(stored);
  return { success: true, character };
}

async function renameCharacter(request: RenameCharacterRequest): Promise<RenameCharacterResponse> {
  const stored = loadSupabaseSession(); if (!stored?.character) return { success: false, error: 'No character selected' };
  const response = await supabaseFetch(`/rest/v1/characters?id=eq.${stored.character.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: request.newName, updated_at: new Date().toISOString() }) }, stored.accessToken);
  if (!response.ok) return { success: false, error: await readError(response) };
  const row = (await response.json() as CharacterRow[])[0]; if (!row) return { success: false, error: 'Character not found' };
  stored.character = characterFromRow(row);
  stored.characters = (stored.characters ?? []).map((entry) => entry.id === stored.character?.id ? stored.character : entry);
  saveSupabaseSession(stored); return { success: true, character: stored.character };
}

async function selectCharacter(characterId: string): Promise<AuthState> {
  const stored = loadSupabaseSession();
  const character = stored?.characters?.find((entry) => entry.id === characterId);
  if (!stored || !character) return emptyState();
  stored.character = character; stored.activeCharacterId = character.id; saveSupabaseSession(stored);
  await applyBHCGrants(character.id);
  await pullSupabaseGameSave(character.id);
  return restoreSession();
}

async function archiveCharacter(characterId: string): Promise<{ success: boolean; error?: string }> {
  const stored = loadSupabaseSession();
  if (!stored) return { success: false, error: 'Not authenticated' };
  const roster = stored.characters ?? [];
  if (roster.length <= 1) return { success: false, error: 'Your last hero cannot be archived' };
  const response = await supabaseFetch(`/rest/v1/characters?id=eq.${encodeURIComponent(characterId)}`, {
    method: 'PATCH', body: JSON.stringify({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  }, stored.accessToken);
  if (!response.ok) return { success: false, error: await readError(response) };
  stored.characters = roster.filter((entry) => entry.id !== characterId);
  if (stored.character?.id === characterId) stored.character = stored.characters[0];
  stored.activeCharacterId = stored.character?.id; saveSupabaseSession(stored);
  return { success: true };
}

export const supabaseAuthClient: AuthClient = {
  login, register, restoreSession, createCharacter, renameCharacter, selectCharacter, archiveCharacter,
  loginAsGuest: developmentAuthClient.loginAsGuest,
  logout: () => { const stored = loadSupabaseSession(); if (stored) void supabaseFetch('/auth/v1/logout', { method: 'POST' }, stored.accessToken); clearSupabaseSession(); },
  exportGuestSave: developmentAuthClient.exportGuestSave,
  importGuestSave: developmentAuthClient.importGuestSave,
};
