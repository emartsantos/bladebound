import type { RegionProgress, UnlockCondition } from '@premium-rpg/shared-types';

// Region progression engine - pure functions, framework-independent

export interface Region {
  id: string;
  name: string;
  recommendedLevel: number;
  unlockConditions: UnlockCondition[];
}

export interface CheckRegionState {
  level: number;
  unlockedRegions: string[];
}

// Available conditions that can be checked by the engine
export interface RegionCheckContext {
  level: number;
  unlockedRegions: string[];
}

// Normalize comparison against a numeric target value
function evaluateCondition(
  condition: UnlockCondition,
  ctx: RegionCheckContext
): boolean {
  let actual: number | undefined;
  switch (condition.target) {
    case 'level':
      actual = ctx.level;
      break;
    case 'region':
      actual = ctx.unlockedRegions.includes(condition.target) ? 1 : 0;
      break;
    default:
      return false;
  }
  if (actual === undefined) return false;
  switch (condition.comparison) {
    case 'gte': return actual >= condition.value;
    case 'lte': return actual <= condition.value;
    case 'gt': return actual > condition.value;
    case 'lt': return actual < condition.value;
    case 'eq': return actual === condition.value;
    default: return false;
  }
}

// Check if a region is unlocked given the current context
export function isRegionUnlocked(
  region: Region,
  ctx: RegionCheckContext
): boolean {
  if (!region.unlockConditions || region.unlockConditions.length === 0) {
    return true; // Starter region always unlocked
  }
  return region.unlockConditions.every((condition) =>
    evaluateCondition(condition, ctx)
  );
}

// Initialize RegionProgress for a new player
export function createRegionProgress(
  startingRegion: string
): RegionProgress {
  return {
    currentRegion: startingRegion,
    unlockedRegions: [startingRegion],
    regionDefeatedBosses: {},
    regionVisitCount: {},
    totalRegionsVisited: 1,
    highestRegionUnlocked: startingRegion,
    lastRegionChangeTime: Date.now(),
  };
}

// Get all regions the player can access based on level + current progress
export function getUnlockedRegions(
  allRegions: Region[],
  progress: RegionProgress,
  level: number
): Region[] {
  return allRegions.filter((region) =>
    isRegionUnlocked(region, {
      level,
      unlockedRegions: progress.unlockedRegions,
    })
  );
}

// Attempt to move the player to a new region
export function moveToRegion(
  progress: RegionProgress,
  targetRegionId: string,
  allRegions: Region[],
  level: number
): { success: boolean; error?: string; newProgress?: RegionProgress } {
  const target = allRegions.find((r) => r.id === targetRegionId);
  if (!target) {
    return { success: false, error: `Region not found: ${targetRegionId}` };
  }

  const unlocked = getUnlockedRegions(allRegions, progress, level);
  const isUnlocked = unlocked.some((r) => r.id === targetRegionId);
  if (!isUnlocked) {
    return {
      success: false,
      error: `Region locked: ${target.name}. Requires level ${target.recommendedLevel} or higher.`,
    };
  }

  const visitCount = progress.regionVisitCount[targetRegionId] ?? 0;
  const wasUnlockedBefore = progress.unlockedRegions.includes(targetRegionId);

  const newProgress: RegionProgress = {
    ...progress,
    currentRegion: targetRegionId,
    unlockedRegions: wasUnlockedBefore
      ? progress.unlockedRegions
      : [...progress.unlockedRegions, targetRegionId],
    regionVisitCount: {
      ...progress.regionVisitCount,
      [targetRegionId]: visitCount + 1,
    },
    totalRegionsVisited: wasUnlockedBefore
      ? progress.totalRegionsVisited
      : progress.totalRegionsVisited + 1,
    highestRegionUnlocked: allRegions
      .filter((r) => wasUnlockedBefore
        ? progress.unlockedRegions.includes(r.id) || r.id === targetRegionId
        : [...progress.unlockedRegions, targetRegionId].includes(r.id))
      .reduce(
        (highest, r) =>
          !highest || highest.recommendedLevel < r.recommendedLevel
            ? r
            : highest,
        null as Region | null
      )?.id ?? targetRegionId,
    lastRegionChangeTime: Date.now(),
  };

  return { success: true, newProgress };
}

// Mark a boss as defeated in a region
export function markBossDefeated(
  progress: RegionProgress,
  regionId: string,
  bossId: string
): RegionProgress {
  return {
    ...progress,
    regionDefeatedBosses: {
      ...progress.regionDefeatedBosses,
      [regionId]: true,
      [`${regionId}:${bossId}`]: true,
    },
  };
}

// Check if a region's boss is defeated
export function isBossDefeated(
  progress: RegionProgress,
  regionId: string,
  bossId: string
): boolean {
  return !!progress.regionDefeatedBosses[`${regionId}:${bossId}`];
}

// Count defeated bosses across all regions
export function countDefeatedBosses(progress: RegionProgress): number {
  return Object.entries(progress.regionDefeatedBosses)
    .filter(([key, value]) => value && key.includes(':'))
    .length;
}

// Determine the next region in progression after the current one
export function getNextRegion(
  allRegions: Region[],
  currentRegionId: string
): Region | null {
  const index = allRegions.findIndex((r) => r.id === currentRegionId);
  if (index < 0 || index >= allRegions.length - 1) return null;
  return allRegions[index + 1];
}

// Get the recommended level for a region
export function getRegionRecommendedLevel(
  allRegions: Region[],
  regionId: string
): number | null {
  const region = allRegions.find((r) => r.id === regionId);
  return region ? region.recommendedLevel : null;
}
