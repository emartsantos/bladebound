import { describe, it, expect } from 'vitest';
import {
  createQuestState,
  getAvailableQuests,
  isQuestAvailable,
  prerequisitesMet,
  startQuest,
  abandonQuest,
  processQuestEvent,
  isQuestCompletable,
  completeQuest,
  hasUnlock,
  getQuestChainProgress,
  getComputedQuestStatus,
} from '../src/quest';
import type { PlayerQuestState, QuestContext } from '../src/quest';
import type { QuestDefinition } from '@premium-rpg/shared-types';

function q(partial: QuestDefinition): QuestDefinition {
  return partial;
}

// ─── FIXTURES (inline, mirrors the authored content philosophy) ──────
const FIXTURES: QuestDefinition[] = [
  q({
    id: 'awakening', name: 'Awakening', category: 'main', recommendedLevel: 1,
    regionId: 'starter-frontier', description: 'prologue', lore: 'lore',
    objectives: [
      { id: 'o_goblin', type: 'kill', targetId: 'goblin', required: 3, description: 'kill goblins' },
      { id: 'o_wolf', type: 'kill', targetId: 'wolf', required: 2, description: 'kill wolves' },
      { id: 'o_bone', type: 'collect', targetId: 'bone', required: 5, description: 'collect bones' },
    ],
    rewards: { experience: 120, gold: 75, items: [{ itemId: 'bronze_sword', quantity: 1 }] },
  }),
  q({
    id: 'first_forge', name: 'First Forge', category: 'main', recommendedLevel: 3,
    regionId: 'starter-frontier', description: 'forge', chain: { questId: 'awakening', stepIndex: 2 },
    objectives: [
      { id: 'o_mining', type: 'reach_skill_level', skillId: 'mining', required: 3, description: 'mining 3' },
      { id: 'o_copper', type: 'gather', skillId: 'mining', targetId: 'copper_ore', required: 8, description: 'mine copper' },
    ],
    rewards: { experience: 180, gold: 90 },
  }),
  q({
    id: 'darkwood_scout', name: 'Darkwood Scout', category: 'main', recommendedLevel: 5,
    regionId: 'starter-frontier', description: 'scout', chain: { questId: 'first_forge', stepIndex: 3 },
    objectives: [
      { id: 'o_visit', type: 'visit_region', targetId: 'darkwood-forest', required: 1, description: 'visit' },
      { id: 'o_spider', type: 'kill', targetId: 'darkwood_spider', required: 5, description: 'spiders' },
    ],
    rewards: {
      experience: 260, gold: 130,
      unlocks: [{ key: 'region:darkwood-forest', label: 'Darkwood Forest', type: 'region' }],
    },
  }),
  q({
    id: 'vlads_curse', name: 'Vlad Curse', category: 'main', recommendedLevel: 8,
    regionId: 'darkwood-forest', description: 'vlad',
    objectives: [
      { id: 'o_werewolf', type: 'kill', targetId: 'werewolf', required: 5, description: 'werewolves' },
      { id: 'o_dungeon', type: 'complete_dungeon', targetId: 'darkwood-caverns', required: 1, description: 'dungeon' },
      { id: 'o_vlad', type: 'kill', targetId: 'count_vlad', required: 1, description: 'vlad' },
    ],
    rewards: { experience: 500, gold: 200 },
  }),
  q({
    id: 'side_equip', name: 'Side Equip', category: 'side', recommendedLevel: 30,
    regionId: 'mountain-stronghold', description: 'equip',
    objectives: [
      { id: 'o_weapon', type: 'equip_item', slot: 'weapon', required: 1, description: 'weapon' },
      { id: 'o_chest', type: 'equip_item', slot: 'chest', required: 1, description: 'chest' },
    ],
    rewards: { experience: 1000, gold: 400 },
  }),
  q({
    id: 'lore_spirits', name: 'Lore Spirits', category: 'lore', recommendedLevel: 14,
    regionId: 'darkwood-forest', description: 'lore', prerequisites: [{ type: 'quest', target: 'awakening', comparison: 'gte', value: 1 }],
    objectives: [
      { id: 'o_npc', type: 'interact_npc', targetId: 'archivist_omnar', required: 1, description: 'npc' },
      { id: 'o_dryad', type: 'kill', targetId: 'elder_dryad', required: 1, description: 'dryad' },
      { id: 'o_sap', type: 'collect', targetId: 'elder_sap', required: 3, description: 'sap' },
    ],
    rewards: { experience: 650, gold: 260, collectionEntries: ['enemy:elder_dryad'] },
  }),
  q({
    id: 'unlock_keys', name: 'Unlock Keys', category: 'unlock', recommendedLevel: 6,
    regionId: 'starter-frontier', description: 'keys', prerequisites: [{ type: 'quest', target: 'awakening', comparison: 'gte', value: 1 }],
    objectives: [{ id: 'o_smith', type: 'interact_npc', targetId: 'smith_harrin', required: 1, description: 'smith' }],
    rewards: { experience: 400, gold: 220, unlocks: [{ key: 'mechanic:dungeon_keys', label: 'Dungeon Keys', type: 'mechanic' }] },
  }),
];

const BY_ID: Record<string, QuestDefinition> = Object.fromEntries(FIXTURES.map((x) => [x.id, x]));

function ctx(overrides: Partial<QuestContext> = {}): QuestContext {
  return {
    level: 1,
    skills: { mining: 1, woodcutting: 1, fishing: 1 },
    region: 'starter-frontier',
    unlocks: {},
    ...overrides,
  };
}

// Fully completes the awakening quest (all objectives) then marks it done.
function completeAwakening(state: PlayerQuestState, startAt = 1, endAt = 2) {
  startQuest(state, BY_ID.awakening, startAt);
  for (let i = 0; i < 3; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, startAt);
  for (let i = 0; i < 2; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'wolf', regionId: 'starter-frontier' }, startAt);
  processQuestEvent(state, BY_ID, { type: 'item_collected', itemId: 'bone', quantity: 5 }, startAt);
  const grant = completeQuest(state, BY_ID.awakening, endAt);
  return grant;
}

describe('quest availability & prerequisites', () => {
  it('exposes the opening quest from zero state', () => {
    const state = createQuestState();
    const available = getAvailableQuests(FIXTURES, state, ctx());
    expect(available.map((a) => a.id)).toContain('awakening');
  });

  it('gates chained quests until the parent is complete', () => {
    const state = createQuestState();
    expect(isQuestAvailable(BY_ID.first_forge, state, ctx())).toBe(false);
    expect(prerequisitesMet(BY_ID.first_forge, state, ctx())).toBe(false);
    completeAwakening(state);
    expect(isQuestAvailable(BY_ID.first_forge, state, ctx({ level: 3 }))).toBe(true);
  });

  it('respects level gates', () => {
    const state = createQuestState();
    expect(isQuestAvailable(BY_ID.darkwood_scout, state, ctx({ level: 4 }))).toBe(false);
  });

  it('does not re-offer already-completed quests', () => {
    const state = createQuestState();
    completeAwakening(state);
    expect(isQuestAvailable(BY_ID.awakening, state, ctx())).toBe(false);
  });

  it('applies explicit quest prerequisites', () => {
    const state = createQuestState();
    expect(isQuestAvailable(BY_ID.unlock_keys, state, ctx())).toBe(false);
    completeAwakening(state);
    expect(isQuestAvailable(BY_ID.unlock_keys, state, ctx({ level: 6 }))).toBe(true);
  });
});

describe('quest lifecycle', () => {
  it('starts a quest with zeroed objectives', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.awakening, 10);
    expect(state.active['awakening'].status).toBe('active');
    expect(isQuestCompletable(state.active['awakening'])).toBe(false);
    expect(Object.values(state.active['awakening'].objectives)).toHaveLength(3);
  });

  it('advances kill objectives and caps at the requirement', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.awakening, 10);
    for (let i = 0; i < 5; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, 11);
    const ob = state.active['awakening'].objectives['o_goblin'];
    expect(ob.current).toBe(3);
    expect(ob.completed).toBe(true);
  });

  it('only advances objectives matching the event target', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.awakening, 10);
    processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'alpha_wolf', regionId: 'starter-frontier' }, 11);
    expect(state.active['awakening'].objectives['o_goblin'].current).toBe(0);
  });

  it('completes a quest and grants rewards + unlocks', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.darkwood_scout, 10);
    processQuestEvent(state, BY_ID, { type: 'region_visited', regionId: 'darkwood-forest' }, 11);
    for (let i = 0; i < 5; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'darkwood_spider', regionId: 'darkwood-forest' }, 11);
    expect(isQuestCompletable(state.active['darkwood_scout'])).toBe(true);

    const grant = completeQuest(state, BY_ID.darkwood_scout, 12);
    expect(grant).not.toBeNull();
    expect(grant!.unlocks.some((u) => u.key === 'region:darkwood-forest')).toBe(true);
    expect(hasUnlock(state, 'region:darkwood-forest')).toBe(true);
    expect(state.completed['darkwood_scout']).toBeDefined();
    expect(state.active['darkwood_scout']).toBeUndefined();
  });

  it('refuses to complete a quest with unfinished objectives', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.awakening, 10);
    processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, 11);
    expect(completeQuest(state, BY_ID.awakening, 12)).toBeNull();
    expect(state.active['awakening']).toBeDefined();
  });

  it('tracks dungeon objective alongside kills', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.vlads_curse, 10);
    for (let i = 0; i < 5; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'werewolf', regionId: 'darkwood-forest' }, 11);
    processQuestEvent(state, BY_ID, { type: 'dungeon_completed', dungeonId: 'darkwood-caverns' }, 12);
    processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'count_vlad', regionId: 'darkwood-forest' }, 13);
    expect(isQuestCompletable(state.active['vlads_curse'])).toBe(true);
  });

  it('reaches skill level and gather objectives', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.first_forge, 10);
    processQuestEvent(state, BY_ID, { type: 'skill_leveled', skillId: 'mining', newLevel: 5 }, 11);
    processQuestEvent(state, BY_ID, { type: 'resource_gathered', skillId: 'mining', resourceId: 'copper_ore', quantity: 8 }, 12);
    expect(isQuestCompletable(state.active['first_forge'])).toBe(true);
  });

  it('tracks equip_item objectives by slot', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.side_equip, 10);
    processQuestEvent(state, BY_ID, { type: 'item_equipped', slot: 'weapon', itemId: 'adamant_sword' }, 11);
    expect(state.active['side_equip'].objectives['o_weapon'].completed).toBe(true);
    processQuestEvent(state, BY_ID, { type: 'item_equipped', slot: 'chest', itemId: 'mithril_platebody' }, 12);
    expect(state.active['side_equip'].objectives['o_chest'].completed).toBe(true);
  });

  it('tracks interact_npc and collect objectives for lore quests', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.lore_spirits, 10);
    processQuestEvent(state, BY_ID, { type: 'npc_interacted', npcId: 'archivist_omnar' }, 11);
    processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'elder_dryad', regionId: 'darkwood-forest' }, 12);
    processQuestEvent(state, BY_ID, { type: 'item_collected', itemId: 'elder_sap', quantity: 3 }, 13);
    expect(isQuestCompletable(state.active['lore_spirits'])).toBe(true);
    const grant = completeQuest(state, BY_ID.lore_spirits, 14)!;
    expect(grant.collectionEntries).toContain('enemy:elder_dryad');
    expect(state.unlocks['enemy:elder_dryad']).toBe(true);
  });

  it('handles abandoning an abandonable quest', () => {
    const state = createQuestState();
    startQuest(state, BY_ID.awakening, 10);
    expect(abandonQuest(state, BY_ID.awakening)).toBe(true);
    expect(state.active['awakening']).toBeUndefined();
  });
});

describe('journal & chain queries', () => {
  it('reports chain status across a quest line', () => {
    const state = createQuestState();
    completeAwakening(state, 1, 2);
    // manually begin first_forge as active (no objective completion needed)
    startQuest(state, BY_ID.first_forge, 3);
    const chain = getQuestChainProgress(state, ['awakening', 'first_forge', 'darkwood_scout']);
    expect(chain[0]).toMatchObject({ questId: 'awakening', status: 'completed' });
    expect(chain[1]).toMatchObject({ questId: 'first_forge', status: 'active' });
    expect(chain[2]).toMatchObject({ questId: 'darkwood_scout', status: 'locked' });
  });

  it('computes per-quest journal status', () => {
    const state = createQuestState();
    expect(getComputedQuestStatus(BY_ID.awakening, state, ctx())).toBe('available');
    startQuest(state, BY_ID.awakening, 1);
    expect(getComputedQuestStatus(BY_ID.awakening, state, ctx())).toBe('active');
    // Complete all objectives, then complete the quest.
    for (let i = 0; i < 3; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, 1);
    for (let i = 0; i < 2; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'wolf', regionId: 'starter-frontier' }, 1);
    processQuestEvent(state, BY_ID, { type: 'item_collected', itemId: 'bone', quantity: 5 }, 1);
    expect(isQuestCompletable(state.active['awakening'])).toBe(true);
    completeQuest(state, BY_ID.awakening, 2);
    expect(getComputedQuestStatus(BY_ID.awakening, state, ctx())).toBe('completed');
  });
});

describe('integration: full chain flow', () => {
  it('drives awakening to completion end to end', () => {
    const state = createQuestState();
    expect(getAvailableQuests(FIXTURES, state, ctx()).map((x) => x.id)).toContain('awakening');
    startQuest(state, BY_ID.awakening, 1);
    for (let i = 0; i < 3; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'goblin', regionId: 'starter-frontier' }, 2);
    for (let i = 0; i < 2; i++) processQuestEvent(state, BY_ID, { type: 'enemy_killed', enemyId: 'wolf', regionId: 'starter-frontier' }, 3);
    processQuestEvent(state, BY_ID, { type: 'item_collected', itemId: 'bone', quantity: 5 }, 4);
    const grant = completeQuest(state, BY_ID.awakening, 5)!;
    expect(grant.experience).toBeGreaterThan(0);
    expect(grant.items.some((i) => i.itemId === 'bronze_sword')).toBe(true);
    expect(state.completed['awakening']).toBeDefined();
  });
});
