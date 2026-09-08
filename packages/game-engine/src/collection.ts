import type {
  CollectionCategory,
  CollectionEntryDefinition,
  CollectionEntryState,
  CollectionEvent,
  CollectionSetReward,
  PlayerCollectionState,
} from '@premium-rpg/shared-types';

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createCollectionState(): PlayerCollectionState {
  return {
    entries: {},
    ownedItems: {},
    titles: [],
    setRewardsGranted: {},
  };
}

/**
 * Pre-registers entry states so discover/silhouette tracking works even
 * before an entry is collected.
 */
export function registerEntries(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[]
): void {
  for (const d of definitions) {
    if (!state.entries[d.id]) {
      state.entries[d.id] = { entryId: d.id, discovered: false, collected: false, collectedAt: null };
    }
  }
}

// ─── ENTRY STATE HELPERS ─────────────────────────────────────────────

export function getEntryState(
  state: PlayerCollectionState,
  entryId: string
): CollectionEntryState {
  return state.entries[entryId] ?? { entryId, discovered: false, collected: false, collectedAt: null };
}

export type EntryVisibility = 'question' | 'silhouette' | 'collected';

export function getEntryVisibility(
  state: PlayerCollectionState,
  entry: CollectionEntryDefinition
): EntryVisibility {
  const s = getEntryState(state, entry.id);
  if (s.collected) return 'collected';
  if (s.discovered) return 'silhouette';
  return 'question';
}

export function isCollected(state: PlayerCollectionState, entryId: string): boolean {
  return getEntryState(state, entryId).collected;
}

export function isDiscovered(state: PlayerCollectionState, entryId: string): boolean {
  return getEntryState(state, entryId).discovered;
}

// ─── MUTATIONS ───────────────────────────────────────────────────────

export interface CollectionMutationResult {
  newlyDiscovered: string[];
  newlyCollected: string[];
  rewardsGranted: CollectionRewardGrant[];
}

export interface CollectionRewardGrant {
  category: CollectionCategory;
  threshold: number;
  title?: string;
  cosmetic?: string;
}

export function markDiscovered(state: PlayerCollectionState, entryId: string, changed: CollectionMutationResult): void {
  const s = getEntryState(state, entryId);
  if (!s.discovered) {
    s.discovered = true;
    state.entries[entryId] = s;
    changed.newlyDiscovered.push(entryId);
  }
}

export function markCollected(
  state: PlayerCollectionState,
  entryId: string,
  changed: CollectionMutationResult,
  now: number
): void {
  const s = getEntryState(state, entryId);
  if (!s.collected) {
    s.collected = true;
    if (!s.discovered) s.discovered = true;
    s.collectedAt = now;
    state.entries[entryId] = s;
    changed.newlyCollected.push(entryId);
  }
}

// ─── SET COMPLETION ──────────────────────────────────────────────────

function ownsAll(state: PlayerCollectionState, itemIds: string[]): boolean {
  return itemIds.every((id) => (state.ownedItems[id] ?? 0) > 0);
}

function completeSets(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[],
  changed: CollectionMutationResult,
  now: number
): void {
  for (const d of definitions) {
    if (d.category !== 'equipment_sets' || !d.requiresItems) continue;
    if (isCollected(state, d.id)) continue;
    if (ownsAll(state, d.requiresItems)) {
      markCollected(state, d.id, changed, now);
    }
  }
}

// ─── THRESHOLD REWARDS ───────────────────────────────────────────────

function grantSetRewards(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[],
  setRewards: Record<CollectionCategory, CollectionSetReward[]>,
  changed: CollectionMutationResult
): void {
  const grouped: Record<string, number> = {};
  for (const d of definitions) {
    if (isCollected(state, d.id)) grouped[d.category] = (grouped[d.category] ?? 0) + 1;
  }
  for (const category of Object.keys(setRewards) as CollectionCategory[]) {
    let highestGranted = state.setRewardsGranted[category] ?? 0;
    const rewards = [...setRewards[category]].sort((a, b) => a.threshold - b.threshold);
    for (const r of rewards) {
      if (r.threshold <= (grouped[category] ?? 0) && r.threshold > highestGranted) {
        highestGranted = r.threshold;
        changed.rewardsGranted.push({ category, threshold: r.threshold, title: r.title, cosmetic: r.cosmetic });
      }
    }
    state.setRewardsGranted[category] = Math.max(state.setRewardsGranted[category] ?? 0, highestGranted);
  }
}

// ─── EVENT PROCESSING ────────────────────────────────────────────────

/**
 * Feeds a gameplay event into the collection system, discovering and
 * collecting matching entries, completing equipment sets, and granting
 * category-threshold rewards. Returns newly changed entries and granted
 * rewards for the caller/server to reconcile.
 */
export function processCollectionEvent(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[],
  setRewards: Record<CollectionCategory, CollectionSetReward[]>,
  event: CollectionEvent,
  now: number
): CollectionMutationResult {
  const changed: CollectionMutationResult = { newlyDiscovered: [], newlyCollected: [], rewardsGranted: [] };

  switch (event.type) {
    case 'enemy_defeated': {
      const entry = definitions.find((d) => d.ref?.enemyId === event.enemyId);
      if (entry) {
        markDiscovered(state, entry.id, changed);
        markCollected(state, entry.id, changed, now);
      }
      break;
    }
    case 'dungeon_completed': {
      const entry = definitions.find((d) => d.ref?.dungeonId === event.dungeonId);
      if (entry) markCollected(state, entry.id, changed, now);
      break;
    }
    case 'item_acquired': {
      const qty = event.quantity ?? 1;
      state.ownedItems[event.itemId ?? ''] = (state.ownedItems[event.itemId ?? ''] ?? 0) + qty;
      for (const entry of definitions) {
        if (entry.ref?.itemId === event.itemId && (entry.category === 'items' || entry.category === 'rare_drops')) {
          markCollected(state, entry.id, changed, now);
        }
      }
      completeSets(state, definitions, changed, now);
      break;
    }
    case 'item_crafted': {
      const entry = definitions.find((d) => d.ref?.itemId === event.itemId && d.category === 'crafted_items');
      if (entry) markCollected(state, entry.id, changed, now);
      break;
    }
    case 'region_visited': {
      // Region visits reveal silhouettes of that region's foes (not collected).
      for (const d of definitions) {
        if (d.ref?.regionId && d.ref.regionId === event.regionId) {
          markDiscovered(state, d.id, changed);
        }
      }
      break;
    }
    case 'grant_entry': {
      if (event.entryId && definitions.find((d) => d.id === event.entryId)) {
        markCollected(state, event.entryId, changed, now);
      }
      break;
    }
    case 'title_earned': {
      const entry = definitions.find((d) => d.ref?.title === event.title);
      if (entry) {
        if (event.title && !state.titles.includes(event.title)) state.titles.push(event.title);
        markCollected(state, entry.id, changed, now);
      }
      break;
    }
  }

  grantSetRewards(state, definitions, setRewards, changed);
  return changed;
}

// ─── QUERIES ─────────────────────────────────────────────────────────

export interface CategoryCompletion {
  category: CollectionCategory;
  collected: number;
  total: number;
  ratio: number;
}

export function getCollectionCategoryCompletion(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[],
  category: CollectionCategory
): CategoryCompletion {
  const filtered = definitions.filter((d) => d.category === category);
  const total = filtered.length;
  const collected = filtered.filter((d) => isCollected(state, d.id)).length;
  return { category, collected, total, ratio: total > 0 ? collected / total : 0 };
}

export function getAllCategoryCompletions(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[]
): Record<CollectionCategory, CategoryCompletion> {
  const result = {} as Record<CollectionCategory, CategoryCompletion>;
  for (const category of [...new Set(definitions.map((d) => d.category))]) {
    result[category] = getCollectionCategoryCompletion(state, definitions, category);
  }
  return result;
}

export function getOverallCompletion(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[]
): { collected: number; total: number; ratio: number } {
  const total = definitions.length;
  const collected = definitions.filter((d) => isCollected(state, d.id)).length;
  return { collected, total, ratio: total > 0 ? collected / total : 0 };
}

export function getCollectedEntries(
  state: PlayerCollectionState,
  definitions: CollectionEntryDefinition[],
  category?: CollectionCategory
): CollectionEntryDefinition[] {
  return definitions.filter((d) => (!category || d.category === category) && isCollected(state, d.id));
}

