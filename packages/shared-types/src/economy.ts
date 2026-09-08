// ─── ECONOMY DOMAIN ──────────────────────────────────────────────────
// A controlled economy with documented currencies, a persisted wallet,
// shop buy/sell, repair, crafting, upgrade, and convenience costs — plus
// an event stream so currency changes propagate to achievements/UI.
//
// Currency policy: gold is the universal day-to-day currency; dungeon_seals
// is a single special currency earned from endgame/milestone content and
// spent only at a prestige vendor. Every currency is documented (source,
// sink, why it exists, inflation risk).
//
// NOTE: `CurrencyId` (gold) already exists in player.ts — we use the name
// `EconomyCurrencyId` here to avoid an index re-export collision.

export type EconomyCurrencyId = 'gold' | 'dungeon_seals';

export interface Wallet {
  gold: number;
  dungeon_seals: number;
}

export interface CurrencyLedger {
  earned: number;
  spent: number;
}

// A single +/- change to one currency.
export interface EconomyTransaction {
  currency: EconomyCurrencyId;
  amount: number; // + earn, - spend
}

export type EconomyReceiptStatus =
  | 'success'
  | 'insufficient_funds'
  | 'invalid_item'
  | 'no_stock'
  | 'already_purchased'
  | 'locked';

export interface EconomyReceipt {
  status: EconomyReceiptStatus;
  deltas: EconomyTransaction[]; // applied deltas (empty on failure)
  balance: Wallet;              // resulting balance (post-success)
}

export type ShopCategory =
  | 'gear'       // equippable equipment
  | 'material'   // raw crafting/gathering materials
  | 'consumable' // one-shot / limited-use
  | 'convenience' // QoL purchases
  | 'cosmetic';  // cosmetic purchases (usually dungeon_seals)

export interface ShopItemDefinition {
  id: string;
  itemId: string;
  price: number;            // base price
  currency: EconomyCurrencyId;
  stock?: number;           // finite stock; omit = unlimited
  levelRequired?: number;
  category: ShopCategory;
  onetime?: boolean;        // purchasable only once
}

// Full documentation for every currency, meeting the spec requirement to
// document each one (how earned / where spent / why / inflation risk / sink).
export interface CurrencyDocumentation {
  id: EconomyCurrencyId;
  name: string;
  howEarned: string;
  whereSpent: string;
  whyExists: string;
  inflationRisk: string; // 'low' | 'medium' | 'high' + rationale
  economySink: string;   // the sink that removes it from circulation
}

// A convenience/meta upgrade (inventory, bank, autopilot, etc.).
export interface ConvenienceUpgrade {
  id: string;
  name: string;
  description: string;
  currency: EconomyCurrencyId;
  baseCost: number;
  maxLevel: number;
  costGrowth: number;      // multiplier per level applied to baseCost
  category: 'inventory' | 'bank' | 'autopilot' | 'travel' | 'other';
}

export interface EconomyPurchaseRecord {
  id: string;
  action: 'buy' | 'convenience';
  ref: string;             // shop item id or convenience id
  currency: EconomyCurrencyId;
  amount: number;
  at: number;
}

export interface PlayerEconomyState {
  wallet: Wallet;
  ledger: Record<EconomyCurrencyId, CurrencyLedger>;
  upgrades: Record<string, number>; // convenience upgrade id -> level
  stock: Record<string, number>;    // shop item id -> remaining stock (limited)
  purchases: EconomyPurchaseRecord[];
}

// Event emitted on any currency change for downstream systems (notably the
// achievement engine's gold_earned_lifetime counter).
export interface EconomyEvent {
  type: 'currency_earned' | 'currency_spent';
  currency: EconomyCurrencyId;
  amount: number;
  source?: string; // e.g. 'combat', 'quest', 'shop_sell', 'dungeon'
}
