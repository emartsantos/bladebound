# PHASE_18_COMPLETION_REPORT — Collections

## Objective
Create collection interfaces for items, enemies, bosses, dungeons, crafted items, rare drops, lore, titles, and equipment sets, per `MASTER_GAME_SPEC.md` (line 1579). Make completion visually satisfying and let unknown content appear as silhouettes or question marks where appropriate.

## Deliverables

### 1. Shared types — `shared-types/src/collection.ts`
- `CollectionCategory` — all requested collections: `items`, `enemies`, `bosses`, `dungeons`, `crafted_items`, `rare_drops`, `lore`, `titles`, `equipment_sets`
- `CollectionEventType` / `CollectionEvent` — event bus consuming gameplay signals (`enemy_defeated`, `dungeon_completed`, `item_acquired`, `item_crafted`, `region_visited`, `grant_entry`, `title_earned`)
- `CollectionEntryDefinition` — id, category, displayName, description, `ref` (enemy/dungeon/item/region/title), `requiresItems` (sets), `hidden`, `lore`
- `CollectionEntryState` — binary `discovered` (silhouette vs ?) and `collected` (card vs silhouette)
- `CollectionSetReward` — per-category threshold rewards (title / cosmetic)
- `PlayerCollectionState` — entry states, owned-items, titles, per-category granted rewards
- Wired into `PlayerSaveState` via `collection?: PlayerCollectionState` in `domain.ts`, exported from index.

### 2. Collection catalog — `game-data/src/collections.ts`
Built **programmatically from the authored world data** (no hand-listed ids → no drift):
- **Foes** — every `ALL_ENEMIES` entry: regular enemies → `enemies`, `category === 'boss'` → `bosses` (8 bosses), using the established `enemy:<id>` convention so existing quest/achievement `collectionEntries` grants (e.g. `enemy:elder_dryad`) still resolve
- **Dungeons** — all 7 from `ALL_DUNGEONS`
- **Items / rare drops / crafted** — classified from `ALL_ITEM_DEFINITIONS`: boss uniques + legendary/epic materials → `rare_drops`; the 18 tiered weapon/armor production line → `items` (and `crafted_items`)
- **Lore** — 13 authored world-building entries (`lore:ashfall` → `lore:abyssal_throne` + gathering/smithing traditions)
- **Titles** — 28 authored title entries (`title:<slug>`) matching the title strings granted across quests/achievements
- **Equipment sets** — `set:bronze` … `set:void` (9 tiers), each completing when blade + platebody are owned
- **Set rewards** per category (e.g. bosses 4→`aura_boss_slayer`, 8→`Slayer of Legends`) — the "visually satisfying" payoff.
- Exports: `COLLECTION_ENTRIES` (6-figure registry ~130 entries), `COLLECTION_ENTRY_BY_ID`, `COLLECTION_SET_REWARDS`.

### 3. Collection engine — `game-engine/src/collection.ts`
Pure, framework-independent state machine:
- `createCollectionState()`, `registerEntries()` (pre-register for silhouette tracking), `getEntryState()`
- **Discover vs collect**: `markDiscovered`/`markCollected`; `getEntryVisibility()` → `'question'` (??), `'silhouette'`, or `'collected'` — the visual reveal model
- `processCollectionEvent(state, definitions, setRewards, event, now)` → routes each event to matching entries (enemy/dungeon/item/craft/region/grant/title), updates owned-items, auto-completes equipment sets when all pieces are owned, and returns `{ newlyDiscovered, newlyCollected, rewardsGranted }`
- **Threshold rewards**: per-category completion counts trigger title/cosmetic grants (monotonic — no duplicate granting), recorded in `state.setRewardsGranted`
- Queries: `getOverallCompletion`, `getCollectionCategoryCompletion`, `getAllCategoryCompletions`, `getCollectedEntries`, `isCollected`, `isDiscovered`
- Reward grants returned as payloads for the caller/server to reconcile.

## Key design decisions
- **Programmatic registry**: the catalog is derived from the authored enemy/dungeon/item databases rather than duplicated, so collections can never drift from game content.
- **Discover/collected separation**: unknown content shows as a question mark; seen-but-unclaimed content as a silhouette; completed content as a filled card — fully satisfying the spec's visual requirement without leaking info.
- **Established id convention**: `enemy:<id>` matches the quest/achievement `collectionEntries` grants already in the codebase, so cross-system collection completion works out of the box.
- **Equipment sets as owned-item conjunctions**: a set completes only when every member item is owned, giving an achievable, satisfying endgame chase.
- Integrity: reward grants returned as payloads for server reconciliation.

## Tests — `game-engine/tests/collection.test.ts` (14 tests)
- State factory & registration; visibility question→silhouette→collected
- Event processing (enemy defeat, boss/dungeon completion, item acquisition + owned tracking, craft, region-visit silhouette reveal, direct grant + unknown-grant ignore, title earned)
- Equipment set completion (all pieces required)
- Threshold rewards (tiered grants, no duplicate)
- Queries (category/overall completion, filtered collected entries)
- **Integration** — drives the full authored `game-data` catalog end-to-end (unique ids, all 9 categories present, 8 bosses + 7 dungeons, bronze set completion, lore grant, sane overall completion). Also surfaced + corrected a data fact: the 8 enemy-DB bosses are (incl. `undead_dragon`, not `ancient_lich`).

## Verification
- `npm run typecheck` — passes on all workspaces (shared-types, game-data, game-engine, validation, web)
- Game-engine — **144 tests passing** (14 new collection tests)
- Validation — **6 tests passing**
- **Total: 150 tests passing**

## Next step (Phase 19)
From `MASTER_GAME_SPEC.md` line 1607 — Shop and Economy (currency sources/sinks, shop prices, repair/crafting costs, upgrades, convenience purchases, special currencies, dev simulations for gold in/out per hour and affordability).