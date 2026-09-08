import type {
  PlayerQuestState,
  QuestDefinition,
  QuestEvent,
  QuestObjective,
  QuestProgressState,
  QuestStatus,
  UnlockCondition,
} from '@premium-rpg/shared-types';

// ─── CONTEXT ─────────────────────────────────────────────────────────
// External facts the quest engine needs to evaluate availability and
// prerequisites. Systems that hold player state build this themselves.
export interface QuestContext {
  level: number;
  skills: Record<string, number>;
  region: string;
  // Pre-granted unlocks (from other systems / save state)
  unlocks?: Record<string, boolean>;
  completedQuestIds?: string[];
  achievedQuestTarget?: (condition: UnlockCondition) => boolean;
}

export interface QuestRewardGrant {
  experience: number;
  gold: number;
  items: { itemId: string; quantity: number }[];
  skillExperience: Record<string, number>;
  unlocks: { key: string; type: string; label: string }[];
  titles: string[];
  collectionEntries: string[];
}

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createQuestState(): PlayerQuestState {
  return {
    active: {},
    completed: {},
    unlocks: {},
    chains: {},
  };
}

// ─── AVAILABILITY & PREREQUISITES ────────────────────────────────────

function evalCondition(
  condition: UnlockCondition,
  ctx: QuestContext,
  state: PlayerQuestState
): boolean {
  switch (condition.type) {
    case 'level': {
      const actual = ctx.level;
      const target = condition.value;
      switch (condition.comparison) {
        case 'gte': return actual >= target;
        case 'gt': return actual > target;
        case 'lte': return actual <= target;
        case 'lt': return actual < target;
        case 'eq': return actual === target;
      }
      return false;
    }
    case 'quest': {
      if (ctx.achievedQuestTarget) {
        return ctx.achievedQuestTarget(condition);
      }
      if (ctx.completedQuestIds && ctx.completedQuestIds.includes(condition.target)) {
        return true;
      }
      return !!state.completed[condition.target];
    }
    case 'item':
      // Requires an external resolver (inventory query). If none provided,
      // fall back to an unlock marker keyed by item id.
      return hasUnlock(state, `item:${condition.target}`);
    case 'achievement':
      return hasUnlock(state, `achievement:${condition.target}`);
    case 'collection':
      return hasUnlock(state, `collection:${condition.target}`);
  }
  return false;
}

export function prerequisitesMet(
  definition: QuestDefinition,
  state: PlayerQuestState,
  ctx: QuestContext
): boolean {
  // Chain prerequisite: the defined parent quest must be completed.
  if (definition.chain) {
    if (ctx.completedQuestIds && ctx.completedQuestIds.includes(definition.chain.questId)) {
      // ok
    } else if (!state.completed[definition.chain.questId]) {
      return false;
    }
  }
  if (definition.prerequisites) {
    for (const cond of definition.prerequisites) {
      if (!evalCondition(cond, ctx, state)) return false;
    }
  }
  // Level gate
  if (ctx.level < definition.recommendedLevel) return false;
  return true;
}

export function isQuestAvailable(
  definition: QuestDefinition,
  state: PlayerQuestState,
  ctx: QuestContext
): boolean {
  if (state.completed[definition.id]) return false;
  if (state.active[definition.id]) return false;
  return prerequisitesMet(definition, state, ctx);
}

export function getAvailableQuests(
  definitions: QuestDefinition[],
  state: PlayerQuestState,
  ctx: QuestContext
): QuestDefinition[] {
  return definitions.filter((d) => isQuestAvailable(d, state, ctx));
}

// ─── START / ABANDON ─────────────────────────────────────────────────

export function startQuest(
  state: PlayerQuestState,
  definition: QuestDefinition,
  now: number
): QuestProgressState {
  const objectives: Record<string, QuestProgressState['objectives'][string]> = {};
  for (const o of definition.objectives) {
    objectives[o.id] = {
      objectiveId: o.id,
      current: 0,
      completed: false,
      completedAt: null,
    };
  }
  const progress: QuestProgressState = {
    questId: definition.id,
    status: 'active',
    startedAt: now,
    completedAt: null,
    objectives,
    currentCycle: 1,
  };
  state.active[definition.id] = progress;

  // Register chain membership if provided.
  if (definition.chain && definition.chain.questId) {
    const chainKey = definition.chain.questId;
    if (!state.chains[chainKey]) state.chains[chainKey] = [];
    const ordered = state.chains[chainKey];
    if (!ordered.includes(definition.id)) {
      ordered.push(definition.id);
      ordered.sort();
    }
  }

  return progress;
}

export function abandonQuest(
  state: PlayerQuestState,
  definition: QuestDefinition
): boolean {
  // Only abandonable quests can be removed; otherwise keep it.
  if (definition.abandonable === false) return false;
  if (!state.active[definition.id]) return false;
  delete state.active[definition.id];
  return true;
}

// ─── OBJECTIVE MATCHING ──────────────────────────────────────────────

function matchesObjective(
  objective: QuestObjective,
  event: QuestEvent
): boolean {
  switch (objective.type) {
    case 'kill':
      if (event.type !== 'enemy_killed') return false;
      if (objective.targetId && event.enemyId !== objective.targetId) return false;
      if (objective.targetRegionId && event.regionId !== objective.targetRegionId) return false;
      return true;
    case 'collect':
      return event.type === 'item_collected' && event.itemId === objective.targetId;
    case 'craft':
      return event.type === 'item_crafted' && event.itemId === objective.targetId;
    case 'gather':
      if (event.type !== 'resource_gathered') return false;
      if (objective.skillId && event.skillId !== objective.skillId) return false;
      if (objective.targetId && event.resourceId !== objective.targetId) return false;
      return true;
    case 'visit_region':
      return event.type === 'region_visited' && event.regionId === objective.targetId;
    case 'complete_dungeon':
      return event.type === 'dungeon_completed' && event.dungeonId === objective.targetId;
    case 'equip_item':
      return event.type === 'item_equipped' && event.slot === objective.slot;
    case 'reach_skill_level':
      return (
        event.type === 'skill_leveled' &&
        event.skillId === objective.skillId &&
        Number(event.newLevel) >= objective.required
      );
    case 'interact_npc':
      return event.type === 'npc_interacted' && event.npcId === objective.targetId;
  }
  return false;
}

function eventAmount(event: QuestEvent): number {
  if (typeof event.amount === 'number' && event.amount > 0) return event.amount;
  if (typeof event.quantity === 'number' && event.quantity > 0) return event.quantity;
  return 1;
}

// Objectives whose `required` is a condition value rather than a quantity
// to accumulate. A single matching event satisfies them.
const BINARY_OBJECTIVE_TYPES = new Set<QuestObjective['type']>([
  'reach_skill_level',
  'visit_region',
  'complete_dungeon',
  'interact_npc',
  'equip_item',
]);

function isBinaryObjective(objective: QuestObjective): boolean {
  return BINARY_OBJECTIVE_TYPES.has(objective.type);
}

/**
 * Feeds a game event into the quest engine, advancing matching objectives
 * on all active quests. Requires the quest definition database because
 * objective type/spec lives on the definitions, while the save state only
 * stores progress counters. Returns the list of quest ids whose progression
 * changed (including newly-completable quests).
 */
export function processQuestEvent(
  state: PlayerQuestState,
  definitionById: Record<string, QuestDefinition>,
  event: QuestEvent,
  now: number
): string[] {
  const changed: string[] = [];
  for (const questId of Object.keys(state.active)) {
    const progress = state.active[questId];
    if (progress.status !== 'active') continue;
    const quest = definitionById[questId];
    if (!quest) continue;

    let progressed = false;
    for (const objective of quest.objectives) {
      const p = progress.objectives[objective.id];
      if (!p || p.completed) continue;
      if (matchesObjective(objective, event)) {
        if (isBinaryObjective(objective)) {
          // Single-condition objective (skill level, visit, dungeon, npc,
          // equip): one matching event satisfies it; `required` is the
          // threshold value to record, not a count to accumulate.
          p.current = objective.required;
          p.completed = true;
          p.completedAt = now;
        } else {
          const amount = eventAmount(event);
          p.current = Math.min(p.current + amount, objective.required);
          if (p.current >= objective.required) {
            p.completed = true;
            p.completedAt = now;
          }
        }
        progressed = true;
      }
    }

    if (progressed) {
      changed.push(questId);
    }
  }
  return changed;
}

// ─── COMPLETION ──────────────────────────────────────────────────────

export function isQuestCompletable(progress: QuestProgressState): boolean {
  return Object.values(progress.objectives).every((o) => o.completed);
}

/**
 * Marks a quest complete and materializes its rewards. Returns the grant
 * payload the caller should apply (xp, gold, items, skill xp, unlocks).
 */
export function completeQuest(
  state: PlayerQuestState,
  definition: QuestDefinition,
  now: number
): QuestRewardGrant | null {
  const progress = state.active[definition.id] ?? ({ status: 'active' } as QuestProgressState);
  if (!isQuestCompletable(progress) && progress.status === 'active') {
    return null;
  }

  const rewards = definition.rewards;
  const grant: QuestRewardGrant = {
    experience: rewards.experience,
    gold: rewards.gold,
    items: rewards.items ?? [],
    skillExperience: rewards.skillExperience ?? {},
    unlocks: (rewards.unlocks ?? []).map((u) => ({ key: u.key, type: u.type, label: u.label })),
    titles: rewards.titles ?? [],
    collectionEntries: rewards.collectionEntries ?? [],
  };

  const record = state.completed[definition.id] ?? { questId: definition.id, completedAt: now, unlocksGranted: [] };
  record.completedAt = now;
  record.unlocksGranted = grant.unlocks.map((u) => u.key);
  state.completed[definition.id] = record;

  // Grant unlocks to the player-wide registry.
  for (const u of grant.unlocks) {
    state.unlocks[u.key] = true;
  }
  for (const coll of grant.collectionEntries) {
    state.unlocks[coll] = true;
  }

  delete state.active[definition.id];
  return grant;
}

// ─── QUERIES ─────────────────────────────────────────────────────────

export function hasUnlock(state: PlayerQuestState, key: string): boolean {
  return state.unlocks[key] === true;
}

export function getQuestChainProgress(
  state: PlayerQuestState,
  chainQuestIds: string[]
): { questId: string; status: 'completed' | 'active' | 'locked' | 'available' }[] {
  return chainQuestIds.map((id) => {
    if (state.completed[id]) return { questId: id, status: 'completed' };
    if (state.active[id]) return { questId: id, status: 'active' };
    return { questId: id, status: 'locked' };
  });
}

export function getComputedQuestStatus(
  definition: QuestDefinition,
  state: PlayerQuestState,
  ctx: QuestContext
): QuestStatus {
  if (state.completed[definition.id]) return 'completed';
  if (state.active[definition.id]) return 'active';
  if (prerequisitesMet(definition, state, ctx)) return 'available';
  return 'failed';
}
