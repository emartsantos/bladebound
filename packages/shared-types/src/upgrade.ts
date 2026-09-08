import type { StatBlock } from './combat';

// ─── ITEM UPGRADES AND DURABILITY ────────────────────────────────────
// Deterministic, predictable item enhancement (+1/+2/+3…) and a clear,
// forgiving durability model. Rules:
//   • Upgrades ALWAYS succeed and ALWAYS cost gold + material. Costs scale
//     predictably per level (see UpgradePathDef) — no gambling, no RNG.
//   • A broken item (current durability 0) NEVER silently destroys itself.
//     It simply offers no bonuses until repaired. Destruction is ONLY via
//     the explicit, clearly-named `salvageItem` action.

// Stat keys an upgrade may amplify. All other stats are left untouched.
export type UpgradeStatKey =
  | 'strength'
  | 'agility'
  | 'intelligence'
  | 'vitality'
  | 'accuracy'
  | 'evasion'
  | 'critChance'
  | 'critDamage'
  | 'attackSpeed'
  | 'armor'
  | 'maxHealth'
  | 'damage'
  | 'defense';

// Cost of a single upgrade step (from currentLevel → currentLevel+1).
export interface UpgradeCost {
  gold: number;
  materials: Record<string, number>; // material item id -> quantity
}

// Predictable cost/power model shared by every enhancable item path.
export interface UpgradePathDef {
  id: string;              // path id (e.g. 'weapon' | 'armor' | 'unique')
  maxLevel: number;        // e.g. 5
  baseGold: number;        // gold cost of the FIRST upgrade (+1)
  goldGrowth: number;      // multiplier applied to gold each further level
  baseMaterial: string;    // material item id consumed
  materialPerLevel: number; // material units per level
  // Fraction of the item's base stat power added per upgrade level.
  // e.g. 0.05 = each +1 adds +5% of the item's base relevant stat.
  statPowerPerLevel: number;
}

// Per-item-instance upgrade record (keyed by InventoryItem.uid).
export interface ItemUpgradeState {
  level: number;           // 0..maxLevel (0 = vanilla)
  upgradedAt: number;
  totalGoldSpent: number;
}

// Per-item-instance durability record (KEYED by InventoryItem.uid).
export interface DurabilityState {
  max: number;
  current: number;
}

export interface BrokenPolicy {
  // A broken item applies no bonuses but is never destroyed.
  contributesStats: false;
  autoDestroys: false;
  repairRequired: true;
}

// Persisted, framework-independent upgrade + durability wallet.
export interface PlayerItemUpgradeState {
  upgrades: Record<string, ItemUpgradeState>;   // item uid -> upgrade
  durability: Record<string, DurabilityState>;   // item uid -> durability
  materialsSpent: Record<string, number>;         // material id -> lifetime spent
  totalGoldSpent: number;
  salvaged: string[];                             // uids intentionally destroyed
}

// Result of applying an upgrade to one item instance.
export interface UpgradeResult {
  itemUid: string;
  fromLevel: number;
  toLevel: number;
  cost: UpgradeCost;
  statDelta: Partial<StatBlock>;
  atCapacity: boolean; // true when already at maxLevel
}

// Result of durability damage — clearly surfaces the broken state.
export interface DurabilityDamageResult {
  uid: string;
  before: number;
  after: number;
  broken: boolean;       // current reached 0 (bonuses disabled, NOT destroyed)
  destroyed: false;      // never auto-destroyed
}
