'use client';

// The React-facing game facade. All gameplay authority lives behind the
// GameClient boundary (lib/game/), which is driven by the pure domain service
// (lib/game/service.ts) and the shared engine. This provider owns React state
// wiring only — it does not run gameplay math or touch engine/data directly.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SkillId, FoodItem, BaseStats, EquipmentSlot } from '@premium-rpg/shared-types';
import type { GameClient } from './game/game-client';
import { LocalGameClient } from './game/local-game-client';
import { mergeSeed, xpStepForLevel } from './game/service';
import type { GameState, ActiveAction, QueuedAction, ActionLogEntry, GainFeed, CombatView, SkillView } from './game/service';
import { levelForXp } from '@premium-rpg/game-engine';
import { usePlayer } from './use-player';
import { baseStatsForLevel, cumulativeXpForLevel } from './player-summary';
import { itemName, itemHeal } from './item-names';
import { useNotifications } from '@/components/ui/notification';
import { localGamePersistence } from '@/lib/persistence/local-game-persistence';

export type { GameState, ActiveAction, QueuedAction, ActionLogEntry, GainFeed, CombatView, SkillView };

export interface GameContextValue {
  state: GameState;
  playerId: string;
  stats: BaseStats;
  maxHealth: number;
  skillView: (skill: SkillId) => SkillView;
  foods: FoodItem[];
  startAction: (skill: SkillId, id: string, kind: 'gathering' | 'crafting') => void;
  stopAction: () => void;
  removeQueuedAction: (index: number) => void;
  clearActionQueue: () => void;
  clearActionLog: () => void;
  claimTask: (taskId: string) => void;
  setSelectedSkill: (skill: SkillId) => void;
  setCombatTarget: (regionId: string, enemyId: string) => void;
  fight: () => void;
  toggleAutoFight: () => void;
  toggleRest: () => void;
  eatFood: () => void;
  clearCombatLog: () => void;
  repairAll: () => void;
  resetProgress: () => void;
  equipItem: (slot: EquipmentSlot, itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  buyShopItem: (shopItemId: string) => void;
  sellItem: (itemId: string) => void;
  startDungeon: (dungeonId: string) => void;
  dungeonFight: () => void;
  abandonDungeon: () => void;
  clearDungeon: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children, resetNonce }: { children: ReactNode; resetNonce?: number }) {
  const { player } = usePlayer();
  const { addNotification } = useNotifications();
  const playerId = player.id;

  const [state, setState] = useState<GameState>(() =>
    mergeSeed({
      playerId,
      playerName: player.name,
      skills: player.skills,
      combatLevel: player.combatLevel,
      equipment: player.equipment,
      gold: player.currency.gold,
      persistence: localGamePersistence,
    }),
  );

  const clientRef = useRef<GameClient | null>(null);
  const playerRef = useRef(player);
  playerRef.current = player;

  // Create the client (and re-seed) when the player identity changes or a
  // reset is requested. Ongoing actions are NOT reset by section navigation —
  // the client persists for the lifetime of this provider.
  useEffect(() => {
    const p = playerRef.current;
    const client = new LocalGameClient({
      playerId,
      playerName: p.name,
      skills: p.skills,
      combatLevel: p.combatLevel,
      equipment: p.equipment,
      gold: p.currency.gold,
      persistence: localGamePersistence,
    });
    client.subscribe((next) => setState(next));
    clientRef.current = client;
    setState(client.getState());
    return () => {
      client.dispose();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, resetNonce]);

  const run = useCallback((op: (client: GameClient) => void) => {
    const client = clientRef.current;
    if (client) op(client);
  }, []);

  const stats = baseStatsForLevel(state.combatLevel);
  const maxHealth = stats.maxHealth;

  const skillView = useCallback(
    (skill: SkillId): SkillView => {
      const xp = state.skills[skill];
      const level = levelForXp(xp);
      const intoLevel = xp - cumulativeXpForLevel(level);
      const needNext = xpStepForLevel(level);
      return {
        skill,
        level,
        xp,
        intoLevel,
        needNext,
        pct: needNext > 0 ? Math.min(100, Math.round((intoLevel / needNext) * 100)) : 100,
      };
    },
    [state.skills],
  );

  const foods = useMemo(
    () =>
      Object.entries(state.inventory)
        .filter(([id, qty]) => qty > 0 && itemHeal(id) !== undefined)
        .map(([id]) => ({ itemId: id, name: itemName(id), healAmount: itemHeal(id) ?? 0 })),
    [state.inventory],
  );

  const startAction = useCallback((skill: SkillId, id: string, kind: 'gathering' | 'crafting') => run((c) => c.startAction(skill, id, kind)), [run]);
  const stopAction = useCallback(() => run((c) => c.stopAction()), [run]);
  const removeQueuedAction = useCallback((index: number) => run((c) => c.removeQueuedAction(index)), [run]);
  const clearActionQueue = useCallback(() => run((c) => c.clearActionQueue()), [run]);
  const clearActionLog = useCallback(() => run((c) => c.clearActionLog()), [run]);
  const claimTask = useCallback((taskId: string) => run((c) => c.claimTask(taskId)), [run]);
  const setSelectedSkill = useCallback((skill: SkillId) => run((c) => c.setSelectedSkill(skill)), [run]);
  const setCombatTarget = useCallback((regionId: string, enemyId: string) => run((c) => c.setCombatTarget(regionId, enemyId)), [run]);
  const fight = useCallback(() => run((c) => c.fight()), [run]);
  const toggleAutoFight = useCallback(() => run((c) => c.toggleAutoFight()), [run]);
  const toggleRest = useCallback(() => run((c) => c.toggleRest()), [run]);
  const eatFood = useCallback(() => run((c) => c.eatFood()), [run]);
  const clearCombatLog = useCallback(() => run((c) => c.clearCombatLog()), [run]);
  const repairAll = useCallback(() => run((c) => c.repairAll()), [run]);
  const equipItem = useCallback((slot: EquipmentSlot, itemId: string) => run((c) => c.equipItem(slot, itemId)), [run]);
  const unequipItem = useCallback((slot: EquipmentSlot) => run((c) => c.unequipItem(slot)), [run]);

  const buyShopItem = useCallback((shopItemId: string) => run((c) => c.buyShopItem(shopItemId)), [run]);
  const sellItem = useCallback((itemId: string) => run((c) => c.sellItem(itemId)), [run]);
  const startDungeon = useCallback((dungeonId: string) => run((c) => c.startDungeon(dungeonId)), [run]);
  const dungeonFight = useCallback(() => run((c) => c.dungeonFight()), [run]);
  const abandonDungeon = useCallback(() => run((c) => c.abandonDungeon()), [run]);
  const clearDungeon = useCallback(() => run((c) => c.clearDungeon()), [run]);

  const resetProgress = useCallback(() => {
    run((c) => c.resetProgress());
    addNotification('info', 'New save', 'Progress was reset.');
  }, [run, addNotification]);

  return (
    <GameContext.Provider
      value={{
        state,
        playerId,
        stats,
        maxHealth,
        skillView,
        foods,
        startAction,
        stopAction,
        removeQueuedAction,
        clearActionQueue,
        clearActionLog,
        claimTask,
        setSelectedSkill,
        setCombatTarget,
        fight,
        toggleAutoFight,
        toggleRest,
        eatFood,
        clearCombatLog,
        repairAll,
        resetProgress,
        equipItem,
        unequipItem,
        buyShopItem,
        sellItem,
        startDungeon,
        dungeonFight,
        abandonDungeon,
        clearDungeon,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
