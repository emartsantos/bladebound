import { describe, it, expect } from 'vitest';
import {
  createCollectionState,
  registerEntries,
  processCollectionEvent,
  markDiscovered,
  isCollected,
  isDiscovered,
  getEntryVisibility,
  getOverallCompletion,
  getCollectionCategoryCompletion,
  getAllCategoryCompletions,
  getCollectedEntries,
} from '../src/collection';
import type {
  CollectionCategory,
  CollectionEntryDefinition,
  CollectionSetReward,
} from '@premium-rpg/shared-types';
import { COLLECTION_ENTRIES, COLLECTION_SET_REWARDS } from '@premium-rpg/game-data';

function def(partial: Partial<CollectionEntryDefinition>): CollectionEntryDefinition {
  return {
    id: 'x',
    category: 'enemies',
    displayName: 'X',
    ...partial,
  } as CollectionEntryDefinition;
}

const REWARDS: Record<CollectionCategory, CollectionSetReward[]> = {
  enemies: [
    { threshold: 2, title: 'the Menagerist' },
    { threshold: 3, cosmetic: 'badge_hunter' },
  ],
  bosses: [{ threshold: 1, cosmetic: 'aura_boss_slayer' }],
  dungeons: [{ threshold: 1, cosmetic: 'banner_delver' }],
  items: [{ threshold: 1, title: 'the Hoarder' }],
  crafted_items: [{ threshold: 1, cosmetic: 'badge_smith' }],
  rare_drops: [{ threshold: 1, cosmetic: 'aura_rare' }],
  lore: [{ threshold: 1, cosmetic: 'lore_scroll' }],
  titles: [{ threshold: 1, cosmetic: 'crown_noble' }],
  equipment_sets: [{ threshold: 1, cosmetic: 'aura_forged' }],
};

describe('state factory & registration', () => {
  it('creates an empty state', () => {
    const state = createCollectionState();
    expect(state.entries).toEqual({});
    expect(state.ownedItems).toEqual({});
  });

  it('pre-registers entries for silhouette tracking', () => {
    const state = createCollectionState();
    registerEntries(state, [
      def({ id: 'enemy:goblin', category: 'enemies' }),
      def({ id: 'enemy:wolf', category: 'enemies', ref: { enemyId: 'wolf' } }),
    ]);
    expect(isDiscovered(state, 'enemy:goblin')).toBe(false);
    expect(isCollected(state, 'enemy:goblin')).toBe(false);
  });
});

describe('visibility silhouettes', () => {
  it('reports question mark until discovered, silhouette until collected, then collected', () => {
    const state = createCollectionState();
    const e = def({ id: 'enemy:goblin', category: 'enemies', ref: { enemyId: 'goblin' } });
    expect(getEntryVisibility(state, e)).toBe('question');

    markDiscovered(state, e.id, { newlyDiscovered: [], newlyCollected: [], rewardsGranted: [] });
    expect(getEntryVisibility(state, e)).toBe('silhouette');

    processCollectionEvent(state, [e], REWARDS, { type: 'enemy_defeated', enemyId: 'goblin' }, 1);
    expect(getEntryVisibility(state, e)).toBe('collected');
  });
});

describe('event processing', () => {
  it('collects enemies on defeat', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'enemy:goblin', category: 'enemies', ref: { enemyId: 'goblin' } }),
      def({ id: 'enemy:alpha_wolf', category: 'enemies', ref: { enemyId: 'alpha_wolf' } }),
    ];
    const r = processCollectionEvent(state, entries, REWARDS, { type: 'enemy_defeated', enemyId: 'goblin' }, 1);
    expect(isCollected(state, 'enemy:goblin')).toBe(true);
    expect(isCollected(state, 'enemy:alpha_wolf')).toBe(false);
    expect(r.newlyCollected).toContain('enemy:goblin');
  });

  it('collects bosses and dungeons on completion', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'boss:count_vlad', category: 'bosses', ref: { enemyId: 'count_vlad' } }),
      def({ id: 'dungeon:darkwood-caverns', category: 'dungeons', ref: { dungeonId: 'darkwood-caverns' } }),
    ];
    processCollectionEvent(state, entries, REWARDS, { type: 'enemy_defeated', enemyId: 'count_vlad' }, 1);
    processCollectionEvent(state, entries, REWARDS, { type: 'dungeon_completed', dungeonId: 'darkwood-caverns' }, 2);
    expect(isCollected(state, 'boss:count_vlad')).toBe(true);
    expect(isCollected(state, 'dungeon:darkwood-caverns')).toBe(true);
  });

  it('tracks owned items and collects item/rare entries', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'item:iron_sword', category: 'items', ref: { itemId: 'iron_sword' } }),
      def({ id: 'rare:unmaker_heart', category: 'rare_drops', ref: { itemId: 'unmaker_heart' } }),
    ];
    processCollectionEvent(state, entries, REWARDS, { type: 'item_acquired', itemId: 'iron_sword', quantity: 1 }, 1);
    processCollectionEvent(state, entries, REWARDS, { type: 'item_acquired', itemId: 'unmaker_heart', quantity: 1 }, 2);
    expect(state.ownedItems['iron_sword']).toBe(1);
    expect(isCollected(state, 'item:iron_sword')).toBe(true);
    expect(isCollected(state, 'rare:unmaker_heart')).toBe(true);
  });

  it('collects crafted items on craft', () => {
    const state = createCollectionState();
    const entries = [def({ id: 'crafted:bronze_sword', category: 'crafted_items', ref: { itemId: 'bronze_sword' } })];
    processCollectionEvent(state, entries, REWARDS, { type: 'item_crafted', itemId: 'bronze_sword' }, 1);
    expect(isCollected(state, 'crafted:bronze_sword')).toBe(true);
  });

  it('reveals silhouettes of a region on visit (not collected)', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'enemy:goblin', category: 'enemies', ref: { enemyId: 'goblin', regionId: 'starter-frontier' } }),
      def({ id: 'enemy:wolf', category: 'enemies', ref: { enemyId: 'wolf', regionId: 'darkwood-forest' } }),
    ];
    processCollectionEvent(state, entries, REWARDS, { type: 'region_visited', regionId: 'starter-frontier' }, 1);
    expect(isDiscovered(state, 'enemy:goblin')).toBe(true);
    expect(isCollected(state, 'enemy:goblin')).toBe(false);
    expect(isDiscovered(state, 'enemy:wolf')).toBe(false);
  });

  it('collects entries via direct grant (quests/achievements)', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'lore:ashfall', category: 'lore' }),
      def({ id: 'enemy:elder_dryad', category: 'enemies', ref: { enemyId: 'elder_dryad' } }),
    ];
    const r = processCollectionEvent(state, entries, REWARDS, { type: 'grant_entry', entryId: 'lore:ashfall' }, 1);
    expect(isCollected(state, 'lore:ashfall')).toBe(true);
    expect(r.newlyCollected).toContain('lore:ashfall');
    // unknown grant is ignored
    processCollectionEvent(state, entries, REWARDS, { type: 'grant_entry', entryId: 'lore:nonexistent' }, 2);
    expect(isCollected(state, 'lore:nonexistent')).toBe(false);
  });

  it('collects title entries when a title is earned', () => {
    const state = createCollectionState();
    const entries = [def({ id: 'title:the_awakened', category: 'titles', ref: { title: 'the Awakened' } })];
    processCollectionEvent(state, entries, REWARDS, { type: 'title_earned', title: 'the Awakened' }, 1);
    expect(isCollected(state, 'title:the_awakened')).toBe(true);
    expect(state.titles).toContain('the Awakened');
  });
});

describe('equipment sets', () => {
  it('completes a set when all pieces are owned', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'set:bronze', category: 'equipment_sets', displayName: 'Bronze Militia', requiresItems: ['bronze_sword', 'bronze_platebody'] }),
    ];
    processCollectionEvent(state, entries, REWARDS, { type: 'item_acquired', itemId: 'bronze_sword', quantity: 1 }, 1);
    expect(isCollected(state, 'set:bronze')).toBe(false);
    processCollectionEvent(state, entries, REWARDS, { type: 'item_acquired', itemId: 'bronze_platebody', quantity: 1 }, 2);
    expect(isCollected(state, 'set:bronze')).toBe(true);
  });
});

describe('threshold rewards', () => {
  it('grants tiered category rewards as collection grows', () => {
    const state = createCollectionState();
    const enemies = [
      def({ id: 'enemy:a', category: 'enemies', ref: { enemyId: 'a' } }),
      def({ id: 'enemy:b', category: 'enemies', ref: { enemyId: 'b' } }),
      def({ id: 'enemy:c', category: 'enemies', ref: { enemyId: 'c' } }),
    ];
    processCollectionEvent(state, enemies, REWARDS, { type: 'enemy_defeated', enemyId: 'a' }, 1);
    const r2 = processCollectionEvent(state, enemies, REWARDS, { type: 'enemy_defeated', enemyId: 'b' }, 2);
    expect(r2.rewardsGranted.some((x) => x.threshold === 2 && x.title === 'the Menagerist')).toBe(true);

    const r3 = processCollectionEvent(state, enemies, REWARDS, { type: 'enemy_defeated', enemyId: 'c' }, 3);
    expect(r3.rewardsGranted.some((x) => x.threshold === 3 && x.cosmetic === 'badge_hunter')).toBe(true);

    // No duplicate granting after further events.
    const r4 = processCollectionEvent(state, enemies, REWARDS, { type: 'enemy_defeated', enemyId: 'c' }, 4);
    expect(r4.rewardsGranted).toHaveLength(0);
  });
});

describe('queries', () => {
  it('computes category and overall completion', () => {
    const state = createCollectionState();
    const entries = [
      def({ id: 'enemy:a', category: 'enemies', ref: { enemyId: 'a' } }),
      def({ id: 'enemy:b', category: 'enemies', ref: { enemyId: 'b' } }),
      def({ id: 'dungeon:x', category: 'dungeons', ref: { dungeonId: 'x' } }),
    ];
    processCollectionEvent(state, entries, REWARDS, { type: 'enemy_defeated', enemyId: 'a' }, 1);
    const enemies = getCollectionCategoryCompletion(state, entries, 'enemies');
    expect(enemies.collected).toBe(1);
    expect(enemies.total).toBe(2);
    expect(enemies.ratio).toBeCloseTo(0.5);

    const overall = getOverallCompletion(state, entries);
    expect(overall.collected).toBe(1);
    expect(overall.total).toBe(3);

    const all = getAllCategoryCompletions(state, entries);
    expect(all['dungeons'].collected).toBe(0);

    expect(getCollectedEntries(state, entries).map((e) => e.id)).toEqual(['enemy:a']);
  });
});

describe('integration with authored game-data catalog', () => {
  it('builds a complete multi-category registry and runs end-to-end', () => {
    expect(COLLECTION_ENTRIES.length).toBeGreaterThan(100);
    const ids = new Set(COLLECTION_ENTRIES.map((e) => e.id));
    expect(ids.size).toBe(COLLECTION_ENTRIES.length);

    // Categories all represented.
    const categories = new Set(COLLECTION_ENTRIES.map((e) => e.category));
    for (const c of ['items', 'enemies', 'bosses', 'dungeons', 'crafted_items', 'rare_drops', 'lore', 'titles', 'equipment_sets'] as CollectionCategory[]) {
      expect(categories.has(c)).toBe(true);
    }

    const state = createCollectionState();
    registerEntries(state, COLLECTION_ENTRIES);

    // 8 bosses expected from the authored DB.
    const bosses = getAllCategoryCompletions(state, COLLECTION_ENTRIES)['bosses'];
    expect(bosses.total).toBe(8);
    const dungeons = getAllCategoryCompletions(state, COLLECTION_ENTRIES)['dungeons'];
    expect(dungeons.total).toBe(7);

    // Defeat every boss -> boss collection + all-dungeon set of milestones.
    for (const boss of ['forest_troll_king', 'count_vlad', 'undead_dragon', 'frost_giant_king', 'tyrant_of_the_deep', 'arch_demon', 'magma_tyrant', 'the_unmaker']) {
      processCollectionEvent(state, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'enemy_defeated', enemyId: boss }, 1);
    }
    expect(getCollectionCategoryCompletion(state, COLLECTION_ENTRIES, 'bosses').collected).toBe(8);

    // Craft a set: complete the bronze militia equipment set.
    processCollectionEvent(state, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'item_acquired', itemId: 'bronze_sword', quantity: 1 }, 1);
    processCollectionEvent(state, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'item_acquired', itemId: 'bronze_platebody', quantity: 1 }, 1);
    expect(isCollected(state, 'set:bronze')).toBe(true);

    // Grant lore + a title via entry grants.
    processCollectionEvent(state, COLLECTION_ENTRIES, COLLECTION_SET_REWARDS, { type: 'grant_entry', entryId: 'lore:ashfall' }, 1);
    expect(isCollected(state, 'lore:ashfall')).toBe(true);

    // Overall completion is within reasonable bounds.
    const overall = getOverallCompletion(state, COLLECTION_ENTRIES);
    expect(overall.collected).toBeGreaterThan(10);
    expect(overall.ratio).toBeGreaterThan(0);
    expect(overall.ratio).toBeLessThan(1);
  });
});
