import type {
  ConvenienceUpgrade,
  CurrencyDocumentation,
  EconomyCurrencyId,
  ShopItemDefinition,
} from '@premium-rpg/shared-types';

// ─── COST MODEL ──────────────────────────────────────────────────────
// Central pricing constants. The engine combines these with the item value
// model (itemization.computeItemValue) to derive concrete prices, avoiding
// duplicated formulas across packages.
export interface EconomyCostModel {
  sellRatio: number;            // % of item value refunded when selling
  shopMarkup: number;           // buy price = item value * this multiplier
  repairCostFraction: number;   // full repair cost as % of item value
  craftFeeFraction: number;     // gold fee to craft as % of output item value
  startingGold: number;
  startingSeals: number;
}

export const ECONOMY_COST_MODEL: EconomyCostModel = {
  sellRatio: 0.5,
  shopMarkup: 2.0,
  repairCostFraction: 0.1,
  craftFeeFraction: 0.03,
  startingGold: 50,
  startingSeals: 0,
};

// ─── CURRENCY DOCUMENTATION ──────────────────────────────────────────
// Every currency documented per the spec: how earned, where spent, why it
// exists, inflation risk, and its controlling sink.
export const CURRENCY_DOCUMENTATION: CurrencyDocumentation[] = [
  {
    id: 'gold',
    name: 'Gold',
    howEarned: 'Combat kills, dungeon clears, quest and task rewards, and selling loot.',
    whereSpent: 'Gear and material from the general shop, crafting fees, repair costs, and gold-priced convenience upgrades.',
    whyExists: 'It is the universal day-to-day trading currency that lets all systems share one store of value.',
    inflationRisk: 'medium — gold is generated from combat at a steady per-kill rate; unchecked it devalues sinks. Controlled by finite-reward sinks below.',
    economySink: 'Shop purchases, repair, crafting fees, death penalty (10% gold loss), and convenience upgrades remove gold from circulation.',
  },
  {
    id: 'dungeon_seals',
    name: 'Dungeon Seals',
    howEarned: 'First-clear dungeon bonuses and endgame boss rewards. Not farmable from normal combat.',
    whereSpent: 'The prestige vendor: cosmetic purchases and premium convenience upgrades.',
    whyExists: 'Provides a long-horizon prestige currency that is durable (low inflation) and gated behind real milestones, so cosmetics stay meaningful.',
    inflationRisk: 'low — supply is strictly milestone-gated and not repeat-farmable, so its value is stable.',
    economySink: 'Cosmetic and premium purchases; seals are consumed on spend and cannot be re-obtained from the same milestone twice.',
  },
];

// ─── GENERAL SHOP (gold) ─────────────────────────────────────────────
// Buy prices are derived at runtime as itemValue * shopMarkup. `level`
// gates gate tiers to progression. Finite stock drives limited purchases.
export const SHOP_STOCK: ShopItemDefinition[] = [
  // Starter gear
  { id: 'shop_bronze_sword', itemId: 'bronze_sword', price: 0, currency: 'gold', levelRequired: 1, category: 'gear' },
  { id: 'shop_bronze_plate', itemId: 'bronze_platebody', price: 0, currency: 'gold', levelRequired: 1, category: 'gear' },
  // Mid tiers
  { id: 'shop_iron_sword', itemId: 'iron_sword', price: 0, currency: 'gold', levelRequired: 5, category: 'gear' },
  { id: 'shop_steel_sword', itemId: 'steel_sword', price: 0, currency: 'gold', levelRequired: 10, category: 'gear' },
  { id: 'shop_mithril_sword', itemId: 'mithril_sword', price: 0, currency: 'gold', levelRequired: 18, category: 'gear' },
  // High tiers (limited stock, finite)
  { id: 'shop_rune_sword', itemId: 'rune_sword', price: 0, currency: 'gold', levelRequired: 30, category: 'gear', stock: 1 },
  { id: 'shop_dragon_sword', itemId: 'dragon_sword', price: 0, currency: 'gold', levelRequired: 45, category: 'gear', stock: 1 },
  { id: 'shop_void_blade', itemId: 'void_blade', price: 0, currency: 'gold', levelRequired: 65, category: 'gear', stock: 1 },
  // Materials (unlimited)
  { id: 'shop_cosmic_crystal', itemId: 'cosmic_crystal', price: 0, currency: 'gold', levelRequired: 40, category: 'material', stock: 5 },
  { id: 'shop_ethereal_wood', itemId: 'ethereal_wood', price: 0, currency: 'gold', levelRequired: 40, category: 'material', stock: 5 },
];

// ─── PRESTIGE VENDOR (dungeon_seals) ─────────────────────────────────
export const PRESTIGE_STOCK: ShopItemDefinition[] = [
  { id: 'seal_aurora_cape', itemId: 'aurora_cape', price: 150, currency: 'dungeon_seals', category: 'cosmetic', onetime: true },
  { id: 'seal_abyss_cape', itemId: 'abyss_cape', price: 400, currency: 'dungeon_seals', category: 'cosmetic', onetime: true },
  { id: 'seal_gold_ring', itemId: 'gold_ring', price: 60, currency: 'dungeon_seals', category: 'convenience' },
];

// ─── CONVENIENCE UPGRADES ────────────────────────────────────────────
export const CONVENIENCE_UPGRADES: ConvenienceUpgrade[] = [
  {
    id: 'conv_bank_slots', name: 'Extended Bank', description: 'Adds 25 bank slots per level.',
    currency: 'gold', baseCost: 250, maxLevel: 8, costGrowth: 1.9, category: 'bank',
  },
  {
    id: 'conv_inventory', name: 'Backpack Extension', description: 'Adds 5 inventory slots per level.',
    currency: 'gold', baseCost: 150, maxLevel: 6, costGrowth: 1.8, category: 'inventory',
  },
  {
    id: 'conv_autopilot', name: 'Combat Autopilot', description: 'Repeats combat actions without manual restarts.',
    currency: 'gold', baseCost: 500, maxLevel: 1, costGrowth: 1, category: 'autopilot',
  },
  {
    id: 'conv_travel', name: 'Waypoint Recall', description: 'Unlocks fast travel between explored regions.',
    currency: 'gold', baseCost: 300, maxLevel: 1, costGrowth: 1, category: 'travel',
  },
];

// ─── SIMULATION INPUTS ───────────────────────────────────────────────
// Modeled hourly rates used by the developer economy simulation to
// estimate gold-in/out per hour and progression affordability.
export interface SimulationRates {
  // Assumed active-activity kills per hour (idle pacing).
  killsPerHour: number;
  // Average gold per kill across the early-mid game.
  averageGoldPerKill: number;
  // Assumed crafts per hour at endgame pace.
  craftsPerHour: number;
  // Assumed full repairs per hour of active combat.
  repairsPerHour: number;
  // Repairs triggered by combat durability.
  durabilityPerKillFraction: number;
  // Assumed sink purchases per hour (shop + fees).
  shopSpendPerHour: number;
}

export const DEFAULT_SIMULATION_RATES: SimulationRates = {
  killsPerHour: 120,          // ~2 kills/min idle
  averageGoldPerKill: 6,      // early tier goldReward median
  craftsPerHour: 20,
  repairsPerHour: 2,          // repairs per hour at combat pace
  durabilityPerKillFraction: 0.02,
  shopSpendPerHour: 260,      // materials, gear, and fee sink
};

export type { EconomyCurrencyId };
