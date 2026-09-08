import type { AchievementDefinition } from '@premium-rpg/shared-types';

// ─── ACHIEVEMENT DATABASE ────────────────────────────────────────────
// Milestone achievements across all eight categories. One-time unlocks
// (no frequent awards); points, titles, and cosmetics reward meaningful
// milestones. All identifiers reference real authored content.

function a(partial: AchievementDefinition): AchievementDefinition {
  return partial;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── PROGRESSION ───────────────────────────────────────────────────
  a({ id: 'prog_level_10', name: 'Awakening', description: 'Reach level 10.', category: 'progression', order: 1, conditions: [{ metric: 'level', target: 10 }], reward: { points: 10, title: 'the Awakened' } }),
  a({ id: 'prog_level_25', name: 'Seasoned Adventurer', description: 'Reach level 25.', category: 'progression', order: 2, conditions: [{ metric: 'level', target: 25 }], reward: { points: 20, cosmetic: 'aura_mist' } }),
  a({ id: 'prog_level_50', name: 'Champion of the Frontier', description: 'Reach level 50.', category: 'progression', order: 3, conditions: [{ metric: 'level', target: 50 }], reward: { points: 40, title: 'Champion' } }),
  a({ id: 'prog_level_100', name: 'Legend', description: 'Reach level 100.', category: 'progression', order: 4, conditions: [{ metric: 'level', target: 100 }], reward: { points: 80, title: 'Legend' } }),
  a({ id: 'prog_total_500', name: 'Jack of All Trades', description: 'Reach a total level of 500 across all skills.', category: 'progression', order: 5, conditions: [{ metric: 'total_level', target: 500 }], reward: { points: 30, title: 'the Polymath' } }),

  // ── COMBAT ────────────────────────────────────────────────────────
  a({ id: 'combat_kills_100', name: 'First Blood, Repeated', description: 'Defeat 100 enemies in total.', category: 'combat', order: 1, conditions: [{ metric: 'kills_total', target: 100 }], reward: { points: 10 } }),
  a({ id: 'combat_kills_1000', name: 'Mass Slayer', description: 'Defeat 1,000 enemies in total.', category: 'combat', order: 2, conditions: [{ metric: 'kills_total', target: 1000 }], reward: { points: 30, title: 'Mass Slayer' } }),
  a({ id: 'combat_kills_10000', name: 'Exterminator', description: 'Defeat 10,000 enemies in total.', category: 'combat', order: 3, conditions: [{ metric: 'kills_total', target: 10000 }], reward: { points: 80, title: 'Exterminator' } }),
  a({ id: 'combat_elite_50', name: 'Elite Bane', description: 'Defeat 50 elite enemies.', category: 'combat', order: 4, conditions: [{ metric: 'kills_elite', target: 50 }], reward: { points: 25 } }),
  a({ id: 'combat_undead_100', name: 'Undead Aftermath', description: 'Defeat 100 undead in the haunted lands.', category: 'combat', order: 5, conditions: [{ metric: 'kill', targetId: 'skeleton', target: 100 }, { metric: 'kill', targetId: 'zombie', target: 100 }], reward: { points: 30, title: 'Undead Warden' } }),

  // ── SKILL ─────────────────────────────────────────────────────────
  a({ id: 'skill_gather_10', name: 'Gatherer', description: 'Reach level 10 in any gathering skill.', category: 'skill', order: 1, conditions: [{ metric: 'skill', targetId: 'mining', target: 10 }], reward: { points: 10 } }),
  a({ id: 'skill_gather_50', name: 'Master Gatherer', description: 'Reach level 50 in any gathering skill.', category: 'skill', order: 2, conditions: [{ metric: 'skill', targetId: 'mining', target: 50 }], reward: { points: 30, title: 'the Gatherer' } }),
  a({ id: 'skill_smith_50', name: 'Master Smith', description: 'Reach level 50 smithing.', category: 'skill', order: 3, conditions: [{ metric: 'skill', targetId: 'smithing', target: 50 }], reward: { points: 30, title: 'Master Smith' } }),
  a({ id: 'skill_all_50', name: 'Grandmaster Craftsman', description: 'Reach level 50 in all crafting skills.', category: 'skill', order: 4, conditions: [{ metric: 'skill', targetId: 'smithing', target: 50 }, { metric: 'skill', targetId: 'cooking', target: 50 }, { metric: 'skill', targetId: 'fletching', target: 50 }, { metric: 'skill', targetId: 'alchemy', target: 50 }], reward: { points: 60, title: 'Grandmaster Craftsman' } }),
  a({ id: 'skill_gather_100k', name: 'Tireless Hands', description: 'Gather 100,000 resources over your career.', category: 'skill', order: 5, conditions: [{ metric: 'gather_count', target: 100000 }], reward: { points: 50 } }),

  // ── COLLECTION ────────────────────────────────────────────────────
  a({ id: 'col_bestiary_10', name: 'Bestiary Keeper', description: 'Defeat 10 distinct enemy types.', category: 'collection', order: 1, conditions: [{ metric: 'bestiary_defeated', target: 10 }], reward: { points: 10 } }),
  a({ id: 'col_bestiary_50', name: 'Zoologist', description: 'Defeat 50 distinct enemy types.', category: 'collection', order: 2, conditions: [{ metric: 'bestiary_defeated', target: 50 }], reward: { points: 30 } }),
  a({ id: 'col_dungeon_7', name: 'Dungeon Delver', description: 'Complete all 7 major dungeons.', category: 'collection', order: 3, conditions: [
    { metric: 'dungeon_specific', targetId: 'darkwood-caverns', target: 1 },
    { metric: 'dungeon_specific', targetId: 'crumbling-citadel', target: 1 },
    { metric: 'dungeon_specific', targetId: 'frozen-summit', target: 1 },
    { metric: 'dungeon_specific', targetId: 'sunken-catacombs', target: 1 },
    { metric: 'dungeon_specific', targetId: 'citadel-depths', target: 1 },
    { metric: 'dungeon_specific', targetId: 'molten-core', target: 1 },
    { metric: 'dungeon_specific', targetId: 'abyssal-throne', target: 1 },
  ], reward: { points: 60, title: 'Dungeon Delver', cosmetic: 'banner_hero' } }),
  a({ id: 'col_collection_20', name: 'Curator', description: 'Collect 20 collection entries.', category: 'collection', order: 4, conditions: [{ metric: 'collection_entries', target: 20 }], reward: { points: 25, title: 'the Curator' } }),
  a({ id: 'col_titles_10', name: 'Many Names', description: 'Own 10 titles.', category: 'collection', order: 5, conditions: [{ metric: 'titles_owned', target: 10 }], reward: { points: 15 } }),

  // ── BOSS ──────────────────────────────────────────────────────────
  a({ id: 'boss_troll_king', name: 'Foe of the Forest', description: 'Slay the Forest Troll King.', category: 'boss', order: 1, conditions: [{ metric: 'boss', targetId: 'forest_troll_king', target: 1 }], reward: { points: 15 } }),
  a({ id: 'boss_vlad', name: 'Bloodline Severed', description: 'Slay Count Vlad.', category: 'boss', order: 2, conditions: [{ metric: 'boss', targetId: 'count_vlad', target: 1 }], reward: { points: 20 } }),
  a({ id: 'boss_lich', name: 'Judge of the Dead', description: 'Slay the Ancient Lich.', category: 'boss', order: 3, conditions: [{ metric: 'boss', targetId: 'ancient_lich', target: 1 }], reward: { points: 25, title: 'Lichbane' } }),
  a({ id: 'boss_frost_giant', name: 'Frostbreaker', description: 'Slay the Frost Giant King.', category: 'boss', order: 4, conditions: [{ metric: 'boss', targetId: 'frost_giant_king', target: 1 }], reward: { points: 30 } }),
  a({ id: 'boss_tyrant', name: 'Tyrant Down', description: 'Slay the Tyrant of the Deep.', category: 'boss', order: 5, conditions: [{ metric: 'boss', targetId: 'tyrant_of_the_deep', target: 1 }], reward: { points: 30 } }),
  a({ id: 'boss_arch_demon', name: 'Demon Warden', description: 'Slay the Arch Demon.', category: 'boss', order: 6, conditions: [{ metric: 'boss', targetId: 'arch_demon', target: 1 }], reward: { points: 40 } }),
  a({ id: 'boss_magma', name: 'Heart of Flame Quenched', description: 'Slay the Magma Tyrant.', category: 'boss', order: 7, conditions: [{ metric: 'boss', targetId: 'magma_tyrant', target: 1 }], reward: { points: 40, cosmetic: 'aura_ember' } }),
  a({ id: 'boss_unmaker', name: 'The Unmaker Falls', description: 'Slay the Unmaker and end the prophecy.', category: 'boss', order: 8, conditions: [{ metric: 'boss', targetId: 'the_unmaker', target: 1 }], reward: { points: 100, title: 'Prophecy Ender', cosmetic: 'wings_abyss' } }),

  // ── ECONOMY ───────────────────────────────────────────────────────
  a({ id: 'econ_gold_10000', name: 'First Fortune', description: 'Earn 10,000 gold lifetime.', category: 'economy', order: 1, conditions: [{ metric: 'gold_earned_lifetime', target: 10000 }], reward: { points: 10 } }),
  a({ id: 'econ_gold_250000', name: 'Tycoon of the Frontier', description: 'Earn 250,000 gold lifetime.', category: 'economy', order: 2, conditions: [{ metric: 'gold_earned_lifetime', target: 250000 }], reward: { points: 30, title: 'the Tycoon' } }),
  a({ id: 'econ_gold_1_000_000', name: 'Untaxable', description: 'Earn 1,000,000 gold lifetime.', category: 'economy', order: 3, conditions: [{ metric: 'gold_earned_lifetime', target: 1000000 }], reward: { points: 75, title: 'Untaxable', cosmetic: 'crown_gold' } }),

  // ── RARE ──────────────────────────────────────────────────────────
  a({ id: 'rare_craft_1000', name: 'Master Artisan', description: 'Craft 1,000 items in total.', category: 'rare', order: 1, conditions: [{ metric: 'craft_count', target: 1000 }], reward: { points: 25 } }),
  a({ id: 'rare_items_10000', name: 'Collector', description: 'Collect 10,000 items in total.', category: 'rare', order: 2, conditions: [{ metric: 'items_collected', target: 10000 }], reward: { points: 25 } }),
  a({ id: 'rare_quests_20', name: 'Quest-Seeker', description: 'Complete 20 quests.', category: 'rare', order: 3, conditions: [{ metric: 'quest_completed', target: 20 }], reward: { points: 30, title: 'Quest-Seeker' } }),
  a({ id: 'rare_regions_8', name: 'Explorer', description: 'Visit all 8 regions.', category: 'rare', order: 4, conditions: [{ metric: 'region_visited', target: 8 }], reward: { points: 40, title: 'the Explorer', cosmetic: 'compass_charm' } }),
  a({ id: 'rare_playtime_100', name: 'Devoted', description: 'Log 100 hours of playtime.', category: 'rare', order: 5, conditions: [{ metric: 'playtime_hours', target: 100 }], reward: { points: 50, title: 'the Devoted' } }),

  // ── HIDDEN ────────────────────────────────────────────────────────
  a({ id: 'hidden_shadow_kill', name: 'Stalker of the Dark', hidden: true, description: 'Slay many shadow creatures deep in the marsh.', category: 'hidden', reward: { points: 40, title: 'the Stalker' }, conditions: [{ metric: 'kill', targetId: 'marsh_wraith', target: 25 }] }),
  a({ id: 'hidden_elite_hunter', name: 'The Phantom', hidden: true, description: 'Cut down a great many elite foes in a single region.', category: 'hidden', reward: { points: 25, cosmetic: 'shroud_phantom' }, conditions: [{ metric: 'kills_elite', target: 100 }] }),
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map((x) => [x.id, x])
);

export const ACHIEVEMENTS_BY_CATEGORY = ACHIEVEMENTS.reduce((acc, x) => {
  (acc[x.category] ??= []).push(x);
  return acc;
}, {} as Record<string, AchievementDefinition[]>);

export const TOTAL_ACHIEVEMENT_POINTS = ACHIEVEMENTS.reduce(
  (sum, x) => sum + x.reward.points,
  0
);
