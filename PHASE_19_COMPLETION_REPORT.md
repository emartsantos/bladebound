# PHASE_19_COMPLETION_REPORT — Shop and Economy

## Objective
Per `MASTER_GAME_SPEC.md` (line 1607): implement a **controlled economy** — currencies with documented sources and sinks, shop purchases, sell/buy-back, repair costs (making durability no longer free), a crafting fee, convenience/upgrade purchases, a single purposeful special currency, and **developer simulations** (gold in/out per hour, progression costs, affordability) validating the balance.

## Key research finding
Before this phase the game had **no persisted wallet**: gold existed only as ephemeral, engine-local `InventoryState.gold` (never saved), as reward payloads (`QuestRewardGrant.gold`, `TaskClaimResult.reward.gold`, `DungeonRewardResult.gold`, `CombatSummary.goldGained`), and as a hardcoded UI placeholder (`1,245` in `shell.tsx:85`). Repair was **completely free** and crafting had **no cost field**. `PlayerEconomyState` is the first persisted wallet; `PlayerSaveState` had no currency/economy sub-state.

## Deliverables

### 1. Shared types — `shared-types/src/economy.ts`
- `EconomyCurrencyId = 'gold' | 'dungeon_seals'` (deliberately NOT `CurrencyId` to avoid colliding with the existing `CurrencyId = 'gold'` in `player.ts` on the index `export *`)
- `Wallet`, `CurrencyLedger` (earned/spent per currency), `EconomyTransaction`
- `EconomyReceiptStatus` — `success | insufficient_funds | invalid_item | no_stock | already_purchased | locked`
- `EconomyReceipt` — status + applied deltas + post balance (never trusts client; caller reconciles)
- `ShopItemDefinition` (id, itemId, explicit-or-derived price, currency, finite stock, level gate, category, one-time), `ShopCategory` (`gear|material|consumable|convenience|cosmetic`)
- `CurrencyDocumentation` — the spec-mandated doc record: `howEarned`, `whereSpent`, `whyExists`, `inflationRisk`, `economySink`
- `ConvenienceUpgrade` — QoL purchases with level caps and per-level cost growth
- `EconomyPurchaseRecord` and `PlayerEconomyState` (wallet, ledger, upgrades, stock, purchase log)
- `EconomyEvent` — `currency_earned|currency_spent` emitted for forwarding to the achievement engine's `money_earned` / `gold_earned_lifetime` counter
- Wired into `PlayerSaveState` as `economy?: PlayerEconomyState` in `domain.ts` and exported from index — **following the exact precedent** used for quest/task/achievement/collection (optional modern sub-state, not added to the legacy migration builders, consistent with those systems).

### 2. Economy catalog — `game-data/src/economy.ts` (exported from index)
- `ECONOMY_COST_MODEL` — central pricing constants: `sellRatio 0.5`, `shopMarkup 2.0`, `repairCostFraction 0.1`, `craftFeeFraction 0.03`, `startingGold 50`, `startingSeals 0`
- `CURRENCY_DOCUMENTATION` — both currencies fully documented (source/sink/why/inflation risk)
- `SHOP_STOCK` — gold shop: starter through void-gear (level-gated, high tiers finite-stock), plus limited materials
- `PRESTIGE_STOCK` — `dungeon_seals` prestige vendor: cosmetics + convenience purchasable with the special currency
- `CONVENIENCE_UPGRADES` — bank/inventory/autopilot/travel with max levels and exponential cost growth
- `DEFAULT_SIMULATION_RATES` + `SimulationRates` — parameterized idle pacing for the dev simulation

### 3. Economy engine — `game-engine/src/economy.ts` (pure, framework-independent)
- `createEconomyState()`, `getBalance()`
- `creditEconomy` / `spendEconomy` — maintain ledger, floor fractional amounts, reject negatives, emit `EconomyEvent`, return wallet snapshots
- `sellLoot` + `computeSellValue` — buy-back at 50% of item value (currency emerges from the inventory sell path). Renamed from `sellItem` to avoid colliding with the legacy `inventory.ts` `sellItem`.
- `buyShopItem` + `computeShopPrice` — explicit price wins, else `itemValue * shopMarkup`; enforces funds, level gate, finite stock, and one-time purchases; logs the purchase
- **Repair is no longer free**: `computeRepairCost` = `itemValue * repairCostFraction * (max-current)/max` (proportional to missing durability) and `payRepair`; `payCraftingFee` + `computeCraftingFee` = `itemValue * craftFeeFraction * qty`
- `buyConvenience` + `convenienceCost` — level-up convenience upgrades in gold/seals

### 4. Developer simulation — `game-engine/src/economy-simulation.ts`
- `simulateEconomy(model, rates, shopStock, itemValueResolver)` → a pure, reproducible `EconomySimulationReport`
- Computes **gold generated/hour** (combat) vs **gold consumed/hour** (**repair**, **crafting fees**, **shop sink**), `net/hour`, and per-item **progression costs** (item value, shop price, sell price, `hoursToAfford`) over the real authored shop stock
- Emits a **verdict**: `healthy | inflated | deflated`, and asserts high-tier gear is affordable within a sane idle span
- `formatEconomyReport()` — human-readable output for developers

## Key design decisions
- **Controlled economy, no duplication**: all pricing lives in one cost model (`game-data`) combined with the existing item-value model (`computeItemValue`) in the engine — no duplicated formulas across packages. Repairs/crafting/selling are all derived from a single item value.
- **Gold sinks over proportion**: every earn path has a paired sink (shop, repair — now costly, crafting fee, convenience upgrades, death 10% penalty documented), and the simulation enforces sinks absorb between 50% and 100% of per-hour generation — a `healthy` verdict — preventing both inflation (gold piling up) and deflation (unaffordable progress).
- **One special currency, purposeful**: `dungeon_seals` is milestone-gated (first-clear dungeons / boss rewards), non-farmable from normal combat → strictly **low inflation**, spent only at the prestige vendor on cosmetics and premium convenience — meeting the spec's "only if purposeful" test.
- **Currency is documented, not implicit**: every currency carries full `CurrencyDocumentation`, satisfying the spec's requirement to explain how each is earned, where spent, why it exists, its inflation risk, and its sink.
- **Reward grants returned as payloads**: receipts/deltas/events are returned for the caller (server) to reconcile against the persisted wallet; the engine never silently trusts callers.
- **Wiring precedent**: `economy` added as an optional `PlayerSaveState` sub-state and exported — no conflict in the shared index (`EconomyCurrencyId` distinct from `CurrencyId`), no legacy migration changes (matching quest/task/achievement/collection).

## Testing
- `packages/game-engine/tests/economy.test.ts` — 19 tests: credit/spend/ledger/rounding/insufficient-funds, sell at 50%, buy (level lock, no stock, insufficient funds, finite stock, one-time, prestige-in-seals), repair cost math + paid repair, crafting fee, convenience level scaling + max-level cap, currency-documentation completeness, and an **integration simulation** over the real `SHOP_STOCK` asserting positive values, a `healthy` verdict, sinks < generation, and high-tier gear affordable under 60 idle hours.
- **Full suite: 163 tests passing** (150 prior + 13 new) — 13 test files, all green.
- **Typecheck passes** across all workspaces.

## Next
Phase 20 — Item Upgrades and Durability (spec line 1655): the durability/repair system this phase priced is expected to be finalized there; also consider surfacing the new `PlayerEconomyState.wallet` into the UI (replacing the `1,245` placeholder in `shell.tsx:85`) and wiring gold rewards from combat/quest/task/dungeon through `creditEconomy` → `EconomyEvent` → the achievement engine's `money_earned` counter.
