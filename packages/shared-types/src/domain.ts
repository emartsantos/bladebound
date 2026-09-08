export const GAME_EVENT_TYPES = [
  'ACTION_STARTED',
  'ACTION_COMPLETED',
  'RESOURCE_GAINED',
  'ITEM_GAINED',
  'ITEM_REMOVED',
  'XP_GAINED',
  'LEVEL_UP',
  'ENEMY_KILLED',
  'PLAYER_DEFEATED',
  'QUEST_PROGRESS',
  'QUEST_COMPLETED',
  'ACHIEVEMENT_UNLOCKED',
  'DUNGEON_STARTED',
  'DUNGEON_COMPLETED',
  'EQUIPMENT_CHANGED',
  'ITEM_CRAFTED',
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  playerId: string;
  payload: Record<string, unknown>;
}

export interface SaveSnapshot {
  id: string;
  version: number;
  player: PlayerSaveState;
  timestamp: number;
  checksum: string;
}

export interface PlayerSaveState {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  lastValidActionTimestamp: number;
  lastActionStartTimestamp: number;
  playtime: number;
  region: string;
  experience: number;
  level: number;
  skills: Record<string, number>;
  totalLevel: number;
  bestiary?: import('./bestiary').BestiaryState;
  regionProgress?: RegionProgress;
  dungeon?: import('./dungeon').PlayerDungeonState;
  quest?: import('./quest').PlayerQuestState;
  task?: import('./task').PlayerTaskState;
  achievement?: import('./achievement').PlayerAchievementState;
  collection?: import('./collection').PlayerCollectionState;
  economy?: import('./economy').PlayerEconomyState;
  itemUpgrades?: import('./upgrade').PlayerItemUpgradeState;
  npcs?: import('./npc').PlayerNPCState;
  contracts?: import('./npc').PlayerContractState;
  world?: import('./npc').WorldState;
  offline?: import('./offline').PlayerOfflineState;
}

export interface RegionProgress {
  currentRegion: string;
  unlockedRegions: string[];
  regionDefeatedBosses: Record<string, boolean>;
  regionVisitCount: Record<string, number>;
  totalRegionsVisited: number;
  highestRegionUnlocked: string;
  lastRegionChangeTime: number;
}

export interface UnlockCondition {
  type: 'level' | 'quest' | 'item' | 'achievement' | 'collection';
  target: string;
  comparison: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number;
}

export type StatusEffectType =
  | 'bleed'
  | 'burn'
  | 'poison'
  | 'stun'
  | 'slow'
  | 'armor_reduction'
  | 'healing_over_time'
  | 'damage_over_time'
  | 'shield'
  | 'accuracy_buff'
  | 'evasion_buff'
  | 'critical_buff';

export interface Buff {
  type: StatusEffectType;
  duration: number;
  intensity: number;
  source: 'player' | 'enemy' | 'item' | 'food';
  tickRate?: number;
}


// Gathering skill types
export type SkillName = 'mining' | 'woodcutting' | 'fishing' | 'combat' | 'defense' | 'alchemy' | 'smithing' | 'cooking' | 'fletching';

export type GatheringActionType = 'mining' | 'woodcutting' | 'fishing';

export type GatheringResourceType = 'ore' | ' wood' | 'fish';

export type ToolType = 'pickaxe' | 'axe' | 'fishing_rod';

// Crafting types
export type CraftingSkill = 'smithing' | 'cooking' | 'fletching' | 'alchemy' | 'runecrafting' | 'crafting';

export interface RecipeIngredient {
  itemId: string;
  quantity: number;
}

export interface RecipeOutput {
  itemId: string;
  quantity: number;
  chance?: number; // 0-1, default 1.0 (guaranteed)
}

export interface CraftingBonus {
  type: 'extra_output' | 'double_output' | 'save_ingredient' | 'bonus_xp';
  chance: number; // 0-1
  value?: number; // for bonus_xp: flat XP, for extra_output: extra quantity
}

export interface CraftingRecipe {
  id: string;
  name: string;
  skill: CraftingSkill;
  levelRequired: number;
  ingredients: RecipeIngredient[];
  output: RecipeOutput[];
  duration: number; // milliseconds
  xp: number;
  bonuses?: CraftingBonus[];
  autoRepeat?: boolean; // default true for production recipes
}

export interface CraftingAction {
  recipeId: string;
  skill: CraftingSkill;
  startTime: number;
  duration: number;
  quantity: number; // number of times to repeat
  completed: number; // how many completed so far
}

export interface CraftingState {
  activeAction: CraftingAction | null;
  queue: CraftingAction[];
  recipeBook: Record<string, boolean>; // recipeId → unlocked
}
