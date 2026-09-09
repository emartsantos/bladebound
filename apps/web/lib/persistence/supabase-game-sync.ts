import type { GameSaveData } from './game-persistence';
import { localGamePersistence } from './local-game-persistence';
import { loadSupabaseSession, supabaseFetch } from '@/lib/supabase/session';

const GRANT_STAMP_PREFIX = 'premium-rpg:grant:seen:';

function readGrantStamp(characterId: string): string | null {
  try { return localStorage.getItem(`${GRANT_STAMP_PREFIX}${characterId}`); } catch { return null; }
}

function writeGrantStamp(characterId: string, stamp: string): void {
  try { localStorage.setItem(`${GRANT_STAMP_PREFIX}${characterId}`, stamp); } catch { /* ignore */ }
}

export async function pullSupabaseGameSave(characterId: string): Promise<void> {
  const session = loadSupabaseSession();
  if (!session?.accessToken) return;
  const response = await supabaseFetch(
    `/rest/v1/game_saves?character_id=eq.${encodeURIComponent(characterId)}&select=save_data,grants_seen_at&limit=1`,
    { method: 'GET' }, session.accessToken,
  );
  if (!response.ok) return;
  const rows = await response.json() as { save_data: GameSaveData; grants_seen_at?: string | null }[];
  if (rows[0]?.save_data) localGamePersistence.save(`character:${characterId}`, rows[0].save_data, false);
  if (rows[0]?.grants_seen_at) writeGrantStamp(characterId, rows[0].grants_seen_at);
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
      grants_seen_at: readGrantStamp(characterId),
      updated_at: new Date().toISOString(),
    }),
  }, session.accessToken);
}

const roundBhc = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Claim pending server-authoritative BHC grants for the signed-in owner and
 * credit the active character's save. The RPC atomically bumps the cloud save
 * and marks each grant applied, so a later stale local push can never erase it.
 * Local save is mirrored (or seeded from the cloud when missing) so the balance
 * is immediately visible even without a full re-login.
 */
export async function applyBHCGrants(characterId: string): Promise<number> {
  const session = loadSupabaseSession();
  if (!session?.accessToken || !session?.userId) return 0;
  const response = await supabaseFetch('/rest/v1/rpc/claim_bhc_grants', {
    method: 'POST',
    body: JSON.stringify({ p_owner_id: session.userId, p_character_id: characterId }),
  }, session.accessToken);
  if (!response.ok) return 0;
  let total = 0;
  try {
    const rows = await response.json() as unknown[];
    const first = rows[0];
    if (typeof first === 'number') total = first;
    else if (first && typeof first === 'object') total = Number(Object.values(first as Record<string, unknown>)[0] ?? 0) || 0;
  } catch {
    total = 0;
  }
  if (total > 0) {
    const key = `character:${characterId}`;
    writeGrantStamp(characterId, new Date().toISOString());
    const save = localGamePersistence.load(key);
    if (save) {
      const investment = save.investment ?? { bhc: 0, burnedTotal: 0, heroRebirth: 0, heroReforge: 0, heroBonusStat: null, heroBonusValue: 0, history: [] };
      save.investment = { ...investment, bhc: roundBhc(investment.bhc + total) };
      localGamePersistence.save(key, save);
    } else {
      await pullSupabaseGameSave(characterId);
    }
  }
  return total;
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
