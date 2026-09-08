import type {
  StatBlock,
  ItemDefinition,
  EquipmentTier,
  Rarity,
  ItemPassive,
  AcquisitionSource,
} from '@premium-rpg/shared-types';

// ─── ITEMIZATION ENGINE ──────────────────────────────────────────────
// The philosophy: rarity/tier are NOT flat stat multipliers. They control:
//   - a stat BUDGET (total power points) that scales with tier
//   - HOW many stat LINES are produced (rarity = more combinations)
//   - whether load-bearing PASSIVES are attached (the real payoff)
// This produces "better stat combinations", "specialized builds", and
// "unique passives" — not just bigger numbers.

export interface ItemStatLine {
  stat: keyof StatBlock;
  value: number;
}

export interface GeneratedItemMods {
  statLines: ItemStatLine[];
  passives: ItemPassive[];
  statBudget: number;
  rarity: Rarity;
  tier: EquipmentTier | undefined;
}

// ─── STAT BUDGET BY TIER ─────────────────────────────────────────────
// Total power budget grows by tier. Budget is spent across stat lines
// and (at higher tiers) exclusive passives. NOT a damage multiplier.

export const TIER_STAT_BUDGET: Record<EquipmentTier, number> = {
  bronze: 10,
  iron: 20,
  steel: 30,
  mithril: 45,
  adamant: 60,
  rune: 80,
  dragon: 105,
  infernal: 135,
  void: 170,
};

// ─── SLOT ARCHETYPES ─────────────────────────────────────────────────
// Each equipment slot has a theme that shapes WHICH stats roll together.
// This creates meaningful combinations and build variety.

export type SlotArchetype =
  | 'weapon'      // primary stat + crit + attack speed
  | 'offhand'     // crit + defense + block flavor
  | 'helmet'      // balanced + max health + accuracy
  | 'chest'       // armor + defense + vitality
  | 'gloves'      // accuracy + agility + crit
  | 'legs'        // vitality + armor + defense
  | 'boots'       // evasion + agility + speed
  | 'amulet'      // crit damage + intelligence + max health
  | 'ring'        // focused single primary (strength/agility/etc.)
  | 'cape';       // utility spread

export const SLOT_ARCHETYPE: Record<NonNullable<ItemDefinition['equipmentSlot']>, SlotArchetype> = {
  weapon: 'weapon',
  offhand: 'offhand',
  helmet: 'helmet',
  chest: 'chest',
  gloves: 'gloves',
  legs: 'legs',
  boots: 'boots',
  amulet: 'amulet',
  ring: 'ring',
  cape: 'cape',
};

// Candidate stat pools per archetype, with per-line relative weights.
const ARCHETYPE_STATS: Record<SlotArchetype, { stat: keyof StatBlock; weight: number }[]> = {
  weapon: [
    { stat: 'strength', weight: 3 }, { stat: 'agility', weight: 2 },
    { stat: 'intelligence', weight: 2 }, { stat: 'critChance', weight: 1.5 },
    { stat: 'critDamage', weight: 1.5 }, { stat: 'attackSpeed', weight: 1 },
  ],
  offhand: [
    { stat: 'critChance', weight: 2 }, { stat: 'critDamage', weight: 2 },
    { stat: 'defense', weight: 2 }, { stat: 'armor', weight: 1.5 },
    { stat: 'vitality', weight: 1.5 }, { stat: 'evasion', weight: 1 },
  ],
  helmet: [
    { stat: 'maxHealth', weight: 3 }, { stat: 'accuracy', weight: 2 },
    { stat: 'armor', weight: 2 }, { stat: 'intelligence', weight: 1.5 },
    { stat: 'vitality', weight: 1.5 },
  ],
  chest: [
    { stat: 'armor', weight: 3 }, { stat: 'defense', weight: 3 },
    { stat: 'vitality', weight: 2.5 }, { stat: 'maxHealth', weight: 2 },
    { stat: 'strength', weight: 1 },
  ],
  gloves: [
    { stat: 'accuracy', weight: 3 }, { stat: 'agility', weight: 2.5 },
    { stat: 'critChance', weight: 2 }, { stat: 'attackSpeed', weight: 1.5 },
    { stat: 'strength', weight: 1 },
  ],
  legs: [
    { stat: 'vitality', weight: 3 }, { stat: 'armor', weight: 2.5 },
    { stat: 'defense', weight: 2.5 }, { stat: 'maxHealth', weight: 2 },
    { stat: 'strength', weight: 1 },
  ],
  boots: [
    { stat: 'evasion', weight: 3 }, { stat: 'agility', weight: 2.5 },
    { stat: 'attackSpeed', weight: 1.5 }, { stat: 'maxHealth', weight: 1.5 },
    { stat: 'vitality', weight: 1 },
  ],
  amulet: [
    { stat: 'critDamage', weight: 3 }, { stat: 'intelligence', weight: 2.5 },
    { stat: 'maxHealth', weight: 2 }, { stat: 'strength', weight: 1.5 },
    { stat: 'armor', weight: 1 },
  ],
  ring: [
    { stat: 'strength', weight: 2 }, { stat: 'agility', weight: 2 },
    { stat: 'intelligence', weight: 2 }, { stat: 'vitality', weight: 2 },
    { stat: 'armor', weight: 1.5 }, { stat: 'critChance', weight: 1.5 },
  ],
  cape: [
    { stat: 'accuracy', weight: 2 }, { stat: 'evasion', weight: 2 },
    { stat: 'critDamage', weight: 2 }, { stat: 'maxHealth', weight: 2 },
    { stat: 'attackSpeed', weight: 1 },
  ],
};

// ─── RARITY → STAT LINE COUNT ────────────────────────────────────────
// Higher rarity produces MORE stat lines (better combos), not bigger
// multipliers per line.

export const RARITY_STAT_LINES: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

// Rarity gates passives: rare+ items can carry 1, epic 1-2, legendary 2-3.
export const RARITY_PASSIVE_SLOTS: Record<Rarity, { min: number; max: number }> = {
  common: { min: 0, max: 0 },
  uncommon: { min: 0, max: 0 },
  rare: { min: 1, max: 1 },
  epic: { min: 1, max: 2 },
  legendary: { min: 2, max: 3 },
};

// ─── GENERATED PASSIVE TEMPLATES ─────────────────────────────────────

export const PASSIVE_TEMPLATES: Record<ItemPassive['category'], ItemPassive[]> = {
  damage: [
    { id: 'dm_power', name: 'Empowered', description: '+X% damage', category: 'damage', value: 0.1, condition: 'always' },
    { id: 'dm_burst', name: 'Burst', description: '+X% damage while buffed', category: 'damage', value: 0.15, condition: 'while_buffed' },
  ],
  defense: [
    { id: 'df_barrier', name: 'Barrier', description: 'Reduce damage taken by X% when low HP', category: 'defense', value: 0.08, condition: 'low_hp' },
    { id: 'df_guarded', name: 'Guarded', description: 'Reduce damage taken by X%', category: 'defense', value: 0.06, condition: 'always' },
  ],
  healing: [
    { id: 'hl_regen', name: 'Regeneration', description: 'Regenerate X% max HP over time', category: 'healing', value: 0.01, condition: 'always' },
  ],
  crit: [
    { id: 'cr_sharp', name: 'Sharpened', description: '+X% critical chance', category: 'crit', value: 0.03, condition: 'always' },
    { id: 'cr_brutal', name: 'Brutal', description: '+X% critical damage', category: 'crit', value: 0.1, condition: 'always' },
  ],
  speed: [
    { id: 'sp_quick', name: 'Quickened', description: '+X% attack speed', category: 'speed', value: 0.1, condition: 'always' },
  ],
  lifesteal: [
    { id: 'ls_drain', name: 'Life Drain', description: 'Heal for X% of damage dealt on kill', category: 'lifesteal', value: 0.2, condition: 'after_kill' },
  ],
  resource: [
    { id: 'rs_efficiency', name: 'Efficient', description: '+X% resource retention', category: 'resource', value: 0.1, condition: 'always' },
  ],
  utility: [
    { id: 'ut_penetration', name: 'Penetrating', description: 'Ignore X% of enemy armor', category: 'utility', value: 0.15, condition: 'always' },
    { id: 'ut_greed', name: 'Greedy', description: 'Gain X% more gold from kills', category: 'utility', value: 0.2, condition: 'always' },
  ],
};

// ─── STAT WEIGHT / BUDGET SPENDING ───────────────────────────────────
// Distribute the tier budget across a rarity-determined number of lines,
// picked from the slot archetype's weighted stat pool.

function weightedPick<T>(arr: T[], weightFn: (t: T) => number): T {
  const total = arr.reduce((sum, item) => sum + weightFn(item), 0);
  let roll = Math.random() * total;
  for (const item of arr) {
    roll -= weightFn(item);
    if (roll <= 0) return item;
  }
  return arr[arr.length - 1];
}

function sumWeights(pool: { stat: keyof StatBlock; weight: number }[]): number {
  return pool.reduce((sum, p) => sum + p.weight, 0);
}

function redistributeWeights(
  pool: { stat: keyof StatBlock; weight: number }[],
  excluded: keyof StatBlock
): { stat: keyof StatBlock; weight: number }[] {
  return pool
    .filter((p) => p.stat !== excluded)
    .map((p) => ({ stat: p.stat, weight: p.weight }));
}

// Convert raw stat values into budget units. Percentage-like stats
// (crit chance, armor reduction) consume more budget per point.
function budgetPerPoint(stat: keyof StatBlock): number {
  switch (stat) {
    case 'critChance': return 2;
    case 'critDamage': return 1;
    case 'attackSpeed': return 2;
    case 'maxHealth': return 0.25; // HP is cheap: lots of raw HP
    case 'armor': return 1;
    case 'defense': return 1;
    default: return 1; // strength, agility, intelligence, vitality, accuracy, evasion
  }
}

// ─── CORE GENERATION ─────────────────────────────────────────────────

export interface ItemGenerationRequest {
  rarity: Rarity;
  tier?: EquipmentTier;
  slot: NonNullable<ItemDefinition['equipmentSlot']>;
  // Seeded/overridden stat lines (e.g. for crafted base items)
  fixedStats?: Partial<Record<keyof StatBlock, number>>;
}

export function generateItemMods(request: ItemGenerationRequest): GeneratedItemMods {
  const { rarity, slot, tier } = request;
  const archetype = SLOT_ARCHETYPE[slot];

  const budget = tier ? TIER_STAT_BUDGET[tier] : 30;
  const numLines = RARITY_STAT_LINES[rarity];

  // Begin with fixed (explicit) stats consuming part of the budget
  const statLines: ItemStatLine[] = [];
  let remainingBudget = budget;
  if (request.fixedStats) {
    for (const [stat, value] of Object.entries(request.fixedStats)) {
      if (value) {
        statLines.push({ stat: stat as keyof StatBlock, value });
        remainingBudget -= value * budgetPerPoint(stat as keyof StatBlock);
      }
    }
  }

  // Roll remaining archetype lines until we have enough or run out of budget
  let pool = [...ARCHETYPE_STATS[archetype]];
  let linesToRoll = Math.max(0, numLines - statLines.length);

  while (linesToRoll > 0 && remainingBudget > 0 && pool.length > 0) {
    const chosen = weightedPick(pool, (p) => p.weight);
    const perPoint = budgetPerPoint(chosen.stat as keyof StatBlock);
    // Allocate a portion of remaining budget to this line
    const allocation = Math.max(
      1,
      Math.floor((remainingBudget / linesToRoll) * 0.9 / perPoint)
    );
    if (allocation <= 0) break;

    // Merge into existing line if duplicate stat
    const existing = statLines.find((l) => l.stat === chosen.stat);
    if (existing) {
      existing.value += allocation;
    } else {
      statLines.push({ stat: chosen.stat as keyof StatBlock, value: allocation });
    }
    remainingBudget -= allocation * perPoint;
    linesToRoll -= 1;
    pool = redistributeWeights(pool, chosen.stat as keyof StatBlock);
  }

  // Passives from rarity
  const passiveRange = RARITY_PASSIVE_SLOTS[rarity];
  const numPassives =
    passiveRange.min +
    (passiveRange.max > passiveRange.min
      ? Math.floor(Math.random() * (passiveRange.max - passiveRange.min + 1))
      : 0);
  const passives: ItemPassive[] = [];
  const usedCategories = new Set<ItemPassive['category']>();
  const categories = Object.keys(PASSIVE_TEMPLATES) as ItemPassive['category'][];
  let passivesLeft = numPassives;
  while (passivesLeft > 0 && categories.length > 0) {
    const cat = weightedPick(categories, () => 1);
    if (usedCategories.has(cat)) {
      const idx = categories.indexOf(cat);
      categories.splice(idx, 1);
      continue;
    }
    const template = PASSIVE_TEMPLATES[cat][0];
    passives.push({ ...template, id: `${template.id}_${passives.length + 1}` });
    usedCategories.add(cat);
    passivesLeft -= 1;
  }

  return { statLines, passives, statBudget: budget, rarity, tier };
}

// ─── ITEM DEFINITION STAT RESOLUTION ─────────────────────────────────
// Produce concrete stat lines for an item definition. If the item has
// explicit stats, they are used as-is (and merged with any unique
// passives). Otherwise generate from rarity/tier/slot.

export function resolveItemStats(
  definition: ItemDefinition
): GeneratedItemMods {
  // Unique items with explicit stats + passives are fully authored
  if (definition.stats && (definition.passives || definition.unique)) {
    const statLines: ItemStatLine[] = Object.entries(definition.stats)
      .filter(([, v]) => v !== undefined && v !== 0)
      .map(([stat, value]) => ({ stat: stat as keyof StatBlock, value: value as number }));
    const passives = definition.unique?.passives ?? definition.passives ?? [];
    return {
      statLines,
      passives,
      statBudget: TIER_STAT_BUDGET[definition.tier ?? 'bronze'],
      rarity: definition.rarity,
      tier: definition.tier,
    };
  }

  // Generated drops use the template-based generation
  const slot = definition.equipmentSlot ?? 'weapon';
  return generateItemMods({
    rarity: definition.rarity,
    tier: definition.tier,
    slot,
    fixedStats: definition.stats,
  });
}

// ─── ACQUISITION HELPERS ─────────────────────────────────────────────

export function getAcquisitionSources(
  definition: ItemDefinition
): AcquisitionSource[] {
  return definition.acquisition ?? [];
}

export function isAcquiredFrom(
  definition: ItemDefinition,
  source: AcquisitionSource
): boolean {
  return (definition.acquisition ?? []).includes(source);
}

// ─── VALUE (SELL PRICE) ──────────────────────────────────────────────
// Selling price is computed from tier budget + rarity, not arbitrary.
export function computeItemValue(
  definition: ItemDefinition
): number {
  const baseTierValue = TIER_STAT_BUDGET[definition.tier ?? 'bronze'];
  const rarityMult: Record<Rarity, number> = {
    common: 1, uncommon: 1.5, rare: 2.5, epic: 4, legendary: 6,
  };
  const passiveBonus = definition.passives?.length ?? 0;
  const uniqueMult = definition.unique ? 2 : 1;
  return Math.floor(baseTierValue * rarityMult[definition.rarity] * uniqueMult * (1 + passiveBonus * 0.5));
}

// ─── ITEM LEVEL (for comparisons) ────────────────────────────────────

export function getItemLevel(definition: ItemDefinition): number {
  return definition.levelRequired ?? TIER_STAT_BUDGET[definition.tier ?? 'bronze'];
}
