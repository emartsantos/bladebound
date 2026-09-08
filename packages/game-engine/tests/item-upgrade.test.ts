import { describe, it, expect } from 'vitest';
import {
  createItemUpgradeState,
  upgradeCost,
  applyUpgrade,
  getUpgradeLevel,
  projectUpgradeStatBonus,
  ensureDurability,
  takeDurability,
  getDurability,
  isBroken,
  repairDurability,
  salvageItem,
  statContributionActive,
  STAT_KEYS,
} from '../src/item-upgrade';
import { computeItemValue } from '../src/itemization';
import { computeRepairCost } from '../src/economy';
import { UPGRADE_PATH_BY_ID, ECONOMY_COST_MODEL } from '@premium-rpg/game-data';
import { ITEM_BY_ID } from '@premium-rpg/game-data';
import type { PlayerItemUpgradeState } from '@premium-rpg/shared-types';

function item(id: string) {
  const d = ITEM_BY_ID[id];
  if (!d) throw new Error(`no item ${id}`);
  return d;
}

function makeState(): PlayerItemUpgradeState {
  return createItemUpgradeState();
}

// ─── predictable upgrade cost scaling ────────────────────────────────

describe('upgrade costs scale predictably', () => {
  it('weapon gold grows multiplicatively per level and is deterministic', () => {
    const path = UPGRADE_PATH_BY_ID['weapon'];
    const c1 = upgradeCost(path, 0);
    const c2 = upgradeCost(path, 1);
    const c3 = upgradeCost(path, 2);
    expect(c1.gold).toBe(path.baseGold); // +1 = baseGold
    expect(c2.gold).toBe(Math.floor(path.baseGold * path.goldGrowth));
    expect(c3.gold).toBe(Math.floor(path.baseGold * path.goldGrowth * path.goldGrowth));
    // fully deterministic
    expect(upgradeCost(path, 0)).toEqual(c1);
  });

  it('materials grow linearly with level', () => {
    const path = UPGRADE_PATH_BY_ID['armor'];
    expect(upgradeCost(path, 0).materials[path.baseMaterial]).toBe(1);
    expect(upgradeCost(path, 1).materials[path.baseMaterial]).toBe(2);
    expect(upgradeCost(path, 2).materials[path.baseMaterial]).toBe(3);
  });

  it('cannot upgrade past maxLevel (cost 0 / at_capacity)', () => {
    const path = UPGRADE_PATH_BY_ID['armor'];
    expect(upgradeCost(path, path.maxLevel)).toEqual({ gold: 0, materials: {} });
  });
});

// ─── applying upgrades ───────────────────────────────────────────────

describe('applying upgrades', () => {
  it('upgrades an item to +1, charging gold + material, and projects stat delta', () => {
    const s = makeState();
    const def = item('rune_sword');
    const path = UPGRADE_PATH_BY_ID['weapon'];
    let gold = 10_000;
    const materials: Record<string, number> = { cosmic_crystal: 100 };
    const outcome = applyUpgrade(s, def, path, 'uid-1', {
      spendGold: (amt) => { if (gold < amt) return false; gold -= amt; return true; },
      consumeMaterial: (mat, qty) => { if ((materials[mat] ?? 0) < qty) return false; materials[mat] -= qty; return true; },
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.ok && getUpgradeLevel(s, 'uid-1')).toBe(1);
    const delta = projectUpgradeStatBonus(def, path, 1);
    expect(outcome.ok && outcome.result.statDelta).toEqual(delta);
    expect(delta.strength).toBeGreaterThan(0);
    // tracked lifetime spend
    expect(s.totalGoldSpent).toBeGreaterThan(0);
    expect(s.materialsSpent.cosmic_crystal).toBeGreaterThan(0);
  });

  it('refuses when gold is insufficient (no state mutation)', () => {
    const s = makeState();
    const def = item('rune_sword');
    const path = UPGRADE_PATH_BY_ID['weapon'];
    const outcome = applyUpgrade(s, def, path, 'uid-x', {
      spendGold: () => false,
      consumeMaterial: () => true,
    });
    expect(outcome).toEqual({ ok: false, reason: 'insufficient_gold' });
    expect(getUpgradeLevel(s, 'uid-x')).toBe(0);
  });

  it('refuses when material is insufficient', () => {
    const s = makeState();
    const def = item('rune_sword');
    const path = UPGRADE_PATH_BY_ID['weapon'];
    const outcome = applyUpgrade(s, def, path, 'uid-y', {
      spendGold: () => true,
      consumeMaterial: () => false,
    });
    expect(outcome).toEqual({ ok: false, reason: 'insufficient_materials' });
    expect(getUpgradeLevel(s, 'uid-y')).toBe(0);
  });

  it('stops at max level with existing levels respected', () => {
    const s = makeState();
    const def = item('rune_sword');
    const path = UPGRADE_PATH_BY_ID['weapon'];
    s.upgrades['uid'] = { level: path.maxLevel, upgradedAt: 1, totalGoldSpent: 0 };
    const outcome = applyUpgrade(s, def, path, 'uid', { spendGold: () => true, consumeMaterial: () => true });
    expect(outcome).toEqual({ ok: false, reason: 'at_capacity' });
  });
});

// ─── durability economics ────────────────────────────────────────────

describe('durability: economic decisions without annoyance, no silent destruction', () => {
  it('damage reduces durability and reports broken at 0, but never destroys', () => {
    const s = makeState();
    ensureDurability(s, 'uid', 100);
    const r = takeDurability(s, 'uid', 130);
    expect(r.after).toBe(0);
    expect(r.broken).toBe(true);
    expect(r.destroyed).toBe(false);
    // item still exists, just broken
    expect(isBroken(s, 'uid')).toBe(true);
    expect(statContributionActive(s, 'uid')).toBe(false);
  });

  it('stat contribution is active when item is healthy and disabled when broken', () => {
    const s = makeState();
    ensureDurability(s, 'uid', 100);
    expect(statContributionActive(s, 'uid')).toBe(true);
    takeDurability(s, 'uid', 100);
    expect(statContributionActive(s, 'uid')).toBe(false);
  });

  it('repair restores durability and stat contribution returns', () => {
    const s = makeState();
    ensureDurability(s, 'uid', 100);
    takeDurability(s, 'uid', 60);
    const repaired = repairDurability(s, 'uid', 100);
    expect(repaired).toBe(60);
    expect(getDurability(s, 'uid')?.current).toBe(100);
  });

  it('repair cannot exceed max', () => {
    const s = makeState();
    ensureDurability(s, 'uid', 100);
    takeDurability(s, 'uid', 10);
    expect(repairDurability(s, 'uid', 100)).toBe(10);
  });

  it('repair cost in gold scales with missing durability and item value (economy hook)', () => {
    const def = item('rune_sword');
    const value = computeItemValue(def);
    const missing = computeRepairCost(value, { current: 0, max: 100 }, ECONOMY_COST_MODEL);
    const half = computeRepairCost(value, { current: 50, max: 100 }, ECONOMY_COST_MODEL);
    expect(missing).toBe(Math.floor(value * 0.1));
    expect(half).toBe(Math.floor(value * 0.1 * 0.5));
  });

  it('durability is easy to understand: current <= max and clamped to max', () => {
    const s = makeState();
    const d = ensureDurability(s, 'uid', 100);
    expect(d.current).toBe(100);
    expect(d.max).toBe(100);
  });
});

// ─── explicit destruction only ───────────────────────────────────────

describe('destruction is explicit and never automatic', () => {
  it('salvageItem is the ONLY way to mark an item destroyed', () => {
    const s = makeState();
    expect(salvageItem(s, 'uid')).toBe(true);
    expect(s.salvaged).toContain('uid');
    // idempotent
    expect(salvageItem(s, 'uid')).toBe(false);
  });

  it('a salvaged item cannot be upgraded', () => {
    const s = makeState();
    const def = item('rune_sword');
    const path = UPGRADE_PATH_BY_ID['weapon'];
    salvageItem(s, 'uid');
    const outcome = applyUpgrade(s, def, path, 'uid', { spendGold: () => true, consumeMaterial: () => true });
    expect(outcome).toEqual({ ok: false, reason: 'salvaged' });
  });
});

// ─── upgrade + durability simulation (developer estimates) ───────────

describe('upgrade path totals (developer simulation)', () => {
  it('computes total gold + material to fully upgrade a weapon to +5', () => {
    const path = UPGRADE_PATH_BY_ID['weapon'];
    let gold = 0;
    let material = 0;
    for (let lvl = 0; lvl < path.maxLevel; lvl++) {
      const c = upgradeCost(path, lvl);
      gold += c.gold;
      material += c.materials[path.baseMaterial] ?? 0;
    }
    // materials: 1+2+3+4+5 = 15
    expect(material).toBe(15);
    // gold: 60 + 132 + 290 + 638 + 1405 = 2525 (predictable, > base and strictly increasing)
    expect(gold).toBe(2525);
    expect(gold).toBeGreaterThan(path.baseGold);
    // monotonic cost growth — each step costs more than the previous
    let prev = -1;
    for (let lvl = 0; lvl < path.maxLevel; lvl++) {
      const c = upgradeCost(path, lvl).gold;
      expect(c).toBeGreaterThan(prev);
      prev = c;
    }
  });

  it('enumerates all stat keys amplifying item stats', () => {
    const path = UPGRADE_PATH_BY_ID['weapon'];
    const def = item('rune_sword');
    const delta = projectUpgradeStatBonus(def, path, 5);
    // Sum of upgraded stat power is at least base * power * 5 (present stats only).
    expect(STAT_KEYS.length).toBeGreaterThan(0);
    const base = def.stats ?? {};
    for (const key of STAT_KEYS) {
      const bv = base[key];
      if (bv) expect(delta[key as keyof typeof base]).toBe(Math.round((bv as number) * path.statPowerPerLevel * 5));
    }
  });
});
