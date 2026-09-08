# PHASE_17_COMPLETION_REPORT — Achievements

## Objective
Implement an achievement system from `MASTER_GAME_SPEC.md` (line 1543) that recognizes progression, combat milestones, skill milestones, collections, rare events, boss kills, economic milestones, and hidden challenges — with categories, completion percentages, points, cosmetic rewards, and titles. Critically, **do not award an achievement every two minutes** — achievements are meaningful one-time milestone unlocks.

## Deliverables

### 1. Shared types — `shared-types/src/achievement.ts`
- `AchievementCategory` — all 8 requested categories: `progression`, `combat`, `skill`, `collection`, `boss`, `economy`, `rare`, `hidden`
- `AchievementMetric` — 20 measureable milestones: level progression (`level`, `total_level`), combat (`skill`, `kill`, `kills_total`, `kills_elite`), collection (`dungeon_completed`, `dungeon_specific`, `region_visited`, `quest_completed`, `bestiary_defeated`, `bestiary_completed`, `collection_entries`, `titles_owned`), economy (`gold_earned_lifetime`), and rarity (`items_collected`, `craft_count`, `gather_count`, `playtime_hours`)
- `AchievementCondition` — metric + target threshold (+ optional targetId), with **multiple conditions AND-ed** per achievement
- `AchievementReward` — points, optional title, cosmetic, collection entries
- `AchievementDefinition` — id, name, description, category, conditions, reward, `hidden` flag, sort order
- `AchievementCounters` — lifetime accumulators; `AchievementProgressState`; `AchievementRecord`; `PlayerAchievementState` (progress / completed / counters / aggregates / earnedTitles / earnedCosmetics / collectionEntries)
- Wired into `PlayerSaveState` via `achievement?: PlayerAchievementState` in `domain.ts`, exported from index.

### 2. Achievement database — `game-data/src/achievements.ts`
35 authored achievements across all 8 categories, all tied to real authored content:
- **Progression**: levels 10/25/50/100 + total level 500
- **Combat**: 100/1000/10000 total kills, 50 elite kills, undead combine (100 skeletons AND 100 zombies)
- **Skill**: gathering/smithing/all-crafting milestones, 100k gathers
- **Collection**: bestiary 10/50, all 7 dungeons, 20 collection entries, 10 titles
- **Boss**: all 8 bosses individually (Forest Troll King → the Unmaker), each worth points and late-bosses grant titles/cosmetics
- **Economy**: 10k / 250k / 1M lifetime gold with escalating titles + `crown_gold` cosmetic
- **Rare**: 1000 crafts, 10k items, 20 quests, all 8 regions, 100 playtime hours
- **Hidden**: `hidden_shadow_kill`, `hidden_elite_hunter` (secret until earnable)
- Exports: `ACHIEVEMENTS`, `ACHIEVEMENT_BY_ID`, `ACHIEVEMENTS_BY_CATEGORY`, `TOTAL_ACHIEVEMENT_POINTS`.

### 3. Achievement engine — `game-engine/src/achievement.ts`
Pure, framework-independent state machine (mirrors quest/task pattern):
- `createAchievementState(definitions)` — initializes progress for every definition
- `processAchievementEvent(state, definitions, snapshot, event, now)` — accumulates lifetime counters from events, resolves every metric against a live `AchievementSnapshot`, awards all satisfied achievements; returns `{ newlyAwarded }` grants as a payload for the caller/server to reconcile
- **Two data sources**: real-time `AchievementSnapshot` (level, skills, bestiary counts, dungeon/region/quest counts, collection/title counts, playtime) for state-derived metrics; `state.counters` for lifetimes (kills, gold, crafts, gathers, items, dungeon completions) accumulated from events
- Progress fraction = min condition ratio for accurate in-progress display; percentages & totals via `getCompletionRatio`, `getCategoryCompletion`, `getCategoryPercentages`, `getTotalPoints`
- Reward flow records `completed` records, `totalPoints`, `totalCompleted`, `earnedTitles`, `earnedCosmetics`, `collectionEntries`; a completed achievement is never re-awarded

## Key design decisions
- **One-time milestones, not spam**: each achievement completes once and is removed from the active evaluation set, so unlocks are paced (level 10 → 25 → 50 → 100, kills 100 → 1000 → 10000, etc.) rather than awarded every few minutes.
- **Two-source metric resolution**: live player state for "where you are" metrics and event-accumulated counters for lifetime totals — no duplicate tracking, framework-independent, compact saves.
- **Cross-system alignment**: titles/cosmetics/collection entries flow into the same player-wide registries the quest system established (`earnedTitles`, `earnedCosmetics`, `collectionEntries`), keeping identity consistent and enabling the Phase 18 collections layer.
- **Hidden challenges**: secret achievements are flagged `hidden` and only surface as they become earnable, satisfying rare/hidden recognition without spoilers.
- **Integrity**: reward grants returned as payloads for the server to reconcile (never trust client-side progression).

## Tests — `game-engine/tests/achievement.test.ts` (13 tests)
- State factory (all definitions initialized)
- Progression (award at threshold, award only once, no point inflation on repeat events)
- Combat (total + elite kill accumulation), boss (via live bestiary + title grant), skill (single + multi-condition AND), economy (gold accumulation), collection (per-dungeon + entries/titles)
- Hidden achievements (still award when conditions met; cosmetic grant)
- Queries & percentages (overall + per-category, total points)
- Progress fraction (least-progressed condition ratio across two conditions)
- **Integration** — drives the full 35-achievement authored `game-data` DB through the engine end-to-end (unique ids, awards cross-category, percentage sanity)

## Verification
- `npm run typecheck` — passes on all workspaces (shared-types, game-data, game-engine, validation, web)
- Game-engine — **130 tests passing** (13 new achievement tests)
- Validation — **6 tests passing**
- **Total: 136 tests passing**

## Next step (Phase 18)
From `MASTER_GAME_SPEC.md` line 1579 — Collections (items, enemies, bosses, dungeons, crafted items, rare drops, lore, titles, equipment sets; silhouettes/question marks for unknown content).
