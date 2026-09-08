import type { CharacterMetadata } from '@premium-rpg/shared-types';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

export const SUPABASE_SESSION_KEY = 'bladehound:supabase-session';

export interface StoredSupabaseSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
  character?: CharacterMetadata;
  characters?: CharacterMetadata[];
  activeCharacterId?: string;
}

export function loadSupabaseSession(): StoredSupabaseSession | null {
  try {
    const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
    return raw ? JSON.parse(raw) as StoredSupabaseSession : null;
  } catch { return null; }
}

export function saveSupabaseSession(session: StoredSupabaseSession): void {
  localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

export function clearSupabaseSession(): void {
  localStorage.removeItem(SUPABASE_SESSION_KEY);
}

export async function supabaseFetch(path: string, init: RequestInit = {}, accessToken?: string): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken ?? SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}
