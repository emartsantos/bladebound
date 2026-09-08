import { ALL_REGIONS } from '@premium-rpg/game-data';
import type { Region } from '@premium-rpg/game-data';

export interface RegionDisplay {
  id: Region['id'];
  name: Region['name'];
  recommendedLevel: Region['recommendedLevel'];
  enemyCount: number;
  unlocked: boolean;
  boss: Region['boss'];
}

/**
 * Pure projection of region data for the Adventure list.
 * Kept framework-independent so it can be unit tested.
 */
export function buildRegionsDisplay(regions: readonly Region[] = ALL_REGIONS): RegionDisplay[] {
  return regions.map((region) => ({
    id: region.id,
    name: region.name,
    recommendedLevel: region.recommendedLevel,
    enemyCount: region.enemyPool.length,
    unlocked: region.unlockConditions.length === 0,
    boss: region.boss ?? '—',
  }));
}