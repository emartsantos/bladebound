# PHASE_15_COMPLETION_REPORT — Quest System

## Objective
Implement a structured, lore-driven quest system with chains, requirements, progress tracking, rewards, a journal, and completed-history. Quests must reveal world lore and unlock mechanics — not just be generic filler.

## Deliverables

### 1. Shared types — `shared-types/src/quest.ts`
Full quest domain:
- `QuestObjectiveType` — all 9 requested types: `kill`, `collect`, `craft`, `gather`, `visit_region`, `complete_dungeon`, `equip_item`, `reach_skill_level`, `interact_npc`
- `QuestObjective` — target ids, region scoping, skill ids, equip slots, `required` thresholds, hidden flag
- `QuestReward` / `QuestUnlock` — xp, gold, items, skill xp, unlocks, titles, collection entries
- `QuestDefinition` — category (main/side/lore/unlock), recommended level, region, `prerequisites` (UnlockCondition[]), `chain` (parent + stepIndex), objectives, rewards
- `QuestProgressState`, `QuestObjectiveProgress`, `QuestCompletionRecord`, `PlayerQuestState` (active / completed / unlocks / chains)
- `QuestEventType` / `QuestEvent` — event bus consumed by the engine
- Wired into `PlayerSaveState` via `quest?: PlayerQuestState` in `domain.ts` and exported from the index

### 2. Quest database — `game-data/src/quests.ts`
17 authored quests across 4 categories, all tied to real authored content (regions, dungeons, enemies, items, skills):
- **Main chain "The Awakening" (10 quests)** — a continuous 10-step arcing story from the Ashfall prologue to slaying the Unmaker: `q_awakening → q_first_forge → q_darkwood_scout → q_vlads_curse → q_lich_awakened → q_frozen_summit_ascent → q_sunken_catacombs → q_citadel_depths → q_molten_core → q_abyssal_throne`. Each directly references real dungeon completions and boss kills (Count Vlad, Ancient Lich, Frost Giant King, Tyrant of the Deep, Arch Demon, Magma Tyrant, the Unmaker).
- **Unlock quests (2)** — `q_unlock_dungeon_keys` (grants `mechanic:dungeon_keys`), `q_unlock_blessing` (grants `mechanic:blessing`).
- **Lore quests (2)** — deep world-building (elder wood spirits, the Ashen Prophecy).
- **Side quests (3)** — supply runs, herbalist/relic gather, and a gearing/equip master order.
- Static NPC registry `QUEST_NPCS[]` for consistent `interact_npc` identity across phases.
- Exports: `QUESTS`, `QUEST_BY_ID`, `MAIN_QUEST_CHAIN`, `UNLOCK_QUESTS`, `LORE_QUESTS`, `SIDE_QUESTS`, `QUEST_NPCS`.

### 3. Quest engine — `game-engine/src/quest.ts`
Pure, framework-independent state machine (mirrors the dungeon/region engine pattern):
- `createQuestState()`
- Availability & prerequisites: `evalCondition()` (level / quest / item / achievement / collection via `UnlockCondition`), `prerequisitesMet()`, `isQuestAvailable()`, `getAvailableQuests()`, `getComputedQuestStatus()`
- Chain gating via `definition.chain` (parent completion required before the child becomes available)
- Lifecycle: `startQuest()`, `abandonQuest()`, `processQuestEvent(state, definitionById, event, now)` — routes gameplay events to matching objectives
  - **Binary vs count objective semantics**: `reach_skill_level` / `visit_region` / `complete_dungeon` / `interact_npc` / `equip_item` are single-condition (one matching event satisfies them, where `required` is the threshold value); `kill` / `collect` / `craft` / `gather` accumulate with capping.
- Completion & rewards: `isQuestCompletable()`, `completeQuest()` → returns `QuestRewardGrant` (xp, gold, items, skill xp, unlocks, titles, collection entries) while recording completed history and granting unlocks to `state.unlocks`
- Queries: `hasUnlock()`, `getQuestChainProgress()`, journal status helpers

## Key design decisions
- Save state stores only **progress counters** (`current`), not objective definitions — the engine resolves objective specs from the definition database by id, keeping saves compact and framework-independent.
- Unlocks (regions, mechanics, cosmetics) live in a player-wide `unlocks` registry queryable by other systems via `hasUnlock()` — establishing the cross-system gate the spec requires.
- Quests always reference real authored entities (enemy/dungeon/region/item/skill ids), never abstract placeholders.
- Online-first integrity: reward grants are returned as a payload for the caller (server) to reconcile, matching the "don't trust client progression" rule.

## Tests — `game-engine/tests/quest.test.ts` (18 tests)
- Availability & prerequisites (zero-state, chain gating, level gates, no re-offer, explicit quest prerequisites)
- Lifecycle (start with zeroed objectives, kill objective capping, target-specific matching, completion + unlock grant, refusal on incomplete, dungeon + skill + equip + npc + collect objectives, abandon)
- Journal & chain queries (chain status, per-quest status, collection entry registry)
- Integration (full awakening quest end-to-end)

## Verification
- `npm run typecheck` — passes on all workspaces (shared-types, game-data, game-engine, validation, web)
- Game-engine — **102 tests passing** (18 new quest tests)
- Validation — **6 tests passing**
- **Total: 108 tests passing**

## Next step (Phase 16)
From `MASTER_GAME_SPEC.md` line 1519 — Tasks and Daily Systems (repeatable daily/weekly contracts, monster contracts, gathering/crafting orders, non-FOMO design).
