import type {
  ConvenienceUpgrade,
  EconomyCurrencyId,
  EconomyEvent,
  EconomyReceipt,
  EconomyReceiptStatus,
  EconomyTransaction,
  PlayerEconomyState,
  ShopCategory,
  Wallet,
} from '@premium-rpg/shared-types';
import type { EconomyCostModel } from '@premium-rpg/game-data';

export interface EconomyActionResult {
  receipt: EconomyReceipt;
  event: EconomyEvent | null;
}

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createEconomyState(startingGold = 50, startingSeals = 0): PlayerEconomyState {
  return {
    wallet: { gold: startingGold, dungeon_seals: startingSeals },
    ledger: {
      gold: { earned: 0, spent: 0 },
      dungeon_seals: { earned: 0, spent: 0 },
    },
    upgrades: {},
    stock: {},
    purchases: [],
  };
}

export function getBalance(state: PlayerEconomyState, currency: EconomyCurrencyId): number {
  return state.wallet[currency];
}

// ─── LOW-LEVEL CREDIT / DEBIT ────────────────────────────────────────

export function creditEconomy(
  state: PlayerEconomyState,
  currency: EconomyCurrencyId,
  amount: number,
  source?: string
): EconomyActionResult {
  const safeAmount = Math.max(0, Math.floor(amount));
  state.wallet[currency] += safeAmount;
  state.ledger[currency].earned += safeAmount;
  const deltas: EconomyTransaction[] = [{ currency, amount: safeAmount }];
  const receipt: EconomyReceipt = { status: 'success', deltas, balance: { ...state.wallet } };
  const event: EconomyEvent = { type: 'currency_earned', currency, amount: safeAmount, source };
  return { receipt, event };
}

export function spendEconomy(
  state: PlayerEconomyState,
  currency: EconomyCurrencyId,
  amount: number,
  source?: string
): EconomyActionResult {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (state.wallet[currency] < safeAmount) {
    const receipt: EconomyReceipt = { status: 'insufficient_funds', deltas: [], balance: { ...state.wallet } };
    return { receipt, event: null };
  }
  state.wallet[currency] -= safeAmount;
  state.ledger[currency].spent += safeAmount;
  const deltas: EconomyTransaction[] = [{ currency, amount: -safeAmount }];
  const receipt: EconomyReceipt = { status: 'success', deltas, balance: { ...state.wallet } };
  const event: EconomyEvent = { type: 'currency_spent', currency, amount: safeAmount, source };
  return { receipt, event };
}

// ─── SELLING LOOT ────────────────────────────────────────────────────
// Selling refunds sellRatio of the item's computed value per unit.

export function sellLoot(
  state: PlayerEconomyState,
  itemValue: number,
  quantity: number,
  model: EconomyCostModel,
  source = 'shop_sell'
): EconomyActionResult {
  const gains = Math.floor(itemValue * model.sellRatio * Math.max(0, Math.floor(quantity)));
  return creditEconomy(state, 'gold', gains, source);
}

export function computeSellValue(itemValue: number, model: EconomyCostModel, quantity = 1): number {
  return Math.floor(itemValue * model.sellRatio * Math.max(0, Math.floor(quantity)));
}

// Resolve a shop unit price: explicit price wins, else item value * markup.
export function computeShopPrice(itemValue: number, model: EconomyCostModel, explicitPrice: number): number {
  return explicitPrice > 0 ? explicitPrice : Math.floor(itemValue * model.shopMarkup);
}

// ─── BUYING ──────────────────────────────────────────────────────────
// Buy price = explicit price if > 0, else itemValue * shopMarkup.

export interface BuyOptions {
  stockId: string;
  currency: EconomyCurrencyId;
  price: number;                 // resolved price per unit
  levelRequired?: number;
  stock?: number;                // finite stock (omitted = unlimited)
  onetime?: boolean;
  category: ShopCategory;
}

export function buyShopItem(
  state: PlayerEconomyState,
  opts: BuyOptions,
  quantity: number,
  playerLevel: number,
  source = 'shop_buy'
): EconomyActionResult {
  const qty = Math.max(0, Math.floor(quantity));
  if (opts.levelRequired !== undefined && playerLevel < opts.levelRequired) {
    return fail('locked');
  }
  if (opts.onetime && state.purchases.some((p) => p.ref === opts.stockId)) {
    return fail('already_purchased');
  }
  const remaining = state.stock[opts.stockId];
  if (opts.stock !== undefined) {
    if (remaining === undefined) state.stock[opts.stockId] = opts.stock;
    if (state.stock[opts.stockId] < qty) return fail('no_stock');
  }
  const total = opts.price * qty;
  const spend = spendEconomy(state, opts.currency, total, source);
  if (spend.receipt.status !== 'success') return spend;
  if (opts.stock !== undefined) {
    state.stock[opts.stockId] = (state.stock[opts.stockId] ?? opts.stock) - qty;
  }
  state.purchases.push({
    id: `${opts.stockId}:${state.purchases.length}`,
    action: 'buy',
    ref: opts.stockId,
    currency: opts.currency,
    amount: total,
    at: Date.now(),
  });
  return spend;
}

function fail(status: EconomyReceiptStatus): EconomyActionResult {
  return {
    receipt: { status, deltas: [], balance: { gold: 0, dungeon_seals: 0 } },
    event: null,
  };
}

// ─── REPAIR ──────────────────────────────────────────────────────────
// Repair cost scales with missing durability as a fraction of item value.
// A fully broken item costs repairCostFraction of its value to restore.

export function computeRepairCost(
  itemValue: number,
  durability: { current: number; max: number },
  model: EconomyCostModel
): number {
  if (!durability || durability.max <= 0) return 0;
  const missingRatio = (durability.max - Math.max(0, durability.current)) / durability.max;
  return Math.floor(itemValue * model.repairCostFraction * missingRatio);
}

export function payRepair(
  state: PlayerEconomyState,
  itemValue: number,
  durability: { current: number; max: number },
  model: EconomyCostModel,
  source = 'repair'
): EconomyActionResult {
  const cost = computeRepairCost(itemValue, durability, model);
  if (cost <= 0) return { receipt: { status: 'success', deltas: [], balance: { ...state.wallet } }, event: null };
  return spendEconomy(state, 'gold', cost, source);
}

// ─── CRAFTING FEE ────────────────────────────────────────────────────
// Convenience fee to craft is a small fraction of the output item value.

export function computeCraftingFee(outputItemValue: number, quantity: number, model: EconomyCostModel): number {
  return Math.floor(outputItemValue * model.craftFeeFraction * Math.max(0, Math.floor(quantity)));
}

export function payCraftingFee(
  state: PlayerEconomyState,
  outputItemValue: number,
  quantity: number,
  model: EconomyCostModel,
  source = 'crafting_fee'
): EconomyActionResult {
  const fee = computeCraftingFee(outputItemValue, quantity, model);
  if (fee <= 0) return { receipt: { status: 'success', deltas: [], balance: { ...state.wallet } }, event: null };
  return spendEconomy(state, 'gold', fee, source);
}

// ─── CONVENIENCE / UPGRADES ──────────────────────────────────────────

export function convenienceCost(upgrade: ConvenienceUpgrade, currentLevel: number): number {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, currentLevel));
}

export function buyConvenience(
  state: PlayerEconomyState,
  upgrade: ConvenienceUpgrade,
  source = 'convenience'
): EconomyActionResult {
  const currentLevel = state.upgrades[upgrade.id] ?? 0;
  if (currentLevel >= upgrade.maxLevel) return fail('already_purchased');
  const cost = convenienceCost(upgrade, currentLevel);
  const res = spendEconomy(state, upgrade.currency, cost, source);
  if (res.receipt.status !== 'success') return res;
  state.upgrades[upgrade.id] = currentLevel + 1;
  state.purchases.push({
    id: `${upgrade.id}:${state.purchases.length}`,
    action: 'convenience',
    ref: upgrade.id,
    currency: upgrade.currency,
    amount: cost,
    at: Date.now(),
  });
  return res;
}

// ─── HELPERS ─────────────────────────────────────────────────────────

export function walletDeltaEvents(action: EconomyActionResult): EconomyEvent[] {
  return action.event ? [action.event] : [];
}

export function toWallet(state: PlayerEconomyState): Wallet {
  return { ...state.wallet };
}
