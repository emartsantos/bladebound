# PHASE_22_COMPLETION_REPORT — NPCs and World Interaction

## Objective
Per `MASTER_GAME_SPEC.md` (line ~1711): introduce important NPCs providing quests, shops, crafting, dialogue, region lore, upgrades, and contracts. NPC dialogue must be concise and atmospheric — no massive AI-generated exposition dumps.

## Deliverables

### 1. Shared types — `shared-types/src/npc.ts`
- `NPCRole` — 10 roles: quest_giver, merchant, prestige_merchant, crafting_station, trainer, lore_keeper, contract_broker, healer, banker, traveler
- `NPCService` / `NPCServiceConfig` — typed service descriptors (shop stock, crafting recipe category, training upgrade category, contract tier, healing cost, travel destinations)
- `DialogueContext` — 15 contextual dialogue states (greeting, returning, quest_available/active/complete, shop_browse, crafting_open, lore_reveal, contract_offer, healing, training, farewell, region_intro, milestone, low_health, full_inventory)
- `DialogueLine` — terse lines with optional conditional `requires` (context, quest state, region progress, NPC reputation, player level, flags) and optional action
- `NPCDefinition` — full NPC: role, services, dialogue, reputation (initial/max/thresholds), availability, contract IDs, lore entries
- `PlayerNPCState` — reputations per NPC, interaction state (seen dialogue, completed contracts, purchased training), and global player flags
- `ContractDefinition` / `ActiveContract` — repeatable tasks with tier (daily/weekly/elite), objectives (kill/gather/deliver/explore/craft/dungeon), rewards, cooldown
- `PlayerContractState` — active contracts, cooldowns, completed
- `WorldState` — region discovery/progress, world flags, active events

### 2. Game data — `game-data/src/npc.ts` (exported from index)
- **10 NPC definitions** built on the existing `QUEST_NPCS` roster: Elder Athan (quests), Scout Mira (travel), Smith Harrin (crafting/training), The Cartographer (lore), Mistress Rin (merchant/bank), Archivist Omnar (lore), Herbalist Orin (healer/crafting), Loremaster Valen (lore), Warden Garrick (training/contracts/armory), Seer Nyx (prestige_merchant/lore)
- **Atmospheric, concise dialogue** — 1-3 sentences per line, no exposition dumps; contextual variants (greeting, low_health, quest states, region_intro, lore_reveal)
- **6 contracts** across tiers: daily frontier patrol, daily wood quota, daily darkwood cull, weekly dungeon delver, weekly boss marks, elite unmaker hunt
- `REGION_LORE` — layered lore for all 8 regions, revealed progressively by lore keepers
- `NPC_BY_ID`, `NPCS_BY_REGION`, `NPC_CONTRACTS`, `CONTRACT_BY_ID` lookup maps

### 3. Engine — `game-engine/src/npc.ts` (pure, framework-independent)
- **World state**: `createWorldState`, `discoverRegion`, `setRegionCompletion` (monotonic), `isRegionDiscovered`, `getRegionCompletion`
- **Reputation**: `createPlayerNPCState`, `getNPCReputation`, `changeNPCReputation` (clamped -100..max, returns applied delta), flags
- **Dialogue resolution**: `resolveDialogue` evaluates conditional `requires` against player context (level, seen dialogue, reputation, world flags, region progress, quest states) and returns matching terse lines or a fallback. No hardcoded branches — conditions are data-driven.
- **Contracts**: `canAcceptContract` (active/one-time/cooldown/reputation checks), `acceptContract` (daily/weekly/elite expiry), `progressContract` (per-objective counting with cap, auto-complete), `claimContract` (returns typed reward bundle for reconciliation, sets cooldown)
- **Services**: `getHealingQuote`, `offersService`

### 4. Tests — `packages/game-engine/tests/npc.test.ts` (30 tests)
- World state: creation, single discovery, monotonic completion, clamping
- Reputation: default, bounded changes with exact applied deltas, world flags
- Dialogue: greeting resolution, contextual variants (quest_available, low_health), fallback behavior (data-driven min-NPC), traveler action, region-intro line
- Contracts: acceptance, duplicate rejection, cooldown respect, one-time tracking, objective progression with completion and over-count capping, claiming with rewards + cooldown set, incomplete rejection
- Data integrity: all NPC fields valid, contract IDs referenced are defined, non-negative rewards, all regions have lore, healer/merchant service checks

## Key design decisions
- **Data-driven dialogue**: no dialogue branches in code; `requires` conditions evaluated generically against a `DialogueContextState` snapshot, keeping the engine clean and NPCs purely declarative
- **Concise atmosphere over exposition**: every dialogue line is 1-3 sentences; lore is split into short `REGION_LORE` entries revealed progressively rather than wall-of-text dumps
- **Reputation is first-class**: NPCs have initial/max reputation with unlock thresholds; contracts and dialogue can gate on it
- **Contracts distinct from quests**: repeatable, tiered (daily/weekly/elite) with cooldowns, separate from the curated quest chain
- **Rewards returned as bundles**: `claimContract` returns a typed reward object (gold/xp/seals/reputation/items) for the caller to reconcile, matching the framework-independent grant pattern
- **World state is lightweight**: per-region discovery/completion and global flags, no over-engineering

## Verification
- **Typecheck passes** across all workspaces
- **Full suite: 241 tests passing** (211 prior + 30 new NPC tests) — 16 test files, all green
- No regressions

## Next
Phase 23 — Offline Progression (spec line ~1800): store active action + start timestamp + last validated state on leave; on return calculate elapsed time, determine valid completed actions, apply limits, calculate rewards, run progression events, display offline summary. Prevent clock manipulation exploits; validate server-side for registered accounts.