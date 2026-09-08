export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export type SupabaseReadiness = 'checking' | 'ready' | 'schema-missing' | 'unconfigured' | 'unreachable';

export async function checkSupabaseReadiness(): Promise<SupabaseReadiness> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return 'unconfigured';
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?select=character_id&limit=1`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    if (response.ok) return 'ready';
    if (response.status === 404 || response.status === 400) return 'schema-missing';
    return 'unreachable';
  } catch {
    return 'unreachable';
  }
}
