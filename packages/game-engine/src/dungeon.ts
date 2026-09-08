import type {
  DungeonDefinition,
  DungeonEncounter,
  DungeonRunState,
  DungeonProgressState,
  PlayerDungeonState,
  DungeonRunHistory,
} from '@premium-rpg/shared-types';

// ─── INTERNAL HELPERS ────────────────────────────────────────────────

function createEmptyProgress(dungeonId: string): DungeonProgressState {
  return {
    bestFloor: 0,
    clears: 0,
    firstClearDone: false,
    firstClearAt: null,
    bestTimeMs: null,
    lastRunTime: null,
    history: [],
    bossCleared: {},
  };
}

// ─── STATE CREATION ──────────────────────────────────────────────────

// Create an empty player dungeon save payload (all dungeons idle)
export function createEmptyDungeonState(dungeonIds: string[]): PlayerDungeonState {
  const progress: Record<string, DungeonProgressState> = {};
  for (const id of dungeonIds) {
    progress[id] = createEmptyProgress(id);
  }
  return { currentRun: null, progress };
}

// ─── ENTRY REQUIREMENTS ──────────────────────────────────────────────

export function checkDungeonEntry(
  dungeon: DungeonDefinition,
  playerLevel: number,
  opts: {
    hasKey?: boolean;
  } = {}
): { allowed: boolean; reason?: string } {
  const req = dungeon.entryRequirement;
  if (playerLevel < req.level) {
    return { allowed: false, reason: `Requires level ${req.level}` };
  }
  if (req.keyId && !opts.hasKey) {
    return { allowed: false, reason: `Requires a ${req.keyId} to enter` };
  }
  return { allowed: true };
}

// ─── RUN LIFECYCLE ───────────────────────────────────────────────────

export interface StartDungeonOptions {
  isFirstClear?: boolean;
  now?: number;
  hasKey?: boolean;
}

// Begin a dungeon run (validates entry, resets player dungeon state)
export function startDungeonRun(
  state: PlayerDungeonState,
  dungeon: DungeonDefinition,
  playerLevel: number,
  opts: StartDungeonOptions = {}
): { success: boolean; reason?: string; state?: PlayerDungeonState; run?: DungeonRunState } {
  if (state.currentRun && state.currentRun.status === 'active') {
    return { success: false, reason: 'A dungeon run is already in progress' };
  }

  const entry = checkDungeonEntry(dungeon, playerLevel, { hasKey: opts.hasKey });
  if (!entry.allowed) {
    return { success: false, reason: entry.reason };
  }

  const now = opts.now ?? Date.now();
  const progress = state.progress[dungeon.id] ?? createEmptyProgress(dungeon.id);
  const isFirstClear = opts.isFirstClear ?? !progress.firstClearDone;

  const run: DungeonRunState = {
    dungeonId: dungeon.id,
    status: 'active',
    currentFloor: 1,
    startedAt: now,
    currentEncounterId: dungeon.encounters[0]?.id ?? null,
    encountersCleared: [],
    isFirstClear,
    completedAt: null,
    result: null,
  };

  return {
    success: true,
    run,
    state: {
      currentRun: run,
      progress: {
        ...state.progress,
        [dungeon.id]: progress,
      },
    },
  };
}

// Get the encounter currently being fought
export function getCurrentEncounter(
  run: DungeonRunState,
  dungeon: DungeonDefinition
): DungeonEncounter | null {
  if (run.currentFloor < 1 || run.currentFloor > dungeon.encounters.length) {
    return null;
  }
  return dungeon.encounters[run.currentFloor - 1];
}

// Get the progress state (all floors / how many remain, boss preview)
export function getRunProgress(
  run: DungeonRunState,
  dungeon: DungeonDefinition
): {
  currentFloor: number;
  totalFloors: number;
  floorsRemaining: number;
  percentComplete: number;
  currentEncounter: DungeonEncounter | null;
  bossEncounter: DungeonEncounter | null;
  isOnBoss: boolean;
} {
  const totalFloors = dungeon.encounters.length;
  const currentEncounter = getCurrentEncounter(run, dungeon);
  const bossEncounter = dungeon.encounters[dungeon.encounters.length - 1] ?? null;
  const isOnBoss = currentEncounter?.type === 'boss';
  return {
    currentFloor: run.currentFloor,
    totalFloors,
    floorsRemaining: Math.max(0, totalFloors - run.currentFloor),
    percentComplete: Math.min(100, Math.round((run.currentFloor / totalFloors) * 100)),
    currentEncounter,
    bossEncounter,
    isOnBoss,
  };
}

// ─── ENCOUNTER COMPLETION ────────────────────────────────────────────

// Called after the combat for the current encounter resolves. Advances
// the run or finalizes it if all floors (including boss) are cleared.
export function resolveDungeonEncounter(
  state: PlayerDungeonState,
  dungeon: DungeonDefinition,
  encounterResult: 'victory' | 'defeat' | 'retreat',
  opts: { now?: number } = {}
): { state: PlayerDungeonState; runFinished?: boolean; run?: DungeonRunState } {
  const run = state.currentRun;
  if (!run || run.status !== 'active') {
    throw new Error('No active dungeon run');
  }
  const now = opts.now ?? Date.now();
  const progress = state.progress[dungeon.id] ?? createEmptyProgress(dungeon.id);

  const currentEncounter = getCurrentEncounter(run, dungeon);

  if (encounterResult === 'defeat') {
    // Run failed - player died on this floor
    const failedRun: DungeonRunState = {
      ...run,
      status: 'failed',
      completedAt: now,
      result: 'defeat',
    };
    return {
      state: {
        currentRun: failedRun,
        progress: {
          ...state.progress,
          [dungeon.id]: {
            ...progress,
            lastRunTime: now,
            bestFloor: Math.max(progress.bestFloor, failedRun.currentFloor),
          },
        },
      },
      runFinished: true,
      run: failedRun,
    };
  }

  if (encounterResult === 'retreat') {
    // Player abandoned the run voluntarily mid-way
    const abandoned: DungeonRunState = {
      ...run,
      status: 'abandoned',
      completedAt: now,
      result: null,
    };
    return {
      state: {
        currentRun: abandoned,
        progress: {
          ...state.progress,
          [dungeon.id]: {
            ...progress,
            lastRunTime: now,
          },
        },
      },
      runFinished: true,
      run: abandoned,
    };
  }

  // victory
  const clearedIds = [...run.encountersCleared];
  if (currentEncounter) {
    clearedIds.push(currentEncounter.id);
  }

  const isLastEncounter = run.currentFloor >= dungeon.encounters.length;

  if (isLastEncounter) {
    // Full clear - finalize as completed
    const completedRun: DungeonRunState = {
      ...run,
      status: 'completed',
      currentFloor: dungeon.encounters.length,
      encountersCleared: clearedIds,
      completedAt: now,
      result: 'victory',
      currentEncounterId: null,
    };

    return {
      state: {
        currentRun: completedRun,
        progress: {
          ...state.progress,
          [dungeon.id]: {
            ...progress,
            bestFloor: dungeon.encounters.length,
            clears: progress.clears + 1,
            firstClearDone: run.isFirstClear ? true : progress.firstClearDone,
            firstClearAt:
              progress.firstClearAt ?? (run.isFirstClear ? now : progress.firstClearAt),
            bestTimeMs: progress.bestTimeMs === null
              ? now - run.startedAt
              : Math.min(progress.bestTimeMs, now - run.startedAt),
            lastRunTime: now,
            bossCleared: {
              ...progress.bossCleared,
              [dungeon.id]: true,
            },
          },
        },
      },
      runFinished: true,
      run: completedRun,
    };
  }

  // Advance to next floor
  const advancedRun: DungeonRunState = {
    ...run,
    currentFloor: run.currentFloor + 1,
    encountersCleared: clearedIds,
    currentEncounterId: dungeon.encounters[run.currentFloor]?.id ?? null,
  };

  return {
    state: {
      currentRun: advancedRun,
      progress: {
        ...state.progress,
        [dungeon.id]: {
          ...progress,
          bestFloor: Math.max(progress.bestFloor, advancedRun.currentFloor),
        },
      },
    },
    runFinished: false,
    run: advancedRun,
  };
}

// ─── REWARDS ─────────────────────────────────────────────────────────

export interface DungeonRewardResult {
  xp: number;
  gold: number;
  items: { itemId: string; quantity: number }[];
  isFirstClear: boolean;
}

// Compute rewards for a completed (full-clear) run
export function computeDungeonRewards(
  run: DungeonRunState,
  dungeon: DungeonDefinition
): DungeonRewardResult {
  const reward = dungeon.reward;
  const isFirstClear = run.isFirstClear;

  let xp = reward.xp;
  let gold = reward.gold;
  const items = [...reward.guaranteed].map((d) => ({ ...d }));

  // Apply repeat reward multiplier for non-first clears
  if (!isFirstClear) {
    xp = Math.floor(xp * dungeon.repeatRewardMultiplier);
    gold = Math.floor(gold * dungeon.repeatRewardMultiplier);
    items.forEach((item) => {
      item.quantity = Math.max(1, Math.floor(item.quantity * dungeon.repeatRewardMultiplier));
    });
  }

  // Add first-clear bonus items
  if (isFirstClear && reward.firstClearBonus) {
    for (const bonus of reward.firstClearBonus) {
      items.push({ ...bonus });
    }
  }

  return { xp, gold, items, isFirstClear };
}

// ─── RUN HISTORY ─────────────────────────────────────────────────────

const MAX_HISTORY_PER_DUNGEON = 10;

export function addRunHistory(
  progress: DungeonProgressState,
  entry: DungeonRunHistory
): DungeonProgressState {
  return {
    ...progress,
    history: [...progress.history, entry].slice(-MAX_HISTORY_PER_DUNGEON),
  };
}

// ─── ABANDON / RESET ─────────────────────────────────────────────────

export function abandonDungeonRun(
  state: PlayerDungeonState
): PlayerDungeonState {
  const run = state.currentRun;
  if (!run || run.status !== 'active') return state;
  return {
    ...state,
    currentRun: { ...run, status: 'abandoned', completedAt: Date.now() },
  };
}

// Clear a finished run so the player can start a new one
export function clearDungeonRun(
  state: PlayerDungeonState
): PlayerDungeonState {
  return { ...state, currentRun: null };
}
