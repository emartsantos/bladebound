# PHASE_20_COMPLETION_REPORT — Item Upgrades and Durability

## Objective
Per `MASTER_GAME_SPEC.md` (line 1655): implement a deterministic **upgrade system** (+1..+5, costs scale predictably, always succeed, no RNG) and a **forgiving durability model** that creates economic decisions without annoyance — broken items NEVER silently destroy themselves; the only destruction path is the explicit `salvageItem` action.

## Deliverables

### 1. Shared types — `shared-types/src/upgrade.ts`
- `UpgradePathDef` — predictable cost/power model shared by all enhancable items: `baseGold`, `goldGrowth` (multiplier), `baseMaterial`, `materialPerLevel`, `statPowerPerLevel` (fraction of base stat added per +1), `maxLevel`
- `UpgradeCost` — gold + material map for one step
- `ItemUpgradeState` — per-instance (`uid`) upgrade level, timestamp, lifetime gold spent
- `DurabilityState` — per-instance `max`/`current`
- `PlayerItemUpgradeState` — persisted wallet: `upgrades`, `durability`, `materialsSpent`, `totalGoldSpent`, `salvaged` (uids explicitly destroyed)
- `UpgradeResult` — `statDelta`, cost, at-capacity flag
- `DurabilityDamageResult` — `before`, `after`, `broken: true`, `destroyed: false` (contractually guaranteed)
- `BrokenPolicy` — `contributesStats: false`, `autoDestroys: false`, `repairRequired: true`
- `UpgradeStatKey` — stat keys amplifiable by upgrades (all 13 `StatBlock` keys)
- Wired into `PlayerSaveState` as `itemUpgrades?: PlayerItemUpgradeState` in `domain.ts`, exported from index — following the exact precedent used for quest/task/achievement/collection/economy.

### 2. Upgrade catalog — `game-data/src/upgrades.ts` (exported from index)
- `UPGRADE_PATHS` / `UPGRADE_PATH_BY_ID` — three paths:
  - **weapon**: max 5, base 60g, 2.2× growth, `cosmic_crystal` ×(lvl+1), +6% stat power/level
  - **armor**: max 5, base 45g, 2.0× growth, `iron_ingot` ×(lvl+1), +5% stat power/level
  - **unique**: max 3, base 500g, 3.0× growth, `void_essence` ×2 per level, +10% stat power/level
- `DEFAULT_DURABILITY_BASE` — baseline max durability: weapon 100, armor 120, unique 80
- All costs deterministic and strictly increasing; materials form an intentional sink.

### 3. Upgrade/durability engine — `game-engine/src/item-upgrade.ts` (pure, framework-independent)
- `createItemUpgradeState()` — empty wallet
- `upgradeCost(path, level)` — returns exact `UpgradeCost` for step `level→level+1` (floor gold, linear material)
- `applyUpgrade(state, itemDef, path, uid, { spendGold, consumeMaterial })` — verifies both callbacks succeed before mutating state; returns discriminated outcome (`ok: true/false` with reason: `at_capacity` | `insufficient_gold` | `insufficient_materials` | `salvaged`)
- `projectUpgradeStatBonus(itemDef, path, level)` — derives bonus stats by amplifying every base stat the item has by `statPowerPerLevel × level`
- **Durability**: `ensureDurability`, `takeDurability` (clamps to 0, reports `broken` but `destroyed: false`), `isBroken`, `repairDurability` (restores ≤ max), `statContributionActive` (false when broken, true when healthy)
- **Explicit destruction only**: `salvageItem(state, uid)` — the **only** way an item is marked destroyed; idempotent, never automatic, never silent. Salvaged items cannot be upgraded.

### 4. Tests — `packages/game-engine/tests/item-upgrade.test.ts` (17 tests)
- Predictable cost scaling (gold multiplicative, material linear, at-capacity cap)
- Apply upgrade succeeds with gold+material, projects correct stat delta; refuses on insufficient gold/material/max level/salvaged
- Durability: damage reduces, broken stops stat contribution, repair restores, never exceeds max
- Repair cost via Phase 19 economy hook scales with missing durability and item value
- **Destruction is explicit and never automatic** — `salvageItem` is the only path, salvaged items cannot be upgraded
- **Developer simulation**: total gold/material to fully upgrade a weapon to +5 (2525g, 15 cosmic_crystals) with monotonic cost growth verification; stat projection enumerates all amplifiable keys

## Key design decisions
- **No RNG, pure predictability**: every upgrade step has a closed-form cost (`baseGold × goldGrowth^level`), always succeeds. This satisfies "costs must scale predictably."
- **Durability without annoyance**: `current ≤ max` model is easy to understand; broken items stop giving bonuses but are **never destroyed** — repair restores them. The only destruction is the clearly-named `salvageItem` action, meeting the spec's "never silently destroy" requirement.
- **Economic integration**: upgrades consume gold + materials (gold from Phase 19 wallet, materials from inventory); repair costs hook into Phase 19's `computeRepairCost` (proportional to missing durability). Together they form meaningful, balanced sinks.
- **Stat projection from base**: each +1 amplifies the item's existing stats by a small fraction, so weapons and armor both scale sensibly without per-item config.
- **Per-instance state keyed by `uid`**: upgrade/durability lives on the item instance, not the definition, matching the `InventoryItem.uid` model.
- **Reward grants returned as payloads**: `applyUpgrade` returns `UpgradeResult` with cost/deltas for the caller/server to reconcile; the engine never silently touches balances.

## Verification
- **Typecheck passes** across all workspaces
- **Full suite: 180 tests passing** (163 prior + 17 new) — 14 test files, all green
- No regressions in existing itemization/equipment/economy tests

## Next
Phase 21 — Magic, Abilities and Status Effects (spec line ~1680): create an extensible effect system (bleed, burn, poison, stun, slow, armor reduction, HoT, DoT, shield, buffs) implemented in the shared game engine without hardcoding every effect in combat UI. This will build on the `ItemPassive` machinery already present in item definitions.