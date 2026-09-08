import type { EquipmentSlot } from './item';
import type { UnlockCondition } from './domain';

// ─── QUEST OBJECTIVE TYPES ───────────────────────────────────────────

export type QuestObjectiveType =
  | 'kill'               // defeat N of a specific enemy (or any enemy in a region)
  | 'collect'            // obtain N of a specific item
  | 'craft'              // craft N of a specific item
  | 'gather'             // gather N of a resource via a gathering skill
  | 'visit_region'       // visit a specific region
  | 'complete_dungeon'   // complete a dungeon run
  | 'equip_item'         // equip an item in a slot
  | 'reach_skill_level'  // reach a skill level
  | 'interact_npc';      // interact with an NPC

// Shared target payload fields per objective type. Keep flat and optional
// so the engine can validate generically.
export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  description: string;          // human-readable goal shown in the journal
  // Target references (which entity to count)
  targetId?: string;            // enemy id, item id, dungeon id, region id, NPC id
  targetRegionId?: string;      // for kill/gather in a specific region (optional)
  slot?: EquipmentSlot;         // for equip_item
  skillId?: string;             // for gather / reach_skill_level
  // Threshold
  required: number;             // how many to complete
  // Optional hidden-from-journal flag (spoilery/lore objectives)
  hidden?: boolean;
}

// ─── QUEST REWARDS ───────────────────────────────────────────────────

export interface QuestReward {
  experience: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
  // Skill XP granted to specific skills (skillId -> amount)
  skillExperience?: Record<string, number>;
  // Mechanical unlocks granted on completion (unlock key -> condition metadata)
  unlocks?: QuestUnlock[];
  // Cosmetic/title rewards
  titles?: string[];
  // Collectible/collection entries granted
  collectionEntries?: string[];
}

export interface QuestUnlock {
  // Narrative/mechanical marker keyed elsewhere (e.g. 'region:haunted-marsh',
  // 'skill:shrine', 'mechanic:prayer'). The quest engine stores it so other
  // systems can query unlocked state.
  key: string;
  label: string;
  // Whether this unlock gates entry to a region/dungeon or enables a mechanic
  type: 'region' | 'dungeon' | 'mechanic' | 'skill' | 'cosmetic';
}

// ─── QUEST DEFINITION ────────────────────────────────────────────────

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export type QuestCategory =
  | 'main'       // story-critical lore quests
  | 'side'       // optional world quests
  | 'lore'       // pure world-building quests
  | 'unlock';    // quests that unlock mechanics/regions

export interface QuestDefinition {
  id: string;
  name: string;
  category: QuestCategory;
  description: string;          // quest journal blurb
  lore?: string;                // deeper world-building narrative text
  // Level / region the quest is tuned for
  recommendedLevel: number;
  regionId?: string;            // originating region
  // Preconditions before the quest is offered
  prerequisites?: UnlockCondition[];
  // previous quest in a chain (this quest's parent)
  chain?: {
    questId: string;            // id of the quest required to be complete
    stepIndex: number;          // this quest's position (1-based) in the chain
  };
  // Objectives (required to progress / complete)
  objectives: QuestObjective[];
  // Optional repeatable (rare; most quests are one-time)
  repeatable?: boolean;
  // Whether this quest can be abandoned
  abandonable?: boolean;
  // Rewards
  rewards: QuestReward;
  // Whether this quest must be started before it can be completed
  requiresStart?: boolean;
}

// ─── QUEST PROGRESS STATE ────────────────────────────────────────────

export interface QuestObjectiveProgress {
  objectiveId: string;
  current: number;              // current progress toward `required`
  completed: boolean;
  completedAt: number | null;
}

export interface QuestProgressState {
  questId: string;
  status: QuestStatus;
  startedAt: number | null;
  completedAt: number | null;
  objectives: Record<string, QuestObjectiveProgress>; // objectiveId -> progress
  // For repeatable quests, track the last completed cycle
  currentCycle: number;
}

export interface QuestCompletionRecord {
  questId: string;
  completedAt: number;
  // Which unlock keys this completion granted
  unlocksGranted: string[];
}

// Full player-side quest save payload
export interface PlayerQuestState {
  // Active quests (in-progress)
  active: Record<string, QuestProgressState>;
  // Historically completed quests
  completed: Record<string, QuestCompletionRecord>;
  // Unlock keys the player has earned (mechanics, regions, etc.)
  unlocks: Record<string, boolean>;
  // Quest chain progress tracking for lookup convenience
  chains: Record<string, string[]>; // chainId -> ordered quest ids
}

// ─── QUEST EVENTS ────────────────────────────────────────────────────

export type QuestEventType =
  | 'enemy_killed'       // { enemyId, regionId }
  | 'item_collected'     // { itemId, quantity }
  | 'item_crafted'       // { itemId }
  | 'resource_gathered'  // { skillId, resourceId }
  | 'region_visited'     // { regionId }
  | 'dungeon_completed'  // { dungeonId }
  | 'item_equipped'      // { slot, itemId }
  | 'skill_leveled'      // { skillId, newLevel }
  | 'npc_interacted';    // { npcId }

export interface QuestEvent {
  type: QuestEventType;
  // Generic payload — the quest engine reads only fields relevant to its
  // objective matching by type.
  [key: string]: unknown;
}
