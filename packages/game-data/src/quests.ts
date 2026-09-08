import type { QuestDefinition, QuestObjective } from '@premium-rpg/shared-types';

// ─── NPC REFERENCE ────────────────────────────────────────────────────
// Static NPC identities referenced by interact_npc objectives. A full NPC
// system arrives in a later phase; quests reference stable ids here so
// the engine and journal stay consistent.

export const QUEST_NPCS: Record<string, { id: string; name: string; regionId: string }> = {
  elder_athan:          { id: 'elder_athan',          name: 'Elder Athan',          regionId: 'starter-frontier' },
  scout_mira:           { id: 'scout_mira',           name: 'Scout Mira',           regionId: 'starter-frontier' },
  mistress_rin:         { id: 'mistress_rin',         name: 'Mistress Rin',         regionId: 'starter-frontier' },
  archivist_omnar:      { id: 'archivist_omnar',      name: 'Archivist Omnar',      regionId: 'darkwood-forest' },
  loremaster_valen:     { id: 'loremaster_valen',     name: 'Loremaster Valen',     regionId: 'ruined-province' },
  warden_garrick:       { id: 'warden_garrick',       name: 'Warden Garrick',       regionId: 'forgotten-citadel' },
  seer_nyx:             { id: 'seer_nyx',             name: 'Seer Nyx',             regionId: 'volcanic-wasteland' },
  the_cartographer:     { id: 'the_cartographer',     name: 'The Cartographer',     regionId: 'starter-frontier' },
  herbalist_orin:       { id: 'herbalist_orin',       name: 'Herbalist Orin',       regionId: 'darkwood-forest' },
  smith_harrin:         { id: 'smith_harrin',         name: 'Smith Harrin',         regionId: 'starter-frontier' },
};

// ─── QUEST DATABASE ──────────────────────────────────────────────────

// Objective helper — reduces boilerplate while keeping type safety.
function obj(partial: QuestObjective): QuestObjective {
  return partial;
}

export const QUESTS: QuestDefinition[] = [
  // ═══ MAIN CHAIN: THE AWAKENING ══════════════════════════════════════
  {
    id: 'q_awakening',
    name: 'The Awakening',
    category: 'main',
    recommendedLevel: 1,
    regionId: 'starter-frontier',
    description:
      'A plague of goblins and wolves has spilled from the frontier woods. Elder Athan asks you to prove your steel before the village will trust you with greater tasks.',
    lore:
      'You wake with iron in your hand and a debt of duty on your back. The village of Ashfall stands at the edge of the Darkwood, and it has endured the raids of tooth and blade long enough.',
    objectives: [
      obj({ id: 'ob_kill_goblin', type: 'kill', targetId: 'goblin', required: 3, description: 'Slay goblins in the frontier.' }),
      obj({ id: 'ob_kill_wolf', type: 'kill', targetId: 'wolf', required: 2, description: 'Hunt wolves prowling the plains.' }),
      obj({ id: 'ob_collect_bones', type: 'collect', targetId: 'bone', required: 5, description: 'Gather bones left by the fallen.' }),
    ],
    rewards: {
      experience: 120,
      gold: 75,
      items: [{ itemId: 'bronze_sword', quantity: 1 }],
    },
  },

  {
    id: 'q_first_forge',
    name: 'The First Forge',
    category: 'main',
    recommendedLevel: 3,
    regionId: 'starter-frontier',
    chain: { questId: 'q_awakening', stepIndex: 2 },
    description:
      'Smith Harrin will not arm the village militia with cold iron. Learn the miner\u2019s craft and forge the first bar yourself.',
    objectives: [
      obj({ id: 'ob_mining_3', type: 'reach_skill_level', skillId: 'mining', required: 3, description: 'Raise Mining to level 3.' }),
      obj({ id: 'ob_gather_copper', type: 'gather', skillId: 'mining', targetId: 'copper_ore', required: 8, description: 'Mine 8 copper ore.' }),
    ],
    rewards: {
      experience: 180,
      gold: 90,
      items: [{ itemId: 'iron_sword', quantity: 1 }],
    },
  },

  {
    id: 'q_darkwood_scout',
    name: 'Eyes on the Darkwood',
    category: 'main',
    recommendedLevel: 5,
    regionId: 'starter-frontier',
    chain: { questId: 'q_first_forge', stepIndex: 3 },
    description:
      'Scout Mira reports movement in the Darkwood and needs a blade at her side. Venture into the forest and learn what stalks beneath the canopy.',
    lore:
      'The Darkwood is old — older than Ashfall, older than the roads that once ran through it. What lives there does not belong to this age, and it is waking.',
    objectives: [
      obj({ id: 'ob_visit_darkwood', type: 'visit_region', targetId: 'darkwood-forest', required: 1, description: 'Enter the Darkwood Forest.' }),
      obj({ id: 'ob_kill_spider', type: 'kill', targetId: 'darkwood_spider', required: 5, description: 'Clear venomous spiders from the webbed glades.' }),
      obj({ id: 'ob_kill_zombie', type: 'kill', targetId: 'zombie', required: 4, description: 'Put down the shambling dead.' }),
    ],
    rewards: {
      experience: 260,
      gold: 130,
      unlocks: [{ key: 'region:darkwood-forest', label: 'Darkwood Forest', type: 'region' }],
    },
  },

  {
    id: 'q_vlads_curse',
    name: 'The Curse of Count Vlad',
    category: 'main',
    recommendedLevel: 8,
    regionId: 'darkwood-forest',
    chain: { questId: 'q_darkwood_scout', stepIndex: 4 },
    description:
      'The arewolf plague has a master. Archivist Omnar believes Count Vlad lairs in the Darkwood Caverns. Slay him and break the blood-curse on the village of Ashfall.',
    lore:
      'Vlad was not born monstrous. He was a border lord who made a desperate pact with the things beneath the marsh. Now the pact owns him, and the curse spreads through every bite.',
    objectives: [
      obj({ id: 'ob_kill_werewolf', type: 'kill', targetId: 'werewolf', required: 5, description: 'Slay werewolves under the curse.' }),
      obj({ id: 'ob_complete_caverns', type: 'complete_dungeon', targetId: 'darkwood-caverns', required: 1, description: 'Clear the Darkwood Caverns.' }),
      obj({ id: 'ob_defeat_vlad', type: 'kill', targetId: 'count_vlad', required: 1, description: 'Defeat Count Vlad.' }),
    ],
    rewards: {
      experience: 500,
      gold: 200,
      items: [{ itemId: 'vampire_fang', quantity: 1 }],
      unlocks: [{ key: 'mechanic:blood_mark', label: 'Blood Mark', type: 'mechanic' }],
    },
  },

  {
    id: 'q_lich_awakened',
    name: 'The Lich That Waited',
    category: 'main',
    recommendedLevel: 15,
    regionId: 'ruined-province',
    chain: { questId: 'q_vlads_curse', stepIndex: 5 },
    description:
      'The Ruined Province hides a shattered citadel, and inside, the Ancient Lich stirs. Loremaster Valen begs you to reach it before its power is whole.',
    lore:
      'A thousand years ago the Lich was a mortal king who refused to let his kingdom die. He bound every soul of his realm to his own survival. The citadel remembers them still.',
    objectives: [
      obj({ id: 'ob_visit_ruins', type: 'visit_region', targetId: 'ruined-province', required: 1, description: 'Enter the Ruined Province.' }),
      obj({ id: 'ob_kill_skeleton_knight', type: 'kill', targetId: 'skeleton_knight', required: 6, description: 'Break the knightly dead.' }),
      obj({ id: 'ob_complete_citadel', type: 'complete_dungeon', targetId: 'crumbling-citadel', required: 1, description: 'Clear the Crumbling Citadel.' }),
      obj({ id: 'ob_defeat_lich', type: 'kill', targetId: 'ancient_lich', required: 1, description: 'Destroy the Ancient Lich.' }),
    ],
    rewards: {
      experience: 900,
      gold: 350,
      items: [{ itemId: 'lich_philactery', quantity: 1 }],
      unlocks: [{ key: 'mechanic:phylactery', label: 'Phylactery', type: 'mechanic' }],
    },
  },

  {
    id: 'q_frozen_summit_ascent',
    name: 'The Frozen Summit',
    category: 'main',
    recommendedLevel: 25,
    regionId: 'mountain-stronghold',
    chain: { questId: 'q_lich_awakened', stepIndex: 6 },
    description:
      'Beyond the province, the Frost Giant King commands the mountain passes. Climb the Frozen Summit and claim its crown.',
    objectives: [
      obj({ id: 'ob_visit_mountain', type: 'visit_region', targetId: 'mountain-stronghold', required: 1, description: 'Enter the Mountain Stronghold.' }),
      obj({ id: 'ob_kill_ice', type: 'kill', targetId: 'ice_elemental', required: 5, description: 'Shatter the ice elementals.' }),
      obj({ id: 'ob_complete_summit', type: 'complete_dungeon', targetId: 'frozen-summit', required: 1, description: 'Clear the Frozen Summit.' }),
      obj({ id: 'ob_defeat_giant', type: 'kill', targetId: 'frost_giant_king', required: 1, description: 'Defeat the Frost Giant King.' }),
    ],
    rewards: {
      experience: 1500,
      gold: 550,
      items: [{ itemId: 'frost_crown', quantity: 1 }],
    },
  },

  {
    id: 'q_sunken_catacombs',
    name: 'The Sunken Catacombs',
    category: 'main',
    recommendedLevel: 35,
    regionId: 'haunted-marsh',
    chain: { questId: 'q_frozen_summit_ascent', stepIndex: 7 },
    description:
      'The Haunted Marsh hides drowned halls where the Tyrant of the Deep hunts. Descend and end its reign.',
    objectives: [
      obj({ id: 'ob_visit_marsh', type: 'visit_region', targetId: 'haunted-marsh', required: 1, description: 'Enter the Haunted Marsh.' }),
      obj({ id: 'ob_kill_marsh_wraith', type: 'kill', targetId: 'marsh_wraith', required: 5, description: 'Banish the marsh wraiths.' }),
      obj({ id: 'ob_complete_sunken', type: 'complete_dungeon', targetId: 'sunken-catacombs', required: 1, description: 'Clear the Sunken Catacombs.' }),
      obj({ id: 'ob_defeat_tyrant', type: 'kill', targetId: 'tyrant_of_the_deep', required: 1, description: 'Slay the Tyrant of the Deep.' }),
    ],
    rewards: {
      experience: 2400,
      gold: 850,
      items: [{ itemId: 'tidal_crown', quantity: 1 }],
    },
  },

  {
    id: 'q_citadel_depths',
    name: 'Warden of the Citadel Depths',
    category: 'main',
    recommendedLevel: 45,
    regionId: 'forgotten-citadel',
    chain: { questId: 'q_sunken_catacombs', stepIndex: 8 },
    description:
      'The Forgotten Citadel opens at last. Warden Garrick has seen the Arch Demon ascend within. Cut it down before the Depths become a throne.',
    objectives: [
      obj({ id: 'ob_visit_citadel', type: 'visit_region', targetId: 'forgotten-citadel', required: 1, description: 'Enter the Forgotten Citadel.' }),
      obj({ id: 'ob_kill_guardian', type: 'kill', targetId: 'citadel_guardian', required: 4, description: 'Break the citadel guardians.' }),
      obj({ id: 'ob_complete_depths', type: 'complete_dungeon', targetId: 'citadel-depths', required: 1, description: 'Clear the Citadel Depths.' }),
      obj({ id: 'ob_defeat_demon', type: 'kill', targetId: 'arch_demon', required: 1, description: 'Banish the Arch Demon.' }),
    ],
    rewards: {
      experience: 3600,
      gold: 1200,
      items: [{ itemId: 'demon_horn', quantity: 1 }],
    },
  },

  {
    id: 'q_molten_core',
    name: 'The Molten Core',
    category: 'main',
    recommendedLevel: 55,
    regionId: 'volcanic-wasteland',
    chain: { questId: 'q_citadel_depths', stepIndex: 9 },
    description:
      'The Volcanic Wasteland is a wound in the earth, and from it the Magma Tyrant crawls. Seer Nyx says its core must be extinguished.',
    objectives: [
      obj({ id: 'ob_visit_volcanic', type: 'visit_region', targetId: 'volcanic-wasteland', required: 1, description: 'Enter the Volcanic Wasteland.' }),
      obj({ id: 'ob_kill_magma_drake', type: 'kill', targetId: 'magma_drake', required: 5, description: 'Slay the magma drakes.' }),
      obj({ id: 'ob_complete_core', type: 'complete_dungeon', targetId: 'molten-core', required: 1, description: 'Clear the Molten Core.' }),
      obj({ id: 'ob_defeat_tyrant2', type: 'kill', targetId: 'magma_tyrant', required: 1, description: 'Destroy the Magma Tyrant.' }),
    ],
    rewards: {
      experience: 5200,
      gold: 1700,
      items: [{ itemId: 'magma_tyrant_core', quantity: 1 }],
    },
  },

  {
    id: 'q_abyssal_throne',
    name: 'The Abyssal Throne',
    category: 'main',
    recommendedLevel: 70,
    regionId: 'ancient-endgame',
    chain: { questId: 'q_molten_core', stepIndex: 10 },
    description:
      'At the end of the world sits the Abyssal Throne, and upon it, the Unmaker. Everything you have endured has led here.',
    lore:
      'The Unmaker is not a conqueror. It is the silence at the end of all things, waiting for the world to finish forgetting itself. It must be unmade first.',
    objectives: [
      obj({ id: 'ob_visit_endgame', type: 'visit_region', targetId: 'ancient-endgame', required: 1, description: 'Enter the ancient endgame.' }),
      obj({ id: 'ob_kill_void_lord', type: 'kill', targetId: 'void_lord', required: 3, description: 'Break the void lords ahead.' }),
      obj({ id: 'ob_complete_abyss', type: 'complete_dungeon', targetId: 'abyssal-throne', required: 1, description: 'Clear the Abyssal Throne.' }),
      obj({ id: 'ob_defeat_unmaker', type: 'kill', targetId: 'the_unmaker', required: 1, description: 'Destroy the Unmaker.' }),
    ],
    rewards: {
      experience: 8000,
      gold: 3000,
      items: [{ itemId: 'unmaker_heart', quantity: 1 }],
      unlocks: [{ key: 'cosmetic:unmaker_title', label: 'Unmaker\u2019s Bane', type: 'cosmetic' }],
      titles: ['Unmaker\u2019s Bane'],
    },
  },

  // ═══ UNLOCK QUESTS ═════════════════════════════════════════════════
  {
    id: 'q_unlock_dungeon_keys',
    name: 'Keys to the Deep',
    category: 'unlock',
    recommendedLevel: 6,
    regionId: 'starter-frontier',
    prerequisites: [{ type: 'quest', target: 'q_awakening', comparison: 'gte', value: 1 }],
    description:
      'Smith Harrin has drawn blueprints for keys that unlock the sealed hoards and dungeons. Recover his tools from the frontier so he can forge them.',
    objectives: [
      obj({ id: 'ob_gather_tools', type: 'gather', skillId: 'mining', targetId: 'runite_ore', required: 1, description: 'Recover a trace of runite ore for the smith.' }),
      obj({ id: 'ob_interact_harin', type: 'interact_npc', targetId: 'smith_harrin', required: 1, description: 'Return to Smith Harrin.' }),
    ],
    rewards: {
      experience: 400,
      gold: 220,
      unlocks: [{ key: 'mechanic:dungeon_keys', label: 'Dungeon Keys', type: 'mechanic' }],
    },
  },

  {
    id: 'q_unlock_blessing',
    name: 'The Weeping Shrine',
    category: 'unlock',
    recommendedLevel: 12,
    regionId: 'darkwood-forest',
    prerequisites: [{ type: 'quest', target: 'q_darkwood_scout', comparison: 'gte', value: 1 }],
    description:
      'Herbalist Orin speaks of a shrine in the deep wood that grants its blessing to those who prove their devotion. Restore it and earn its favor.',
    objectives: [
      obj({ id: 'ob_gather_herbs', type: 'gather', skillId: 'woodcutting', targetId: 'ethereal_wood', required: 3, description: 'Gather ethereal wood for the shrine\u2019s altar.' }),
      obj({ id: 'ob_interact_orin', type: 'interact_npc', targetId: 'herbalist_orin', required: 1, description: 'Speak with Herbalist Orin.' }),
    ],
    rewards: {
      experience: 700,
      gold: 300,
      unlocks: [{ key: 'mechanic:blessing', label: 'Shrine Blessing', type: 'mechanic' }],
    },
  },

  // ═══ LORE QUESTS ═══════════════════════════════════════════════════
  {
    id: 'q_lore_forest_spirits',
    name: 'Whispers of the Elder Wood',
    category: 'lore',
    recommendedLevel: 14,
    regionId: 'darkwood-forest',
    prerequisites: [{ type: 'quest', target: 'q_darkwood_scout', comparison: 'gte', value: 1 }],
    description:
      'Archivist Omnar thinks the forest itself is grieving. Speak with the dryads and lay a spirit to rest to understand why the Darkwood is dying.',
    lore:
      'The dryads do not speak with words — they speak in the creak of branches and the fall of leaves. Elder wood was planted by the first people, and it remembers their oaths.',
    objectives: [
      obj({ id: 'ob_interact_omnar', type: 'interact_npc', targetId: 'archivist_omnar', required: 1, description: 'Consult the archivist.' }),
      obj({ id: 'ob_kill_elder_dryad', type: 'kill', targetId: 'elder_dryad', required: 1, description: 'Confront the corrupted elder dryad.' }),
      obj({ id: 'ob_collect_sap', type: 'collect', targetId: 'elder_sap', required: 3, description: 'Collect the sap of the elder wood.' }),
    ],
    rewards: {
      experience: 650,
      gold: 260,
      collectionEntries: ['enemy:elder_dryad'],
    },
  },

  {
    id: 'q_lore_ashen_prophecy',
    name: 'The Ashen Prophecy',
    category: 'lore',
    recommendedLevel: 52,
    regionId: 'volcanic-wasteland',
    prerequisites: [{ type: 'quest', target: 'q_citadel_depths', comparison: 'gte', value: 1 }],
    description:
      'Seer Nyx reads a warning in the ash: the volcano is not a wound — it is a door. Uncover what the first peoples sealed within.',
    objectives: [
      obj({ id: 'ob_interact_nyx', type: 'interact_npc', targetId: 'seer_nyx', required: 1, description: 'Hear the Seer\u2019s prophecy.' }),
      obj({ id: 'ob_kill_pyro_lord', type: 'kill', targetId: 'pyro_lord', required: 2, description: 'Defeat the pylons of flame.' }),
      obj({ id: 'ob_collect_ember', type: 'collect', targetId: 'ember_crystal', required: 3, description: 'Claim ember crystals.' }),
    ],
    rewards: {
      experience: 4800,
      gold: 1500,
      collectionEntries: ['enemy:pyro_lord', 'enemy:magma_tyrant'],
    },
  },

  // ═══ SIDE QUESTS ═══════════════════════════════════════════════════
  {
    id: 'q_side_supply_run',
    name: 'A Supply Run',
    category: 'side',
    recommendedLevel: 4,
    regionId: 'starter-frontier',
    description:
      'The village stores run low on lumber and stone. Gather what the frontier offers so Ashfall can keep its walls standing.',
    objectives: [
      obj({ id: 'ob_gather_logs', type: 'gather', skillId: 'woodcutting', required: 10, description: 'Chop 10 logs from the frontier trees.' }),
      obj({ id: 'ob_gather_stone', type: 'gather', skillId: 'mining', required: 6, description: 'Quarry 6 stone from the hills.' }),
    ],
    rewards: {
      experience: 220,
      gold: 110,
    },
  },

  {
    id: 'q_side_herbalist',
    name: 'The Herbalist\u2019s Debt',
    category: 'side',
    recommendedLevel: 10,
    regionId: 'darkwood-forest',
    prerequisites: [{ type: 'quest', target: 'q_darkwood_scout', comparison: 'gte', value: 1 }],
    description:
      'Herbalist Orin owes a cure to the village, but the marsh fish that brews it have grown scarce. Bring him what he needs.',
    objectives: [
      obj({ id: 'ob_fish_marsh', type: 'gather', skillId: 'fishing', required: 5, description: 'Catch 5 fish from dark waters.' }),
      obj({ id: 'ob_interact_orin2', type: 'interact_npc', targetId: 'herbalist_orin', required: 1, description: 'Deliver the catch to Orin.' }),
      obj({ id: 'ob_kill_plague_rat', type: 'kill', targetId: 'plague_rat', required: 4, description: 'Cull the plague rats stealing the brew.' }),
    ],
    rewards: {
      experience: 380,
      gold: 180,
      items: [{ itemId: 'void_pike', quantity: 1 }],
    },
  },

  {
    id: 'q_side_equip_order',
    name: 'The Warden\u2019s Standard',
    category: 'side',
    recommendedLevel: 30,
    regionId: 'mountain-stronghold',
    prerequisites: [{ type: 'quest', target: 'q_frozen_summit_ascent', comparison: 'gte', value: 1 }],
    description:
      'Warden Garrick requires his rangers geared for the pass. Equip the standard of the stronghold and prove your readiness.',
    objectives: [
      obj({ id: 'ob_equip_weapon', type: 'equip_item', slot: 'weapon', required: 1, description: 'Equip a weapon worthy of the stronghold.' }),
      obj({ id: 'ob_equip_chest', type: 'equip_item', slot: 'chest', required: 1, description: 'Equip heavy chest armor.' }),
      obj({ id: 'ob_kill_giant_warrior', type: 'kill', targetId: 'giant_warrior', required: 3, description: 'Prove yourself against the giants.' }),
    ],
    rewards: {
      experience: 2000,
      gold: 750,
      items: [{ itemId: 'mithril_platebody', quantity: 1 }],
    },
  },
];

// ─── REGISTRY ────────────────────────────────────────────────────────

export const QUEST_BY_ID: Record<string, QuestDefinition> = Object.fromEntries(
  QUESTS.map((q) => [q.id, q])
);

export const MAIN_QUEST_CHAIN: string[] = [
  'q_awakening',
  'q_first_forge',
  'q_darkwood_scout',
  'q_vlads_curse',
  'q_lich_awakened',
  'q_frozen_summit_ascent',
  'q_sunken_catacombs',
  'q_citadel_depths',
  'q_molten_core',
  'q_abyssal_throne',
];

export const UNLOCK_QUESTS: string[] = ['q_unlock_dungeon_keys', 'q_unlock_blessing'];
export const LORE_QUESTS: string[] = ['q_lore_forest_spirits', 'q_lore_ashen_prophecy'];
export const SIDE_QUESTS: string[] = ['q_side_supply_run', 'q_side_herbalist', 'q_side_equip_order'];
