import type { GameSaveData } from './game-persistence';
import { localGamePersistence } from './local-game-persistence';
import { loadSupabaseSession, supabaseFetch } from '@/lib/supabase/session';

export async function pullSupabaseGameSave(accountId: string, characterId: string): Promise<void> {
  const session = loadSupabaseSession();
  if (!session?.accessToken) return;
  const response = await supabaseFetch(
    `/rest/v1/game_saves?character_id=eq.${encodeURIComponent(characterId)}&select=save_data&limit=1`,
    { method: 'GET' }, session.accessToken,
  );
  if (!response.ok) return;
  const rows = await response.json() as { save_data: GameSaveData }[];
  if (rows[0]?.save_data) localGamePersistence.save(`account:${accountId}`, rows[0].save_data, false);
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
