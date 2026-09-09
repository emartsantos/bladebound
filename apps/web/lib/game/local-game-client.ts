'use client';

import type { SkillId, EquipmentSlot } from '@premium-rpg/shared-types';
import type { GameClient } from './game-client';
import type { GamePersistence } from '@/lib/persistence/game-persistence';
import type { GameState, SeedConfig, SummonDescriptor } from './service';
import type { EconomyTransaction } from '@/lib/persistence/game-persistence';
import type { MarketplaceAssetType } from '@/lib/persistence/game-persistence';
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
  reduceClaimTask,
  reduceRerollTask,
  reduceClaimMail,
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
  reduceForgeWeapon,
  reduceAwakenWeapon,
  reduceRerollWeapon,
  reduceRebirthHero,
  reduceReforgeHero,
  reduceCreateMarketplaceListing,
  reduceCancelMarketplaceListing,
  reduceBuyMarketplaceListing,
  reduceSummonHero, SUMMON_COST,
  reduceSummonedHeroBattle,
  rollSummonDescriptor,
  reduceChallengeEmberColossus,
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
  private readonly flushOnPageExit = () => this.flushPersistence();
  private readonly flushOnVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.flushPersistence();
    }
  };

  constructor(config: SeedConfig) {
    this.config = config;
    this.state = mergeSeed(config);
    this.timer = setInterval(() => this.applyTick(), TICK_MS);
    if (typeof window !== 'undefined') window.addEventListener('pagehide', this.flushOnPageExit);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.flushOnVisibilityChange);
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
    if (this.state.marketplace.heroLocked) return;
    this.setState(tick(this.state, Date.now()), 'gameplay');
  }

  private heroAvailable(): boolean { return !this.state.marketplace.heroLocked; }

  private setState(next: GameState, reason = 'system'): void {
    if (next === this.state) return;
    const entries = this.createLedgerEntries(this.state, next, reason);
    this.state = entries.length ? { ...next, ledger: [...next.ledger, ...entries].slice(-500) } : next;
    this.schedulePersist();
    for (const listener of this.listeners) listener(this.state);
  }

  private createLedgerEntries(previous: GameState, next: GameState, reason: string): EconomyTransaction[] {
    const createdAt = Date.now();
    const entries: EconomyTransaction[] = [];
    const add = (category: EconomyTransaction['category'], assetId: string, delta: number, balance: number) => {
      if (!delta) return;
      entries.push({ id: `${createdAt}-${category}-${assetId}-${entries.length}`, createdAt, category, assetId, delta, balance, reason });
    };
    add('gold', 'gold', next.gold - previous.gold, next.gold);
    add('combat_xp', 'combat_xp', next.combatXp - previous.combatXp, next.combatXp);
    add('bhc', 'bhc', next.investment.bhc - previous.investment.bhc, next.investment.bhc);
    for (const skill of Object.keys(next.skills) as SkillId[]) add('skill_xp', skill, next.skills[skill] - previous.skills[skill], next.skills[skill]);
    const itemIds = new Set([...Object.keys(previous.inventory), ...Object.keys(next.inventory)]);
    for (const itemId of itemIds) add('item', itemId, (next.inventory[itemId] ?? 0) - (previous.inventory[itemId] ?? 0), next.inventory[itemId] ?? 0);
    return entries;
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.config.persistence.save(this.config.playerId, gameToSaveData(this.state));
    }, 800);
  }

  private flushPersistence(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.config.persistence.save(this.config.playerId, gameToSaveData(this.state));
  }

  // ---- gathering / crafting ----

  startAction(skill: SkillId, id: string, kind: 'gathering' | 'crafting', repetitions = 1): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceStartAction(this.state, skill, id, kind, repetitions), `${kind}_queued`);
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

  claimTask(taskId: string): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceClaimTask(this.state, taskId), 'task_reward');
  }

  rerollTask(group: 'daily' | 'weekly', index: number): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceRerollTask(this.state, group, index), 'task_reroll');
  }

  claimMail(mailId: string): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceClaimMail(this.state, mailId), 'mail_reward');
  }

  setSelectedSkill(skill: SkillId): void {
    this.setState(reduceSetSelectedSkill(this.state, skill));
  }

  // ---- combat ----

  setCombatTarget(regionId: string, enemyId: string): void {
    this.setState(reduceSetCombatTarget(this.state, regionId, enemyId));
  }

  fight(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceFight(this.state), 'combat');
  }

  toggleAutoFight(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceToggleAutoFight(this.state));
  }

  toggleRest(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceToggleRest(this.state));
  }

  eatFood(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceEatFood(this.state), 'consume_item');
  }

  clearCombatLog(): void {
    this.setState(reduceClearCombatLog(this.state));
  }

  // ---- inventory / equipment ----

  repairAll(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceRepairAll(this.state), 'equipment_repair');
  }

  equipItem(slot: EquipmentSlot, itemId: string, rarity?: import('@premium-rpg/shared-types').Rarity): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceEquipItem(this.state, slot, itemId, rarity));
  }

  unequipItem(slot: EquipmentSlot): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceUnequipItem(this.state, slot));
  }

  forgeWeapon(): void { if (this.heroAvailable()) this.setState(reduceForgeWeapon(this.state), 'weapon_forge'); }
  awakenWeapon(): void { if (this.heroAvailable()) this.setState(reduceAwakenWeapon(this.state), 'weapon_awaken'); }
  rerollWeapon(): void { if (this.heroAvailable()) this.setState(reduceRerollWeapon(this.state), 'weapon_reroll'); }
  rebirthHero(): void { if (this.heroAvailable()) this.setState(reduceRebirthHero(this.state), 'hero_rebirth'); }
  reforgeHero(): void { if (this.heroAvailable()) this.setState(reduceReforgeHero(this.state), 'hero_reforge'); }
  summonHero(): SummonDescriptor | null {
    if (!this.heroAvailable() || this.state.investment.bhc + 0.000001 < SUMMON_COST) return null;
    const roll = Math.random();
    const now = Date.now();
    const descriptor = rollSummonDescriptor(roll, this.state.summoning.pity, this.state.summoning.totalSummons, this.state.summoning.heroes, now);
    const key = `summon:${this.config.playerId}:${now}:${crypto.randomUUID()}`;
    this.setState(reduceSummonHero(this.state, roll, key, now), 'hero_summon');
    return descriptor;
  }
  runSummonedHeroBattle(heroId: string): void { this.setState(reduceSummonedHeroBattle(this.state, heroId), 'summoned_hero_battle'); }
  challengeEmberColossus(): void { if (this.heroAvailable()) this.setState(reduceChallengeEmberColossus(this.state), 'ember_colossus'); }

  // ---- economy (shop) ----

  buyShopItem(shopItemId: string): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceShopBuy(this.state, shopItemId), 'shop_purchase');
  }

  sellItem(itemId: string): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceShopSell(this.state, itemId), 'shop_sale');
  }

  createMarketplaceListing(assetType: MarketplaceAssetType, assetId: string, price: number): void {
    const key = `listing:${this.config.playerId}:${assetType}:${assetId}:${Date.now()}`;
    this.setState(reduceCreateMarketplaceListing(this.state, this.config.playerId, assetType, assetId, price, key), 'marketplace_listing');
  }

  cancelMarketplaceListing(listingId: string): void {
    this.setState(reduceCancelMarketplaceListing(this.state, this.config.playerId, listingId), 'marketplace_cancel');
  }

  buyMarketplaceListing(listingId: string): void {
    const key = `purchase:${this.config.playerId}:${listingId}:${Date.now()}`;
    this.setState(reduceBuyMarketplaceListing(this.state, this.config.playerId, listingId, key), 'marketplace_purchase');
  }

  // ---- dungeons ----

  startDungeon(dungeonId: string): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceDungeonEnter(this.state, dungeonId), 'dungeon_entry');
  }

  dungeonFight(): void {
    if (!this.heroAvailable()) return;
    this.setState(reduceDungeonFight(this.state), 'dungeon_combat');
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
    this.flushPersistence();
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', this.flushOnPageExit);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.flushOnVisibilityChange);
    this.listeners.clear();
  }
}
