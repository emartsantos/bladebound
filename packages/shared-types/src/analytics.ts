// ─── ANALYTICS AND BALANCING TOOLS TYPES ────────────────────────
// Phase 28: Internal metrics, simulation configs, and report types
// for balancing the game. Never balance solely by manual play-testing.

// ─── ANALYTICS METRICS ──────────────────────────────────────────

export interface ProgressionMetrics {
  /** Average time (ms) from level N to N+1. */
  timeToLevel: Record<number, number>;
  /** XP earned per hour of gameplay. */
  xpPerHour: number;
  /** Gold earned per hour of gameplay. */
  goldPerHour: number;
  /** Total playtime in ms. */
  totalPlaytime: number;
}

export interface CombatMetrics {
  /** Total encounters. */
  totalEncounters: number;
  /** Victories. */
  wins: number;
  /** Defeats. */
  losses: number;
  /** Retreats. */
  retreats: number;
  /** Win rate 0-1. */
  winRate: number;
  /** Average fight duration in ms. */
  avgFightDuration: number;
  /** Median fight duration in ms. */
  medianFightDuration: number;
  /** Boss encounters. */
  bossEncounters: number;
  /** Boss completion rate 0-1. */
  bossCompletionRate: number;
  /** Player death rate 0-1. */
  deathRate: number;
}

export interface LootMetrics {
  /** Total drops. */
  totalDrops: number;
  /** Drops by rarity. */
  dropsByRarity: Record<string, number>;
  /** Actual drop rate per rarity (vs configured rate). */
  dropRatesByRarity: Record<string, number>;
  /** Rarest item dropped. */
  rarestDrop: string | null;
  /** Average items dropped per fight. */
  itemsPerFight: number;
}

export interface EconomyMetrics {
  /** Total gold earned. */
  totalGoldEarned: number;
  /** Total gold spent. */
  totalGoldSpent: number;
  /** Net gold flow. */
  netGoldFlow: number;
  /** Gold sink ratio (spent/earned). */
  goldSinkRatio: number;
  /** Most purchased items. */
  topPurchases: Array<{ itemId: string; count: number }>;
  /** Most sold items. */
  topSales: Array<{ itemId: string; count: number }>;
}

export interface SkillMetrics {
  /** XP earned per skill per hour. */
  xpPerHourBySkill: Record<string, number>;
  /** Time spent on each skill (ms). */
  timeSpentBySkill: Record<string, number>;
  /** Skill level distribution. */
  levelDistribution: Record<string, Record<number, number>>;
  /** Most popular skills (by time spent). */
  popularSkills: Array<{ skillId: string; timeSpent: number }>;
}

export interface RegionMetrics {
  /** Players in each region. */
  playersByRegion: Record<string, number>;
  /** Completion rate per region. */
  completionRateByRegion: Record<string, number>;
  /** Average time in each region. */
  avgTimeByRegion: Record<string, number>;
  /** Region difficulty rating (deaths/player). */
  difficultyByRegion: Record<string, number>;
}

export interface QuestMetrics {
  /** Quest completion rate. */
  completionRate: number;
  /** Average time to complete a quest. */
  avgTimeToComplete: number;
  /** Quests abandoned. */
  abandoned: number;
  /** Most completed quests. */
  topQuests: Array<{ questId: string; completions: number }>;
}

export interface ItemMetrics {
  /** Items used per hour. */
  usageRate: Record<string, number>;
  /** Items in player inventories. */
  circulation: Record<string, number>;
  /** Item power vs level curve (for balancing). */
  powerByLevel: Array<{ level: number; avgPower: number }>;
}

// ─── BALANCING REPORT ───────────────────────────────────────────

export interface BalancingReport {
  /** Report timestamp. */
  generatedAt: number;
  /** Sample size (number of simulated players). */
  sampleSize: number;
  /** Simulation duration in ms. */
  simulationDuration: number;
  /** All metrics. */
  progression: ProgressionMetrics;
  combat: CombatMetrics;
  loot: LootMetrics;
  economy: EconomyMetrics;
  skills: SkillMetrics;
  regions: RegionMetrics;
  quests: QuestMetrics;
  items: ItemMetrics;
  /** Flags for metrics outside acceptable ranges. */
  warnings: BalancingWarning[];
}

export interface BalancingWarning {
  metric: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actual: number;
  expected: { min?: number; max?: number };
}

// ─── SIMULATION TYPES ───────────────────────────────────────────

export interface FightSimulationConfig {
  /** Number of fights to simulate. */
  fightCount: number;
  /** Player combat level. */
  playerLevel: number;
  /** Player stats override (optional). */
  playerStats?: Record<string, number>;
  /** Enemy ID to fight (or random if omitted). */
  enemyId?: string;
  /** Enemy level override. */
  enemyLevel?: number;
  /** Whether player can use food. */
  useFood: boolean;
  /** Food supply (number of food items). */
  foodSupply: number;
  /** Random seed for reproducibility. */
  seed?: number;
}

export interface FightSimulationResult {
  /** Total fights simulated. */
  totalFights: number;
  /** Victories. */
  wins: number;
  /** Defeats. */
  losses: number;
  /** Win rate 0-1. */
  winRate: number;
  /** Average fight duration in rounds. */
  avgRounds: number;
  /** Median fight duration in rounds. */
  medianRounds: number;
  /** Total food consumed. */
  foodConsumed: number;
  /** Total gold earned. */
  goldEarned: number;
  /** Total XP earned. */
  xpEarned: number;
  /** Gold per fight. */
  goldPerFight: number;
  /** XP per fight. */
  xpPerFight: number;
  /** Rare drops obtained. */
  rareDrops: number;
  /** Total items dropped. */
  totalDrops: number;
  /** Damage distribution (min/max/avg per round). */
  damagePerRound: { min: number; max: number; avg: number };
  /** Round distribution. */
  roundsPerFight: { min: number; max: number; avg: number };
  /** Individual fight logs (last N). */
  fightLogs: FightLogEntry[];
}

export interface FightLogEntry {
  fightNumber: number;
  result: 'victory' | 'defeat';
  rounds: number;
  goldEarned: number;
  xpEarned: number;
  foodUsed: number;
  drops: string[];
}

// ─── PROGRESSION SIMULATION ─────────────────────────────────────

export interface ProgressionSimulationConfig {
  /** Number of simulated players. */
  playerCount: number;
  /** Simulation duration in ms. */
  durationMs: number;
  /** XP grant interval in ms. */
  xpIntervalMs: number;
  /** XP per grant. */
  xpPerGrant: number;
  /** Starting level. */
  startLevel: number;
  /** Random seed. */
  seed?: number;
}

export interface ProgressionSimulationResult {
  /** Average final level. */
  avgFinalLevel: number;
  /** Level distribution. */
  levelDistribution: Record<number, number>;
  /** Average time to reach each level. */
  avgTimeToLevel: Record<number, number>;
  /** Level-ups per hour. */
  levelUpsPerHour: number;
  /** XP/hour per player. */
  avgXpPerHour: number;
}

// ─── LOOT SIMULATION ────────────────────────────────────────────

export interface LootSimulationConfig {
  /** Number of loot rolls. */
  rollCount: number;
  /** Drop table to simulate. */
  dropTable: Array<{ itemId: string; weight: number; rarity: string }>;
  /** Random seed. */
  seed?: number;
}

export interface LootSimulationResult {
  /** Total rolls. */
  totalRolls: number;
  /** Items dropped by ID. */
  dropsByItem: Record<string, number>;
  /** Items dropped by rarity. */
  dropsByRarity: Record<string, number>;
  /** Actual rates vs configured. */
  rateDeviations: Array<{ itemId: string; expected: number; actual: number; deviation: number }>;
}
