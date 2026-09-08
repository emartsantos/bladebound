# PHASE 0 — GAME-DOMAIN ENTITIES

Defined per MASTER_GAME_SPEC.md specifications. All entities are typed in `packages/shared-types/` and consumed by `packages/game-engine/` via structured data from `packages/game-data/`.

## Player
```typescript
export interface Player {
  id: string                    // Unique player identifier
  name: string                  // Player-chosen name
  createdAt: Date              // Account creation timestamp
  lastPlayedAt: Date           // Last session start timestamp
  playtime: number             // Total playtime in minutes
  combatLevel: number          // Combat-derived level
  totalLevel: number           // Sum of all skill/stat levels
  region: string               // Current region ID
  avatar: string | null        // Optional avatar URL
  class: string | null         // Optional character class/archetype
  
  // Progression
  xp: number                   // Current experience points
  skills: Record<string, SkillLevel>
  equipment: EquipmentSlots
  inventory: InventoryItem[]
  currency: Record<string, number>
  buffs: Record<string, BuffData>
  statusEffects: Record<string, StatusEffectData>
}
```

## Skill
```typescript
export interface Skill {
  id: string                   // Unique skill identifier (e.g., "mining", "woodcutting")
  name: string                 // Display name
  description: string          // Description of what the skill does
  icon: string                 // Icon identifier
  level: number                // Current skill level
  xp: number                   // Current skill XP
  xpToNextLevel: number        // XP required for next level
  unlockLevel: number          // Minimum player level to unlock
  levelRequirements: Record<string, number> // Prerequisite skill levels
  
  // Action configuration
  actionDuration: number       // Base action time in seconds
  baseXPReward: number         // Base XP per action
  baseResourceReward: number   // Base resource per action
  rareDropChance: number       // Chance for rare drop per action
  
  // Tool requirements
  toolId: string | null        // Required tool item ID
  toolBonus: number            // Bonus percentage from tool
  
  // Offline progress
  offlineMultiplier: number    // Multiplier for offline progression
}
```

## SkillLevel
```typescript
export type SkillLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
```

## Item
```typescript
export interface Item {
  id: string                   // Unique item identifier
  name: string                 // Display name
  description: string          // Description
  type: ItemType               // Category (weapon, material, food, quest, etc.)
  rarity: Rarity               // Rarity tier
  stackable: boolean           // Can multiple stack in inventory?
  maxStack: number             // Maximum stack size (1 if non-stackable)
  icon: string                 // Icon identifier
  weight: number               // For loot table weighting
  
  // Item-specific properties
  metadata: Record<string, unknown>
}
```

## EquipmentSlot
```typescript
export type EquipmentSlot = 
  | 'weapon' 
  | 'offhand' 
  | 'helmet' 
  | 'chest' 
  | 'gloves' 
  | 'legs' 
  | 'boots' 
  | 'amulet' 
  | 'ring' 
  | 'cape'

export interface EquipmentSlots {
  weapon: Item | null
  offhand: Item | null
  helmet: Item | null
  chest: Item | null
  gloves: Item | null
  legs: Item | null
  boots: Item | null
  amulet: Item | null
  ring: Item | null
  cape: Item | null
}
```

## InventoryItem
```typescript
export interface InventoryItem {
  id: string                   // Unique instance identifier
  itemId: string               // Reference to item definition
  quantity: number             // Stack count (1 if non-stackable)
  equipped: boolean            // Currently equipped (if equipment slot)
  durability: number | null    // If applicable (weapons/armor degrade)
  metadata: Record<string, unknown>
}
```

## Enemy
```typescript
export interface Enemy {
  id: string                   // Unique enemy identifier
  name: string                 // Display name
  region: string               // Region where enemy appears
  level: number                // Recommended player level
  health: number               // Current health
  maxHealth: number            // Maximum health
  stats: {
    strength: number
    agility: number
    intelligence: number
    vitality: number
  }
  attackStyle: 'melee' | 'ranged' | 'magic'
  abilities: EnemyAbility[]
  lootTable: string            // Reference to loot table definition
  xpReward: number             // XP granted on defeat
  rarity: Rarity
  loreSnippet: string          // Short lore description
  bestiaryMetadata: {
    discovered: boolean
    defeatCount: number
    dropsDiscovered: number
  }
}
```

## Region
```typescript
export interface Region {
  id: string                   // Unique region identifier
  name: string                 // Display name
  visualIdentity: string       // Art direction identifier
  recommendedLevel: number     // Recommended player level
  skills: string[]             // Skills relevant to this region
  resources: string[]          // Resources found in this region
  enemyPool: string[]          // Enemy IDs that can appear
  quests: string[]             // Quest IDs available in region
  dungeon: string | null       // Dungeon ID if region has dungeon
  boss: string | null          // Enemy ID if region has boss
  specialRewards: string[]     // Unique reward IDs
  unlockConditions: UnlockCondition[]
  backgroundColor: string      // CSS color variable
  themeMusic: string | null    // Optional music identifier
}
```

## UnlockCondition
```typescript
export interface UnlockCondition {
  type: 'level' | 'quest' | 'item' | 'achievement' | 'collection'
  target: string               // ID of target (region, quest, item, etc.)
  comparison: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'  // Comparison operator
  value: number                // Value to compare against
}
```

## Quest
```typescript
export interface Quest {
  id: string                   // Unique quest identifier
  title: string                // Display title
  description: string          // Quest description
  objectiveType: 'kill' | 'collect' | 'craft' | 'gather' | 'visit' | 'dungeon' | 'equip' | 'skill'
  objectiveTarget: string      // ID of target (enemy, item, recipe, region, skill)
  objectiveCount: number       // Required count
  objectiveCurrent: number     // Current progress count
  rewardXP: number             // XP reward on completion
  rewardGold: number           // Gold reward on completion
  rewardItem: string | null    // Item ID reward (if any)
  rewardCurrency: string | null // Currency type reward (if any)
  chainId: string | null       // Related quest chain identifier
  hidden: boolean              // Whether quest is hidden/secret
  loreReveal: string | null    // Lore text revealed upon completion
}
```

## QuestProgress
```typescript
export interface QuestProgress {
  questId: string
  current: number
  total: number
  completed: boolean
}
```

## Achievement
```typescript
export interface Achievement {
  id: string                   // Unique achievement identifier
  title: string                // Display title
  description: string          // Description of requirement
  category: 'progression' | 'combat' | 'skill' | 'collection' | 'rare' | 'economic' | 'hidden'
  icon: string                 // Icon identifier
  requirement: string          // Human-readable requirement description
  condition: {
    type: 'milestone' | 'count' | 'level' | 'rare_event' | 'hidden'
    target: string             // What is being tracked
    comparison: 'gte' | 'lte' | 'eq'
    value: number              // Target value
  }
  reward: {
    type: 'cosmetic' | 'title' | 'points' | 'currency' | 'item'
    value: string | number
  }
  hidden: boolean              // Whether achievement is hidden initially
}
```

## CollectionEntry
```typescript
export interface CollectionEntry {
  id: string                   // Unique entry identifier
  type: 'item' | 'enemy' | 'boss' | 'dungeon' | 'crafted' | 'rare-drop' | 'lore' | 'title'
  name: string                 // Display name
  description: string          // Description
  icon: string                 // Icon identifier
  discovered: boolean          // Whether content has been discovered
  collected: boolean           // Whether entry is complete
  targetCount: number          // How many needed for completion
  currentCount: number         // How many have been obtained/discovered
}
```

## Task (Daily/Weekly)
```typescript
export interface Task {
  id: string                   // Unique task identifier
  title: string                // Display title
  description: string          // Task description
  type: 'daily' | 'weekly' | 'monster' | 'gathering' | 'crafting'
  objectiveType: 'kill' | 'collect' | 'craft' | 'gather' | 'visit'
  objectiveTarget: string      // ID of target
  objectiveCount: number       // Required count
  objectiveCurrent: number     // Current progress
  rewardXP: number             // XP reward
  rewardGold: number           // Gold reward
  rewardItem: string | null    // Item reward (if any)
  resetTime: Date              // When this task resets
  isRepeatable: boolean
}
```

## SaveSnapshot
```typescript
export interface SaveSnapshot {
  id: string                   // Save file identifier
  version: number              // Schema version (v1, v2, v3, etc.)
  player: Player               // Complete player state
  timestamp: Date              // Save timestamp
  checksum: string             // Integrity check hash
  lastValidatedAt: Date        // When server last validated this save
}
```

## GameEvent (Event System)
```typescript
export type GameEvent = 
  | 'ACTION_STARTED'
  | 'ACTION_COMPLETED'
  | 'RESOURCE_GAINED'
  | 'ITEM_GAINED'
  | 'ITEM_REMOVED'
  | 'XP_GAINED'
  | 'LEVEL_UP'
  | 'ENEMY_KILLED'
  | 'PLAYER_DEFEATED'
  | 'QUEST_PROGRESS'
  | 'QUEST_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'DUNGEON_STARTED'
  | 'DUNGEON_COMPLETED'
  | 'EQUIPMENT_CHANGED'
  | 'ITEM_CRAFTED'
```

## Rarity
```typescript
export type Rarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary'
```

## Buff
```typescript
export interface Buff {
  id: string                   // Unique buff identifier
  type: BuffType               // What stat/effect this buff modifies
  duration: number             // Remaining duration in seconds
  intensity: number            // Effect strength
  source: 'player' | 'enemy' | 'item' | 'food'  // Origin
  tickRate?: number            // How often effect ticks (if continuous)
}
```

## StatusEffect
```typescript
export type StatusEffect = 
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
  | 'critical_buff'
```

## CombatTimelineItem
```typescript
export interface CombatTimelineItem {
  id: string                   // Unique event identifier
  type: 'attack' | 'hit' | 'damage' | 'ability' | 'status_tick' | 'death' | 'loot' | 'xp'
  timestamp: number            // When this occurs (ms from combat start)
  participant: 'player' | 'enemy'  // Who is involved
  detail: string               // Description of the event
}