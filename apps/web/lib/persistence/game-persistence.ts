import type { CombatEncounter, EquipmentSlots, SkillId, PlayerDungeonState } from '@premium-rpg/shared-types';

/**
 * The authoritative fields of a game save. Carried by every persistence
 * implementation; clients never write this shape directly except through a
 * GamePersistence, so a server-backed implementation can replace the local
 * one without touching game code.
 */
export interface GameSaveData {
  skills: Record<SkillId, number>;
  gold: number;
  inventory: Record<string, number>;
  durability: Record<string, number>;
  equipment: EquipmentSlots;
  combatXp: number;
  combatLevel: number;
  selectedSkill: SkillId;
  /** Per-save shop purchase ledger (finite stock / one-time tracking). */
  shopBought?: Record<string, number>;
  /** Dungeon progress + any active run. */
  dungeon?: PlayerDungeonState;
  /** Transient active dungeon fight (restored so a reload keeps fighting). */
  dungeonCombat?: DungeonCombatSlice;
}

/**
 * The transient encounter for an in-progress dungeon fight. Isolated from the
 * open-world combat slice so a run survives section changes and reloads.
 */
export interface DungeonCombatSlice {
  encounter: CombatEncounter | null;
  nextRoundAt: number | null;
  /** Hunter HP carried between dungeon floors while a run is active. */
  playerHp: number;
}

/** The persistence boundary for authoritative game data. */
export interface GamePersistence {
  load(playerId: string): GameSaveData | null;
  save(playerId: string, data: GameSaveData): void;
  remove(playerId: string): void;
}