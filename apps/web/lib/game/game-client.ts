import type { SkillId, EquipmentSlot, Rarity } from '@premium-rpg/shared-types';
import type { GameState, SummonDescriptor } from './service';
import type { MarketplaceAssetType } from '@/lib/persistence/game-persistence';

/**
 * The Game Client boundary — the single seam the React UI talks through for
 * gameplay. It exposes authoritative operations and emits the resulting state;
 * components never import engine/gameplay math directly.
 *
 * Today the concrete implementation is a local client driven by the shared
 * game engine. The same interface is the target for a server-backed GameClient
 * (API → Game Service → engine → persistence), so components and providers do
 * not change when authority moves server-side.
 */
export interface GameClient {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;

  startAction(skill: SkillId, id: string, kind: 'gathering' | 'crafting', repetitions?: number): void;
  stopAction(): void;
  removeQueuedAction(index: number): void;
  clearActionQueue(): void;
  clearActionLog(): void;
  claimTask(taskId: string): void;
  rerollTask(group: 'daily' | 'weekly', index: number): void;
  claimMail(mailId: string): void;
  setSelectedSkill(skill: SkillId): void;

  setCombatTarget(regionId: string, enemyId: string): void;
  fight(): void;
  toggleAutoFight(): void;
  toggleRest(): void;
  eatFood(): void;
  clearCombatLog(): void;

  repairAll(): void;
  resetProgress(): void;
  equipItem(slot: EquipmentSlot, itemId: string, rarity?: Rarity): void;
  unequipItem(slot: EquipmentSlot): void;
  forgeWeapon(): void;
  awakenWeapon(): void;
  rerollWeapon(): void;
  rebirthHero(): void;
  reforgeHero(): void;
  /** Roll and settle a summon. Returns the roll descriptor (null when blocked). */
  summonHero(): SummonDescriptor | null;
  runSummonedHeroBattle(heroId: string): void;
  challengeEmberColossus(): void;

  buyShopItem(shopItemId: string): void;
  sellItem(itemId: string): void;
  createMarketplaceListing(assetType: MarketplaceAssetType, assetId: string, price: number): void;
  cancelMarketplaceListing(listingId: string): void;
  buyMarketplaceListing(listingId: string): void;

  startDungeon(dungeonId: string): void;
  dungeonFight(): void;
  abandonDungeon(): void;
  clearDungeon(): void;

  dispose(): void;
}
