// ─── TASK DOMAIN ─────────────────────────────────────────────────────
// Optional, repeatable content: daily tasks, weekly contracts, monster
// contracts, gathering orders, and crafting orders. Designed to avoid
// manipulative FOMO — a missed day never permanently disadvantages the
// player (see catch-up tokens below).

export type TaskGroup = 'daily' | 'weekly';

export type TaskKind =
  | 'daily'            // general small daily objective
  | 'weekly'           // larger weekly contract
  | 'monster_contract' // kill N of a specific enemy (or in a region)
  | 'gathering_order'  // gather N of a resource via a skill
  | 'crafting_order'   // craft N of a specific item
  | 'dungeon_contract';// complete a dungeon

export type TaskObjectiveType =
  | 'kill'               // kill N enemies (target or region)
  | 'gather'             // gather N resources with a skill
  | 'craft'              // craft N of an item
  | 'collect'            // collect/obtain N of an item
  | 'complete_dungeon';  // complete a dungeon N times

export interface TaskObjective {
  type: TaskObjectiveType;
  // Target references (which entity to count)
  targetId?: string;         // enemy id, item id, dungeon id
  skillId?: string;          // for gather
  regionId?: string;         // optional region scoping for kill/gather
  required: number;
}

export interface TaskReward {
  experience: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
  skillExperience?: Record<string, number>;
}

export interface TaskDefinition {
  id: string;
  name: string;
  group: TaskGroup;          // which selection pool this belongs to
  kind: TaskKind;
  description: string;
  regionId?: string;
  levelRequirement?: number; // optional gate for daily/weekly selection
  objective: TaskObjective;
  reward: TaskReward;
  weight?: number;           // selection weight within its pool
  maxPerWeek?: number;       // weekly selection cap
}

// ─── TASK ASSIGNMENT & PROGRESS ──────────────────────────────────────

export interface TaskAssignment {
  taskId: string;
  group: TaskGroup;
  objectiveType: TaskObjectiveType;
  objectiveTarget: string | null;  // resolved target id (for UI/tracking)
  skillId: string | null;
  regionId: string | null;
  required: number;
  current: number;
  completed: boolean;
  claimed: boolean;          // reward already claimed
  assignedAt: number;
}

export interface TaskCompletionRecord {
  taskId: string;
  completedAt: number;
  group: TaskGroup;
}

// ─── PLAYER TASK STATE ───────────────────────────────────────────────
// Cycle keys: daily uses 'D-YYYY-MM-DD', weekly uses 'W-YYYY-WW'
// (ISO week). Assignments are stored per cycle so history is inspectable.

export interface PlayerTaskState {
  daily: Record<string, TaskAssignment[]>;   // dateKey -> daily assignments
  weekly: Record<string, TaskAssignment[]>;  // weekKey -> weekly assignments
  // Non-FOMO catch-up: completed-but-unclaimed completions are banked and
  // can be claimed later, so a missed day never permanently loses rewards.
  catchUpClaims: TaskAssignment[];           // banked unclaimed completions
  totalTasksCompleted: number;
  history: TaskCompletionRecord[];
}

// ─── SEEDING ─────────────────────────────────────────────────────────
// Deterministic pseudo-random selection from a pool for a given cycle,
// so the same date/week yields the same assignments across clients and
// server (important for save integrity).
export interface TaskSeedingOptions {
  // Number of tasks to select from the daily/weekly pool.
  dailyCount: number;
  weeklyCount: number;
}
