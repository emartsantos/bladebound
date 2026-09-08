// ─── NPC AND WORLD INTERACTION ───────────────────────────────────────
// Concise, atmospheric NPCs providing quests, shops, crafting, lore, upgrades, contracts.
// No exposition dumps — dialogue is purposeful and contextual.

import type { CurrencyDocumentation } from './economy';

// ─── NPC ROLES & SERVICES ────────────────────────────────────────────

export type NPCRole =
  | 'quest_giver'       // offers and tracks quests
  | 'merchant'          // buys/sells items (gold shop)
  | 'prestige_merchant' // sells for dungeon_seals
  | 'crafting_station'  // provides crafting services
  | 'trainer'           // teaches skills/upgrades
  | 'lore_keeper'       // reveals region lore, history
  | 'contract_broker'   // offers repeatable contracts
  | 'healer'            // restores health, cleanses effects
  | 'banker'            // manages storage, convenience upgrades
  | 'traveler';         // fast travel, region info

export type NPCService =
  | 'quest'
  | 'shop'
  | 'prestige_shop'
  | 'crafting'
  | 'training'
  | 'lore'
  | 'contracts'
  | 'healing'
  | 'bank'
  | 'travel';

export interface NPCServiceConfig {
  type: NPCService;
  // For shops: which stock to use (references game-data economy stock IDs)
  stockId?: string;
  // For crafting: which recipes available
  recipeCategory?: string;
  // For training: which upgrades available
  upgradeCategory?: string;
  // For contracts: which contract tier
  contractTier?: 'daily' | 'weekly' | 'elite';
  // For healing: cost model
  healCostGold?: number;
  // For travel: destination regions
  destinations?: string[];
}

// ─── DIALOGUE SYSTEM ─────────────────────────────────────────────────
// Concise, contextual dialogue. No exposition dumps.

export type DialogueContext =
  | 'greeting'           // first interaction
  | 'returning'          // subsequent visits
  | 'quest_available'    // has new quest
  | 'quest_active'       // quest in progress
  | 'quest_complete'     // ready to turn in
  | 'shop_browse'        // opening shop
  | 'crafting_open'      // opening crafting
  | 'lore_reveal'        // sharing lore
  | 'contract_offer'     // offering contract
  | 'healing'            // healing service
  | 'training'           // training/upgrade
  | 'farewell'           // leaving
  | 'region_intro'       // first time in region
  | 'milestone'          // major progression milestone
  | 'low_health'         // player critically injured
  | 'full_inventory';    // inventory management needed

export interface DialogueLine {
  id: string;
  text: string;
  // Conditions for when this line appears
  requires?: {
    context?: DialogueContext;
    questState?: { questId: string; state: 'available' | 'active' | 'complete' }[];
    regionProgress?: { regionId: string; minProgress: number }[];
    npcReputation?: { npcId: string; minReputation: number };
    playerLevel?: number;
    flags?: string[]; // arbitrary progression flags
  };
  // Optional: next dialogue node or action
  next?: string;
  action?: 'open_shop' | 'open_crafting' | 'open_quests' | 'open_contracts' | 'open_lore' | 'heal' | 'train' | 'travel' | 'close';
}

export interface NPCDialogue {
  npcId: string;
  lines: DialogueLine[];
  // Default fallback if no conditional line matches
  fallback?: string;
}

// ─── NPC DEFINITION ──────────────────────────────────────────────────

export interface NPCDefinition {
  id: string;
  name: string;
  title: string;           // e.g. "Elder of the Frontier"
  regionId: string;
  role: NPCRole;
  services: NPCServiceConfig[];
  // Visual
  portrait?: string;       // asset key
  // Dialogue
  dialogue: NPCDialogue;
  // Reputation
  reputation: {
    initial: number;       // starting reputation (-100 to 100)
    max: number;
    // Reputation thresholds for unlocks
    thresholds: { level: number; unlocks: string[] }[];
  };
  // Availability
  availability?: {
    // Only available after certain conditions
    requires?: {
      questComplete?: string[];
      regionUnlocked?: string[];
      level?: number;
      flags?: string[];
    };
    // Schedule (optional): time windows when NPC is present
    schedule?: { dayStart: number; dayEnd: number }[]; // 0-23 hours
  };
  // Contract offerings (if contract_broker)
  contracts?: string[]; // contract IDs
  // Lore entries this NPC can reveal
  loreEntries?: string[]; // lore IDs from collections
}

// ─── PLAYER NPC STATE ────────────────────────────────────────────────

export interface NPCReputationState {
  current: number;
  // Track which thresholds have been claimed
  claimedThresholds: number[];
}

export interface NPCInteractionState {
  // Track which dialogue lines have been seen (for "new" indicators)
  seenDialogue: string[]; // dialogue line IDs
  // Track completed contracts with this NPC
  completedContracts: string[];
  // Track purchased training/upgrades
  purchasedTraining: string[];
}

export interface PlayerNPCState {
  reputations: Record<string, NPCReputationState>; // npcId -> reputation
  interactions: Record<string, NPCInteractionState>; // npcId -> interaction state
  // Global flags set by NPCs
  flags: Record<string, boolean>;
}

// ─── CONTRACTS ───────────────────────────────────────────────────────
// Repeatable tasks offered by contract brokers, distinct from quests/tasks.

export type ContractTier = 'daily' | 'weekly' | 'elite';

export interface ContractDefinition {
  id: string;
  name: string;
  description: string;
  tier: ContractTier;
  // Requirements to accept
  requires: {
    level?: number;
    reputation?: { npcId: string; min: number };
    questComplete?: string[];
  };
  // Objectives (similar to quest objectives but simpler)
  objectives: {
    type: 'kill' | 'gather' | 'deliver' | 'explore' | 'craft' | 'dungeon';
    target: string; // enemyId, itemId, regionId, dungeonId
    count: number;
    regionId?: string;
  }[];
  // Rewards
  rewards: {
    gold: number;
    xp: number;
    reputation?: { npcId: string; amount: number };
    items?: { itemId: string; quantity: number; chance: number }[];
    dungeonSeals?: number;
  };
  // Cooldown before repeatable
  cooldownHours: number;
  // Whether it's a one-time contract
  oneTime?: boolean;
}

export interface ActiveContract {
  contractId: string;
  npcId: string;
  startedAt: number;
  expiresAt: number; // 0 = no expiry (until complete)
  progress: number[]; // objective index -> count
  completed: boolean;
  claimed: boolean;
}

export interface PlayerContractState {
  active: ActiveContract[];
  // Track cooldowns per contract
  cooldowns: Record<string, number>; // contractId -> next available timestamp
  completed: string[]; // contract IDs completed (for one-time tracking)
}

// ─── WORLD STATE ─────────────────────────────────────────────────────

export interface WorldState {
  // Region discovery and progress
  regionProgress: Record<string, {
    discovered: boolean;
    completion: number; // 0-100
    firstVisitAt?: number;
  }>;
  // Global flags for world events
  worldFlags: Record<string, boolean>;
  // Seasonal/time events (optional)
  activeEvents: string[];
}