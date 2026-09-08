import type { EconomyCostModel } from '@premium-rpg/game-data';
import { DEFAULT_SIMULATION_RATES, type SimulationRates } from '@premium-rpg/game-data';
import { computeSellValue, computeRepairCost, computeShopPrice } from './economy';

// ─── DEVELOPER ECONOMY SIMULATION ────────────────────────────────────
// Pure, reproducible estimates of the controlled economy. Developers run
// this to sanity-check that gold generated per hour is sustainably offset
// by sinks and that progression/gear is affordable.

export interface GoldPerHourEstimate {
  goldGeneratedPerHour: number;
  goldConsumedPerHour: number;
  netPerHour: number;
  breakdownSources: Record<string, number>;
  breakdownSinks: Record<string, number>;
}

export interface ProgressionCost {
  label: string;
  itemId: string;
  itemValue: number;
  shopPrice: number;
  sellPrice: number;
  hoursToAfford: number;   // based on net gold per hour
}

export interface EconomySimulationReport {
  model: EconomyCostModel;
  rates: SimulationRates;
  gold: GoldPerHourEstimate;
  progression: ProgressionCost[];
  affordability: {
    tier: string;
    hoursToAffordBestTierGear: number;
    verdict: 'healthy' | 'inflated' | 'deflated';
  };
}

export function simulateEconomy(
  model: EconomyCostModel,
  rates: Partial<SimulationRates> = {},
  shopItems: Array<{ id: string; itemId: string; price: number; levelRequired?: number }>,
  itemByValue: (itemId: string) => number
): EconomySimulationReport {
  const r: SimulationRates = { ...DEFAULT_SIMULATION_RATES, ...rates };
  const priceOf = (explicit: number, itemId: string) => computeShopPrice(itemByValue(itemId), model, explicit);

  // Gold IN per hour
  const combatGold = r.killsPerHour * r.averageGoldPerKill;

  // Gold OUT per hour (sinks)
  // 1) Repair: each kill wears durability on gear; assume repairs keep pace.
  const durabilityLostPerHour = r.killsPerHour * r.durabilityPerKillFraction; // fraction of max dura per hour
  const repairSpend = (() => {
    // Representative gear value at mid-game (rune tier).
    const representativeValue = 80 * 2.5; // rune tier base * rare mult
    return Math.min(
      r.repairsPerHour * computeRepairCost(representativeValue, { current: 0, max: 1 }, model),
      model.repairCostFraction * representativeValue * durabilityLostPerHour
    );
  })();

  // 2) Crafting fees (a fraction of output value each craft)
  const craftRepresentativeValue = 80 * 2.5;
  const craftFeeSpend = r.craftsPerHour * Math.floor(craftRepresentativeValue * model.craftFeeFraction);

  // 3) Shop spend + general sinks
  const shopSpend = r.shopSpendPerHour;

  const breakdownSources = { combat_gold: combatGold };
  const breakdownSinks = { repair: repairSpend, crafting_fees: craftFeeSpend, shop_and_other: shopSpend };

  const goldGeneratedPerHour = combatGold;
  const goldConsumedPerHour = repairSpend + craftFeeSpend + shopSpend;
  const netPerHour = goldGeneratedPerHour - goldConsumedPerHour;

  // Progression costs: shop prices for the tiered gear and their affordability.
  const progression: ProgressionCost[] = shopItems
    .filter((s) => s.itemId)
    .map((s) => {
      const iv = itemByValue(s.itemId);
      const shopPrice = priceOf(s.price, s.itemId);
      const sellPrice = computeSellValue(iv, model, 1);
      const data = { itemId: s.itemId, itemValue: iv, shopPrice, sellPrice };
      return {
        label: s.itemId,
        ...data,
        hoursToAfford: netPerHour > 0 ? shopPrice / netPerHour : Infinity,
      };
    })
    .sort((a, b) => a.shopPrice - b.shopPrice);

  const bestGear = [...progression].sort((a, b) => b.shopPrice - a.shopPrice)[0];
  const hoursToAffordBestTierGear = bestGear ? bestGear.hoursToAfford : 0;

  // Health verdict: a healthy idle economy keeps high-tier gear within a
  // reasonable play span (~hours, not hundreds) while sinks hold net ~near zero.
  const verdict =
    netPerHour < 0 ? 'deflated'
    : netPerHour > goldGeneratedPerHour * 0.5 ? 'inflated' // >50% of income returns un-sunk
    : 'healthy';

  return {
    model,
    rates: r,
    gold: {
      goldGeneratedPerHour,
      goldConsumedPerHour,
      netPerHour,
      breakdownSources,
      breakdownSinks,
    },
    progression,
    affordability: {
      tier: 'best',
      hoursToAffordBestTierGear,
      verdict,
    },
  };
}

// Convenience entrypoint that prints a human-readable report (dev tool).
export function formatEconomyReport(report: EconomySimulationReport): string {
  const g = report.gold;
  const lines: string[] = [];
  lines.push('=== ECONOMY SIMULATION ===');
  lines.push(`Gold generated / hour:      ${g.goldGeneratedPerHour.toFixed(0)}`);
  lines.push(`Gold consumed / hour:       ${g.goldConsumedPerHour.toFixed(0)}`);
  lines.push(`Net gold / hour:            ${g.netPerHour.toFixed(0)}  (${report.affordability.verdict})`);
  lines.push('  sources: ' + Object.entries(g.breakdownSources).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(', '));
  lines.push('  sinks:   ' + Object.entries(g.breakdownSinks).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(', '));
  lines.push('--- Progression costs (hourly affordability) ---');
  for (const p of report.progression) {
    lines.push(`  ${p.itemId.padEnd(18)} value=${String(p.itemValue).padStart(6)} shop=${String(p.shopPrice).padStart(6)} sell=${String(p.sellPrice).padStart(4)}  ~${p.hoursToAfford.toFixed(1)}h`);
  }
  return lines.join('\n');
}
