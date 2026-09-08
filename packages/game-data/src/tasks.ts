import type { TaskDefinition } from '@premium-rpg/shared-types';

// ─── TASK POOLS ──────────────────────────────────────────────────────
// Optional repeatable content: daily tasks, weekly contracts, monster
// contracts, gathering orders, and crafting orders. Designed with the
// non-FOMO principle: tasks are drawn deterministically per cycle and
// unclaimed completions are banked (catch-up), so a missed day never
// permanently disadvantages the player.

function t(partial: TaskDefinition): TaskDefinition {
  return partial;
}

// ─── DAILY TASK POOL ─────────────────────────────────────────────────
export const DAILY_TASKS: TaskDefinition[] = [
  t({
    id: 'd_kill_goblins', name: 'Thin the Goblins', group: 'daily', kind: 'monster_contract',
    description: 'Slay goblins prowling the frontier.', regionId: 'starter-frontier',
    levelRequirement: 1, weight: 3,
    objective: { type: 'kill', targetId: 'goblin', required: 10 },
    reward: { experience: 150, gold: 120 },
  }),
  t({
    id: 'd_kill_wolves', name: 'Hunt the Pack', group: 'daily', kind: 'monster_contract',
    description: 'Cull wolves threatening the travelers.', regionId: 'starter-frontier',
    levelRequirement: 2, weight: 3,
    objective: { type: 'kill', targetId: 'wolf', required: 8 },
    reward: { experience: 160, gold: 130 },
  }),
  t({
    id: 'd_kill_skeletons', name: 'Put the Dead to Rest', group: 'daily', kind: 'monster_contract',
    description: 'Shatter skeletons in the graveyard fields.', regionId: 'starter-frontier',
    levelRequirement: 3, weight: 3,
    objective: { type: 'kill', targetId: 'skeleton', required: 10 },
    reward: { experience: 180, gold: 140 },
  }),
  t({
    id: 'd_mine_copper', name: 'Copper for the Smelter', group: 'daily', kind: 'gathering_order',
    description: 'Mine copper ore for the village smelter.', regionId: 'starter-frontier',
    levelRequirement: 3, weight: 3,
    objective: { type: 'gather', skillId: 'mining', targetId: 'copper_ore', required: 12 },
    reward: { experience: 140, gold: 110, skillExperience: { mining: 60 } },
  }),
  t({
    id: 'd_chop_logs', name: 'Lumber for the Wall', group: 'daily', kind: 'gathering_order',
    description: 'Chop logs to reinforce the frontier wall.', regionId: 'starter-frontier',
    levelRequirement: 3, weight: 3,
    objective: { type: 'gather', skillId: 'woodcutting', targetId: 'log', required: 12 },
    reward: { experience: 140, gold: 110, skillExperience: { woodcutting: 60 } },
  }),
  t({
    id: 'd_fish_carp', name: 'Fresh Catch', group: 'daily', kind: 'gathering_order',
    description: 'Bring in a fresh catch of fish.', regionId: 'starter-frontier',
    levelRequirement: 3, weight: 2,
    objective: { type: 'gather', skillId: 'fishing', targetId: 'carp', required: 10 },
    reward: { experience: 140, gold: 110, skillExperience: { fishing: 60 } },
  }),
  t({
    id: 'd_spiders', name: 'Clear the Webbing', group: 'daily', kind: 'monster_contract',
    description: 'Remove the spider infestation from the glades.', regionId: 'darkwood-forest',
    levelRequirement: 5, weight: 2,
    objective: { type: 'kill', targetId: 'darkwood_spider', required: 8 },
    reward: { experience: 240, gold: 180 },
  }),
  t({
    id: 'd_zombies', name: 'The Shambling Dead', group: 'daily', kind: 'monster_contract',
    description: 'Bury the shambling dead of the forest.', regionId: 'darkwood-forest',
    levelRequirement: 6, weight: 2,
    objective: { type: 'kill', targetId: 'zombie', required: 8 },
    reward: { experience: 250, gold: 190 },
  }),
  t({
    id: 'd_iron_ore', name: 'Iron Demand', group: 'daily', kind: 'gathering_order',
    description: 'The smith needs iron for the militia.', regionId: 'darkwood-forest',
    levelRequirement: 12, weight: 2,
    objective: { type: 'gather', skillId: 'mining', targetId: 'iron_ore', required: 10 },
    reward: { experience: 320, gold: 240, skillExperience: { mining: 90 } },
  }),
  t({
    id: 'd_skulls', name: 'Skulls of the Fallen', group: 'daily', kind: 'gathering_order',
    description: 'Recover the skulls of the long dead.', regionId: 'ruined-province',
    levelRequirement: 16, weight: 2,
    objective: { type: 'collect', targetId: 'bone', required: 15 },
    reward: { experience: 360, gold: 270 },
  }),
  t({
    id: 'd_knights', name: 'Break the Knights', group: 'daily', kind: 'monster_contract',
    description: 'Shatter the knightly remains guarding the ruins.', regionId: 'ruined-province',
    levelRequirement: 17, weight: 2,
    objective: { type: 'kill', targetId: 'skeleton_knight', required: 8 },
    reward: { experience: 400, gold: 300 },
  }),
  t({
    id: 'd_aid_partner', name: 'Aid the Frontier', group: 'daily', kind: 'crafting_order',
    description: 'Craft basic supplies for the frontier outpost.', regionId: 'starter-frontier',
    levelRequirement: 4, weight: 2,
    objective: { type: 'craft', targetId: 'bronze_bar', required: 3 },
    reward: { experience: 220, gold: 160 },
  }),
];

// ─── WEEKLY CONTRACT POOL ────────────────────────────────────────────
export const WEEKLY_TASKS: TaskDefinition[] = [
  t({
    id: 'w_boss_contract_frontier', name: 'Slayer Contract: Frontier Foe', group: 'weekly', kind: 'monster_contract',
    description: 'Hunt and slay a powerful frontier foe.', regionId: 'starter-frontier',
    levelRequirement: 4, weight: 2, maxPerWeek: 1,
    objective: { type: 'kill', targetId: 'forest_troll_king', required: 1 },
    reward: { experience: 900, gold: 600, items: [{ itemId: 'bronze_sword', quantity: 1 }] },
  }),
  t({
    id: 'w_war_boss', name: 'Contract: Blood of Vlad', group: 'weekly', kind: 'monster_contract',
    description: 'Slay Count Vlad and his brood once more.', regionId: 'darkwood-forest',
    levelRequirement: 8, weight: 2, maxPerWeek: 1,
    objective: { type: 'kill', targetId: 'count_vlad', required: 1 },
    reward: { experience: 1200, gold: 700, items: [{ itemId: 'iron_sword', quantity: 1 }] },
  }),
  t({
    id: 'w_lich', name: 'Contract: The Ancient Lich', group: 'weekly', kind: 'monster_contract',
    description: 'Ensure the Lich stays dead.', regionId: 'ruined-province',
    levelRequirement: 16, weight: 2, maxPerWeek: 1,
    objective: { type: 'kill', targetId: 'ancient_lich', required: 1 },
    reward: { experience: 2400, gold: 1400, items: [{ itemId: 'steel_sword', quantity: 1 }] },
  }),
  t({
    id: 'w_dungeon_caverns', name: 'Dungeon Run: Darkwood Caverns', group: 'weekly', kind: 'dungeon_contract',
    description: 'Clear the Darkwood Caverns to its depths.', regionId: 'darkwood-forest',
    levelRequirement: 8, weight: 2, maxPerWeek: 1,
    objective: { type: 'complete_dungeon', targetId: 'darkwood-caverns', required: 1 },
    reward: { experience: 1500, gold: 850 },
  }),
  t({
    id: 'w_dungeon_citadel', name: 'Cleanse the Crumbling Citadel', group: 'weekly', kind: 'dungeon_contract',
    description: 'Purge the Crumbling Citadel of its keepers.', regionId: 'ruined-province',
    levelRequirement: 16, weight: 2, maxPerWeek: 1,
    objective: { type: 'complete_dungeon', targetId: 'crumbling-citadel', required: 1 },
    reward: { experience: 2800, gold: 1600 },
  }),
  t({
    id: 'w_gather_mithril', name: 'Mithril Quota', group: 'weekly', kind: 'gathering_order',
    description: 'Deliver a weekly quota of mithril ore.', regionId: 'mountain-stronghold',
    levelRequirement: 26, weight: 2, maxPerWeek: 1,
    objective: { type: 'gather', skillId: 'mining', targetId: 'mithril_ore', required: 15 },
    reward: { experience: 3000, gold: 1800, skillExperience: { mining: 400 } },
  }),
  t({
    id: 'w_craft_rune', name: 'Rune Production', group: 'weekly', kind: 'crafting_order',
    description: 'Produce a set of rune-tier gear for the guild.', regionId: 'mountain-stronghold',
    levelRequirement: 36, weight: 2, maxPerWeek: 1,
    objective: { type: 'craft', targetId: 'rune_sword', required: 2 },
    reward: { experience: 3800, gold: 2100, items: [{ itemId: 'rune_sword', quantity: 1 }] },
  }),
  t({
    id: 'w_marsh_cleansing', name: 'Cleanse the Marsh', group: 'weekly', kind: 'monster_contract',
    description: 'Lay the undead of the Haunted Marsh to rest.', regionId: 'haunted-marsh',
    levelRequirement: 36, weight: 2, maxPerWeek: 1,
    objective: { type: 'kill', targetId: 'marsh_wraith', required: 12 },
    reward: { experience: 3600, gold: 2000 },
  }),
];

// ─── REGISTRY ────────────────────────────────────────────────────────

export const ALL_TASKS: TaskDefinition[] = [...DAILY_TASKS, ...WEEKLY_TASKS];
export const TASK_BY_ID: Record<string, TaskDefinition> = Object.fromEntries(
  ALL_TASKS.map((task) => [task.id, task])
);

// Default selection counts for a cycle.
export const DEFAULT_TASK_SELECTION = {
  dailyCount: 4,
  weeklyCount: 2,
} as const;
