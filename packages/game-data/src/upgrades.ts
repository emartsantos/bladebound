import type { UpgradePathDef } from '@premium-rpg/shared-types';

// ─── UPGRADE PATHS ───────────────────────────────────────────────────
// Predictable, deterministic enhancement model. Each path defines how the
// +1..+N costs and stat power scale. Costs ALWAYS succeed; there is no RNG
// in this system ("costs must scale predictably").

export const UPGRADE_PATHS: UpgradePathDef[] = [
  {
    id: 'weapon',
    maxLevel: 5,
    baseGold: 60,
    goldGrowth: 2.2,
    baseMaterial: 'cosmic_crystal',
    materialPerLevel: 1,
    statPowerPerLevel: 0.06, // +6% of base weapon stat power per +1
  },
  {
    id: 'armor',
    maxLevel: 5,
    baseGold: 45,
    goldGrowth: 2.0,
    baseMaterial: 'iron_ingot',
    materialPerLevel: 1,
    statPowerPerLevel: 0.05, // +5% defense per +1
  },
  {
    id: 'unique',
    maxLevel: 3,
    baseGold: 500,
    goldGrowth: 3.0,
    baseMaterial: 'void_essence',
    materialPerLevel: 2,
    statPowerPerLevel: 0.10, // rare uniques gain +10% per +1 (premium)
  },
];

export const UPGRADE_PATH_BY_ID: Record<string, UpgradePathDef> = Object.fromEntries(
  UPGRADE_PATHS.map((p) => [p.id, p])
);

// Materials consumed by upgrades form an intentional gold/material sink,
// feeding the economy model (see game-data/economy.ts).
export const UPGRADE_MATERIALS = ['cosmic_crystal', 'iron_ingot', 'void_essence'];

// ─── DEFAULT DURABILITY ──────────────────────────────────────────────
// Baseline durability ranges per item type. `max` is the durability pool;
// damage is subtracted on use/combat. Broken items never auto-destroy.
export interface DurabilityBaseConfig {
  maxWeapon: number;
  maxArmor: number;
  maxUnique: number;
}

export const DEFAULT_DURABILITY_BASE: DurabilityBaseConfig = {
  maxWeapon: 100,
  maxArmor: 120,
  maxUnique: 80,
};

export type { UpgradePathDef };
