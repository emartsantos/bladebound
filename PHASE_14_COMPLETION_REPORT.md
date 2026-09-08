# PHASE_14_COMPLETION_REPORT — Loot and Itemization

## Objective
Deliver a deep, build-defining itemization layer. Rarity must mean **better stat combinations, unique passives, and specialized builds** — NOT flat stat multipliers. This phase removes the historical `rarityMultiplier` anti-pattern and replaces it with a tier-budget + slot-archetype + rarity-line-count system.

## Deliverables

### 1. Shared types — `shared-types/src/item.ts`
Extended `ItemDefinition` with:
- `EquipmentTier` — bronze → void tier ladder (`EquipmentTier`)
- `ItemPassive` — load-bearing passive effects with `category` and `condition`
- `UniqueItemAffix` / `UniqueItem` — authored uniques, optional `soulbound`
- New fields: `tier`, `equipmentSlot`, `stats`, `passives`, `unique`, `acquisition`, `levelRequired`

### 2. Item database — `game-data/src/items.ts`
- 9 weapon tiers (bronze → void)
- 9 armor (chest) tiers
- 7 boss drop uniques: Vampire Fang, Lich Philactery, Frost Crown, Tyrant Tidal Crown, Demon Horn, Magma Tyrant Core, Unmaker Heart
- 2 extra uniques: Abyssal Shard, Serpent Fang
- 3 rare gathering drops: Cosmic Crystal, Ethereal Wood, Void Pike
- Exports: `WEAPON_DEFINITIONS`, `ARMOR_DEFINITIONS`, `ALL_ITEM_DEFINITIONS`, `BOSS_DROP_ITEMS`, `ITEM_BY_ID`

### 3. Centralized weighted loot — `game-data/src/loot-tables-weighted.ts`
Single source of truth for weighted item drops, consumable by the existing `WeightedLootTable`/`selectWeightedEntries` engine:
- `BOSS_DROP_TABLES` — 7 boss tables (uniques weighted low, chase materials)
- `DUNGEON_REWARD_TABLES` — 7 dungeon reward tables
- `GATHERING_PROC_TABLES` — 3 rare gathering proc tables (void mining / abyssal woodcutting / abyssal fishing)
- `ALL_WEIGHTED_TABLES` — aggregated registry

### 4. Itemization engine — `game-engine/src/itemization.ts`
- `TIER_STAT_BUDGET` — stat budget scales with tier, not rarity
- `SLOT_ARCHETYPE` + `ARCHETYPE_STATS` — per-slot weighted stat pools (offense for weapons, survivability for chests, etc.)
- `RARITY_STAT_LINES` — common:1 → legendary:5 stat lines (rarity = combinations)
- `RARITY_PASSIVE_SLOTS` — rare+ gear can roll passives; common/uncommon never do
- `PASSIVE_TEMPLATES` — categorized passive templates (damage, crit, life, utility, etc.)
- `generateItemMods()` — weighted stat generation within budget
- `resolveItemStats()` — merges authored stats + generated mods + authored passives
- `getAcquisitionSources()`, `isAcquiredFrom()`, `computeItemValue()`, `getItemLevel()`

### 5. Equipment refactor — `game-engine/src/equipment.ts`
Removed the `rarityMultiplier` anti-pattern (flat stat scaling by rarity). Now:
- `getModifiersForItem()` → derives stat lines via `resolveItemStats()`
- `getPassivesForItem()` → surfaces authored/generated passives
- `getEquippedPassives()` → aggregates actives across the full set (for combat consumption)
- `EquippedItemInfo` gains `passives[]`

## Design philosophy enforced
- Rarity increases **stat line count and passive count**, NOT a multiplier.
- Tier (bronze→void) drives the **stat budget** and thus power.
- Slot archetype drives **which** stats roll → specialized builds.
- Uniques contribute **authored, hand-tuned passives** → build identity.

## Tests
- `game-engine/tests/itemization.test.ts` — 11 tests (rarity line growth, tier budget ordering, rare+ passives only, archetype combos, unique resolution, item value ordering, acquisition tracking, budget bounds, item level)
- `game-engine/tests/equipment.test.ts` — 3 tests (explicit stat resolution, passive aggregation, common gear yields no passives)

## Verification
- `npm run typecheck` — passes on all 7 workspaces
- Game-engine tests — **84 passed**
- Validation tests — **6 passed**
- **Total: 90 tests passing**

## Next step (Phase 15)
From `MASTER_GAME_SPEC.md` line 1475 — proceed to Phase 15.
