# PHASE 0 — ARCHITECTURE DOCUMENTATION

## Directory Structure (Monorepo)

```
premium-rpg-monorepo/
├── packages/
│   ├── game-engine/          ← Framework-independent core systems
│   │   ├── combat/
│   │   ├── progression/
│   │   ├── economy/
│   │   ├── loot/
│   │   ├── effects/
│   │   └── utils/
│   │
│   ├── game-data/            ← Structured game data (NO code)
│   │   ├── items/
│   │   │   ├── weapons.ts
│   │   │   ├── armor.ts
│   │   │   ├── materials.ts
│   │   │   └── food.ts
│   │   ├── enemies/
│   │   │   ├── goblins.ts
│   │   │   ├── skeletons.ts
│   │   │   └── bosses.ts
│   │   ├── regions/
│   │   │   ├── starter-frontier.ts
│   │   │   ├── dark-woodland.ts
│   │   │   └── ...
│   │   ├── dungeons/
│   │   │   ├── basic-dungeon.ts
│   │   │   └── ...
│   │   ├── quests/
│   │   │   ├── kill-quest.ts
│   │   │   ├── collect-quest.ts
│   │   │   └── ...
│   │   ├── achievements/
│   │   │   ├── progression.ts
│   │   │   ├── combat.ts
│   │   │   └── ...
│   │   ├── skills/
│   │   │   ├── mining.ts
│   │   │   ├── woodcutting.ts
│   │   │   └── fishing.ts
│   │   ├── lootTables/
│   │   │   ├── common.ts
│   │   │   ├── uncommon.ts
│   │   │   └── ...
│   │   └── recipes/
│   │       ├── smithing.ts
│   │       ├── cooking.ts
│   │       └── ...
│   │
│   ├── shared-types/         ← Shared TypeScript types (no runtime)
│   │   ├── player.ts
│   │   ├── item.ts
│   │   ├── enemy.ts
│   │   ├── quest.ts
│   │   ├── skill.ts
│   │   ├── combat.ts
│   │   └──...
│   │
│   ├── validation/           ← Zod schemas for input validation
│   │   ├── player.schema.ts
│   │   ├── item.schema.ts
│   │   └──...
│   │
│   ├── ui-tokens/            ← Design tokens (colors, spacing, typography, etc.)
│   │   ├── colors.ts
│   │   ├── surfaces.ts
│   │   ├── borders.ts
│   │   ├── typography.ts
│   │   ├── shadows.ts
│   │   ├── icons.ts
│   │   ├── motion.ts
│   │   └── rarity.ts
│   │
│   ├── utilities/            ← Pure utilities (no deps on React/Next.js)
│   │   ├── seeded-random.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └──...
│ │
│ └── validation/             ← (duplicate at root for convenience)
│
├── apps/
│   ├── web/                  ← Next.js + React application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── next.config.js
│   │
│   └── api/                  ← API routes (Next.js server)
│       └── routes/
│
└── scripts/                  ← Build/deploy scripts
```

## Critical Architecture Rule
**GAME RULES ⇐ GAME PRESENTATION**

- Game rules live in `packages/game-engine/` — NO React, NO Next.js, NO browser APIs
- Game presentation lives in `apps/web/` — renders results from game engine
- Eventually: game-engine reusable by React Native, server simulations, admin tools, tests

## Frontend Architecture (Next.js + React)
- `apps/web/` — UI components, page routing, client state
- Zustand for client-side interactive game state where appropriate
- TanStack Query for server state (data fetching, caching, updates)
- Components never contain game logic — they only render state from engine
- All calculations go through `packages/game-engine`

## Backend Architecture
- Initially: Next.js server functionality
- If separation becomes necessary: dedicated Node.js backend
- API routes in `apps/api/` with proper authentication/authorization
- Server validates critical progression changes (never trust browser)

## Database (PostgreSQL + Prisma)
- `prisma/schema.prisma` — database model definitions
- ORM migrations managed via Prisma
- Critical data validated on write

## Save System
- Versioned save schema (v1, v2, v3, etc.)
- Migration functions between schema versions
- Server validation of critical progression changes
- Guest local save, registered progression server-side
- Corruption detection and safe fallback

## Event System
- Event-driven domain architecture
- Events: ACTION_STARTED, ACTION_COMPLETED, RESOURCE_GAINED, ITEM_GAINED, ITEM_REMOVED, XP_GAINED, LEVEL_UP, ENEMY_KILLED, PLAYER_DEFEATED, QUEST_PROGRESS, QUEST_COMPLETED, ACHIEVEMENT_UNLOCKED, DUNGEON_STARTED, DUNGEON_COMPLETED, EQUIPMENT_CHANGED, ITEM_CRAFTED
- Systems respond independently to events (quest, task, achievement, bestiary)

## Player State (Domain Model)
```
Player {
  id: string
  name: string
  createdAt: Date
  lastPlayedAt: Date
  playtime: number (minutes)
  combatLevel: number
  totalLevel: number
  region: RegionId
  avatar: AvatarUrl
  skills: SkillMap
  equipment: EquipmentSlots
  inventory: InventoryItem[]
  currency: CurrencyMap
  buffs: BuffMap
  statusEffects: StatusEffectMap
}
```

## Enemy Domain Model
```
Enemy {
  id: string
  name: string
  region: RegionId
  level: number
  health: number
  maxHealth: number
  stats: { strength, agility, intelligence, vitality }
  attackStyle: 'melee' | 'ranged' | 'magic'
  abilities: Ability[]
  lootTable: LootTableId
  xpReward: number
  rarity: Rarity
  loreSnippet: string
}
```

## Region Domain Model
```
Region {
  id: string
  name: string
  visualIdentity: 'steel-forest' | 'ancient-swamp' | 'etc'
  recommendedLevel: number
  skills: SkillId[]
  resources: ResourceId[]
  enemyPool: EnemyId[]
  quests: QuestId[]
  dungeon: DungeonId | null
  boss: EnemyId | null
  specialRewards: RewardId[]
  unlockConditions: UnlockCondition[]
}
```

## Combat Domain Model
```
CombatEncounter {
  id: string
  player: PlayerSummary
  enemy: Enemy
  status: 'pending' | 'active' | 'paused' | 'completed'
  timeline: CombatTimelineItem[]
  result: 'victory' | 'defeat' | 'retreat'
  loot: Loot[]
  xpGained: number
}
```

## API Boundaries
- `GET /api/player` — retrieve current player state
- `POST /api/action` — execute player action (gather, craft, fight)
- `POST /api/save` — save player state (server-validated)
- `POST /api/guest/save` — save guest state (local-cryptographic)
- `GET /api/regions` — list available regions
- `GET /api/enemies` — list enemies by region
- `GET /api/quests` — list available quests

## Save Schema Versions
- v1: Initial release — player, basic equipment, inventory, currency, skills level 1-10
- v2: Add offline progression, status effects, buffs
- v3: Add dungeon data, quest progress tracking
- Migration functions provided between each version

## Content Definition Conventions
- All game data in `packages/game-data/` as pure TypeScript files (no runtime deps)
- Game engine consumes data via imports — no hardcoded `if (item === "...")` logic
- New content added by adding new data files, NOT modifying engine logic
- Types defined in `packages/shared-types/` ensure consistency

## Game Engine API Surface (example)
```
calculateXPForLevel(level: number): number
getLevelForXP(xp: number): number
calculateCombatDamage(attacker: StatBlock, defender: StatBlock): number
rollWeightedLoot(lootTable: LootTable, rarityFilter?: Rarity): Loot[]
getStatModifier(equipment: EquipmentSlot, stat: string): number
calculateOfflineRewards(player: PlayerSummary, elapsedMinutes: number): RewardSummary
applyBuff(effect: StatusEffectType, duration: number, intensity: number): Buff
```

## Risks Identified
- Monorepo tooling configuration (pnpm workspaces, TypeScript project references)
- Keeping game-engine truly framework-independent
- Balancing design token system without excessive abstraction
- Ensuring 41 phases remain maintainable without circular dependencies
- Offline progression exploit prevention at architecture level

## Test Strategy
- Unit tests for all game-engine formulas in `packages/game-engine/tests/`
- Integration tests for API boundaries
- Property-based tests for XP curves and level calculations
- Deterministic seeded randomness for predictable test outcomes