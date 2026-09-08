import type { PlayerSummary, BaseStats, InventoryItem, CharacterMetadata, SkillId } from '@premium-rpg/shared-types';

function equipped(uid: string, itemId: string, durability = 100): InventoryItem {
  return { uid, itemId, quantity: 1, equipped: true, durability };
}

// Demo player derived entirely from real shared-types fields. Equipment slot
// values reference item ids that exist in `@premium-rpg/game-data`'s
// ITEM_BY_ID registry; slots with no real matching item stay empty (null).
export const PLAYER_SUMMARY: PlayerSummary = {
  id: 'player-1',
  name: 'Theron',
  combatLevel: 26,
  totalLevel: 26,
  skills: {
    mining: { level: 18, xp: 4200 },
    woodcutting: { level: 14, xp: 2800 },
    fishing: { level: 11, xp: 1500 },
    smelting: { level: 10, xp: 1200 },
    smithing: { level: 9, xp: 980 },
    cooking: { level: 12, xp: 2100 },
    fletching: { level: 7, xp: 600 },
    alchemy: { level: 5, xp: 300 },
    runecrafting: { level: 4, xp: 200 },
  },
  equipment: {
    weapon: equipped('eq-weapon', 'iron_sword'),
    chest: equipped('eq-chest', 'iron_platebody'),
    offhand: null,
    helmet: null,
    gloves: null,
    legs: null,
    boots: null,
    amulet: null,
    ring: null,
    cape: null,
  },
  currency: { gold: 12450 },
};

export const PLAYER_BASE_STATS: BaseStats = {
  maxHealth: 410,
  strength: 48,
  agility: 35,
  intelligence: 22,
  vitality: 41,
  accuracy: 67,
  evasion: 28,
  critChance: 12.5,
  critDamage: 185,
  attackSpeed: 1.2,
  armor: 89,
};

// Mirrors the XP step formula in game-engine `progression/xp.ts`
// (BASE_XP * level^XP_GROWTH) so UI progress bars stay consistent with the
// engine's curve without coupling the web bundle to the engine package.
const BASE_XP = 52;
const XP_GROWTH = 1.1;

function xpStepForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, XP_GROWTH));
}

// Total XP required to *reach* a level (sum of steps 1..level-1); matches
// game-engine `xpForLevel()`.
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let step = 1; step < level; step += 1) total += xpStepForLevel(step);
  return total;
}

// XP required to advance from `level` to `level + 1`.
export function xpToNextForLevel(level: number): number {
  return xpStepForLevel(level);
}

// ── PER-ACCOUNT PLAYER ─────────────────────────────────────────────

const ALL_SKILL_IDS: SkillId[] = [
  'mining', 'woodcutting', 'fishing', 'smelting',
  'smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting',
];

const EQUIPMENT_SLOTS: (keyof CharacterMetadata['equipment'])[] = [
  'weapon', 'offhand', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'amulet', 'ring', 'cape',
];

export const DEFAULT_STARTING_GOLD = 500;

/**
 * Real player the shell renders after a registered-account login. Built from
 * the account's own CharacterMetadata (name, levels, skills, equipment) rather
 * than the fixed demo player `PLAYER_SUMMARY`.
 */
export function buildPlayerSummary(character: CharacterMetadata): PlayerSummary {
  const skills = {} as Record<SkillId, { level: number; xp: number }>;
  for (const id of ALL_SKILL_IDS) {
    const level = Math.max(1, character.skills[id] ?? 1);
    skills[id] = { level, xp: cumulativeXpForLevel(level) };
  }

  const equipment = {} as PlayerSummary['equipment'];
  for (const slot of EQUIPMENT_SLOTS) {
    const entry = character.equipment[slot];
    equipment[slot] =
      entry && entry.itemId
        ? { uid: `char-${character.id}-${slot}`, itemId: entry.itemId, quantity: 1, equipped: true, durability: entry.durability ?? 100 }
        : null;
  }

  return {
    id: character.id,
    name: character.name,
    combatLevel: character.combatLevel,
    totalLevel: character.totalLevel,
    skills,
    equipment,
    currency: { gold: character.gold ?? DEFAULT_STARTING_GOLD },
  };
}

/**
 * Plausible base stats for a fresh level-1 character, scaled up to the demo
 * baseline at the demo character's combat level. Deterministic (no engine
 * import needed by the web bundle) and exact for the demo player at L26.
 */
export function baseStatsForLevel(combatLevel: number, demo: BaseStats = PLAYER_BASE_STATS): BaseStats {
  const ratio = Math.min((combatLevel - 1) / (DEMO_COMBAT_LEVEL - 1), 1);
  const lerp = (newVal: number, demoVal: number) => Math.round(newVal + (demoVal - newVal) * ratio) || 0;
  return {
    maxHealth: lerp(60, demo.maxHealth),
    strength: lerp(10, demo.strength),
    agility: lerp(10, demo.agility),
    intelligence: lerp(10, demo.intelligence),
    vitality: lerp(10, demo.vitality),
    accuracy: lerp(20, demo.accuracy),
    evasion: lerp(5, demo.evasion),
    critChance: lerp(5, demo.critChance),
    critDamage: lerp(150, demo.critDamage),
    attackSpeed: lerp(1, demo.attackSpeed),
    armor: lerp(5, demo.armor),
  };
}

const DEMO_COMBAT_LEVEL = 26;