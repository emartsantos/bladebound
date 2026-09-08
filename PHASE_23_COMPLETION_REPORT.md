# PHASE_23_COMPLETION_REPORT — Offline Progression

## Objective
Per `MASTER_GAME_SPEC.md` (line ~1736): when a player leaves while an action is running, store active action + start timestamp + last validated state. On return calculate elapsed time, determine valid completed actions, apply limits, calculate rewards, run progression events, display an offline summary. Prevent clock manipulation exploits. Critical calculations validated server-side for registered accounts.

## Deliverables

### 1. Shared types — `shared-types/src/offline.ts`
- **`GatheringNodeSnapshot`** / `GatheringResourceSnapshot` — serializable snapshots of a gathering node (id, skill, baseDuration, baseXp, resources with chance/quantity ranges, toolBonus) decoupled from engine types
- **`OfflineActionSnapshot`** — what the player was doing when they left: kind (`gathering`/`combat`/`crafting`), gathering node snapshot, startedAt, lastValidActionTimestamp, durationMs, toolId. Reserved slots for future combat/crafting.
- **`OfflineSessionStart`** — persisted on leave: leftAt timestamp, action snapshot, baseline (skill levels/xp/resources held) for server-side validation
- **`OfflinePolicies`** — anti-exploit configuration: `maxRewardedMs` (8h hard cap), `maxAcceptedElapsedMs` (24h absolute rejection), `minOfflineMs` (1min minimum before rewards accrue), `clockSkewToleranceMs`, `requireServerValidation` flag for registered accounts
- **`OfflineRng`** — `(seed) => number` hook for deterministic reward rolls that servers can replay and verify
- **`OfflineResourceGain`** / `OfflineSkillResult` / `OfflineSummaryLine` — reward building blocks
- **`OfflineSummary`** — complete return report: elapsedMs (after capping), elapsedCappedAwayMs, actionsCompleted, resources, skills, levelUps, rareDrops, lines (human-readable), serverValidated, cappedByPolicy, reason
- **`PlayerOfflineState`** — persisted save-state slot: session snapshot, lastSummary, optional server nonce for anti-replay

### 2. Engine — `game-engine/src/offline.ts` (pure, framework-independent)
- **`createPlayerOfflineState`** / `captureSessionStart` / `clearSession` — state lifecycle
- **`computeRewardedElapsed`** — the core anti-exploit function:
  - Clock-skew: rejects negative server-elapsed; when `requireServerValidation` is on and no server elapsed provided, returns `clock_skew`
  - `minOfflineMs` gate: too-short returns `too_short` with 0 rewarded
  - `maxAcceptedElapsedMs` hard rejection (24h default)
  - `maxRewardedMs` cap (8h default): excess reported as `elapsedCappedAwayMs`, reason `cap_applied`
- **`processOfflineReturn`** — main entry point: given a session + policies + currentSkillXp + rng + optional `resolveNode`:
  - Computes capped authoritative elapsed
  - For gathering actions: derives per-action duration from node (with tool speed multiplier), computes `actionsCompleted = floor(elapsed / duration)`
  - Rolls rewards per action using injected deterministic RNG: resources with quantity/rarity, aggregated per-item
  - Computes XP/level deltas per skill using `levelForXp` from existing progression engine
  - Detects level-ups with `from -> to` deltas
  - Builds human-readable lines matching spec: "Mining XP +12,440", "Iron Ore +384", "Mining Level 31 → 33", "Rare Drop: ..."
- **`gatheringNodeToSnapshot`** / `computeActionDurationMs` — conversion utilities bridging the engine's GatheringNode into serializable snapshots
- `DEFAULT_OFFLINE_POLICIES` — sensible defaults (8h cap, 1min min, requireServerValidation false for single-player)
- `resolveNode` callback: when provided (server use case), the resolved node fully determines duration + resources, preventing stale/malicious client snapshots from inflating rewards

### 3. Tests — `packages/game-engine/tests/offline.test.ts` (18 tests)
- **State factory**: creates empty state
- **Capture session start**: records action/baseline, clearSession resets
- **Anti-exploit elapsed**: too_short (<1min), ok (within limits), hard cap at maxRewardedMs, negative/server-driven clock_skew, registered-account server requirement, maxAcceptedElapsedMs absolute cap
- **Gathering return**: no_action when no session, full reward aggregation over elapsed, cap action count at maxRewardedMs, level-up detection from XP, deterministic RNG identity check (same seed → identical results), summary line format validation, serverValidated flag, resolveNode override fully controls duration/resources
- **Integration**: startGatheringAction → gatheringNodeToSnapshot conversion

## Key design decisions
- **Server-authoritative anti-exploit**: `computeRewardedElapsed` is a pure function where the caller passes `serverElapsedMs` for registered accounts — the client-reported clock is only used as a sanity cross-check
- **Hard cap before reward computation**: capped-by-policy flag is always reported; the summary tells the UI what happened
- **Deterministic RNG via hook**: `OfflineRng` is injectable, so a server can replay the exact same seed and verify the client never claimed more rewards than the rules allow (anti-cheat for registered accounts)
- **`resolveNode` authority**: when a server supplies a fresh node definition, it overrides both duration AND resources — a malicious client cannot claim shorter action durations
- **Snapshot-based decoupling**: `GatheringNodeSnapshot` in shared-types is a plain data mirror of the engine's GatheringNode, ensuring offline sessions are serializable without coupling to runtime types
- **Evolvable**: the `OfflineActionKind` union includes `combat` and `crafting` slots for future phases; the engine currently only simulates `gathering` and ignores others gracefully
- **Concise lines**: offline summary matches the spec's exact format ("While you were away: Mining XP +12,440 / Iron Ore +384")

## Verification
- **Typecheck passes** across all workspaces
- **Full suite: 259 tests passing** (241 prior + 18 new offline tests) — 17 test files, all green
- No regressions

## Next
Phase 24 — Premium Dashboard UX: redesign dashboard around real gameplay with contextual information (mining: active resource, XP/h, tool bonus, next unlock; fighting: HP bars, timers, buffs, food; etc.).
