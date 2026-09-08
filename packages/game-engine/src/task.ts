import type {
  PlayerTaskState,
  TaskAssignment,
  TaskDefinition,
  TaskGroup,
  TaskSeedingOptions,
  QuestEvent,
} from '@premium-rpg/shared-types';

// ─── CYCLE KEYS ──────────────────────────────────────────────────────
// Daily cycle: D-YYYY-MM-DD (local date). Weekly cycle: W-YYYY-WW (ISO week).

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dailyKey(date: Date): string {
  return `D-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ISO-8601 week number (same week rules as most calendar UIs).
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return week;
}

export function weeklyKey(date: Date): string {
  const year = date.getFullYear();
  const week = isoWeekNumber(date);
  return `W-${year}-${pad(week)}`;
}

// ─── SEEDED RNG ──────────────────────────────────────────────────────
// Deterministic PRNG (mulberry32) so server and clients agree on which
// tasks appear for a given cycle key.

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── POOL SELECTION ──────────────────────────────────────────────────

function selectFromPool(
  pool: TaskDefinition[],
  group: TaskGroup,
  cycleKey: string,
  count: number,
  level: number
): TaskAssignment[] {
  const eligible = pool.filter(
    (d) => d.group === group && (d.levelRequirement === undefined || level >= d.levelRequirement)
  );
  if (eligible.length === 0) return [];

  const rand = mulberry32(hashString(`${cycleKey}:${group}`));
  const ordered = [...eligible];
  // Deterministic shuffle via seeded rng.
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }

  return ordered.slice(0, Math.min(count, ordered.length)).map((d) => toAssignment(d, group, parseCycleStart(group, cycleKey)));
}

function parseCycleStart(group: TaskGroup, cycleKey: string): number {
  // Approximate start timestamp: daily noon UTC, weekly Monday noon UTC.
  if (group === 'daily') {
    const parts = cycleKey.split('-'); // D YYYY MM DD
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), 12).getTime();
  }
  const parts = cycleKey.split('-'); // W YYYY WW
  const year = Number(parts[1]);
  const week = Number(parts[2]);
  const jan4 = new Date(year, 0, 4, 12);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday=0
  jan4.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  return jan4.getTime();
}

function toAssignment(
  d: TaskDefinition,
  group: TaskGroup,
  assignedAt: number
): TaskAssignment {
  return {
    taskId: d.id,
    group,
    objectiveType: d.objective.type,
    objectiveTarget: d.objective.targetId ?? null,
    skillId: d.objective.skillId ?? null,
    regionId: d.objective.regionId ?? null,
    required: d.objective.required,
    current: 0,
    completed: false,
    claimed: false,
    assignedAt,
  };
}

// ─── STATE FACTORY ───────────────────────────────────────────────────

export function createTaskState(): PlayerTaskState {
  return {
    daily: {},
    weekly: {},
    catchUpClaims: [],
    totalTasksCompleted: 0,
    history: [],
  };
}

export interface CurrentTasks {
  daily: TaskAssignment[];
  weekly: TaskAssignment[];
}

/**
 * Ensures the current daily and weekly task sets are seeded (idempotent:
 * only seeds a cycle once). Pure selection — callers pass the pools.
 */
export function ensureCurrentTasks(
  state: PlayerTaskState,
  pool: TaskDefinition[],
  selection: TaskSeedingOptions,
  today: Date,
  level: number
): CurrentTasks {
  const dk = dailyKey(today);
  const wk = weeklyKey(today);
  if (!state.daily[dk]) {
    state.daily[dk] = selectFromPool(pool, 'daily', dk, selection.dailyCount, level);
  }
  if (!state.weekly[wk]) {
    state.weekly[wk] = selectFromPool(pool, 'weekly', wk, selection.weeklyCount, level);
  }
  return { daily: state.daily[dk], weekly: state.weekly[wk] };
}

export function getCurrentTasks(
  state: PlayerTaskState,
  today: Date
): CurrentTasks {
  return {
    daily: state.daily[dailyKey(today)] ?? [],
    weekly: state.weekly[weeklyKey(today)] ?? [],
  };
}

// ─── PROGRESS ────────────────────────────────────────────────────────

function matches(assignment: TaskAssignment, event: QuestEvent): boolean {
  switch (assignment.objectiveType) {
    case 'kill':
      if (event.type !== 'enemy_killed') return false;
      if (assignment.objectiveTarget && event.enemyId !== assignment.objectiveTarget) return false;
      if (assignment.regionId && event.regionId !== assignment.regionId) return false;
      return true;
    case 'gather':
      if (event.type !== 'resource_gathered') return false;
      if (assignment.skillId && event.skillId !== assignment.skillId) return false;
      if (assignment.objectiveTarget && event.resourceId !== assignment.objectiveTarget) return false;
      return true;
    case 'craft':
      return event.type === 'item_crafted' && event.itemId === assignment.objectiveTarget;
    case 'collect':
      return event.type === 'item_collected' && event.itemId === assignment.objectiveTarget;
    case 'complete_dungeon':
      return event.type === 'dungeon_completed' && event.dungeonId === assignment.objectiveTarget;
  }
  return false;
}

function eventAmount(event: QuestEvent): number {
  if (typeof event.amount === 'number' && event.amount > 0) return event.amount;
  if (typeof event.quantity === 'number' && event.quantity > 0) return event.quantity;
  return 1;
}

export interface TaskEventResult {
  changed: TaskAssignment[];
  newlyCompleted: TaskAssignment[];
}

/**
 * Feeds a gameplay event into the engine, advancing every active
 * (unclaimed) assignment across the current cycle sets.
 * Returns assignments whose progress changed and those newly completed.
 */
export function processTaskEvent(
  state: PlayerTaskState,
  today: Date,
  event: QuestEvent
): TaskEventResult {
  const changed: TaskAssignment[] = [];
  const newlyCompleted: TaskAssignment[] = [];
  const { daily, weekly } = getCurrentTasks(state, today);
  for (const assignment of [...daily, ...weekly]) {
    if (assignment.claimed || assignment.completed) continue;
    if (!matches(assignment, event)) continue;
    const amount = eventAmount(event);
    assignment.current = Math.min(assignment.current + amount, assignment.required);
    changed.push(assignment);
    if (assignment.current >= assignment.required) {
      assignment.completed = true;
      newlyCompleted.push(assignment);
    }
  }
  return { changed, newlyCompleted };
}

// ─── CLAIMING & NON-FOMO CATCH-UP ────────────────────────────────────

export function isAssignmentCompletable(assignment: TaskAssignment): boolean {
  return assignment.completed;
}

export interface TaskClaimResult {
  reward: TaskDefinition['reward'];
  assignment: TaskAssignment;
  // true if claimed from the catch-up bank (a past completion)
  fromCatchUp: boolean;
}

/**
 * Claims a completed task's reward. Assignments from prior cycles that
 * were completed but unclaimed are kept in the catch-up bank so a missed
 * day never permanently loses rewards. The caller provides the reward
 * definition resolver.
 */
export function claimTask(
  state: PlayerTaskState,
  assignment: TaskAssignment,
  rewardFor: (taskId: string) => TaskDefinition['reward'] | undefined,
  now: number
): TaskClaimResult | null {
  if (!assignment.completed || assignment.claimed) return null;
  const reward = rewardFor(assignment.taskId);
  if (!reward) return null;

  assignment.claimed = true;
  state.totalTasksCompleted += 1;
  state.history.push({ taskId: assignment.taskId, completedAt: now, group: assignment.group });

  // If this is a current-cycle assignment, keep it in place.
  // If it's a prior-cycle assignment (already in the bank), remove it there.
  removeFromBank(state, assignment);

  return { reward, assignment, fromCatchUp: false };
}

/**
 * Moves unclaimed/completed assignments from a past cycle into the
 * catch-up bank, capped at `maxBanked`. This is the non-FOMO buffer: even
 * after the cycle rolls over, completed tasks can still be claimed.
 */
export function bankExpiredCompletions(
  state: PlayerTaskState,
  currentDailyKey: string,
  currentWeeklyKey: string,
  maxBanked: number
): number {
  let banked = 0;
  const collect = () => {
    for (const key of Object.keys(state.daily)) {
      if (key === currentDailyKey) continue;
      const remaining = state.daily[key].filter((a) => a.completed && !a.claimed);
      for (const a of remaining) {
        if (banked >= maxBanked) break;
        state.catchUpClaims.push(a);
        banked += 1;
      }
      state.daily[key] = state.daily[key].filter((a) => a.completed && a.claimed);
    }
    for (const key of Object.keys(state.weekly)) {
      if (key === currentWeeklyKey) continue;
      const remaining = state.weekly[key].filter((a) => a.completed && !a.claimed);
      for (const a of remaining) {
        if (banked >= maxBanked) break;
        state.catchUpClaims.push(a);
        banked += 1;
      }
      state.weekly[key] = state.weekly[key].filter((a) => a.completed && a.claimed);
    }
  };
  collect();
  return banked;
}

function removeFromBank(state: PlayerTaskState, assignment: TaskAssignment): void {
  const idx = state.catchUpClaims.findIndex((a) => a.taskId === assignment.taskId);
  if (idx !== -1) state.catchUpClaims.splice(idx, 1);
}

export function claimCatchUp(
  state: PlayerTaskState,
  index: number,
  rewardFor: (taskId: string) => TaskDefinition['reward'] | undefined,
  now: number
): TaskClaimResult | null {
  const assignment = state.catchUpClaims[index];
  if (!assignment || assignment.claimed) return null;
  return claimTask(state, assignment, rewardFor, now);
}

// ─── QUERIES ─────────────────────────────────────────────────────────

export function getActiveTaskSummaries(
  state: PlayerTaskState,
  today: Date
): Array<{ assignment: TaskAssignment; key: string; cycle: TaskGroup }> {
  const out: Array<{ assignment: TaskAssignment; key: string; cycle: TaskGroup }> = [];
  for (const key of Object.keys(state.daily)) {
    for (const a of state.daily[key]) {
      out.push({ assignment: a, key, cycle: 'daily' });
    }
  }
  for (const key of Object.keys(state.weekly)) {
    for (const a of state.weekly[key]) {
      out.push({ assignment: a, key, cycle: 'weekly' });
    }
  }
  return out;
}
