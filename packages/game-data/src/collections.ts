import type {
  CollectionCategory,
  CollectionEntryDefinition,
  CollectionSetReward,
} from '@premium-rpg/shared-types';
import { ALL_ENEMIES } from './enemies';
import { ALL_DUNGEONS } from './dungeons';
import { ALL_ITEM_DEFINITIONS } from './items';

const entry = (i: Omit<CollectionEntryDefinition, 'category'> & { category: CollectionCategory }): CollectionEntryDefinition => i;

// ─── AUTO-GENERATED FROM AUTHORED WORLD DATA ─────────────────────────
// Build foe entries from the enemy DB, splitting bosses into their own
// collection while keeping the established `enemy:<id>` id convention so
// existing quest/achievement collection-entry grants keep working.

const FOE_ENTRIES: CollectionEntryDefinition[] = ALL_ENEMIES.map((e) => ({
  id: `enemy:${e.id}`,
  category: e.category === 'boss' ? 'bosses' : 'enemies',
  displayName: e.name,
  ref: { enemyId: e.id, regionId: e.regionId },
  hidden: e.category === 'rare' || e.category === 'boss',
  lore: `A${e.category === 'boss' ? ' legendary' : ''} foe of ${e.regionId}, recorded in the bestiary.`,
}))

const DUNGEON_ENTRIES: CollectionEntryDefinition[] = ALL_DUNGEONS.map((d) =>
  entry({
    id: `dungeon:${d.id}`,
    category: 'dungeons',
    displayName: d.name,
    ref: { dungeonId: d.id },
    lore: `The depths of ${d.name} have been cleared.`,
  })
);

// Items: split into regular items, rare drops, and crafted items.
const ITEM_ENTRIES: CollectionEntryDefinition[] = [];
const RARE_DROP_ENTRIES: CollectionEntryDefinition[] = [];
const CRAFTED_ENTRIES: CollectionEntryDefinition[] = [];

const RARE_IDS = new Set<string>([
  'vampire_fang', 'lich_philactery', 'frost_crown', 'tidal_crown', 'demon_horn',
  'magma_tyrant_core', 'unmaker_heart', 'abyssal_shard', 'serpent_fang',
  'cosmic_crystal', 'ethereal_wood', 'void_pike',
]);

// Tiered weapon/armor are the craftable production line.
const CRAFTED_ITEM_IDS = new Set<string>([
  'bronze_sword', 'iron_sword', 'steel_sword', 'mithril_sword', 'adamant_sword',
  'rune_sword', 'dragon_sword', 'infernal_blade', 'void_blade',
  'bronze_platebody', 'iron_platebody', 'steel_platebody', 'mithril_platebody',
  'adamant_platebody', 'rune_platebody', 'dragon_platebody', 'infernal_platebody',
  'void_platebody',
]);

for (const i of ALL_ITEM_DEFINITIONS) {
  const isRare = Boolean((i as { unique?: unknown }).unique) || (i.type === 'material' && i.rarity !== 'common');
  if (isRare || RARE_IDS.has(i.id)) {
    RARE_DROP_ENTRIES.push(
      entry({
        id: `rare:${i.id}`,
        category: 'rare_drops',
        displayName: i.name,
        ref: { itemId: i.id },
        hidden: true,
        lore: `A rare and storied ${i.name} has been claimed.`,
      })
    );
  } else {
    ITEM_ENTRIES.push(
      entry({
        id: `item:${i.id}`,
        category: 'items',
        displayName: i.name,
        ref: { itemId: i.id },
      })
    );
  }
  if (CRAFTED_ITEM_IDS.has(i.id)) {
    CRAFTED_ENTRIES.push(
      entry({
        id: `crafted:${i.id}`,
        category: 'crafted_items',
        displayName: i.name,
        ref: { itemId: i.id },
        lore: `Masterfully forged ${i.name}.`,
      })
    );
  }
}

// ─── AUTHORED LORE ───────────────────────────────────────────────────

const LORE_ENTRIES: CollectionEntryDefinition[] = [
  entry({ id: 'lore:ashfall', category: 'lore', displayName: 'The Ashfall Prologue', hidden: true, lore: 'Before memory, the sky rained ash and the Old Kingdoms burned. From that long night, the survivors carved a covenant with fire.' }),
  entry({ id: 'lore:frontier', category: 'lore', displayName: 'The Frontier Covenant', lore: 'The Starter Frontier is the last breath of the living world, patrolled by grim outriders who hold the line against the wild.' }),
  entry({ id: 'lore:count_vlad', category: 'lore', displayName: 'The Bloodline of Vlad', hidden: true, lore: 'Count Vlad bound his kin to an unholy bargain; his fang-born heirs still haunt the western woods.' }),
  entry({ id: 'lore:the_lich', category: 'lore', displayName: 'The Ancient Lich', hidden: true, lore: 'The Lich was once a guardian of a forgotten oath. What broke the oath is written only in the catacombs of the ruined province.' }),
  entry({ id: 'lore:frozen_summit', category: 'lore', displayName: 'The Silent Summit', hidden: true, lore: 'High in the Mountain Stronghold, ice slumbers around a crown of frost that has waited a thousand winters for a bearer.' }),
  entry({ id: 'lore:sunken_catacombs', category: 'lore', displayName: 'The Drowned Labyrinth', hidden: true, lore: 'Beneath the marsh, a flooded city remembers the Tyrant of the Deep who made the flood its throne.' }),
  entry({ id: 'lore:citadel_depths', category: 'lore', displayName: 'The Hollow Citadel', hidden: true, lore: 'The Forgotten Citadel is not empty — it is a body with its heart removed. The Hollow King waits where it fell.' }),
  entry({ id: 'lore:molten_core', category: 'lore', displayName: 'The Forge of Wrath', hidden: true, lore: 'In the Volcanic Wasteland, magma forges the weapons of the Unmaker\u2019s host. The Magma Tyrant is its smith.' }),
  entry({ id: 'lore:abyssal_throne', category: 'lore', displayName: 'The Eternal Abyss', hidden: true, lore: 'At the world\u2019s bottom, the Unmaker dreams of ending all that remains. The throne is empty — until someone claims it.' }),
  entry({ id: 'lore:ash_star', category: 'lore', displayName: 'The Ashen Star', hidden: true, lore: 'A portent carved in elder oak: when the Ashen Star climbs, the covenant shall be judged by the ones it abandoned.' }),
  entry({ id: 'lore:gathering_spirits', category: 'lore', displayName: 'The Elder Wood', hidden: true, lore: 'The dryads of Darkwood speak in roots and rain. They remember the great hunger and the price paid to end it.' }),
  entry({ id: 'lore:smelting_traditions', category: 'lore', displayName: 'The Smelter\u2019s Oath', lore: 'Every frontier smith swears an oath to the fire that saved their ancestors — a promise renewed with every bar of bronze.' }),
  entry({ id: 'lore:the_hunt', category: 'lore', displayName: 'The Eternal Hunt', lore: 'The old songs say the first hunt never ended; each generation merely joins it, fang to blade.' }),
];

// ─── AUTHORED TITLES ─────────────────────────────────────────────────

const TITLE_ENTRIES: CollectionEntryDefinition[] = [
  'the Awakened', 'the Polymath', 'Champion', 'Legend',
  'Mass Slayer', 'Exterminator', 'Undead Warden', 'the Gatherer',
  'Master Smith', 'Grandmaster Craftsman', 'Dungeon Delver', 'the Curator',
  'Lichbane', 'Prophecy Ender', 'the Tycoon', 'Untaxable',
  'the Explorer', 'the Devoted', 'the Stalker', 'Quest-Seeker',
  'Unmaker\u2019s Bane', 'the Reckless', 'Bloodline Severed', 'Frostbreaker',
  'Tyrant Down', 'Demon Warden', 'Heart of Flame Quenched', 'The Unmaker Falls',
].map((t) =>
  entry({
    id: `title:${t.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    category: 'titles',
    displayName: t,
    ref: { title: t },
  })
);

// ─── AUTHORED EQUIPMENT SETS ─────────────────────────────────────────

const TIERS = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'dragon', 'infernal', 'void'];

const SET_ENTRIES: CollectionEntryDefinition[] = TIERS.map((tier) => {
  const swordId = tier === 'void' ? 'void_blade' : tier === 'infernal' ? 'infernal_blade' : tier === 'dragon' ? 'dragon_sword' : `${tier}_sword`;
  const bodyId = `${tier}_platebody`;
  return entry({
    id: `set:${tier}`,
    category: 'equipment_sets',
    displayName: `${tier[0].toUpperCase()}${tier.slice(1)} Militia`,
    requiresItems: [swordId, bodyId],
    hidden: true,
    lore: `The complete ${tier} armory: blade and platebound in one faithful set.`,
  });
});

// ─── REGISTRY ────────────────────────────────────────────────────────

export const COLLECTION_ENTRIES: CollectionEntryDefinition[] = [
  ...FOE_ENTRIES,
  ...DUNGEON_ENTRIES,
  ...ITEM_ENTRIES,
  ...RARE_DROP_ENTRIES,
  ...CRAFTED_ENTRIES,
  ...LORE_ENTRIES,
  ...TITLE_ENTRIES,
  ...SET_ENTRIES,
];

export const COLLECTION_ENTRY_BY_ID: Record<string, CollectionEntryDefinition> = Object.fromEntries(
  COLLECTION_ENTRIES.map((e) => [e.id, e])
);

// Per-category threshold rewards. Completion of a category grants titles
// and cosmetics — the "visually satisfying" payoff.
export const COLLECTION_SET_REWARDS: Record<CollectionCategory, CollectionSetReward[]> = {
  enemies: [
    { threshold: 10, title: 'the Menagerist' },
    { threshold: 25, cosmetic: 'badge_hunter' },
    { threshold: 40, title: 'Herald of the Wild' },
  ],
  bosses: [
    { threshold: 4, cosmetic: 'aura_boss_slayer' },
    { threshold: 8, title: 'Slayer of Legends' },
  ],
  dungeons: [
    { threshold: 3, cosmetic: 'banner_delver' },
    { threshold: 7, title: 'the Undeterred' },
  ],
  items: [
    { threshold: 5, title: 'the Hoarder' },
    { threshold: 10, cosmetic: 'ring_collector' },
  ],
  crafted_items: [
    { threshold: 5, cosmetic: 'badge_smith' },
    { threshold: 12, title: 'the Artisan' },
  ],
  rare_drops: [
    { threshold: 3, cosmetic: 'aura_rare' },
    { threshold: 8, title: 'Fortune\u2019s Favorite' },
  ],
  lore: [
    { threshold: 5, cosmetic: 'lore_scroll' },
    { threshold: 10, title: 'the Chronicler' },
  ],
  titles: [
    { threshold: 10, cosmetic: 'crown_noble' },
    { threshold: 20, title: 'the Many-Named' },
  ],
  equipment_sets: [
    { threshold: 3, cosmetic: 'aura_forged' },
    { threshold: 6, title: 'the Collector of Sets' },
  ],
};
