import type { GameSaveData } from './game-persistence';
import { localGamePersistence } from './local-game-persistence';
import { loadSupabaseSession, supabaseFetch } from '@/lib/supabase/session';

export async function pullSupabaseGameSave(characterId: string): Promise<void> {
  const session = loadSupabaseSession();
  if (!session?.accessToken) return;
  const response = await supabaseFetch(
    `/rest/v1/game_saves?character_id=eq.${encodeURIComponent(characterId)}&select=save_data&limit=1`,
    { method: 'GET' }, session.accessToken,
  );
  if (!response.ok) return;
  const rows = await response.json() as { save_data: GameSaveData }[];
  if (rows[0]?.save_data) localGamePersistence.save(`character:${characterId}`, rows[0].save_data, false);
}

export async function pushSupabaseGameSave(data: GameSaveData): Promise<void> {
  const session = loadSupabaseSession();
  const characterId = session?.character?.id;
  if (!session?.accessToken || !characterId) return;
  await supabaseFetch('/rest/v1/game_saves?on_conflict=character_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      character_id: characterId,
      owner_id: session.userId,
      schema_version: data.schemaVersion ?? 2,
      save_data: data,
      updated_at: new Date().toISOString(),
    }),
  }, session.accessToken);
}

/** Atomically reserve a registered hero's daily attempt before local combat starts. */
export async function claimSupabaseDailyBattle(characterId: string): Promise<{ success: boolean; nextBattleAt?: number; error?: string }> {
  const session = loadSupabaseSession();
  if (!session?.accessToken) return { success: false, error: 'Not authenticated' };
  const idempotencyKey = `battle:${characterId}:${Date.now()}:${crypto.randomUUID()}`;
  const response = await supabaseFetch('/rest/v1/rpc/claim_daily_battle', {
    method: 'POST', body: JSON.stringify({ p_character_id: characterId, p_idempotency_key: idempotencyKey }),
  }, session.accessToken);
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    return { success: false, error: body.message?.includes('battle_cooldown')
      ? 'This hero has already battled today.'
      : body.message?.includes('hero_market_locked')
        ? 'This hero is locked in an active marketplace listing.'
        : (body.message ?? 'Could not reserve battle') };
  }
  const row = (await response.json() as Array<{ next_battle_at?: string }>)[0];
  return { success: true, nextBattleAt: row?.next_battle_at ? Date.parse(row.next_battle_at) : undefined };
}
