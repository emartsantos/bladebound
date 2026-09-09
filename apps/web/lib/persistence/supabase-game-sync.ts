import type { GameSaveData, InvestmentState } from './game-persistence';
import { localGamePersistence } from './local-game-persistence';
import { loadSupabaseSession, supabaseFetch } from '@/lib/supabase/session';

const GRANT_STAMP_PREFIX = 'premium-rpg:grant:seen:';

function readGrantStamp(characterId: string): string | null {
  try { return localStorage.getItem(`${GRANT_STAMP_PREFIX}${characterId}`); } catch { return null; }
}

function writeGrantStamp(characterId: string, stamp: string): void {
  try { localStorage.setItem(`${GRANT_STAMP_PREFIX}${characterId}`, stamp); } catch { /* ignore */ }
}

export interface AccountWallet {
  balance: number;
  burnedTotal: number;
}

const WALLET_CACHE_PREFIX = 'premium-rpg:wallet:';
const walletCacheKey = (userId: string): string => `${WALLET_CACHE_PREFIX}${userId}`;

function cacheWallet(userId: string, wallet: AccountWallet): void {
  try { localStorage.setItem(walletCacheKey(userId), JSON.stringify(wallet)); } catch { /* ignore */ }
}

/** Synchronous read of the last wallet the browser knew about (no network). */
export function cachedWallet(userId: string): AccountWallet | null {
  try {
    const raw = localStorage.getItem(walletCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccountWallet> | null;
    if (!parsed || typeof parsed.balance !== 'number' || typeof parsed.burnedTotal !== 'number') return null;
    return { balance: parsed.balance, burnedTotal: parsed.burnedTotal };
  } catch { return null; }
}

function emptyInvestment(): InvestmentState {
  return { bhc: 0, burnedTotal: 0, heroRebirth: 0, heroReforge: 0, heroBonusStat: null, heroBonusValue: 0, history: [] };
}

/**
 * One wallet per account (v105). Every character save mirrors the wallet
 * balance, so whatever amount is on display belongs to the account, not to the
 * active hero. The client is the source of truth for gameplay flows (battles,
 * summons, forging) and mirrors the resulting balance here; grants are credited
 * by claim_bhc_grants and cannot be overwritten by a client that has not seen
 * them (grants_seen_at guard).
 */
async function fetchAccountWallet(ownerId: string, token: string): Promise<AccountWallet | null> {
  const response = await supabaseFetch(
    `/rest/v1/account_wallets?owner_id=eq.${encodeURIComponent(ownerId)}&select=balance,burned_total&limit=1`,
    { method: 'GET' }, token,
  );
  if (!response.ok) return null;
  const rows = await response.json().catch(() => null) as Array<{ balance: number | string; burned_total: number | string }> | null;
  const row = rows?.[0];
  if (!row) return null;
  const wallet = { balance: Number(row.balance) || 0, burnedTotal: Number(row.burned_total) || 0 };
  cacheWallet(ownerId, wallet);
  return wallet;
}

async function upsertAccountWallet(ownerId: string, token: string, balance: number, burnedTotal: number, grantsSeenAt: string | null): Promise<void> {
  await supabaseFetch('/rest/v1/account_wallets?on_conflict=owner_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      owner_id: ownerId,
      balance: Math.round(balance * 1000) / 1000,
      burned_total: Math.round(burnedTotal * 1000) / 1000,
      grants_seen_at: grantsSeenAt,
      updated_at: new Date().toISOString(),
    }),
  }, token);
}

/** Debounced mirror of the active save's BHC pot into the account wallet. */
let lastSyncedBhc: number | null = null;
let lastSyncedBurned: number | null = null;
let mirrorTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleWalletMirror(balance: number, burnedTotal: number): void {
  if (lastSyncedBhc !== null && Math.abs(lastSyncedBhc - balance) < 0.0005 && Math.abs((lastSyncedBurned ?? 0) - burnedTotal) < 0.0005) return;
  const session = loadSupabaseSession();
  if (!session?.accessToken || !session?.userId) return;
  const { accessToken, userId } = session;
  const stamp = session.character?.id ? readGrantStamp(session.character.id) : null;
  if (mirrorTimer) clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => {
    void upsertAccountWallet(userId, accessToken, balance, burnedTotal, stamp).then(() => {
      lastSyncedBhc = Math.round(balance * 1000) / 1000;
      lastSyncedBurned = Math.round(burnedTotal * 1000) / 1000;
      cacheWallet(userId, { balance: lastSyncedBhc, burnedTotal: lastSyncedBurned });
    }).catch(() => { /* the grants guard may reject; the next claim fixes the stamp */ });
  }, 900);
}

function replaceInvestment(save: GameSaveData, wallet: AccountWallet): GameSaveData {
  return { ...save, investment: { ...(save.investment ?? emptyInvestment()), bhc: wallet.balance, burnedTotal: wallet.burnedTotal } };
}

function loadSessionWallet(): AccountWallet | null {
  const session = loadSupabaseSession();
  if (!session?.userId) return null;
  const wallet = cachedWallet(session.userId);
  return wallet;
}

/** Apply the account wallet to one character's local save (cache first, then cloud). */
export async function applyWalletToLocalSave(characterId: string): Promise<boolean> {
  const key = `character:${characterId}`;
  const save = localGamePersistence.load(key);
  if (!save) return false;
  let wallet = loadSessionWallet();
  if (!wallet) {
    const session = loadSupabaseSession();
    if (!session?.accessToken || !session?.userId) return false;
    wallet = await fetchAccountWallet(session.userId, session.accessToken);
  }
  if (!wallet) return false;
  localGamePersistence.save(key, replaceInvestment(save, wallet));
  return true;
}

/**
 * Synchronous variant used at character-switch time: the game re-seeds from
 * localStorage as soon as selection changes, so the sibling hero must already
 * show the account pot before any network call resolves. Returns true when the
 * cached wallet was applied.
 */
export function applyCachedWalletToSave(characterId: string): boolean {
  const key = `character:${characterId}`;
  const save = localGamePersistence.load(key);
  const wallet = loadSessionWallet();
  if (!save || !wallet) return false;
  localGamePersistence.save(key, replaceInvestment(save, wallet));
  return true;
}

/** Normalize every roster save locally to the account wallet. */
export async function normalizeAllLocalSavesToWallet(): Promise<void> {
  const session = loadSupabaseSession();
  if (!session?.accessToken || !session?.userId) return;
  let wallet = cachedWallet(session.userId);
  if (!wallet) wallet = await fetchAccountWallet(session.userId, session.accessToken);
  if (!wallet) return;
  for (const character of session.characters ?? []) {
    applyWalletToLocalSave(character.id);
  }
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
  if (rows[0]?.save_data) {
    let save = rows[0].save_data;
    const wallet = await fetchAccountWallet(session.userId, session.accessToken);
    if (wallet) save = replaceInvestment(save, wallet);
    localGamePersistence.save(`character:${characterId}`, save, false);
  }
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
  if (session.userId && data.investment?.bhc != null) {
    scheduleWalletMirror(data.investment.bhc, data.investment.burnedTotal ?? 0);
  }
}

const roundBhc = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Claim pending server-authoritative BHC grants for the signed-in owner. The
 * RPC credits the account wallet and stamps every save, so a later stale local
 * push can never erase it. The active save is then re-mirrored to the wallet's
 * authoritative balance.
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
  const wallet = await fetchAccountWallet(session.userId, session.accessToken);
  const key = `character:${characterId}`;
  const save = localGamePersistence.load(key);
  if (wallet) {
    cacheWallet(session.userId, wallet);
    writeGrantStamp(characterId, new Date().toISOString());
    if (save) {
      localGamePersistence.save(key, replaceInvestment(save, wallet));
    } else {
      await pullSupabaseGameSave(characterId);
    }
    for (const character of session.characters ?? []) {
      void applyWalletToLocalSave(character.id);
    }
    lastSyncedBhc = null; lastSyncedBurned = null;
    scheduleWalletMirror(wallet.balance, wallet.burnedTotal);
  } else if (total > 0 && save) {
    const investment = save.investment ?? emptyInvestment();
    localGamePersistence.save(key, { ...save, investment: { ...investment, bhc: roundBhc(investment.bhc + total) } });
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