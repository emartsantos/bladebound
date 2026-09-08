import type {
  ContractDefinition,
  NPCDefinition,
} from '@premium-rpg/shared-types';

// ─── CONTRACT DATABASE ───────────────────────────────────────────────
// Repeatable tasks offered by contract brokers (distinct from side quests).

export const CONTRACTS: ContractDefinition[] = [
  // ── DAILY (frontier) ──
  {
    id: 'c_daily_frontier_patrol',
    name: 'Frontier Patrol',
    description:
      'The wolves grow bold at the village edge. Keep the boundary clear.',
    tier: 'daily',
    requires: { level: 1 },
    objectives: [
      { type: 'kill', target: 'wolf', count: 5, regionId: 'starter-frontier' },
    ],
    rewards: { gold: 100, xp: 150, reputation: { npcId: 'elder_athan', amount: 5 } },
    cooldownHours: 24,
  },
  {
    id: 'c_daily_wood_quota',
    name: 'Wood Quota',
    description:
      'The mills never sleep. Feed the frontier\u2019s hunger for timber.',
    tier: 'daily',
    requires: { level: 3 },
    objectives: [
      { type: 'gather', target: 'log', count: 15, regionId: 'starter-frontier' },
    ],
    rewards: { gold: 80, xp: 120 },
    cooldownHours: 24,
  },

  // ── DAILY (darkwood) ──
  {
    id: 'c_daily_darkwood_cull',
    name: 'Darkwood Cull',
    description:
      'Something stirs the beasts of the forest. Thin their numbers before they thin ours.',
    tier: 'daily',
    requires: { level: 7, questComplete: ['q_darkwood_scout'] },
    objectives: [
      { type: 'kill', target: 'darkwood_spider', count: 8, regionId: 'darkwood-forest' },
      { type: 'kill', target: 'zombie', count: 6, regionId: 'darkwood-forest' },
    ],
    rewards: { gold: 180, xp: 220 },
    cooldownHours: 24,
  },

  // ── WEEKLY (progression) ──
  {
    id: 'c_weekly_dungeon_delver',
    name: 'Delve the Depths',
    description:
      'Sealed halls hoard secrets. Unearth one before the week is out.',
    tier: 'weekly',
    requires: { level: 12, questComplete: ['q_darkwood_scout'] },
    objectives: [
      { type: 'dungeon', target: 'darkwood-caverns', count: 1 },
    ],
    rewards: { gold: 600, xp: 900, dungeonSeals: 3 },
    cooldownHours: 168,
  },
  {
    id: 'c_weekly_boss_marks',
    name: 'Marks of the Strong',
    description:
      'Rare beasts leave rare trophies. Bring me proof of a worthy kill.',
    tier: 'weekly',
    requires: { level: 20 },
    objectives: [
      { type: 'kill', target: 'frost_giant', count: 10, regionId: 'mountain-stronghold' },
    ],
    rewards: { gold: 1200, xp: 1500, reputation: { npcId: 'warden_garrick', amount: 10 } },
    cooldownHours: 168,
  },

  // ── ELITE (endgame) ──
  {
    id: 'c_elite_unmaker_hunt',
    name: 'Hunt the Unmaker',
    description:
      'The final silence does not forgive. Neither do we. Bring it to an end.',
    tier: 'elite',
    requires: { level: 70, questComplete: ['q_abyssal_throne', 'q_molten_core'] },
    objectives: [
      { type: 'kill', target: 'the_unmaker', count: 3, regionId: 'ancient-endgame' },
    ],
    rewards: { gold: 2500, xp: 4000, dungeonSeals: 8, items: [{ itemId: 'unmaker_fragment', quantity: 1, chance: 0.2 }] },
    cooldownHours: 168,
    oneTime: false,
  },
];

export const CONTRACT_BY_ID: Record<string, ContractDefinition> = Object.fromEntries(
  CONTRACTS.map((c) => [c.id, c])
);

// ─── NPC DATABASE ────────────────────────────────────────────────────

// Helper to keep dialogue terse and atmospheric.
function line(
  id: string,
  text: string,
  opts: Partial<NonNullable<NPCDefinition['dialogue']>['lines'][0]> = {}
) {
  return { id, text, ...opts };
}

export const NPC_DEFINITIONS: NPCDefinition[] = [
  // ── STARTER FRONTIER ──
  {
    id: 'elder_athan',
    name: 'Elder Athan',
    title: 'Elder of Ashfall',
    regionId: 'starter-frontier',
    role: 'quest_giver',
    services: [{ type: 'quest' }],
    reputation: {
      initial: 10,
      max: 100,
      thresholds: [
        { level: 30, unlocks: ['elder_athan_trust'] },
        { level: 70, unlocks: ['elder_athan_blessing'] },
      ],
    },
    dialogue: {
      npcId: 'elder_athan',
      lines: [
        // Line id must be unique per npcId
        line('elder_greet', 'The flame still burns in you, traveller. How fares the frontier?'),
        line('elder_common', 'Ashfall endures. As long as one blade remains unbroken, so do we.', {
          requires: { context: 'returning' },
        }),
        line('elder_quest_avail', 'There is work to be done beyond the walls. Hear me.', {
          requires: { context: 'quest_available' },
        }),
        line('elder_quest_complete', 'You returned. I never doubted you would.', {
          requires: { context: 'quest_complete' },
        }),
        line('elder_low_hp', 'Your wounds speak louder than words. Rest, before the dirt claims another.', {
          requires: { context: 'low_health' },
        }),
        line('elder_farewell', 'Go with the old gods, so long as they still watch over us.'),
      ],
      fallback: 'The frontier remembers your deeds, traveller.',
    },
  },
  {
    id: 'scout_mira',
    name: 'Scout Mira',
    title: 'Warden of the Road',
    regionId: 'starter-frontier',
    role: 'traveler',
    services: [
      { type: 'travel', destinations: ['darkwood-forest', 'ruined-province'] },
    ],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [],
    },
    dialogue: {
      npcId: 'scout_mira',
      lines: [
        line('mira_greet', 'Roads open where the brave walk. Where would you go?', {
          action: 'travel',
        }),
        line('mira_map', 'The wastes swallow the careless. Mind the old roads.', {
          requires: { context: 'farewell' },
        }),
      ],
      fallback: 'The path is yours to choose, but choose it wisely.',
    },
  },
  {
    id: 'smith_harrin',
    name: 'Smith Harrin',
    title: 'Forgemaster of the Frontier',
    regionId: 'starter-frontier',
    role: 'crafting_station',
    services: [
      { type: 'crafting', recipeCategory: 'weapons' },
      { type: 'bank' },
      { type: 'training', upgradeCategory: 'smithing' },
    ],
    reputation: {
      initial: 5,
      max: 100,
      thresholds: [
        { level: 25, unlocks: ['harrin_premium_forge'] },
        { level: 50, unlocks: ['harrin_masterwork'] },
      ],
    },
    dialogue: {
      npcId: 'smith_harrin',
      lines: [
        line('harrin_greet', 'Iron asks only to be shaped true. What shall we make?', {
          action: 'open_crafting',
        }),
        line('harrin_repair', 'A blade kept whole is a blade that trusts you. Bring your broken steel.', {}),
        line('harrin_farewell', 'Fare well. And mind you oil that edge.'),
      ],
      fallback: 'A good forge never lies.',
    },
  },
  {
    id: 'the_cartographer',
    name: 'The Cartographer',
    title: 'Keeper of the Old Roads',
    regionId: 'starter-frontier',
    role: 'lore_keeper',
    services: [{ type: 'lore' }],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 40, unlocks: ['cartographer_deep_maps'] },
      ],
    },
    dialogue: {
      npcId: 'the_cartographer',
      lines: [
        line('cart_greet', 'Every scar on this land is a map, and I have read them all. Ask, and I shall draw you the path.'),
        line('cart_darkwood', 'The Darkwood was not always dark. It became so, one omen at a time.', {
          requires: { context: 'region_intro', regionProgress: [{ regionId: 'darkwood-forest', minProgress: 1 }] },
        }),
        line('cart_end', 'I have not drawn the end of the world. I hope you are the one who fills that blank.', {
          requires: { regionProgress: [{ regionId: 'ancient-endgame', minProgress: 1 }] },
        }),
      ],
      fallback: 'The map grows with those who walk it.',
    },
  },
  {
    id: 'mistress_rin',
    name: 'Mistress Rin',
    title: 'Broker of the Frontier Market',
    regionId: 'starter-frontier',
    role: 'merchant',
    services: [
      { type: 'shop', stockId: 'frontier_market' },
      { type: 'bank' },
    ],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 20, unlocks: ['rin_trusted_buyer'] },
      ],
    },
    dialogue: {
      npcId: 'mistress_rin',
      lines: [
        line('rin_greet', 'Coin opens more doors than courage ever will. Browse, or begone.', {
          action: 'open_shop',
        }),
        line('rin_bank', 'Safe as stone, my vault. What you store, you keep. Until you want it back, at least.'),
      ],
      fallback: 'A fair price for fair goods. Nothing more, nothing less.',
    },
  },

  // ── DARKWOOD FOREST ──
  {
    id: 'archivist_omnar',
    name: 'Archivist Omnar',
    title: 'Keeper of the Leafy Annals',
    regionId: 'darkwood-forest',
    role: 'lore_keeper',
    services: [{ type: 'lore' }],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 45, unlocks: ['omnar_deeper_annals'] },
      ],
    },
    dialogue: {
      npcId: 'archivist_omnar',
      lines: [
        line('omnar_greet', 'The forest writes its own history in rings and rot. I merely read it to you.'),
        line('omnar_spirit', 'Grief, traveller. The wood grieves. It has for a hundred years.', {
          requires: { context: 'lore_reveal' },
        }),
      ],
      fallback: 'The roots remember what the crowns forget.',
    },
  },
  {
    id: 'herbalist_orin',
    name: 'Herbalist Orin',
    title: 'Tender of the Marsh Gardens',
    regionId: 'darkwood-forest',
    role: 'healer',
    services: [
      { type: 'healing', healCostGold: 20 },
      { type: 'crafting', recipeCategory: 'potions' },
    ],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [],
    },
    dialogue: {
      npcId: 'herbalist_orin',
      lines: [
        line('orin_greet', 'Sit still. The marsh keeps its own cures, and I keep them for the hurting.', {
          action: 'heal',
        }),
        line('orin_potions', 'Some pains refuse the blade. For those, I brew.', {
          action: 'open_crafting',
        }),
      ],
      fallback: 'A tincture a day keeps the grave at bay.',
    },
  },

  // ── RUINED PROVINCE ──
  {
    id: 'loremaster_valen',
    name: 'Loremaster Valen',
    title: 'Scribe of the Shattered Province',
    regionId: 'ruined-province',
    role: 'lore_keeper',
    services: [{ type: 'lore' }],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 60, unlocks: ['valen_full_archive'] },
      ],
    },
    dialogue: {
      npcId: 'loremaster_valen',
      lines: [
        line('valen_greet', 'The province did not fall in a day. It unraveled, thread by thread, and I was there to write it down.'),
        line('valen_lich', 'A king who would not let his kingdom die. That is the whole tragedy, and the whole lesson.', {
          requires: { context: 'lore_reveal' },
        }),
      ],
      fallback: 'History is written in the rubble. Read carefully.',
    },
  },

  // ── MOUNTAIN STRONGHOLD ──
  {
    id: 'warden_garrick',
    name: 'Warden Garrick',
    title: 'Warden of the Frozen Pass',
    regionId: 'mountain-stronghold',
    role: 'trainer',
    services: [
      { type: 'training', upgradeCategory: 'combat' },
      { type: 'contracts', contractTier: 'weekly' },
      { type: 'shop', stockId: 'stronghold_armory' },
    ],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 35, unlocks: ['garrick_veteran'] },
        { level: 65, unlocks: ['garrick_commander'] },
      ],
    },
    dialogue: {
      npcId: 'warden_garrick',
      lines: [
        line('garrick_greet', 'The pass takes no weak hands. Train, or it will take you.', {
          action: 'train',
        }),
        line('garrick_contract', 'There is always work at the edge of the world. Take it, if you can carry the load.', {
          action: 'open_contracts',
        }),
      ],
      fallback: 'The stronghold endures because it is held.',
    },
  },
  {
    id: 'seer_nyx',
    name: 'Seer Nyx',
    title: 'Seer of the Cinder Halls',
    regionId: 'volcanic-wasteland',
    role: 'prestige_merchant',
    services: [
      { type: 'prestige_shop', stockId: 'prestige' },
      { type: 'lore' },
    ],
    reputation: {
      initial: 0,
      max: 100,
      thresholds: [
        { level: 75, unlocks: ['nyx_ancient_eyes'] },
      ],
    },
    dialogue: {
      npcId: 'seer_nyx',
      lines: [
        line('nyx_greet', 'Seals for secrets, wanderer. The old coin buys the old knowledge.'),
        line('nyx_prophecy', 'The ash writes what is to come. I am merely its scribe.', {
          requires: { context: 'lore_reveal' },
        }),
        line('nyx_shop', 'All that glitters is not gold. Some of it is older.', {
          action: 'open_shop',
        }),
      ],
      fallback: 'The oracle does not repeat itself. Choose well.',
    },
  },
];

export const NPC_BY_ID: Record<string, NPCDefinition> = Object.fromEntries(
  NPC_DEFINITIONS.map((n) => [n.id, n])
);

// NPCs grouped by region for UI
export const NPCS_BY_REGION: Record<string, NPCDefinition[]> = NPC_DEFINITIONS.reduce(
  (acc, npc) => {
    (acc[npc.regionId] ??= []).push(npc);
    return acc;
  },
  {} as Record<string, NPCDefinition[]>
);

// Convenience: every NPC's contract IDs
export const NPC_CONTRACTS: Record<string, string[]> = {
  warden_garrick: ['c_weekly_dungeon_delver', 'c_weekly_boss_marks', 'c_elite_unmaker_hunt'],
  elder_athan: ['c_daily_frontier_patrol', 'c_daily_wood_quota', 'c_daily_darkwood_cull'],
};

// ─── REGION LORE ─────────────────────────────────────────────────────
// Layered lore revealed by NPCs; concise lines meant to be unlocked progressively.

export const REGION_LORE: Record<string, { title: string; lines: string[] }[]> = {
  'starter-frontier': [
    {
      title: 'Foundation of Ashfall',
      lines: [
        'Ashfall was built on the bones of an older settlement, one the frontier swallowed without a trace.',
        'The village earns its name by surviving what the ash-fall seasons bury.',
      ],
    },
    {
      title: 'The Old Roads',
      lines: [
        'The stone roads predate every kingdom in the region. Nobody remembers who laid them.',
      ],
    },
  ],
  'darkwood-forest': [
    {
      title: 'The Grieving Wood',
      lines: [
        'The Dryads say the forest has been grieving for a hundred years.',
        'Elder wood remembers the oaths of the first people, and it is tired of keeping them alone.',
      ],
    },
    {
      title: 'The Curse of Vlad',
      lines: [
        'Vlad was not born a monster. He made a pact with the things beneath the marsh, and the pact made him one.',
      ],
    },
  ],
  'ruined-province': [
    {
      title: 'The Aethal Empire',
      lines: [
        'The province was the heart of the Aethal Empire, until a king refused to let his kingdom die.',
      ],
    },
  ],
  'mountain-stronghold': [
    {
      title: 'The Frozen Pass',
      lines: [
        'The stronghold was carved to watch for what comes down from the peaks, and it has never once been idle.',
      ],
    },
  ],
  'haunted-marsh': [
    {
      title: 'The Drowned Halls',
      lines: [
        'The Tyrant of the Deep was once a lord who loved the marsh more than his own people.',
      ],
    },
  ],
  'forgotten-citadel': [
    {
      title: 'The Ascended',
      lines: [
        'The Arch Demon was once a mortal mage who mastered the void, then let the void master him.',
      ],
    },
  ],
  'volcanic-wasteland': [
    {
      title: 'The Volcanic Wound',
      lines: [
        'The volcano is not a wound in the earth. It is a door, and it is beginning to open.',
      ],
    },
  ],
  'ancient-endgame': [
    {
      title: 'The Silence at the End',
      lines: [
        'The Unmaker is not a conqueror. It is the silence at the end of all things, and it is almost ready.',
      ],
    },
  ],
};
