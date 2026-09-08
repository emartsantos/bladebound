import { describe, expect, it } from 'vitest';
import { ALL_ENEMIES } from '@premium-rpg/game-data';
import type { EquipmentSlots, SkillId } from '@premium-rpg/shared-types';
import type { GamePersistence, GameSaveData } from '@/lib/persistence/game-persistence';
import type { GameState, SeedConfig } from '@/lib/game/service';
import {
  mergeSeed,
  tick,
  reduceStartAction,
  reduceSetCombatTarget,
  reduceFight,
  reduceEquipItem,
  reduceUnequipItem,
  reduceShopBuy,
  reduceShopSell,
  reduceDungeonEnter,
  reduceDungeonFight,
  reduceAbandonDungeon,
  reduceClearDungeon,
  resolveDungeonCombat,
  shopBuyPrice,
  shopSellPrice,
  gameToSaveData,
  xpStepForLevel,
  MAX_ACTION_QUEUE,
  reduceRemoveQueuedAction,
  reduceTaskEvent,
  reduceClaimTask,
} from '@/lib/game/service';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { levelForXp } from '@premium-rpg/game-engine';

// ── helpers ─────────────────────────────────────────────────────

const ALL_SKILLS: SkillId[] = ['mining', 'woodcutting', 'fishing', 'smelting', 'smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting'];

class MemoryPersistence implements GamePersistence {
  private store = new Map<string, GameSaveData>();

  load(playerId: string): GameSaveData | null {
    return this.store.get(playerId) ?? null;
  }
  save(playerId: string, data: GameSaveData): void {
    this.store.set(playerId, { ...data, skills: { ...data.skills }, inventory: { ...data.inventory } });
  }
  remove(playerId: string): void {
    this.store.delete(playerId);
  }
}

const emptySlots = (): EquipmentSlots => ({
  weapon: null,
  offhand: null,
  helmet: null,
  chest: null,
  gloves: null,
  legs: null,
  boots: null,
  amulet: null,
  ring: null,
  cape: null,
});

describe('trade action queue', () => {
  it('queues actions FIFO and advances after the current action completes', () => {
    const base = mergeSeed(makeConfig());
    const mining = reduceStartAction(base, 'mining', 'copper_vein', 'gathering');
    const queued = reduceStartAction(mining, 'woodcutting', 'regular_tree', 'gathering');

    expect(queued.activeAction?.skill).toBe('mining');
    expect(queued.actionQueue).toHaveLength(1);
    expect(queued.actionQueue[0].nodeId).toBe('regular_tree');

    const advanced = tick(queued, queued.activeAction!.startTime + queued.activeAction!.duration + 1);
    expect(advanced.activeAction?.skill).toBe('woodcutting');
    expect(advanced.activeAction?.nodeId).toBe('regular_tree');
    expect(advanced.actionQueue).toHaveLength(0);
  });

  it('caps pending trade actions at ten and supports removing one', () => {
    const base = reduceStartAction(mergeSeed(makeConfig()), 'mining', 'copper_vein', 'gathering');
    let state = base;
    for (let i = 0; i < MAX_ACTION_QUEUE + 3; i += 1) {
      state = reduceStartAction(state, 'mining', 'copper_vein', 'gathering');
    }
    expect(state.actionQueue).toHaveLength(MAX_ACTION_QUEUE);

    const shortened = reduceRemoveQueuedAction(state, 4);
    expect(shortened.actionQueue).toHaveLength(MAX_ACTION_QUEUE - 1);
  });

  it('persists the current action and queue across reloads', () => {
    const persistence = new MemoryPersistence();
    let state = reduceStartAction(mergeSeed(makeConfig({ persistence })), 'mining', 'copper_vein', 'gathering');
    state = reduceStartAction(state, 'woodcutting', 'regular_tree', 'gathering');
    persistence.save('p-test', gameToSaveData(state));

    const reloaded = mergeSeed(makeConfig({ persistence }));
    expect(reloaded.activeAction?.nodeId).toBe('copper_vein');
    expect(reloaded.actionQueue[0]?.nodeId).toBe('regular_tree');
  });
});

describe('daily task progress', () => {
  it('advances a matching gameplay objective and persists the counter', () => {
    const base = mergeSeed(makeConfig());
    const key = Object.keys(base.task.daily)[0];
    const taskNow = Date.now();
    const assignment = {
      taskId: 'd_mine_copper', group: 'daily' as const, objectiveType: 'gather' as const,
      objectiveTarget: 'copper_ore', skillId: 'mining', regionId: null,
      required: 12, current: 0, completed: false, claimed: false, assignedAt: taskNow,
    };
    const state: GameState = { ...base, task: { ...base.task, daily: { [key]: [assignment] } } };

    const progressed = reduceTaskEvent(state, {
      type: 'resource_gathered', skillId: 'mining', resourceId: 'copper_ore', quantity: 3,
    }, taskNow);
    expect(progressed.task.daily[key][0].current).toBe(3);
    expect(gameToSaveData(progressed).task?.daily[key][0].current).toBe(3);
  });

  it('allows a completed daily task reward to be claimed once', () => {
    const base = mergeSeed(makeConfig());
    const key = Object.keys(base.task.daily)[0];
    const taskNow = Date.now();
    const assignment = {
      taskId: 'd_mine_copper', group: 'daily' as const, objectiveType: 'gather' as const,
      objectiveTarget: 'copper_ore', skillId: 'mining', regionId: null,
      required: 12, current: 12, completed: true, claimed: false, assignedAt: taskNow,
    };
    const state: GameState = { ...base, task: { ...base.task, daily: { [key]: [assignment] } } };
    const claimed = reduceClaimTask(state, assignment.taskId, taskNow);
    expect(claimed.gold).toBe(state.gold + 110);
    expect(claimed.task.daily[key][0].claimed).toBe(true);
    expect(reduceClaimTask(claimed, assignment.taskId, taskNow)).toBe(claimed);
  });
});

const baseSkills = (): Record<SkillId, { level: number; xp: number }> =>
  Object.fromEntries(ALL_SKILLS.map((id) => [id, { level: 1, xp: 0 }])) as Record<SkillId, { level: number; xp: number }>;

function makeConfig(overrides?: Partial<SeedConfig>): SeedConfig {
  return {
    playerId: 'p-test',
    playerName: 'Test',
    skills: baseSkills(),
    combatLevel: 1,
    equipment: emptySlots(),
    gold: 0,
    persistence: new MemoryPersistence(),
    ...overrides,
  };
}

const now = 1_700_000_000_000;

// ── seeding ─────────────────────────────────────────────────────

describe('mergeSeed', () => {
  it('seeds a fresh save with the starter satchel and player identity', () => {
    const state = mergeSeed(makeConfig());
    expect(state.playerName).toBe('Test');
    expect(state.combatLevel).toBe(1);
    expect(state.inventory.copper_ore).toBe(6);
    expect(state.combat.mustPick).toBe(true);
  });

  it('preserves saved progression over the shell player seed when a save exists', () => {
    const persistence = new MemoryPersistence();
    persistence.save('p-test', { skills: { ...baseSkills(), mining: 1000 } } as unknown as GameSaveData);
    const state = mergeSeed(makeConfig({ persistence, gold: 1234 }));
    // Saved skill XP wins over the shell's level-1 seed…
    expect(state.skills.mining).toBe(1000);
    // …but a zero-difference numeric field falls back to the shell seed.
    expect(state.gold).toBe(1234);
    expect(state.playerName).toBe('Test');
  });

  it('persists gameToSaveData round-trip through a GamePersistence', () => {
    const persistence = new MemoryPersistence();
    const persisted = makeConfig({ persistence, gold: 777 });
    const state = mergeSeed(persisted);
    persistence.save('p-test', gameToSaveData(state));
    const reloaded = mergeSeed({ ...makeConfig(), persistence });
    expect(reloaded.gold).toBe(777);
  });
});

// ── gathering ───────────────────────────────────────────────────

describe('gathering', () => {
  it('grants resources and XP on completion and re-arms the action', () => {
    const base = mergeSeed(makeConfig());
    const started = reduceStartAction(base, 'mining', 'copper_vein', 'gathering');
    expect(started.activeAction?.nodeId).toBe('copper_vein');

    // Force the action to have "completed" by starting the scheduled ticks.
    let state = started;
    for (let i = 0; i < 40 && state.activeAction; i += 1) {
      state = tick(state, state.activeAction.startTime + state.activeAction.duration + 1);
    }

    expect(state.skills.mining).toBeGreaterThan(0);
    expect((state.inventory.copper_ore ?? 0)).toBeGreaterThan(6); // satchel + harvested
    expect(state.gains.some((g) => g.kind === 'xp')).toBe(true);
    // action is re-armed for the next cycle, not stuck
    expect(state.activeAction).not.toBeNull();
  });

  it('does not double-grant on a duplicate completed tick (re-arm guard)', () => {
    const base = mergeSeed(makeConfig());
    const started = reduceStartAction(base, 'mining', 'copper_vein', 'gathering');
    const completedAt = started.activeAction!.startTime + started.activeAction!.duration;

    const first = tick(started, completedAt + 1);
    const before = first.gains.length;
    const inventoryBefore = { ...first.inventory };

    // Re-evaluating the same finished state with the same wall clock must not
    // grant again — single-action/reward idempotency.
    const duplicate = tick(first, completedAt + 1);
    expect(duplicate.gains.length).toBe(before);
    expect(duplicate.inventory).toEqual(inventoryBefore);
  });
});

// ── crafting ────────────────────────────────────────────────────

describe('crafting', () => {
  it('consumes ingredients and grants the output + XP', () => {
    const base = mergeSeed(makeConfig());
    // bronze bar needs 1 copper_ore + 1 tin_ore — starter satchel has both
    const started = reduceStartAction(base, 'smithing', 'smith_bronze_bar', 'crafting');
    expect(started.activeAction?.recipeId).toBe('smith_bronze_bar');

    let state: GameState = started;
    for (let i = 0; i < 40 && state.activeAction; i += 1) {
      state = tick(state, state.activeAction.startTime + state.activeAction.duration + 1);
    }
    expect(state.skills.smithing).toBeGreaterThan(0);
    expect((state.inventory.bronze_bar ?? 0)).toBeGreaterThan(0);
    expect((state.inventory.copper_ore ?? 0)).toBeLessThan(6); // consumed
  });

  it('cancels instead of granting when ingredients run out', () => {
    const base = mergeSeed(makeConfig({ gold: 0 }));
    const started = reduceStartAction(base, 'smithing', 'smith_bronze_bar', 'crafting');
    // Drain the copper/anvil ingredients so completion finds the recipe
    // unaffordable mid-flight.
    let state: GameState = { ...started, inventory: { ...started.inventory, copper_ore: 0, tin_ore: 0 } };
    state = tick(state, state.activeAction!.startTime + state.activeAction!.duration + 1);
    expect(state.activeAction).toBeNull();
    expect((state.inventory.bronze_bar ?? 0)).toBe(0);
  });
});

// ── combat ──────────────────────────────────────────────────────

describe('combat', () => {
  it('grants gold, XP and at most one kill on victory and clears the encounter', () => {
    const goblin = ALL_ENEMIES.find((e) => e.id === 'goblin');
    expect(goblin).toBeDefined();

    const config = makeConfig({ combatLevel: 5 });
    const base = mergeSeed(config);
    const targeted = reduceSetCombatTarget(base, 'starter-frontier', 'goblin');
    // generous HP so the fight is a guaranteed goblin victory without flake
    const armed: GameState = { ...targeted, combat: { ...targeted.combat, playerHp: 999 } };

    const fighting = reduceFight(armed);
    expect(fighting.combat.encounter).not.toBeNull();

    let state = fighting;
    let ticks = 0;
    while (state.combat.encounter && ticks < 500) {
      state = tick(state, (state.combat.nextRoundAt ?? 0) + 1);
      ticks += 1;
    }

    expect(state.combat.encounter).toBeNull();
    expect(state.combat.sessionKills).toBe(1);
    expect(state.gold).toBeGreaterThan(0);
    expect(state.combatXp).toBeGreaterThan(0);
    expect(state.gains.some((g) => g.kind === 'gold')).toBe(true);

    // Loot cannot be re-collected: re-ticking the same post-victory state
    // grants nothing new.
    const settled = tick(state, (state.combat.nextAutoFightAt ?? 0) + 1);
    expect(settled.combat.sessionKills).toBe(1);
    expect(settled.gold).toBe(state.gold);
  });
});

// ── equipment ───────────────────────────────────────────────────

describe('equipment', () => {
  const slotWeapon = 'weapon' as const;

  it('equips from inventory, removing from inventory and adding durability', () => {
    const base = mergeSeed(makeConfig());
    const withSword: GameState = { ...base, inventory: { ...base.inventory, iron_sword: 1 } };
    const equipped = reduceEquipItem(withSword, slotWeapon, 'iron_sword');
    expect(equipped.equipment.weapon?.itemId).toBe('iron_sword');
    expect(equipped.equipment.weapon?.durability).toBe(100);
    expect(equipped.inventory.iron_sword ?? 0).toBe(0);
  });

  it('unequips back to inventory', () => {
    const base = mergeSeed(makeConfig());
    const withSword: GameState = { ...base, inventory: { ...base.inventory, iron_sword: 1 } };
    const equipped = reduceEquipItem(withSword, slotWeapon, 'iron_sword');
    expect(equipped.equipment.weapon).not.toBeNull();
    const unequipped = reduceUnequipItem(equipped, slotWeapon);
    expect(unequipped.equipment.weapon).toBeNull();
    expect(unequipped.inventory.iron_sword).toBe(1);
  });

  it('rejects equipping when the item does not exist in inventory', () => {
    const base = mergeSeed(makeConfig());
    const result = reduceEquipItem(base, slotWeapon, 'iron_sword');
    expect(result.equipment.weapon).toBeNull();
  });

  it('rejects equipping an item into the wrong slot', () => {
    const base = mergeSeed(makeConfig());
    const withSword: GameState = { ...base, inventory: { ...base.inventory, iron_sword: 1 } };
    const result = reduceEquipItem(withSword, 'helmet', 'iron_sword');
    expect(result.equipment.helmet).toBeNull();
    expect(result.inventory.iron_sword).toBe(1);
  });
});

// ── progression ─────────────────────────────────────────────────

describe('progression', () => {
  it('uses the engine XP curve: step sum equals cumulative XP at a level', () => {
    let cumulative = 0;
    for (let level = 1; level < 10; level += 1) {
      cumulative += xpStepForLevel(level);
      expect(cumulativeXpForLevel(level + 1)).toBe(cumulative);
    }
  });

  it('levelForXp and cumulativeXpForLevel are consistent round-trips', () => {
    const xp = cumulativeXpForLevel(12) + xpStepForLevel(11); // just into level 12
    expect(levelForXp(xp)).toBe(12);
  });
});

// ── shop / economy ──────────────────────────────────────────────

describe('shop', () => {
  it('derives a positive gold buy price for stock items with price 0', () => {
    const state = mergeSeed(makeConfig());
    // bronze sword has no authored price -> derived from item value * markup
    const price = shopBuyPrice({ id: 'shop_bronze_sword', itemId: 'bronze_sword', price: 0, currency: 'gold', levelRequired: 1, category: 'gear' });
    expect(price).toBeGreaterThan(0);
  });

  it('buys a gold item, charging gold and adding to inventory', () => {
    const base = mergeSeed(makeConfig({ gold: 10_000 }));
    const beforePrice = shopBuyPrice({ id: 'shop_bronze_sword', itemId: 'bronze_sword', price: 0, currency: 'gold', levelRequired: 1, category: 'gear' });
    const bought = reduceShopBuy(base, 'shop_bronze_sword');
    expect(bought.gold).toBe(base.gold - beforePrice);
    expect(bought.inventory.bronze_sword).toBe(1);
    expect(bought.shopBought['shop_bronze_sword']).toBe(1);
  });

  it('rejects buying without enough gold', () => {
    const base = mergeSeed(makeConfig({ gold: 0 }));
    const bought = reduceShopBuy(base, 'shop_bronze_sword');
    expect(bought.gold).toBe(0);
    expect(bought.inventory.bronze_sword).toBeUndefined();
  });

  it('sells an owned cataloged item for gold', () => {
    const base = mergeSeed(makeConfig({ gold: 0 }));
    const withItem: GameState = { ...base, inventory: { ...base.inventory, bronze_sword: 1 } };
    const sellPrice = shopSellPrice('bronze_sword');
    const sold = reduceShopSell(withItem, 'bronze_sword');
    expect(sellPrice).toBeGreaterThan(0);
    expect(sold.gold).toBe(sellPrice);
    expect(sold.inventory.bronze_sword ?? 0).toBe(0);
  });

  it('rejects selling items not owned', () => {
    const base = mergeSeed(makeConfig({ gold: 5 }));
    const sold = reduceShopSell(base, 'bronze_sword');
    expect(sold.gold).toBe(5);
  });
});

// ── dungeons ────────────────────────────────────────────────────

describe('dungeons', () => {
  // Seed then override the combat level (seedState defaults fresh saves to
  // level 1 and ignores config.combatLevel when no save exists).
  const withLevel = (combatLevel: number): GameState => ({
    ...mergeSeed(makeConfig()),
    combatLevel,
    combatXp: cumulativeXpForLevel(combatLevel),
  });

  const withKey = (state: GameState): GameState => ({
    ...state,
    inventory: { ...state.inventory, cavern_key: 1 },
  });

  it('enters a dungeon when above the level gate and holding the key', () => {
    const base = withKey(withLevel(20));
    const entered = reduceDungeonEnter(base, 'darkwood-caverns');
    expect(entered.dungeon.currentRun?.status).toBe('active');
    expect(entered.dungeon.currentRun?.dungeonId).toBe('darkwood-caverns');
    // Key is consumed on entry.
    expect(entered.inventory.cavern_key ?? 0).toBe(0);
  });

  it('starts a fight that yields a live encounter', () => {
    const base = withKey(withLevel(20));
    const entered = reduceDungeonEnter(base, 'darkwood-caverns');
    const fighting = reduceDungeonFight(entered);
    expect(fighting.dungeonCombat.encounter).not.toBeNull();
  });

  it('resolves a victory via resolveDungeonCombat', () => {
    const base = withKey(withLevel(20));
    const entered = reduceDungeonEnter(base, 'darkwood-caverns');
    const fighting = reduceDungeonFight(entered);

    // Cheat to an already-victorious finished encounter so resolution runs
    // the victory branch without grinding the loop.
    const encounter = fighting.dungeonCombat.encounter!;
    const finished = { ...encounter, finished: true, result: 'victory' as const };
    const won: GameState = {
      ...fighting,
      dungeonCombat: { ...fighting.dungeonCombat, encounter: finished },
    };
    const resolved = resolveDungeonCombat(won, 'victory', now);
    expect(resolved.dungeonCombat.encounter).toBeNull();
  });

  it('abandons an active run', () => {
    const base = withKey(withLevel(20));
    const entered = reduceDungeonEnter(base, 'darkwood-caverns');
    expect(entered.dungeon.currentRun?.status).toBe('active');
    const abandoned = reduceAbandonDungeon(entered);
    expect(abandoned.dungeon.currentRun?.status).toBe('abandoned');
  });

  it('clears a finished run so a new one can start', () => {
    const base = withKey(withLevel(20));
    const entered = reduceDungeonEnter(base, 'darkwood-caverns');
    const abandoned = reduceAbandonDungeon(entered);
    const cleared = reduceClearDungeon(abandoned);
    expect(cleared.dungeon.currentRun).toBeNull();
  });
});
