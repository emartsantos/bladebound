'use client';

import type { SkillId, EquipmentSlot } from '@premium-rpg/shared-types';
import type { GameClient } from './game-client';
import type { GamePersistence } from '@/lib/persistence/game-persistence';
import type { GameState, SeedConfig } from './service';
import {
  TICK_MS,
  mergeSeed,
  tick,
  gameToSaveData,
  reduceStartAction,
  reduceStopAction,
  reduceRemoveQueuedAction,
  reduceClearActionQueue,
  reduceClearActionLog,
  reduceSetSelectedSkill,
  reduceSetCombatTarget,
  reduceFight,
  reduceToggleAutoFight,
  reduceToggleRest,
  reduceEatFood,
  reduceClearCombatLog,
  reduceRepairAll,
  reduceEquipItem,
  reduceUnequipItem,
  reduceShopBuy,
  reduceShopSell,
  reduceDungeonEnter,
  reduceDungeonFight,
  reduceAbandonDungeon,
  reduceClearDungeon,
} from './service';

/**
 * Local, engine-driven GameClient. Owns the authoritative game state for the
 * current player on this device and persists through the injected
 * GamePersistence (local for guest/demo). This is the browser-side developer
 * path; a server-backed GameClient will implement the same interface without
 * touching the provider or any component.
 */
export class LocalGameClient implements GameClient {
  private readonly config: SeedConfig;
  private state: GameState;
  private readonly listeners = new Set<(state: GameState) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SeedConfig) {
    this.config = config;
    this.state = mergeSeed(config);
    this.timer = setInterval(() => this.applyTick(), TICK_MS);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---- private ----

  private applyTick(): void {
    this.setState(tick(this.state, Date.now()));
  }

  private setState(next: GameState): void {
    this.state = next;
    this.schedulePersist();
    for (const listener of this.listeners) listener(this.state);
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.config.persistence.save(this.config.playerId, gameToSaveData(this.state));
    }, 800);
  }

  // ---- gathering / crafting ----

  startAction(skill: SkillId, id: string, kind: 'gathering' | 'crafting'): void {
    this.setState(reduceStartAction(this.state, skill, id, kind));
  }

  stopAction(): void {
    this.setState(reduceStopAction(this.state));
  }

  removeQueuedAction(index: number): void {
    this.setState(reduceRemoveQueuedAction(this.state, index));
  }

  clearActionQueue(): void {
    this.setState(reduceClearActionQueue(this.state));
  }

  clearActionLog(): void {
    this.setState(reduceClearActionLog(this.state));
  }

  setSelectedSkill(skill: SkillId): void {
    this.setState(reduceSetSelectedSkill(this.state, skill));
  }

  // ---- combat ----

  setCombatTarget(regionId: string, enemyId: string): void {
    this.setState(reduceSetCombatTarget(this.state, regionId, enemyId));
  }

  fight(): void {
    this.setState(reduceFight(this.state));
  }

  toggleAutoFight(): void {
    this.setState(reduceToggleAutoFight(this.state));
  }

  toggleRest(): void {
    this.setState(reduceToggleRest(this.state));
  }

  eatFood(): void {
    this.setState(reduceEatFood(this.state));
  }

  clearCombatLog(): void {
    this.setState(reduceClearCombatLog(this.state));
  }

  // ---- inventory / equipment ----

  repairAll(): void {
    this.setState(reduceRepairAll(this.state));
  }

  equipItem(slot: EquipmentSlot, itemId: string): void {
    this.setState(reduceEquipItem(this.state, slot, itemId));
  }

  unequipItem(slot: EquipmentSlot): void {
    this.setState(reduceUnequipItem(this.state, slot));
  }

  // ---- economy (shop) ----

  buyShopItem(shopItemId: string): void {
    this.setState(reduceShopBuy(this.state, shopItemId));
  }

  sellItem(itemId: string): void {
    this.setState(reduceShopSell(this.state, itemId));
  }

  // ---- dungeons ----

  startDungeon(dungeonId: string): void {
    this.setState(reduceDungeonEnter(this.state, dungeonId));
  }

  dungeonFight(): void {
    this.setState(reduceDungeonFight(this.state));
  }

  abandonDungeon(): void {
    this.setState(reduceAbandonDungeon(this.state));
  }

  clearDungeon(): void {
    this.setState(reduceClearDungeon(this.state));
  }

  // ---- lifecycle ----

  resetProgress(): void {
    this.config.persistence.remove(this.config.playerId);
    this.setState(mergeSeed(this.config));
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.listeners.clear();
  }
}
