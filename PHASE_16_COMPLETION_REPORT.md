# PHASE_16_COMPLETION_REPORT — Tasks & Daily Systems

## Objective
Implement a repeatable task system from `MASTER_GAME_SPEC.md` (line 1519): daily, weekly, monster contracts, gathering orders, and crafting orders. Crucially, it must be **non-FOMO** — a missed day must never permanently disadvantage the player, and rewards must be meaningful but controlled.

## Deliverables

### 1. Shared types — `shared-types/src/task.ts`
- `TaskGroup` (`daily` | `weekly`), `TaskKind` (`daily` | `weekly` | `monster_contract` | `gathering_order` | `crafting_order` | `dungeon_contract`)
- `TaskObjectiveType` — `kill`, `gather`, `craft`, `collect`, `complete_dungeon` (a clean subset of the quest objective vocabulary)
- `TaskObjective` / `TaskReward` (xp, gold, items, `skillExperience`)
- `TaskDefinition` — single objective, reward, `weight` (for selection), `maxPerWeek`, `levelRequirement`, region scoping
- `TaskAssignment` — a concrete instance: `taskId`, group, objective type/target/skill/region, `current`/`required`, `completed`, `claimed`, `assignedAt`
- `TaskCompletionRecord`, `PlayerTaskState` — daily/weekly keyed records, `catchUpClaims` bank, `totalTasksCompleted`, `history`
- `TaskSeedingOptions` (dailyCount / weeklyCount)
- Wired into `PlayerSaveState` via `task?: PlayerTaskState` in `domain.ts`, exported from index.

### 2. Task database — `game-data/src/tasks.ts`
- **12 daily tasks** across kill contracts, gathering orders, and a crafting order — all referencing real authored content (goblins, wolves, skeletons, darkwood spiders, copper/iron ore, logs, carp, bronze bars).
- **8 weekly contracts** — boss slayer contracts (Forest Troll King, Count Vlad, Ancient Lich), dungeon runs (Darkwood Caverns, Crumbling Citadel), plus mithril/gathering and rune crafting quotas.
- All task rewards are meaningful but controlled (xp/gold scaleloosely to level band, occasional item grants), `maxPerWeek` caps once-per-week rewards, and every task ties to real enemy/dungeon/item/resource/gathering ids.
- Exports: `DAILY_TASKS`, `WEEKLY_TASKS`, `ALL_TASKS`, `TASK_BY_ID`, `DEFAULT_TASK_SELECTION`.

### 3. Task engine — `game-engine/src/task.ts`
Pure, framework-independent, mirrors the quest engine pattern and reuses the same **`QuestEvent` bus** for progress:
- **Cycle keys**: `dailyKey()` (`D-YYYY-MM-DD`) and `weeklyKey()` (`W-YYYY-WW`, ISO week) — deterministic, calendar-aligned rotation.
- **Seeded deterministic selection**: `ensureCurrentTasks(state, pool, selection, date, level)` picks from the pool using a mulberry32 PRNG seeded from the cycle key, filtered by level. Idempotent — a cycle is seeded once and identical across server/clients for a given date.
- **Progress**: `processTaskEvent(state, date, event)` advances every active, unclaimed assignment whose objective matches (obj type + target + skill + region). Returns `{ changed, newlyCompleted }`.
- **Claiming**: `claimTask(state, assignment, rewardFor, now)` returns a `TaskClaimResult` (reward payload for the caller/server to reconcile), increments `totalTasksCompleted`, and records history. Refuses incomplete/already-claimed tasks.
- **Non-FOMO catch-up**: `bankExpiredCompletions(...)` moves completed-but-unclaimed completions from *past* cycles into the `catchUpClaims` bank (capped), so a player who leaves a daily done but unclaimed can still `claimCatchUp(...)` later — a missed day never permanently loses completed-work rewards.
- Queries: `getCurrentTasks`, `getActiveTaskSummaries`, `isAssignmentCompletable`.

## Key design decisions
- **Non-FOMO by construction**: task *selection* never depends on prior completion, and *completed-but-unclaimed* work rolls into a capped catch-up bank rather than expiring. The only cost of absence is missing the *opportunity* to earn more that day — never losing what was already earned.
- **Shared event vocabulary**: the task engine consumes the exact same `QuestEvent` bus as quests, so a single server event feed drives both systems — no divergent event schemas.
- **Cycle invariance**: server and client agree on which tasks appear each day/week via the seeded PRNG keyed on the cycle, preventing exploit re-rolls and keeping saves small (only assignments/progress stored, definitions resolved by id).
- **Controlled rewards**: weekly contracts are capped via `maxPerWeek`; rewards are meaningful but bounded, honoring the spec's "meaningful but controlled" requirement.
- Integrity: reward grants returned as payloads for the caller/server to reconcile (never trust client-side progression).

## Tests — `game-engine/tests/task.test.ts` (15 tests)
- Cycle keys (stable daily keys, weekly key format)
- Deterministic selection (idempotent seeding, cross-state reproducibility, level gating)
- Progress & completion (kill advance + complete, target-only matching, newly-completed capture, gather/craft/collect/dungeon events, wrong-skill non-advance)
- Claiming & non-FOMO (claim once, refuse incomplete, bank expired completions + catch-up claim, cap on bank size)
- Queries (active summaries across multiple cycles)

## Verification
- `npm run typecheck` — passes on all workspaces (shared-types, game-data, game-engine, validation, web)
- Game-engine — **117 tests passing** (15 new task tests)
- Validation — **6 tests passing**
- **Total: 123 tests passing**

## Next step (Phase 17)
From `MASTER_GAME_SPEC.md` line 1543 — Achievements.
