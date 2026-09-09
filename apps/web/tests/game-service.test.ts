import { describe, expect, it } from 'vitest';
import { ALL_ENEMIES, ITEM_BY_ID } from '@premium-rpg/game-data';
import type { EquipmentSlots, SkillId, Rarity } from '@premium-rpg/shared-types';
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
  MAX_ACTION_REPETITIONS,
  reduceRemoveQueuedAction,
  reduceTaskEvent,
  reduceClaimTask,
  reduceClaimMail,
  reduceRerollTask,
  reduceForgeWeapon,
  reduceAwakenWeapon,
  reduceRerollWeapon,
  reduceRebirthHero,
  reduceReforgeHero,
  battleBhcReward,
  reduceCreateMarketplaceListing,
  reduceCancelMarketplaceListing,
  reduceBuyMarketplaceListing,
  MARKETPLACE_LISTING_FEE,
  reduceSummonHero,
  reduceSummonedHeroBattle,
  summonRarityForRoll,
  SUMMON_COST,
  SUMMON_BURN,
  SUMMON_REWARD_POOL,
  SUMMON_TREASURY,
  MAX_OFFLINE_CATCHUP_PER_TICK,
  rollForgedRarity,
  rollForgedAffix,
  inventoryRarityStacks,
  reduceForgefireCraft,
  FORGEFIRE_RARITY_BOOST,
  reduceChallengeEmberColossus,
  EMBER_COLOSSUS_START,
} from '@/lib/game/service';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { getCurrentTasks, levelForXp, SMITHING_RECIPES } from '@premium-rpg/game-engine';
import { GAME_EVENTS, FORGEFIRE_EVENT_ID, activeEvents, upcomingEvents, expiredEvents, EVENT_BY_ID } from '@/lib/game/events';

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

describe('smithing equipment rarity', () => {
  it('registers every early forged equipment output as equippable gear', () => {
    expect(ITEM_BY_ID.bronze_shield.equipmentSlot).toBe('offhand');
    expect(ITEM_BY_ID.iron_shield.equipmentSlot).toBe('offhand');
    expect(ITEM_BY_ID.bronze_helmet.equipmentSlot).toBe('helmet');
    expect(ITEM_BY_ID.iron_helmet.equipmentSlot).toBe('helmet');
  });

  it('provides complete bronze-through-rune armor sets and recipes', () => {
    for (const tier of ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune']) {
      for (const piece of ['shield', 'helmet', 'platebody', 'gloves', 'legs', 'boots']) {
        const itemId = `${tier}_${piece}`;
        expect(ITEM_BY_ID[itemId]?.equipmentSlot).toBeTruthy();
        expect(SMITHING_RECIPES.some((recipe) => recipe.output.some((output) => output.itemId === itemId))).toBe(true);
      }
      expect(SMITHING_RECIPES.some((recipe) => recipe.output.some((output) => output.itemId === `${tier}_sword`))).toBe(true);
    }
  });

  it('separates forged copies into rarity stacks and rolls affixes', () => {
    const base = mergeSeed(makeConfig());
    const state = { ...base, inventory: { ...base.inventory, bronze_sword: 3 }, forgedEquipmentRarities: { bronze_sword: ['rare', 'epic'] as Rarity[] } };
    expect(inventoryRarityStacks(state, 'bronze_sword', 3, 'common')).toEqual([
      { rarity: 'epic', quantity: 1 }, { rarity: 'rare', quantity: 1 }, { rarity: 'common', quantity: 1 },
    ]);
    expect(rollForgedAffix('epic', 40, 0.1)).toMatchObject({ name: 'Mighty', value: 9 });
  });

  it('never rolls below base rarity and permits legendary quality', () => {
    expect(rollForgedRarity('rare', 1, 0.99)).toBe('rare');
    expect(rollForgedRarity('common', 99, 0)).toBe('legendary');
  });

  it('moves forged rarity from inventory to equipment and back', () => {
    const base = mergeSeed(makeConfig());
    const forged: GameState = {
      ...base,
      inventory: { ...base.inventory, bronze_sword: 1 },
      forgedEquipmentRarities: { bronze_sword: ['epic'] },
      forgedEquipmentAffixes: { bronze_sword: [{ name: 'Mighty', stat: 'strength', value: 7 }] },
    };
    const equipped = reduceEquipItem(forged, 'weapon', 'bronze_sword');
    expect(equipped.equipment.weapon?.metadata?.forgedRarity).toBe('epic');
    expect(equipped.equipment.weapon?.metadata?.bonusValue).toBe(7);
    expect(equipped.forgedEquipmentRarities.bronze_sword).toBeUndefined();
    const unequipped = reduceUnequipItem(equipped, 'weapon');
    expect(unequipped.forgedEquipmentRarities.bronze_sword).toEqual(['epic']);
    expect(unequipped.forgedEquipmentAffixes.bronze_sword?.[0]).toMatchObject({ name: 'Mighty' });
  });
});

describe('Ember Colossus event', () => {
  it('grants the exclusive weapon and daily rewards on a first victory', () => {
    const won = reduceChallengeEmberColossus(mergeSeed(makeConfig()), 0, EMBER_COLOSSUS_START + 1);
    expect(won.inventory.ember_colossus_greatsword).toBe(1);
    expect(won.inventory.coal).toBeGreaterThanOrEqual(10);
    expect(won.emberColossus.weaponClaimed).toBe(true);
    expect(won.investment.bhc).toBe(0.25);
  });

  it('allows only one attempt per UTC day', () => {
    const first = reduceChallengeEmberColossus(mergeSeed(makeConfig()), 1, EMBER_COLOSSUS_START + 1);
    expect(reduceChallengeEmberColossus(first, 0, EMBER_COLOSSUS_START + 2)).toBe(first);
  });

  it('rejects attempts after the seven-day window', () => {
    const base = mergeSeed(makeConfig());
    expect(reduceChallengeEmberColossus(base, 0, EMBER_COLOSSUS_START + 8 * 86_400_000)).toBe(base);
  });
});

describe('Forgefire Festival', () => {
  const duringForgefire = Date.UTC(2026, 8, 24);

  it('is playable for seven days and improves forged rarity odds', () => {
    expect(activeEvents(duringForgefire).map((event) => event.id)).toContain(FORGEFIRE_EVENT_ID);
    expect(EVENT_BY_ID[FORGEFIRE_EVENT_ID].endsAt - EVENT_BY_ID[FORGEFIRE_EVENT_ID].startsAt).toBe(7 * 86_400_000);
    expect(rollForgedRarity('common', 1, 0.3)).toBe('common');
    expect(rollForgedRarity('common', 1, 0.3, FORGEFIRE_RARITY_BOOST)).toBe('uncommon');
  });

  it('awards Forge Cores and the hammer cosmetic once at milestones', () => {
    let state = mergeSeed(makeConfig());
    for (let i = 0; i < 6; i += 1) state = reduceForgefireCraft(state, 'epic', duringForgefire + i);
    expect(state.events.participation[FORGEFIRE_EVENT_ID].craftingPoints).toBe(30);
    expect(state.events.participation[FORGEFIRE_EVENT_ID].claimedMilestones).toEqual([5, 15, 30]);
    expect(state.inventory.forge_core).toBe(3);
    expect(state.inventory.forgefire_hammer_cosmetic).toBe(1);
    state = reduceForgefireCraft(state, 'common', duringForgefire + 10);
    expect(state.inventory.forge_core).toBe(3);
    expect(state.inventory.forgefire_hammer_cosmetic).toBe(1);
  });
});

describe('event framework', () => {
  it('classifies active, upcoming, and expired events from centralized schedules', () => {
    const duringEmber = EMBER_COLOSSUS_START + 1;
    expect(activeEvents(duringEmber).map((event) => event.id)).toContain('ember-colossus-2026');
    expect(upcomingEvents(duringEmber).map((event) => event.id)).toContain('forgefire-festival-2026');
    expect(expiredEvents(Date.UTC(2026, 10, 1))).toHaveLength(GAME_EVENTS.length);
  });

  it('publishes complete schedule and reward-preview metadata', () => {
    for (const event of GAME_EVENTS) {
      expect(event.endsAt).toBeGreaterThan(event.startsAt);
      expect(event.rewardSummary.length).toBeGreaterThan(0);
      expect(EVENT_BY_ID[event.id]).toBe(event);
    }
  });

  it('stores participation under the reusable event id', () => {
    const won = reduceChallengeEmberColossus(mergeSeed(makeConfig()), 0, EMBER_COLOSSUS_START + 1);
    expect(won.events.participation['ember-colossus-2026'].victories).toBe(1);
    expect(won.events.participation['ember-colossus-2026'].featuredRewardClaimed).toBe(true);
  });
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

  it('repeats a queue slot the requested number of times before advancing', () => {
    const base = mergeSeed(makeConfig());
    const mining = reduceStartAction(base, 'mining', 'copper_vein', 'gathering', 3);
    const queued = reduceStartAction(mining, 'woodcutting', 'regular_tree', 'gathering', 1000);

    const afterOne = tick(queued, queued.activeAction!.startTime + queued.activeAction!.duration + 1);
    expect(afterOne.activeAction?.skill).toBe('mining');
    expect(afterOne.activeAction?.repetitionsRemaining).toBe(2);
    expect(afterOne.actionQueue[0].repetitions).toBe(1000);

    const afterTwo = tick(afterOne, afterOne.activeAction!.startTime + afterOne.activeAction!.duration + 1);
    const advanced = tick(afterTwo, afterTwo.activeAction!.startTime + afterTwo.activeAction!.duration + 1);
    expect(advanced.activeAction?.skill).toBe('woodcutting');
    expect(advanced.activeAction?.repetitionsRemaining).toBe(1000);
  });

  it('clamps repetitions to the supported range', () => {
    const base = mergeSeed(makeConfig());
    const started = reduceStartAction(base, 'mining', 'copper_vein', 'gathering', 5000);
    expect(started.activeAction?.repetitionsRemaining).toBe(MAX_ACTION_REPETITIONS);
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

  it('catches up elapsed repetitions and advances the queue after the browser was closed', () => {
    const started = reduceStartAction(mergeSeed(makeConfig()), 'mining', 'copper_vein', 'gathering', 3);
    const queued = reduceStartAction(started, 'woodcutting', 'regular_tree', 'gathering', 2);
    const resumed = tick(queued, started.activeAction!.startTime + 86_400_000);
    expect(resumed.activeAction).toBeNull();
    expect(resumed.actionQueue).toHaveLength(0);
    expect(resumed.skills.mining).toBeGreaterThan(0);
    expect(resumed.skills.woodcutting).toBeGreaterThan(0);
  });

  it('bounds offline catch-up work and continues draining on following ticks', () => {
    const started = reduceStartAction(mergeSeed(makeConfig()), 'mining', 'copper_vein', 'gathering', 1000);
    const farFuture = started.activeAction!.startTime + 86_400_000;
    const first = tick(started, farFuture);
    expect(first.activeAction?.repetitionsRemaining).toBe(1000 - MAX_OFFLINE_CATCHUP_PER_TICK);
    const second = tick(first, farFuture);
    expect(second.activeAction).toBeNull();
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

  it('preserves intentional zero balances and an intentionally empty inventory', () => {
    const persistence = new MemoryPersistence();
    persistence.save('p-test', {
      ...gameToSaveData(mergeSeed(makeConfig())),
      gold: 0,
      inventory: {},
      skills: Object.fromEntries(ALL_SKILLS.map((skill) => [skill, 0])) as Record<SkillId, number>,
    });
    const reloaded = mergeSeed(makeConfig({ persistence, gold: 500 }));
    expect(reloaded.gold).toBe(0);
    expect(reloaded.inventory).toEqual({});
    expect(reloaded.skills.mining).toBe(0);
  });
});

// ── gathering ───────────────────────────────────────────────────

describe('gathering', () => {
  it('grants resources and XP and decrements the requested repeat count', () => {
    const base = mergeSeed(makeConfig());
    const started = reduceStartAction(base, 'mining', 'copper_vein', 'gathering', 2);
    expect(started.activeAction?.nodeId).toBe('copper_vein');

    const state = tick(started, started.activeAction!.startTime + started.activeAction!.duration + 1);

    expect(state.skills.mining).toBeGreaterThan(0);
    expect((state.inventory.copper_ore ?? 0)).toBeGreaterThan(6); // satchel + harvested
    expect(state.gains.some((g) => g.kind === 'xp')).toBe(true);
    expect(state.activeAction?.repetitionsRemaining).toBe(1);
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

  it('reserves one persisted battle attempt and blocks a second fight during cooldown', () => {
    const base = reduceSetCombatTarget(mergeSeed(makeConfig({ combatLevel: 5 })), 'starter-frontier', 'goblin');
    const first = reduceFight(base);
    expect(first.combat.encounter).not.toBeNull();
    expect(first.dailyBattle.activeAttemptId).toMatch(/^battle-/);
    expect(first.dailyBattle.nextBattleAt).toBeGreaterThan(Date.now());

    const withoutEncounter: GameState = { ...first, combat: { ...first.combat, encounter: null } };
    const blocked = reduceFight(withoutEncounter);
    expect(blocked.combat.encounter).toBeNull();
    expect(blocked.dailyBattle.activeAttemptId).toBe(first.dailyBattle.activeAttemptId);
  });

  it('records exactly one battle result after victory', () => {
    const targeted = reduceSetCombatTarget(mergeSeed(makeConfig({ combatLevel: 5 })), 'starter-frontier', 'goblin');
    let state = reduceFight({ ...targeted, combat: { ...targeted.combat, playerHp: 999 } });
    while (state.combat.encounter) state = tick(state, (state.combat.nextRoundAt ?? 0) + 1);
    expect(state.dailyBattle.history).toHaveLength(1);
    expect(state.dailyBattle.history[0]).toMatchObject({ enemyId: 'goblin', result: 'victory' });
    const reticked = tick(state, Date.now() + 100_000);
    expect(reticked.dailyBattle.history).toHaveLength(1);
  });
});

describe('v0.3 progression and retention', () => {
  it('starts the main quest chain and records bestiary kills and region reputation', () => {
    const base = mergeSeed(makeConfig({ combatLevel: 5 }));
    const visited = reduceSetCombatTarget(base, 'starter-frontier', 'goblin');
    expect(visited.quest.active.q_awakening).toBeDefined();
    const progressed = reduceTaskEvent(visited, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, Date.now());
    expect(progressed.quest.active.q_awakening.objectives.ob_kill_goblin.current).toBe(1);
    expect(progressed.bestiary.entries.goblin.killCount).toBe(1);
    expect(progressed.retention.regionReputation['starter-frontier']).toBe(1);
    expect(progressed.collection.entries['enemy:goblin'].collected).toBe(true);
  });

  it('creates one claimable login reward and grants it once', () => {
    const base = mergeSeed(makeConfig());
    const reward = base.retention.mailbox.find((mail) => !mail.claimed);
    expect(reward).toBeDefined();
    const claimed = reduceClaimMail(base, reward!.id);
    expect(claimed.gold).toBe(base.gold + (reward!.reward?.gold ?? 0));
    expect(reduceClaimMail(claimed, reward!.id).gold).toBe(claimed.gold);
  });

  it('allows one task reroll per cycle before progress begins', () => {
    const base = mergeSeed(makeConfig());
    const before = getCurrentTasks(base.task, new Date()).daily[0]?.taskId;
    const rerolled = reduceRerollTask(base, 'daily', 0);
    const after = getCurrentTasks(rerolled.task, new Date()).daily[0]?.taskId;
    expect(after).not.toBe(before);
    const second = reduceRerollTask(rerolled, 'daily', 0);
    expect(getCurrentTasks(second.task, new Date()).daily[0]?.taskId).toBe(after);
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

describe('v0.4 forging and investment', () => {
  function armedState(bhc = 20): GameState {
    const base = mergeSeed(makeConfig());
    const equipped = reduceEquipItem({ ...base, inventory: { ...base.inventory, iron_sword: 1 } }, 'weapon', 'iron_sword');
    return { ...equipped, investment: { ...equipped.investment, bhc } };
  }

  it('burns the exact forge cost and records the upgrade once', () => {
    const forged = reduceForgeWeapon(armedState(1));
    expect(forged.equipment.weapon?.metadata?.forgeLevel).toBe(1);
    expect(forged.investment.bhc).toBe(0.75);
    expect(forged.investment.burnedTotal).toBe(0.25);
    expect(forged.investment.history[0]?.type).toBe('forge');
  });

  it('does not mutate the weapon when the BHC balance is insufficient', () => {
    const base = armedState(0.24);
    expect(reduceForgeWeapon(base)).toBe(base);
  });

  it('requires forge +2 before the first awakening', () => {
    const base = armedState();
    expect(reduceAwakenWeapon(base)).toBe(base);
    const ready: GameState = {
      ...base,
      equipment: { ...base.equipment, weapon: { ...base.equipment.weapon!, metadata: { forgeLevel: 2 } } },
    };
    const awakened = reduceAwakenWeapon(ready);
    expect(awakened.equipment.weapon?.metadata?.awakening).toBe(1);
    expect(awakened.investment.bhc).toBe(19);
  });

  it('rerolls a weapon affix and records a rarity-priced burn', () => {
    const rerolled = reduceRerollWeapon(armedState(2));
    expect(rerolled.equipment.weapon?.metadata?.rerolls).toBe(1);
    expect(rerolled.equipment.weapon?.metadata?.bonusStat).toBe('agility');
    expect(rerolled.investment.history[0]?.type).toBe('weapon_reroll');
    expect(rerolled.investment.bhc).toBeLessThan(2);
  });

  it('enforces rebirth level gates and scales hero reforges', () => {
    const base = armedState(20);
    expect(reduceRebirthHero(base)).toBe(base);
    const eligible = { ...base, combatLevel: 20 };
    const reborn = reduceRebirthHero(eligible);
    expect(reborn.investment.heroRebirth).toBe(1);
    expect(reborn.investment.bhc).toBe(18);
    const reforged = reduceReforgeHero(reborn);
    expect(reforged.investment.heroBonusValue).toBe(5);
    expect(reforged.investment.heroBonusStat).toBe('agility');
  });

  it('scales rewarded-battle BHC and caps it at 0.5', () => {
    const common = ALL_ENEMIES.find((enemy) => enemy.category === 'normal') ?? ALL_ENEMIES[0];
    const boss = ALL_ENEMIES.find((enemy) => enemy.category === 'boss');
    expect(battleBhcReward(armedState(), common)).toBeGreaterThanOrEqual(0.08);
    if (boss) {
      const maxed = armedState();
      const boosted: GameState = {
        ...maxed,
        combatLevel: 1000,
        equipment: { ...maxed.equipment, weapon: { ...maxed.equipment.weapon!, metadata: { forgeLevel: 50, awakening: 20 } } },
      };
      expect(battleBhcReward(boosted, boss)).toBe(0.5);
    }
  });
});

describe('v0.5 economy and marketplace', () => {
  const actor = 'character:market-test';
  const funded = (bhc = 20): GameState => {
    const base = mergeSeed(makeConfig());
    return { ...base, inventory: { ...base.inventory, iron_sword: 1 }, investment: { ...base.investment, bhc } };
  };

  it('validates before burning and charges exactly 0.075 BHC after listing', () => {
    const base = funded(1);
    const invalid = reduceCreateMarketplaceListing(base, actor, 'weapon', 'missing_weapon', 2, 'listing-invalid');
    expect(invalid).toBe(base);
    expect(invalid.investment.burnedTotal).toBe(0);

    const listed = reduceCreateMarketplaceListing(base, actor, 'weapon', 'iron_sword', 2, 'listing-valid');
    expect(listed.investment.bhc).toBe(1 - MARKETPLACE_LISTING_FEE);
    expect(listed.investment.burnedTotal).toBe(MARKETPLACE_LISTING_FEE);
    expect(listed.inventory.iron_sword ?? 0).toBe(0);
    expect(listed.marketplace.listings[0].status).toBe('active');
  });

  it('makes listing retries idempotent without a duplicate fee burn', () => {
    const once = reduceCreateMarketplaceListing(funded(1), actor, 'weapon', 'iron_sword', 2, 'listing-same-key');
    const twice = reduceCreateMarketplaceListing(once, actor, 'weapon', 'iron_sword', 2, 'listing-same-key');
    expect(twice).toBe(once);
    expect(twice.investment.burnedTotal).toBe(MARKETPLACE_LISTING_FEE);
  });

  it('returns escrow on cancellation but never refunds the listing fee', () => {
    const listed = reduceCreateMarketplaceListing(funded(1), actor, 'weapon', 'iron_sword', 2, 'listing-cancel');
    const cancelled = reduceCancelMarketplaceListing(listed, actor, listed.marketplace.listings[0].id);
    expect(cancelled.inventory.iron_sword).toBe(1);
    expect(cancelled.investment.bhc).toBe(1 - MARKETPLACE_LISTING_FEE);
    expect(cancelled.investment.burnedTotal).toBe(MARKETPLACE_LISTING_FEE);
    expect(cancelled.marketplace.listings[0].status).toBe('cancelled');
  });

  it('forbids self-buy and transfers purchase BHC without burning it', () => {
    const base = funded(20);
    const listing = base.marketplace.listings.find((entry) => entry.status === 'active')!;
    const ownView: GameState = { ...base, marketplace: { ...base.marketplace, listings: [{ ...listing, sellerId: actor }, ...base.marketplace.listings.filter((entry) => entry.id !== listing.id)] } };
    expect(reduceBuyMarketplaceListing(ownView, actor, listing.id, 'buy-self')).toBe(ownView);

    const bought = reduceBuyMarketplaceListing(base, actor, listing.id, 'buy-valid');
    expect(bought.investment.bhc).toBe(20 - listing.price);
    expect(bought.investment.burnedTotal).toBe(0);
    expect(bought.marketplace.listings.find((entry) => entry.id === listing.id)?.status).toBe('sold');
  });

  it('locks a listed Hero while preserving its battle cooldown snapshot', () => {
    const base = { ...funded(1), dailyBattle: { ...funded(1).dailyBattle, nextBattleAt: 1_800_000_000_000 } };
    const listed = reduceCreateMarketplaceListing(base, actor, 'hero', actor, 8, 'hero-listing');
    expect(listed.marketplace.heroLocked).toBe(true);
    expect(listed.activeAction).toBeNull();
    expect(listed.marketplace.listings[0].snapshot.nextBattleAt).toBe(1_800_000_000_000);
  });
});

describe('v0.6 summoning', () => {
  const funded = (bhc = 5): GameState => {
    const base = mergeSeed(makeConfig());
    return { ...base, investment: { ...base.investment, bhc } };
  };

  it('uses the published rarity thresholds and pity guarantees', () => {
    expect(summonRarityForRoll(0.1, 0, 0)).toBe('common');
    expect(summonRarityForRoll(0.6, 0, 0)).toBe('uncommon');
    expect(summonRarityForRoll(0.9, 0, 0)).toBe('rare');
    expect(summonRarityForRoll(0.97, 0, 0)).toBe('epic');
    expect(summonRarityForRoll(0.995, 0, 0)).toBe('legendary');
    expect(summonRarityForRoll(0.1, 9, 9)).toBe('rare');
    expect(summonRarityForRoll(0.1, 49, 49)).toBe('epic');
    expect(summonRarityForRoll(0.1, 99, 99)).toBe('legendary');
  });

  it('settles one summon as 50% burn, 40% reward pool, and 10% treasury', () => {
    const summoned = reduceSummonHero(funded(5), 0.9, 'summon-settlement');
    expect(summoned.investment.bhc).toBe(5 - SUMMON_COST);
    expect(summoned.investment.burnedTotal).toBe(SUMMON_BURN);
    expect(summoned.summoning.rewardPool).toBe(SUMMON_REWARD_POOL);
    expect(summoned.summoning.treasury).toBe(SUMMON_TREASURY);
    expect(summoned.summoning.heroes).toHaveLength(1);
  });

  it('makes retries idempotent and converts duplicate archetypes to essence', () => {
    const first = reduceSummonHero(funded(), 0.9, 'summon-one');
    expect(reduceSummonHero(first, 0.9, 'summon-one')).toBe(first);
    const duplicate = reduceSummonHero(first, 0.9, 'summon-two');
    expect(duplicate.summoning.heroes).toHaveLength(1);
    expect(duplicate.summoning.heroes[0].copies).toBe(2);
    expect(duplicate.summoning.essence).toBeGreaterThan(0);
  });

  it('pays one battle per Hero every 24h from the finite reward pool', () => {
    const summoned = reduceSummonHero(funded(), 0.9, 'summon-battle');
    const hero = summoned.summoning.heroes[0];
    const now = 1_800_000_000_000;
    const battled = reduceSummonedHeroBattle(summoned, hero.id, now);
    expect(battled.investment.bhc).toBeGreaterThan(summoned.investment.bhc);
    expect(battled.summoning.rewardPool).toBeLessThan(summoned.summoning.rewardPool);
    expect(battled.summoning.heroes[0].nextBattleAt).toBe(now + 86_400_000);
    expect(reduceSummonedHeroBattle(battled, hero.id, now)).toBe(battled);
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
