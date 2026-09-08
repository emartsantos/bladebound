import type {
  AchievementCondition,
  AchievementDefinition,
  AchievementMetric,
  PlayerAchievementState,
} from '@premium-rpg/shared-types';

// ─── LIVE SNAPSHOT ───────────────────────────────────────────────────
// Real-time values the achievement engine reads from the player's current
// state. The engine resolves most metrics against this snapshot; only
// lifetime accumulators (kills, gold, crafts, gathers, items, dungeon
// completions) are tracked incrementally in state.counters from events.
export interface AchievementSnapshot {
  level: number;
  totalLevel: number;
  skillLevel: (skillId: string) => number;
  bestiaryDefeated: number;
  bestiaryCompleted: number;
  bestiaryKillCount: (enemyId: string) => number;
  regionVisitedCount: number;
  questCompleted: number;
  collectionEntryCount: number;
  titleCount: number;
  playtimeHours: number;
}

// ─── ACHIEVEMENT EVENTS ──────────────────────────────────────────────
// A slim, purpose-built event stream (distinct from the quest/task bus)
// feeding achievement counters.
export type AchievementEventType =
  | 'enemy_killed'
  | 'resource_gathered'
  | 'item_crafted'
  | 'item_collected'
  | 'dungeon_completed'
  | 'region_visited'
  | 'money_earned';

export interface AchievementEvent {
  type: AchievementEventType;
  enemyId?: string;
  isElite?: boolean;
  skillId?: string;
  resourceId?: string;
  itemId?: string;
  dungeonId?: string;
  regionId?: string;
  quantity?: number;
  amount?: number;
}

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createAchievementState(definitions: AchievementDefinition[]): PlayerAchievementState {
  const progress: PlayerAchievementState['progress'] = {};
  for (const d of definitions) {
    progress[d.id] = {
      achievementId: d.id,
      current: 0,
      completed: false,
      completedAt: null,
    };
  }
  return {
    progress,
    completed: {},
    counters: {
      kills_total: 0,
      kills_elite: 0,
      gold_earned_lifetime: 0,
      items_collected: 0,
      craft_count: 0,
      gather_count: 0,
      dungeon_completed_total: 0,
      dungeon_completed: {},
      playtime_hours: 0,
    },
    totalPoints: 0,
    totalCompleted: 0,
    earnedTitles: [],
    earnedCosmetics: [],
    collectionEntries: [],
  };
}

// ─── COUNTER ACCUMULATION ────────────────────────────────────────────

function accumulate(state: PlayerAchievementState, event: AchievementEvent): void {
  const qty = typeof event.quantity === 'number' ? event.quantity : 1;
  switch (event.type) {
    case 'enemy_killed':
      state.counters.kills_total += qty;
      if (event.isElite) state.counters.kills_elite += qty;
      break;
    case 'resource_gathered':
      state.counters.gather_count += qty;
      break;
    case 'item_crafted':
      state.counters.craft_count += qty;
      break;
    case 'item_collected':
      state.counters.items_collected += qty;
      break;
    case 'dungeon_completed':
      state.counters.dungeon_completed_total += 1;
      if (event.dungeonId) {
        state.counters.dungeon_completed[event.dungeonId] =
          (state.counters.dungeon_completed[event.dungeonId] ?? 0) + 1;
      }
      break;
    case 'money_earned':
      state.counters.gold_earned_lifetime += event.amount ?? 0;
      break;
    case 'region_visited':
      // Distinct-region count is read live from the snapshot; nothing to
      // accumulate here.
      break;
  }
}

// ─── METRIC RESOLUTION ───────────────────────────────────────────────

function resolveMetric(
  state: PlayerAchievementState,
  snapshot: AchievementSnapshot,
  metric: AchievementMetric,
  targetId: string | undefined
): number {
  switch (metric) {
    case 'level':
      return snapshot.level;
    case 'total_level':
      return snapshot.totalLevel;
    case 'skill':
      return targetId ? snapshot.skillLevel(targetId) : 0;
    case 'kill':
    case 'boss':
      return targetId ? snapshot.bestiaryKillCount(targetId) : 0;
    case 'kills_total':
      return state.counters.kills_total;
    case 'kills_elite':
      return state.counters.kills_elite;
    case 'dungeon_completed':
      return state.counters.dungeon_completed_total;
    case 'dungeon_specific':
      return targetId ? (state.counters.dungeon_completed[targetId] ?? 0) : 0;
    case 'region_visited':
      return snapshot.regionVisitedCount;
    case 'quest_completed':
      return snapshot.questCompleted;
    case 'bestiary_defeated':
      return snapshot.bestiaryDefeated;
    case 'bestiary_completed':
      return snapshot.bestiaryCompleted;
    case 'collection_entries':
      return snapshot.collectionEntryCount;
    case 'titles_owned':
      return snapshot.titleCount;
    case 'gold_earned_lifetime':
      return state.counters.gold_earned_lifetime;
    case 'items_collected':
      return state.counters.items_collected;
    case 'craft_count':
      return state.counters.craft_count;
    case 'gather_count':
      return state.counters.gather_count;
    case 'playtime_hours':
      return snapshot.playtimeHours;
  }
  return 0;
}

function conditionMet(
  state: PlayerAchievementState,
  snapshot: AchievementSnapshot,
  condition: AchievementCondition
): { met: boolean; ratio: number } {
  const value = resolveMetric(state, snapshot, condition.metric, condition.targetId);
  const ratio = condition.target > 0 ? Math.min(1, value / condition.target) : value > 0 ? 1 : 0;
  return { met: value >= condition.target, ratio };
}

// ─── PROCESSING ──────────────────────────────────────────────────────

export interface AchievementRewardGrant {
  achievementId: string;
  points: number;
  title?: string;
  cosmetic?: string;
  collectionEntries?: string[];
}

export interface AchievementProcessResult {
  newlyAwarded: AchievementRewardGrant[];
}

/**
 * Accumulates counters from an event, then checks every incomplete
 * achievement definition against the live snapshot, awarding rewards for
 * any whose conditions are all met. Returns the newly awarded grants as a
 * payload for the caller/server to reconcile.
 */
export function processAchievementEvent(
  state: PlayerAchievementState,
  definitions: AchievementDefinition[],
  snapshot: AchievementSnapshot,
  event: AchievementEvent,
  now: number
): AchievementProcessResult {
  accumulate(state, event);
  const newlyAwarded: AchievementRewardGrant[] = [];

  for (const def of definitions) {
    const progress = state.progress[def.id];
    if (!progress || progress.completed) continue;

    let current = 1;
    let allMet = true;
    for (const condition of def.conditions) {
      const { met, ratio } = conditionMet(state, snapshot, condition);
      current = Math.min(current, ratio);
      if (!met) {
        allMet = false;
      }
    }
    progress.current = current;
    if (!allMet) continue;

    progress.completed = true;
    progress.completedAt = now;
    state.totalPoints += def.reward.points;
    state.totalCompleted += 1;

    const grant: AchievementRewardGrant = {
      achievementId: def.id,
      points: def.reward.points,
      title: def.reward.title,
      cosmetic: def.reward.cosmetic,
      collectionEntries: def.reward.collectionEntries,
    };

    if (def.reward.title) {
      state.earnedTitles.push(def.reward.title);
      grant.title = def.reward.title;
    }
    if (def.reward.cosmetic) {
      state.earnedCosmetics.push(def.reward.cosmetic);
      grant.cosmetic = def.reward.cosmetic;
    }
    if (def.reward.collectionEntries) {
      for (const e of def.reward.collectionEntries) state.collectionEntries.push(e);
      grant.collectionEntries = def.reward.collectionEntries;
    }

    state.completed[def.id] = {
      achievementId: def.id,
      completedAt: now,
      points: def.reward.points,
      title: def.reward.title,
      cosmetic: def.reward.cosmetic,
      collectionEntries: def.reward.collectionEntries,
    };

    newlyAwarded.push(grant);
  }

  return { newlyAwarded };
}

// ─── QUERIES ─────────────────────────────────────────────────────────

export function isAchievementCompleted(state: PlayerAchievementState, achievementId: string): boolean {
  return state.completed[achievementId] !== undefined;
}

export function getTotalPoints(state: PlayerAchievementState): number {
  return state.totalPoints;
}

export function getCompletionRatio(state: PlayerAchievementState, definitions: AchievementDefinition[]): number {
  if (definitions.length === 0) return 0;
  return state.totalCompleted / definitions.length;
}

export function getCategoryCompletion(
  state: PlayerAchievementState,
  definitions: AchievementDefinition[],
  category: AchievementDefinition['category']
): { completed: number; total: number; ratio: number } {
  const filtered = definitions.filter((d) => d.category === category);
  const total = filtered.length;
  const completed = filtered.filter((d) => state.completed[d.id] !== undefined).length;
  return { completed, total, ratio: total > 0 ? completed / total : 0 };
}

export function getCategoryPercentages(
  state: PlayerAchievementState,
  definitions: AchievementDefinition[]
): Record<AchievementDefinition['category'], number> {
  const buckets: Record<string, { completed: number; total: number }> = {};
  for (const d of definitions) {
    const b = buckets[d.category] ?? { completed: 0, total: 0 };
    b.total += 1;
    if (state.completed[d.id]) b.completed += 1;
    buckets[d.category] = b;
  }
  const result = {} as Record<AchievementDefinition['category'], number>;
  for (const key of Object.keys(buckets)) {
    const b = buckets[key];
    result[key as AchievementDefinition['category']] = Math.round(((b.completed / b.total) * 1000)) / 10;
  }
  return result;
}
