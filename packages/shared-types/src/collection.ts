// ─── COLLECTION DOMAIN ───────────────────────────────────────────────
// Collection interfaces across items, enemies, bosses, dungeons, crafted
// items, rare drops, lore, titles, and equipment sets. Unknown content is
// represented as silhouettes / question marks (discovered vs collected),
// and completion is made visually satisfying with per-category progress
// and threshold rewards (titles + cosmetics).

export type CollectionCategory =
  | 'items'           // regular equipment / lootable items
  | 'enemies'         // normal / elite / rare enemies
  | 'bosses'          // named boss foes
  | 'dungeons'        // cleared dungeons
  | 'crafted_items'   // items produced by crafting skills
  | 'rare_drops'      // unique boss / lucky gathering drops
  | 'lore'            // world-building lore entries
  | 'titles'          // owned titles
  | 'equipment_sets'; // complete equipment sets

// Event that drives collection / discovery.
export type CollectionEventType =
  | 'enemy_defeated'     // { enemyId }
  | 'dungeon_completed'  // { dungeonId }
  | 'item_acquired'      // { itemId, quantity }
  | 'item_crafted'       // { itemId }
  | 'region_visited'     // { regionId } — reveals silhouettes of that region's content
  | 'grant_entry'        // { entryId } — direct grant (quests / achievements / lore)
  | 'title_earned';      // { title }

export interface CollectionEvent {
  type: CollectionEventType;
  enemyId?: string;
  dungeonId?: string;
  itemId?: string;
  regionId?: string;
  entryId?: string;
  title?: string;
  quantity?: number;
}

// A single collectible entry in the registry.
export interface CollectionEntryDefinition {
  id: string;
  category: CollectionCategory;
  displayName: string;
  description?: string;
  // Entity this entry corresponds to, used for event matching.
  ref?: {
    enemyId?: string;
    dungeonId?: string;
    itemId?: string;
    regionId?: string;
    title?: string;
  };
  // For equipment sets: all item ids must be owned to complete the set.
  requiresItems?: string[];
  // Hidden entries start as question marks until their ref is discovered.
  hidden?: boolean;
  // Lore / flavor copy revealed once collected.
  lore?: string;
}

// Per-entry player state. discovered controls silhouette vs ?, collected
// controls filled-card vs silhouette.
export interface CollectionEntryState {
  entryId: string;
  discovered: boolean;
  collected: boolean;
  collectedAt: number | null;
}

// Threshold reward unlocked when a category reaches N collected entries.
export interface CollectionSetReward {
  threshold: number;
  title?: string;
  cosmetic?: string;
}

export interface PlayerCollectionState {
  // entryId -> state
  entries: Record<string, CollectionEntryState>;
  // Owned item quantities (itemId -> qty) tracked from item_acquired,
  // used for equipment-set completion.
  ownedItems: Record<string, number>;
  // Currently owned title strings (shared with quests/achievements).
  titles: string[];
  // Rewards already granted per category (category -> highest threshold granted)
  setRewardsGranted: Record<string, number>;
}
