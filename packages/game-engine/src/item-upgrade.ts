import type {
  DurabilityDamageResult,
  DurabilityState,
  ItemDefinition,
  PlayerItemUpgradeState,
  StatBlock,
  UpgradeCost,
  UpgradePathDef,
  UpgradeResult,
  UpgradeStatKey,
} from '@premium-rpg/shared-types';

export const STAT_KEYS: UpgradeStatKey[] = [
  'strength', 'agility', 'intelligence', 'vitality', 'accuracy', 'evasion',
  'critChance', 'critDamage', 'attackSpeed', 'armor', 'maxHealth', 'damage', 'defense',
];

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createItemUpgradeState(): PlayerItemUpgradeState {
  return {
    upgrades: {},
    durability: {},
    materialsSpent: {},
    totalGoldSpent: 0,
    salvaged: [],
  };
}

// ─── COST MODEL (predictable scaling) ────────────────────────────────
// Gold for the step currentLevel→currentLevel+1 = baseGold * goldGrowth^(level).
// Material = materialPerLevel * (level + 1) demonstrates linear material growth.

export function upgradeCost(path: UpgradePathDef, currentLevel: number): UpgradeCost {
  if (currentLevel >= path.maxLevel) {
    return { gold: 0, materials: {} };
  }
  const gold = Math.floor(path.baseGold * Math.pow(path.goldGrowth, currentLevel));
  return { gold, materials: { [path.baseMaterial]: path.materialPerLevel * (currentLevel + 1) } };
}

// ─── UPGRADE APPLICATION ─────────────────────────────────────────────
// Pure orchestration: verifies cost is payable, then mutates state. The
// callers own the actual deduction (economy wallet + material inventory),
// so the engine never touches balances directly — they return success.

export type UpgradeOutcome =
  | { ok: true; result: UpgradeResult }
  | { ok: false; reason: 'at_capacity' | 'insufficient_gold' | 'insufficient_materials' | 'salvaged' };

export function applyUpgrade(
  state: PlayerItemUpgradeState,
  itemDef: ItemDefinition,
  path: UpgradePathDef,
  uid: string,
  pay: {
    spendGold: (amount: number) => boolean;
    consumeMaterial: (materialId: string, quantity: number) => boolean;
  }
): UpgradeOutcome {
  if (state.salvaged.includes(uid)) return { ok: false, reason: 'salvaged' };

  const current = state.upgrades[uid]?.level ?? 0;
  if (current >= path.maxLevel) return { ok: false, reason: 'at_capacity' };

  const cost = upgradeCost(path, current);
  if (!pay.spendGold(cost.gold)) return { ok: false, reason: 'insufficient_gold' };
  for (const [mat, qty] of Object.entries(cost.materials)) {
    if (qty > 0 && !pay.consumeMaterial(mat, qty)) return { ok: false, reason: 'insufficient_materials' };
  }

  const statDelta = projectUpgradeStatBonus(itemDef, path, current + 1);
  state.upgrades[uid] = {
    level: current + 1,
    upgradedAt: Date.now(),
    totalGoldSpent: (state.upgrades[uid]?.totalGoldSpent ?? 0) + cost.gold,
  };
  state.totalGoldSpent += cost.gold;
  for (const [mat, qty] of Object.entries(cost.materials)) {
    state.materialsSpent[mat] = (state.materialsSpent[mat] ?? 0) + qty;
  }

  return {
    ok: true,
    result: { itemUid: uid, fromLevel: current, toLevel: current + 1, cost, statDelta, atCapacity: current + 1 >= path.maxLevel },
  };
}

export function getUpgradeLevel(state: PlayerItemUpgradeState, uid: string): number {
  return state.upgrades[uid]?.level ?? 0;
}

// ─── STAT PROJECTION ─────────────────────────────────────────────────
// Each upgrade level multiplies the item's present base stats by a small
// fraction (statPowerPerLevel × level). Only stats the item actually has
// are amplified, so weapons and armor both scale sensibly.

export function deriveBaseStats(itemDef: ItemDefinition): Partial<StatBlock> {
  return itemDef.stats ?? {};
}

export function projectUpgradeStatBonus(
  itemDef: ItemDefinition,
  path: UpgradePathDef,
  level: number
): Partial<StatBlock> {
  const base = deriveBaseStats(itemDef);
  const out: Partial<StatBlock> = {};
  for (const key of STAT_KEYS) {
    const bv = base[key];
    if (bv) out[key] = Math.round((bv as number) * path.statPowerPerLevel * level);
  }
  return out;
}

// ─── DURABILITY ──────────────────────────────────────────────────────
// Damage reduces current durability. At 0 the item is BROKEN: it stops
// contributing stats but is NEVER destroyed. The only destruction path is
// the explicit `salvageItem`.

export function ensureDurability(state: PlayerItemUpgradeState, uid: string, max: number): DurabilityState {
  const existing = state.durability[uid];
  if (existing) return existing;
  const created: DurabilityState = { max, current: max };
  state.durability[uid] = created;
  return created;
}

export function getDurability(state: PlayerItemUpgradeState, uid: string): DurabilityState | undefined {
  return state.durability[uid];
}

export function isBroken(state: PlayerItemUpgradeState, uid: string): boolean {
  const d = state.durability[uid];
  return !d || d.current <= 0;
}

export function takeDurability(
  state: PlayerItemUpgradeState,
  uid: string,
  damage: number
): DurabilityDamageResult {
  const d = state.durability[uid] ?? ensureDurability(state, uid, 100);
  const before = d.current;
  const after = Math.max(0, before - Math.max(0, Math.floor(damage)));
  d.current = after;
  return { uid, before, after, broken: after <= 0, destroyed: false };
}

export function repairDurability(state: PlayerItemUpgradeState, uid: string, amount: number): number {
  const d = state.durability[uid];
  if (!d) return 0;
  const repaired = Math.min(amount, d.max - d.current);
  d.current += repaired;
  return repaired;
}

// Explicit, clearly-named destruction. This is the ONLY way an item can be
// removed by the durability/upgrade system — it is never automatic.
export function salvageItem(state: PlayerItemUpgradeState, uid: string): boolean {
  if (state.salvaged.includes(uid)) return false;
  state.salvaged.push(uid);
  return true;
}

// Whether an item's stat contribution is active given its upgrade + state.
export function statContributionActive(state: PlayerItemUpgradeState, uid: string): boolean {
  if (isBroken(state, uid)) return false;
  return true;
}
