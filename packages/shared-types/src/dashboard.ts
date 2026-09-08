// ─── PREMIUM DASHBOARD UX ───────────────────────────────────────────
// Contextual dashboard data that answers real player questions.
// Phase 24 spec: avoid generic cards and meaningless statistics —
// every UI element must answer an actual player question.
//
// The dashboard engine produces a set of "questions + answers" grouped by
// activity, plus typed structured data a renderer can use directly.

import type { SkillId } from './skill';
import type { AttackStyle } from './combat';

// ─── ACTIVITY CONTEXT ───────────────────────────────────────────────

export type DashboardActivity =
  | 'gathering'   // mining / woodcutting / fishing
  | 'combat'      // fighting enemies
  | 'crafting';   // production / recipes

// A structured answer to a specific player question.
export interface DashboardQuestion {
  /** A short imperative/question label, e.g. "What am I mining?" */
  question: string;
  /** Primary value, e.g. "Copper Vein" */
  primary: string;
  /** Supporting detail, e.g. "Level 15 required" */
  supporting?: string;
  /** Optional signed delta for ratemeters (e.g. "+1,200 XP/h"). */
  delta?: string;
  /** Optional 0-1 progress for bars (e.g. toward next unlock). */
  progress?: number;
  /** Optional severity/style hint for the renderer. */
  tone?: 'neutral' | 'good' | 'bad' | 'warning';
}

// ─── GATHERING PANEL ────────────────────────────────────────────────

export interface GatheringResourceRate {
  itemId: string;
  name: string;
  /** Expected items gained per hour (decimal ok). */
  perHour: number;
  rare: boolean;
}

export interface GatheringPanelData {
  activity: 'gathering';
  skill: SkillId;
  // Node currently being gathered.
  activeNode: {
    id: string;
    name: string;
  } | null;
  // Time per completed action in ms.
  timePerActionMs: number;
  // Effective XP per action.
  xpPerAction: number;
  // XP per hour estimate.
  xpPerHour: number;
  // Resource yield rates per hour.
  resourceRates: GatheringResourceRate[];
  // Tool bonus breakdown (if a tool is equipped).
  toolBonus: {
    toolId: string;
    speedMultiplier: number;
    xpBonus: number;
    extraResourceChance: number;
  } | null;
  // Next unlock (next node / level step).
  nextUnlock: {
    target: string;
    requiredLevel: number;
    currentLevel: number;
    xpToUnlock: number;
  } | null;
  // Generated Q&A panel.
  questions: DashboardQuestion[];
}

// ─── COMBAT PANEL ───────────────────────────────────────────────────

export interface CombatPanelData {
  activity: 'combat';
  // Current combat state (null = not in combat).
  combat: {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    enemyName: string;
    // MS until next player attack.
    attackTimerMs: number;
    // MS until next enemy attack.
    enemyAttackTimerMs: number;
    // Active buffs/effects on the player.
    buffs: { name: string; stacks: number; duration: number }[];
    // Equipped food item (consumable healing).
    food: { name: string; quantity: number; healAmount: number } | null;
    // Recent combat log entries (raw text).
    log: string[];
  } | null;
  // Pre-combat context: what to fight next (optional).
  recommended: {
    enemyName: string;
    regionId: string;
    recommendedLevel: number;
    bestLoot: string;
  } | null;
  // Generated Q&A panel.
  questions: DashboardQuestion[];
}

// ─── CRAFTING PANEL ─────────────────────────────────────────────────

export interface CraftingPanelData {
  activity: 'crafting';
  // Active production recipe.
  activeRecipe: {
    id: string;
    name: string;
    skill: SkillId;
    durationMs: number;
    // Expected XP per recipe completion.
    xpPerCraft: number;
  } | null;
  queueLength: number;
  // Ingredients the player has vs needed (for the queued/active recipe).
  ingredientStatus: {
    itemId: string;
    name: string;
    held: number;
    needed: number;
    sufficient: boolean;
  }[];
  // Expected XP per hour of continuous production.
  xpPerHour: number;
  // Next unlock threshold.
  nextRecipe: {
    name: string;
    levelRequired: number;
  } | null;
  // Generated Q&A panel.
  questions: DashboardQuestion[];
}

// ─── UNIFIED PANEL ──────────────────────────────────────────────────

export type DashboardPanelData =
  | GatheringPanelData
  | CombatPanelData
  | CraftingPanelData;

// What input the engine needs to compute a panel — kept minimal so it is
// framework-independent and easy to test.
export interface DashboardContextInput {
  activity: DashboardActivity;
  // Player save state fields the dashboard needs.
  player: {
    level: number;
    experience: number;
    currentRegionId: string;
    health: number;
    maxHealth: number;
    attackStyle: AttackStyle;
    attackSpeedMs: number;
  };
  // Skills (skill name -> xp) for level/unlock math.
  skills: Record<string, number>;
  // Active gathering node, if any.
  activeGathering?: {
    nodeId: string;
    nodeName: string;
    skill: SkillId;
    baseDurationMs: number;
    baseXp: number;
    toolId?: string;
    toolBonus?: { speedMultiplier: number; xpBonus: number; extraResourceChance: number };
    resources: { itemId: string; name: string; minQuantity: number; maxQuantity: number; chance: number; rare?: boolean }[];
  } | null;
  // Active crafting recipe, if any.
  activeCrafting?: {
    recipeId: string;
    recipeName: string;
    skill: SkillId;
    durationMs: number;
    xp: number;
  } | null;
  craftingQueueLength?: number;
  // Ingredient inventory (itemId -> held quantity).
  ingredients?: Record<string, number>;
  // Combat runtime snapshot.
  combat?: {
    enemyName: string;
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    attackTimerMs: number;
    enemyAttackTimerMs: number;
    buffs: { name: string; stacks: number; duration: number }[];
    food: { name: string; quantity: number; healAmount: number } | null;
    log: string[];
  } | null;
  // Next-node lookups (used to answer "what should I mine next?").
  nextGatheringNode?: {
    name: string;
    requiredLevel: number;
    xpToUnlock: number;
  } | null;
  nextRecipe?: { name: string; levelRequired: number } | null;
  recommendedEnemy?: {
    enemyName: string;
    regionId: string;
    recommendedLevel: number;
    bestLoot: string;
  } | null;
  /** Number of seconds per hour for rate math (default 3600). */
  secondsPerHour?: number;
}