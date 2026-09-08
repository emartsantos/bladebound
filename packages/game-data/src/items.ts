import type { ItemDefinition, StatBlock, ItemPassive, EquipmentTier, Rarity } from '@premium-rpg/shared-types';

// ─── ITEM DATABASE ────────────────────────────────────────────────────
// Centralized registry of item definitions. Rarity/tier encode stat
// COMBINATIONS and passives, not flat multipliers.

// Helper to build a stat-partial record
type StatKey = keyof StatBlock;

function equip(
  id: string,
  name: string,
  type: 'weapon' | 'armor',
  rarity: Rarity,
  tier: EquipmentTier,
  slot: ItemDefinition['equipmentSlot'],
  levelRequired: number,
  stats: Partial<Record<StatKey, number>>,
  acquisition: NonNullable<ItemDefinition['acquisition']>[number],
  passives: ItemPassive[] = [],
  description = ''
): ItemDefinition {
  return {
    id, name, type, rarity, tier, equipmentSlot: slot,
    stackable: false, maxStack: 1, weight: 2, levelRequired,
    description: description || name,
    metadata: { tier, levelRequired, slot, source: acquisition },
    stats, passives, acquisition: [acquisition],
  };
}

// ─── WEAPON TIERS (craftable progression: bronze → void) ─────────────

const WEAPON_TIERS: Array<{
  tier: EquipmentTier; rarity: Rarity; level: number;
  name: string; prefix: string; dmg: number; bonus: Partial<Record<StatKey, number>>;
}> = [
  { tier: 'bronze', rarity: 'common', level: 1, name: 'Bronze Sword', prefix: 'bronze_sword', dmg: 4, bonus: { strength: 2 } },
  { tier: 'iron', rarity: 'common', level: 10, name: 'Iron Sword', prefix: 'iron_sword', dmg: 7, bonus: { strength: 4, vitality: 2 } },
  { tier: 'steel', rarity: 'uncommon', level: 20, name: 'Steel Sword', prefix: 'steel_sword', dmg: 11, bonus: { strength: 7, vitality: 3, critChance: 1 } },
  { tier: 'mithril', rarity: 'uncommon', level: 30, name: 'Mithril Sword', prefix: 'mithril_sword', dmg: 16, bonus: { strength: 10, agility: 4, critChance: 1.5, attackSpeed: 0.1 } },
  { tier: 'adamant', rarity: 'rare', level: 40, name: 'Adamant Sword', prefix: 'adamant_sword', dmg: 22, bonus: { strength: 14, agility: 6, critChance: 2, critDamage: 8 } },
  { tier: 'rune', rarity: 'rare', level: 50, name: 'Rune Sword', prefix: 'rune_sword', dmg: 30, bonus: { strength: 19, agility: 8, critChance: 2.5, critDamage: 12, attackSpeed: 0.15 } },
  { tier: 'dragon', rarity: 'epic', level: 60, name: 'Dragon Sword', prefix: 'dragon_sword', dmg: 40, bonus: { strength: 26, agility: 12, critChance: 3, critDamage: 18, attackSpeed: 0.2 } },
  { tier: 'infernal', rarity: 'epic', level: 80, name: 'Infernal Blade', prefix: 'infernal_blade', dmg: 54, bonus: { strength: 35, intelligence: 14, critChance: 4, critDamage: 25, attackSpeed: 0.25 } },
  { tier: 'void', rarity: 'legendary', level: 90, name: 'Void Blade', prefix: 'void_blade', dmg: 70, bonus: { strength: 46, intelligence: 20, critChance: 5, critDamage: 35, attackSpeed: 0.3 } },
];

export const WEAPON_DEFINITIONS: ItemDefinition[] = WEAPON_TIERS.map((t) =>
  equip(
    t.prefix, t.name, 'weapon', t.rarity, t.tier, 'weapon', t.level,
    { damage: t.dmg, ...t.bonus },
    'crafting',
    [],
    `${t.tier}-tier sword. Base weapon tier ${t.tier}.`
  )
);

// ─── ARMOR TIERS (chest) ─────────────────────────────────────────────

const ARMOR_TIERS: Array<{
  tier: EquipmentTier; rarity: Rarity; level: number;
  name: string; prefix: string; def: number; bonus: Partial<Record<StatKey, number>>;
}> = [
  { tier: 'bronze', rarity: 'common', level: 1, name: 'Bronze Platebody', prefix: 'bronze_platebody', def: 3, bonus: { armor: 2, vitality: 1 } },
  { tier: 'iron', rarity: 'common', level: 10, name: 'Iron Platebody', prefix: 'iron_platebody', def: 5, bonus: { armor: 4, vitality: 2, strength: 1 } },
  { tier: 'steel', rarity: 'uncommon', level: 20, name: 'Steel Platebody', prefix: 'steel_platebody', def: 8, bonus: { armor: 6, vitality: 3, strength: 2, defense: 2 } },
  { tier: 'mithril', rarity: 'uncommon', level: 30, name: 'Mithril Platebody', prefix: 'mithril_platebody', def: 12, bonus: { armor: 9, vitality: 4, strength: 3, defense: 3, maxHealth: 20 } },
  { tier: 'adamant', rarity: 'rare', level: 40, name: 'Adamant Platebody', prefix: 'adamant_platebody', def: 17, bonus: { armor: 12, vitality: 6, strength: 4, defense: 5, maxHealth: 35 } },
  { tier: 'rune', rarity: 'rare', level: 50, name: 'Rune Platebody', prefix: 'rune_platebody', def: 23, bonus: { armor: 16, vitality: 8, strength: 5, defense: 7, maxHealth: 55 } },
  { tier: 'dragon', rarity: 'epic', level: 60, name: 'Dragon Platebody', prefix: 'dragon_platebody', def: 30, bonus: { armor: 21, vitality: 11, strength: 7, defense: 9, maxHealth: 80 } },
  { tier: 'infernal', rarity: 'epic', level: 80, name: 'Infernal Platebody', prefix: 'infernal_platebody', def: 40, bonus: { armor: 28, vitality: 15, strength: 9, defense: 12, maxHealth: 120 } },
  { tier: 'void', rarity: 'legendary', level: 90, name: 'Void Platebody', prefix: 'void_platebody', def: 52, bonus: { armor: 36, vitality: 20, strength: 12, defense: 16, maxHealth: 180 } },
];

export const ARMOR_DEFINITIONS: ItemDefinition[] = ARMOR_TIERS.map((t) =>
  equip(
    t.prefix, t.name, 'armor', t.rarity, t.tier, 'chest', t.level,
    { defense: t.def, ...t.bonus },
    'crafting',
    [],
    `${t.tier}-tier chest armor. Base armor tier ${t.tier}.`
  )
);

// ─── UNIQUE / BOSS DROP ITEMS ────────────────────────────────────────
// Bespoke items with named passives — the "more than color" payoff.

export const VAMPIRE_FANG: ItemDefinition = equip(
  'vampire_fang',
  'Vampire Fang',
  'weapon',
  'rare',
  'iron',
  'weapon',
  12,
  { damage: 9, strength: 5, agility: 3, critChance: 1 },
  'boss',
  [{ id: 'lf_fang', name: 'Bloodthirst', description: 'Heal for 20% of damage dealt on kill.', category: 'lifesteal', value: 0.2, condition: 'after_kill' }],
  'Fang of Count Vlad. Drains life from those you slay.'
);

export const LICH_PHILACTERY: ItemDefinition = equip(
  'lich_philactery',
  'Lich Philactery',
  'armor',
  'epic',
  'rune',
  'amulet',
  45,
  { intelligence: 14, vitality: 6, critDamage: 18, maxHealth: 40 },
  'boss',
  [{ id: 'pk_phil', name: 'Undeath Pact', description: '+25% magic damage while at full health.', category: 'damage', value: 0.25, condition: 'full_hp' }],
  'A pulsing relic of the Ancient Lich, brimming with necromantic power.'
);

export const FROST_CROWN: ItemDefinition = equip(
  'frost_crown',
  'Frost Crown',
  'armor',
  'epic',
  'rune',
  'helmet',
  50,
  { armor: 14, vitality: 8, defense: 6, maxHealth: 60, evasion: 3 },
  'boss',
  [{ id: 'fc_crown', name: 'Unbreaking Frost', description: 'Reduce all damage taken by 8% while HP is below 30%.', category: 'defense', value: 0.08, condition: 'low_hp' }],
  'Crown of the Frost Giant King, eternally cold to the touch.'
);

export const TYRANT_TIDAL_CROWN: ItemDefinition = equip(
  'tidal_crown',
  'Tidal Crown',
  'armor',
  'epic',
  'adamant',
  'helmet',
  55,
  { armor: 10, intelligence: 8, vitality: 10, maxHealth: 70 },
  'boss',
  [{ id: 'tc_tide', name: 'Tidewalker', description: 'Regenerate 1% of max HP every 5 seconds.', category: 'healing', value: 1, condition: 'always' }],
  'Crown of the Tyrant of the Deep, taken from the sunken throne.'
);

export const DEMON_HORN: ItemDefinition = equip(
  'demon_horn',
  'Demon Horn',
  'armor',
  'epic',
  'dragon',
  'helmet',
  70,
  { strength: 12, intelligence: 12, critChance: 2, critDamage: 20 },
  'boss',
  [{ id: 'dh_horn', name: 'Infernal Rage', description: '+30% attack speed for 5s after defeating an enemy.', category: 'speed', value: 0.3, condition: 'after_kill' }],
  'Horn of the Arch Demon, still warm with hellfire.'
);

export const MAGMA_TYRANT_CORE: ItemDefinition = equip(
  'magma_tyrant_core',
  'Magma Tyrant Core',
  'armor',
  'legendary',
  'infernal',
  'amulet',
  90,
  { strength: 18, intelligence: 18, critDamage: 30, maxHealth: 100 },
  'boss',
  [
    { id: 'mc_core', name: 'Eruption', description: 'Deal 15% extra damage and take 10% more for 6s after casting.', category: 'damage', value: 0.15, condition: 'while_buffed' },
    { id: 'mc_heat', name: 'Molten Heart', description: 'Overheal converts to a shield for 10% of max HP.', category: 'utility', value: 0.1, condition: 'always' },
  ],
  'The pulsing heart of the volcano itself, impossibly hot.'
);

export const UNMAKER_HEART: ItemDefinition = equip(
  'unmaker_heart',
  'Unmaker Heart',
  'armor',
  'legendary',
  'void',
  'amulet',
  99,
  { strength: 25, intelligence: 25, agility: 25, critDamage: 40, maxHealth: 150 },
  'boss',
  [
    { id: 'uh_unmake', name: 'Annihilate', description: 'Kills refresh a powerful damage buff, stacking up to 3 times.', category: 'crit', value: 0.1, condition: 'after_kill' },
    { id: 'uh_void', name: 'Void Eminence', description: 'Ignore 20% of enemy armor.', category: 'utility', value: 0.2, condition: 'always' },
  ],
  'The incomprehensible heart of the Unmaker. Reality bends around it.'
);

// ─── COMPREHENSIVE UNIQUES (affix style) ─────────────────────────────

export const ABYSSAL_SHARD: ItemDefinition = equip(
  'abyssal_shard',
  'Abyssal Shard',
  'weapon',
  'epic',
  'void',
  'weapon',
  75,
  { damage: 34, strength: 26, agility: 16, critChance: 3, critDamage: 20, attackSpeed: 0.2 },
  'boss',
  [{ id: 'as_shard', name: 'Void Rend', description: 'Attacks have a 10% chance to deal double damage.', category: 'crit', value: 0.1, condition: 'always' }],
  'A splinter of a blade forged in the void between worlds.'
);

export const SERPENT_FANG: ItemDefinition = equip(
  'serpent_fang',
  'Serpent Fang',
  'weapon',
  'rare',
  'adamant',
  'weapon',
  45,
  { damage: 16, agility: 12, strength: 6, critChance: 2, attackSpeed: 0.15 },
  'boss',
  [{ id: 'sf_venom', name: 'Venom', description: 'Poison enemies on hit, dealing damage over time.', category: 'damage', value: 0.08, condition: 'always' }],
  'A fang of the Marsh Serpent, dripping with pale venom.'
);

// ─── RARE GATHERING DROPS ────────────────────────────────────────────
// Rare proc drops from skilling (gathering), not equipment.

export const COSMIC_CRYSTAL: ItemDefinition = {
  id: 'cosmic_crystal', name: 'Cosmic Crystal', type: 'material',
  rarity: 'legendary', stackable: true, maxStack: 10, weight: 0.5,
  description: 'A crystalline shard that hums with unfathomable power.',
  metadata: { source: 'gathering' },
  acquisition: ['gathering'],
};

export const ETHEREAL_WOOD: ItemDefinition = {
  id: 'ethereal_wood', name: 'Ethereal Wood', type: 'material',
  rarity: 'legendary', stackable: true, maxStack: 10, weight: 0.5,
  description: 'Wood that flickers between this world and the next.',
  metadata: { source: 'gathering' },
  acquisition: ['gathering'],
};

export const VOID_PIKE: ItemDefinition = {
  id: 'void_pike', name: 'Void Pike', type: 'material',
  rarity: 'epic', stackable: true, maxStack: 10, weight: 0.6,
  description: 'A rare fish that trails darkness wherever it swims.',
  metadata: { source: 'gathering' },
  acquisition: ['gathering'],
};

// ─── FULL REGISTRY ───────────────────────────────────────────────────

export const ALL_ITEM_DEFINITIONS: ItemDefinition[] = [
  ...WEAPON_DEFINITIONS,
  ...ARMOR_DEFINITIONS,
  VAMPIRE_FANG,
  LICH_PHILACTERY,
  FROST_CROWN,
  TYRANT_TIDAL_CROWN,
  DEMON_HORN,
  MAGMA_TYRANT_CORE,
  UNMAKER_HEART,
  ABYSSAL_SHARD,
  SERPENT_FANG,
  COSMIC_CRYSTAL,
  ETHEREAL_WOOD,
  VOID_PIKE,
];

export const ITEM_BY_ID: Record<string, ItemDefinition> = Object.fromEntries(
  ALL_ITEM_DEFINITIONS.map((item) => [item.id, item])
);

// Boss drop uniques (referenced by bosses/dungeons)
export const BOSS_DROP_ITEMS: ItemDefinition[] = [
  VAMPIRE_FANG,
  LICH_PHILACTERY,
  FROST_CROWN,
  TYRANT_TIDAL_CROWN,
  DEMON_HORN,
  MAGMA_TYRANT_CORE,
  UNMAKER_HEART,
];
