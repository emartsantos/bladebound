// ─── ACHIEVEMENT DOMAIN ──────────────────────────────────────────────
// Milestone-based recognition of progression, combat, skill, collection,
// boss, economic, rare-event, and hidden challenges. Achievements are
// one-time milestone unlocks (not spammy frequent awards) with category
// completion %, points, cosmetic rewards, and titles.

export type AchievementCategory =
  | 'progression'   // reaching levels / total level
  | 'combat'        // kills, elite kills
  | 'skill'         // gathering / crafting skill milestones
  | 'collection'    // bestiary, dungeons, titles, collection entries
  | 'boss'          // defeating named bosses
  | 'economy'       // lifetime gold earned / spent
  | 'rare'          // rare events & challenges
  | 'hidden';       // secret achievements (hidden until earnable)

// The metric an achievement measures. Most are read from live player
// state; counter-backed metrics accumulate in state.counters from events.
export type AchievementMetric =
  | 'level'                // current player level
  | 'total_level'          // sum of all skill levels
  | 'skill'                // a specific skill level (targetId = skillId)
  | 'kill'                 // lifetime kills of a specific enemy (targetId = enemyId)
  | 'boss'                 // defeating a named boss (targetId = enemyId)
  | 'kills_total'          // lifetime enemy kills (counter)
  | 'kills_elite'          // lifetime elite kills (counter)
  | 'dungeon_completed'    // total dungeon completions (counter; no targetId)
  | 'dungeon_specific'     // completions of one dungeon (counter; targetId = dungeonId)
  | 'region_visited'       // distinct regions visited (top-level context)
  | 'quest_completed'      // total quests completed
  | 'bestiary_defeated'    // distinct enemies defeated
  | 'bestiary_completed'   // distinct enemies fully completed
  | 'collection_entries'   // number of distinct collection entries granted
  | 'titles_owned'         // number of titles currently owned
  | 'gold_earned_lifetime' // currency earned over all time (counter)
  | 'items_collected'      // lifetime items collected (counter)
  | 'craft_count'          // lifetime items crafted (counter)
  | 'gather_count'         // lifetime gathering actions (counter)
  | 'playtime_hours';      // total play time

export interface AchievementCondition {
  metric: AchievementMetric;
  target: number;      // threshold that must be met or exceeded
  targetId?: string;   // for metrics that need a specific entity id
}

export interface AchievementReward {
  // GamerScore-style points awarded toward a total.
  points: number;
  title?: string;        // title string granted on completion
  cosmetic?: string;     // cosmetic id granted on completion
  collectionEntries?: string[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  // All conditions must be met before the achievement is awarded.
  conditions: AchievementCondition[];
  reward: AchievementReward;
  // Secret/hidden achievements are not revealed until the player is near
  // or has met them.
  hidden?: boolean;
  // Optional sort order within a category.
  order?: number;
}

// ─── PLAYER STATE ────────────────────────────────────────────────────

export interface AchievementProgressState {
  achievementId: string;
  current: number;     // 0..1 of the achievement (min condition ratio, diagnostic only)
  completed: boolean;
  completedAt: number | null;
}

export interface AchievementRecord {
  achievementId: string;
  completedAt: number;
  points: number;
  title?: string;
  cosmetic?: string;
  collectionEntries?: string[];
}

export interface AchievementCounters {
  // Lifetime accumulators surfaced by achievement metrics.
  kills_total: number;
  kills_elite: number;
  gold_earned_lifetime: number;
  items_collected: number;
  craft_count: number;
  gather_count: number;
  dungeon_completed_total: number;
  dungeon_completed: Record<string, number>;
  playtime_hours: number;
  [key: string]: number | Record<string, number>;
}

export interface PlayerAchievementState {
  // Per-achievement progress (all definitions, whether earned or not)
  progress: Record<string, AchievementProgressState>;
  // Completed achievement records
  completed: Record<string, AchievementRecord>;
  // Counter-backed lifetime metrics
  counters: AchievementCounters;
  // Aggregates
  totalPoints: number;
  totalCompleted: number;
  earnedTitles: string[];
  earnedCosmetics: string[];
  collectionEntries: string[];
}
