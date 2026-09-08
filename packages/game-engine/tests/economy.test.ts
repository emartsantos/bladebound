import { describe, it, expect } from 'vitest';
import {
  createEconomyState,
  creditEconomy,
  spendEconomy,
  sellLoot,
  computeSellValue,
  buyShopItem,
  computeShopPrice,
  computeRepairCost,
  payRepair,
  computeCraftingFee,
  payCraftingFee,
  convenienceCost,
  buyConvenience,
} from '../src/economy';
import {
  simulateEconomy,
  formatEconomyReport,
} from '../src/economy-simulation';
import { ECONOMY_COST_MODEL } from '@premium-rpg/game-data';
import { SHOP_STOCK, PRESTIGE_STOCK, CONVENIENCE_UPGRADES, CURRENCY_DOCUMENTATION } from '@premium-rpg/game-data';
import { computeItemValue } from '../src/itemization';
import { ITEM_BY_ID } from '@premium-rpg/game-data';

function itemValue(itemId: string): number {
  const def = ITEM_BY_ID[itemId];
  if (!def) throw new Error(`no item ${itemId}`);
  return computeItemValue(def);
}

// ─── credit / debit / ledger ─────────────────────────────────────────

describe('credit and spend', () => {
  it('credits gold and updates the ledger + emits an earned event', () => {
    const s = createEconomyState();
    const res = creditEconomy(s, 'gold', 100, 'combat');
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.gold).toBe(150); // +50 starting
    expect(s.ledger.gold.earned).toBe(100);
    expect(res.event).toEqual({ type: 'currency_earned', currency: 'gold', amount: 100, source: 'combat' });
  });

  it('spends gold, rejects overdraft with insufficient_funds', () => {
    const s = createEconomyState();
    spendEconomy(s, 'gold', 30);
    const res = spendEconomy(s, 'gold', 100);
    expect(res.receipt.status).toBe('insufficient_funds');
    expect(res.event).toBeNull();
    expect(s.wallet.gold).toBe(20);
    expect(s.ledger.gold.spent).toBe(30);
  });

  it('rounds fractional amounts down and never credits negatives', () => {
    const s = createEconomyState(0, 0);
    creditEconomy(s, 'gold', 10.9);
    expect(s.wallet.gold).toBe(10);
    creditEconomy(s, 'gold', -5);
    expect(s.wallet.gold).toBe(10);
  });

  it('returns a wallet snapshot on success', () => {
    const s = createEconomyState(0, 0);
    const res = creditEconomy(s, 'dungeon_seals', 60);
    expect(res.receipt.balance).toEqual({ gold: 0, dungeon_seals: 60 });
  });
});

// ─── selling loot ────────────────────────────────────────────────────

describe('selling loot', () => {
  it('sells at sellRatio of item value and credits gold', () => {
    const s = createEconomyState(0, 0);
    const v = itemValue('iron_sword');
    const gains = computeSellValue(v, ECONOMY_COST_MODEL, 1);
    const res = sellLoot(s, v, 1, ECONOMY_COST_MODEL);
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.gold).toBe(gains);
    expect(res.event?.type).toBe('currency_earned');
  });

  it('sell returns 50% of value, and shop marks catalogue up', () => {
    const v = itemValue('iron_sword');
    expect(computeSellValue(v, ECONOMY_COST_MODEL, 1)).toBe(Math.floor(v * 0.5));
    expect(computeShopPrice(v, ECONOMY_COST_MODEL, 0)).toBe(Math.floor(v * 2));
  });
});

// ─── buying from a shop ──────────────────────────────────────────────

describe('buying', () => {
  it('buys a stockless item when funds + level allow, spending price', () => {
    const s = createEconomyState(1000, 0);
    const v = itemValue('bronze_sword');
    const price = computeShopPrice(v, ECONOMY_COST_MODEL, 0);
    const res = buyShopItem(s, { stockId: 's', currency: 'gold', price, levelRequired: 1, category: 'gear' }, 1, 1);
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.gold).toBe(1000 - price);
    expect(res.event?.type).toBe('currency_spent');
  });

  it('denies when player level is below the requirement', () => {
    const s = createEconomyState(1000, 0);
    const res = buyShopItem(s, { stockId: 's', currency: 'gold', price: 10, levelRequired: 10, category: 'gear' }, 1, 3);
    expect(res.receipt.status).toBe('locked');
    expect(s.wallet.gold).toBe(1000);
  });

  it('denies when funds are insufficient', () => {
    const s = createEconomyState(10, 0);
    const res = buyShopItem(s, { stockId: 's', currency: 'gold', price: 50, category: 'gear' }, 1, 1);
    expect(res.receipt.status).toBe('insufficient_funds');
  });

  it('honors finite stock and rejects over-stock purchases', () => {
    const s = createEconomyState(1000, 0);
    const opts = { stockId: 'limited', currency: 'gold' as const, price: 20, stock: 2, category: 'gear' as const };
    expect(buyShopItem(s, opts, 2, 1).receipt.status).toBe('success');
    expect(s.stock.limited).toBe(0);
    expect(buyShopItem(s, opts, 1, 1).receipt.status).toBe('no_stock');
  });

  it('enforces one-time purchases', () => {
    const s = createEconomyState(1000, 0);
    const opts = { stockId: 'once', currency: 'gold' as const, price: 10, onetime: true, category: 'cosmetic' as const };
    expect(buyShopItem(s, opts, 1, 1).receipt.status).toBe('success');
    expect(buyShopItem(s, opts, 1, 1).receipt.status).toBe('already_purchased');
  });

  it('buys prestige items in dungeon_seals', () => {
    const s = createEconomyState(0, 500);
    const item = PRESTIGE_STOCK[0];
    const res = buyShopItem(s, { stockId: item.id, currency: 'dungeon_seals', price: item.price, category: 'cosmetic', onetime: true }, 1, 1);
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.dungeon_seals).toBe(500 - item.price);
  });
});

// ─── repair ──────────────────────────────────────────────────────────

describe('repair', () => {
  it('costs proportional to missing durability and item value', () => {
    const v = itemValue('steel_sword');
    const fullMissing = computeRepairCost(v, { current: 0, max: 100 }, ECONOMY_COST_MODEL);
    const halfMissing = computeRepairCost(v, { current: 50, max: 100 }, ECONOMY_COST_MODEL);
    expect(fullMissing).toBe(Math.floor(v * 0.1));
    expect(halfMissing).toBe(Math.floor(v * 0.1 * 0.5));
    expect(computeRepairCost(v, { current: 100, max: 100 }, ECONOMY_COST_MODEL)).toBe(0);
  });

  it('pays gold when affordable and leaves it at a different balance', () => {
    const s = createEconomyState(500, 0);
    const v = itemValue('steel_sword');
    const before = s.wallet.gold;
    const res = payRepair(s, v, { current: 0, max: 100 }, ECONOMY_COST_MODEL);
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.gold).toBe(before - computeRepairCost(v, { current: 0, max: 100 }, ECONOMY_COST_MODEL));
  });
});

// ─── crafting fee ────────────────────────────────────────────────────

describe('crafting fee', () => {
  it('charges a small fraction of output value per craft', () => {
    const v = itemValue('mithril_sword');
    expect(computeCraftingFee(v, 1, ECONOMY_COST_MODEL)).toBe(Math.floor(v * 0.03));
    const s = createEconomyState(1000, 0);
    const res = payCraftingFee(s, v, 2, ECONOMY_COST_MODEL);
    expect(res.receipt.status).toBe('success');
    expect(s.wallet.gold).toBe(1000 - Math.floor(v * 0.03 * 2));
  });
});

// ─── convenience upgrades ────────────────────────────────────────────

describe('convenience upgrades', () => {
  it('scales cost with level and increments the owned level', () => {
    const u = CONVENIENCE_UPGRADES.find((x) => x.id === 'conv_bank_slots')!;
    const s = createEconomyState(5000, 0);
    const c0 = convenienceCost(u, 0);
    expect(c0).toBe(u.baseCost);
    const res = buyConvenience(s, u);
    expect(res.receipt.status).toBe('success');
    expect(s.upgrades[u.id]).toBe(1);
    expect(s.wallet.gold).toBe(5000 - c0);
    // level 2 is more expensive
    const c1 = convenienceCost(u, 1);
    expect(c1).toBe(Math.round(u.baseCost * u.costGrowth));
  });

  it('rejects upgrading past max level', () => {
    const u = CONVENIENCE_UPGRADES.find((x) => x.id === 'conv_autopilot')!; // maxLevel 1
    const s = createEconomyState(5000, 0);
    const first = buyConvenience(s, u);
    expect(first.receipt.status).toBe('success');
    expect(buyConvenience(s, u).receipt.status).toBe('already_purchased');
  });
});

// ─── currency documentation completeness ─────────────────────────────

describe('currency documentation', () => {
  it('documents every currency with all required fields', () => {
    expect(CURRENCY_DOCUMENTATION.length).toBe(2);
    for (const c of CURRENCY_DOCUMENTATION) {
      expect(c.howEarned).toBeTruthy();
      expect(c.whereSpent).toBeTruthy();
      expect(c.whyExists).toBeTruthy();
      expect(c.inflationRisk).toBeTruthy();
      expect(c.economySink).toBeTruthy();
    }
  });
});

// ─── developer simulation ────────────────────────────────────────────

describe('developer economy simulation', () => {
  it('produces a balanced, affordable report over real shop stock', () => {
    const stock = SHOP_STOCK.map((s) => ({ id: s.id, itemId: s.itemId, price: s.price, levelRequired: s.levelRequired }));
    const report = simulateEconomy(ECONOMY_COST_MODEL, {}, stock, itemValue);
    const g = report.gold;

    // Sinks meaningfully offset but do not exceed generation.
    expect(g.goldConsumedPerHour).toBeGreaterThan(0);
    expect(g.goldConsumedPerHour).toBeLessThan(g.goldGeneratedPerHour);
    expect(report.affordability.verdict).toBe('healthy');

    // Best tier gear is affordable within a sane idle span (not hundreds of hours).
    expect(report.affordability.hoursToAffordBestTierGear).toBeLessThan(60);

    // Every shop item resolved to a positive value and price.
    const bad = report.progression.filter((p) => p.itemValue <= 0 || p.shopPrice <= 0);
    expect(bad).toEqual([]);

    // The report is human-readable for a dev.
    expect(formatEconomyReport(report)).toContain('=== ECONOMY SIMULATION ===');
  });
});