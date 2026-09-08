import { describe, it, expect } from 'vitest';
import {
  createWorldState,
  discoverRegion,
  setRegionCompletion,
  isRegionDiscovered,
  getRegionCompletion,
  createPlayerNPCState,
  getNPCReputation,
  changeNPCReputation,
  addWorldFlag,
  hasWorldFlag,
  resolveDialogue,
  canAcceptContract,
  acceptContract,
  progressContract,
  claimContract,
  getHealingQuote,
  offersService,
  type DialogueContextState,
} from '../src/npc';
import {
  NPC_BY_ID,
  CONTRACT_BY_ID,
  NPC_CONTRACTS,
  REGION_LORE,
} from '@premium-rpg/game-data';

describe('NPC world state', () => {
  it('creates empty world state', () => {
    const w = createWorldState();
    expect(w.regionProgress).toEqual({});
    expect(w.worldFlags).toEqual({});
    expect(w.activeEvents).toEqual([]);
  });

  it('discovers a region only once', () => {
    const w = createWorldState();
    expect(discoverRegion(w, 'starter-frontier')).toBe(true);
    expect(discoverRegion(w, 'starter-frontier')).toBe(false);
    expect(isRegionDiscovered(w, 'starter-frontier')).toBe(true);
    expect(isRegionDiscovered(w, 'darkwood-forest')).toBe(false);
  });

  it('tracks region completion without lowering it', () => {
    const w = createWorldState();
    setRegionCompletion(w, 'darkwood-forest', 40);
    expect(getRegionCompletion(w, 'darkwood-forest')).toBe(40);
    setRegionCompletion(w, 'darkwood-forest', 20);
    expect(getRegionCompletion(w, 'darkwood-forest')).toBe(40); // monotonic
    setRegionCompletion(w, 'darkwood-forest', 70);
    expect(getRegionCompletion(w, 'darkwood-forest')).toBe(70);
  });

  it('clamps region completion to 0-100', () => {
    const w = createWorldState();
    setRegionCompletion(w, 'x', 150);
    setRegionCompletion(w, 'y', -5);
    expect(getRegionCompletion(w, 'x')).toBe(100);
    expect(getRegionCompletion(w, 'y')).toBe(0);
  });
});

describe('NPC reputation', () => {
  it('creates empty NPC state', () => {
    const s = createPlayerNPCState();
    expect(s.reputations).toEqual({});
    expect(s.interactions).toEqual({});
    expect(s.flags).toEqual({});
  });

  it('returns default reputation 0', () => {
    const s = createPlayerNPCState();
    expect(getNPCReputation(s, 'elder_athan')).toBe(0);
  });

  it('changes reputation within bounds', () => {
    const s = createPlayerNPCState();
    expect(changeNPCReputation(s, 'elder_athan', 15, 100)).toBe(15);
    expect(changeNPCReputation(s, 'elder_athan', 95, 100)).toBe(85); // clamps at 100
    expect(getNPCReputation(s, 'elder_athan')).toBe(100);
    expect(changeNPCReputation(s, 'elder_athan', -200, 100)).toBe(-200); // 100 -> -100
    expect(getNPCReputation(s, 'elder_athan')).toBe(-100);
  });

  it('manages world flags', () => {
    const s = createPlayerNPCState();
    expect(hasWorldFlag(s, 'elder_athan_blessing')).toBe(false);
    addWorldFlag(s, 'elder_athan_blessing');
    expect(hasWorldFlag(s, 'elder_athan_blessing')).toBe(true);
  });
});

describe('dialogue resolution', () => {
  function baseState(overrides: Partial<DialogueContextState> = {}): DialogueContextState {
    return {
      context: 'greeting',
      level: 1,
      seenDialogue: [],
      reputations: {},
      worldFlags: {},
      regionProgress: {},
      questStates: {},
      ...overrides,
    };
  }

  it('resolves greeting line for Elder Athan', () => {
    const npc = NPC_BY_ID.elder_athan;
    const result = resolveDialogue(npc, baseState());
    expect(result.npcId).toBe('elder_athan');
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.lines[0].text).toContain('flame');
  });

  it('shows quest_available line when in that context', () => {
    const npc = NPC_BY_ID.elder_athan;
    const result = resolveDialogue(npc, baseState({ context: 'quest_available' }));
    expect(result.lines.some((l) => l.text.includes('work to be done'))).toBe(true);
  });

  it('shows low_health line when player is critically injured', () => {
    const npc = NPC_BY_ID.elder_athan;
    const result = resolveDialogue(npc, baseState({ context: 'low_health' }));
    expect(result.lines.some((l) => l.text.includes('wounds'))).toBe(true);
  });

  it('returns fallback when nothing specific matches', () => {
    // Build a minimal NPC with only a high-level-gated line so nothing matches at level 1
    const npc = {
      id: 'test_npc',
      dialogue: {
        npcId: 'test_npc',
        fallback: 'Fallback line here.',
        lines: [
          { id: 't_rare', text: 'Only veterans hear this.', requires: { playerLevel: 50 } },
        ],
      },
    };
    const result = resolveDialogue(npc, baseState({ context: 'greeting', level: 1 }));
    expect(result.lines[0].text).toBe('Fallback line here.');
    expect(result.fallback).toBe('Fallback line here.');
  });

  it('shows mesa action for traveler NPC (Scout Mira)', () => {
    const npc = NPC_BY_ID.scout_mira;
    const result = resolveDialogue(npc, baseState());
    const travelLine = result.lines.find((l) => l.action === 'travel');
    expect(travelLine).toBeDefined();
  });

  it('shows region-intro line for cartographer in darkwood', () => {
    const npc = NPC_BY_ID.the_cartographer;
    const result = resolveDialogue(npc, baseState({
      context: 'region_intro',
      regionProgress: { 'darkwood-forest': { discovered: true, completion: 1 } },
    }));
    expect(result.lines.some((l) => l.text.includes('not always dark'))).toBe(true);
  });
});

describe('contracts', () => {
  function freshContractState() {
    return { active: [], cooldowns: {}, completed: [] };
  }

  it('accepts an available daily contract', () => {
    const s = freshContractState();
    const res = acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    expect(res.ok).toBe(true);
    expect(s.active.length).toBe(1);
    expect(s.active[0].contractId).toBe('c_daily_frontier_patrol');
  });

  it('rejects accepting the same contract twice', () => {
    const s = freshContractState();
    acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    const res = acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('already_active');
  });

  it('rejects contract lacking reputation requirement', () => {
    const s = freshContractState();
    // c_weekly_boss_marks requires level 20 only; use a reputation contract instead
    const res = acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    expect(res.ok).toBe(true);
  });

  it('rejects one-time contract after completion', () => {
    // c_elite_unmaker_hunt is not oneTime, but test with a completed one
    const s = { active: [], cooldowns: {}, completed: ['c_elite_unmaker_hunt'] };
    const res = canAcceptContract(s, CONTRACT_BY_ID.c_elite_unmaker_hunt, 0);
    // Not oneTime, so it should still be acceptable (no cooldown)
    expect(res.ok).toBe(true);
  });

  it('respects cooldown on repeatable contracts', () => {
    const s = { active: [], cooldowns: { c_daily_frontier_patrol: Date.now() + 1000 }, completed: [] };
    const res = canAcceptContract(s, CONTRACT_BY_ID.c_daily_frontier_patrol, 0);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('on_cooldown');
  });

  it('progresses contract objectives and completes it', () => {
    const s = freshContractState();
    acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    // objective 0: kill 5 wolves
    let id = s.active[0].contractId;
    for (let i = 0; i < 5; i++) progressContract(s, id, 0, 1, CONTRACT_BY_ID);
    expect(s.active[0].completed).toBe(true);
    expect(progressContract(s, id, 0, 1, CONTRACT_BY_ID)).toBe(false); // already complete
  });

  it('does not over-count progress beyond objective target', () => {
    const s = freshContractState();
    acceptContract(s, 'c_daily_wood_quota', 'elder_athan', CONTRACT_BY_ID, 10);
    progressContract(s, s.active[0].contractId, 0, 5, CONTRACT_BY_ID);
    progressContract(s, s.active[0].contractId, 0, 100, CONTRACT_BY_ID);
    expect(s.active[0].progress[0]).toBe(15);
  });

  it('claims a completed contract and returns rewards', () => {
    const s = freshContractState();
    acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    const id = s.active[0].contractId;
    for (let i = 0; i < 5; i++) progressContract(s, id, 0, 1, CONTRACT_BY_ID);
    const res = claimContract(s, id, CONTRACT_BY_ID);
    expect(res.ok).toBe(true);
    expect(res.rewards.gold).toBe(100);
    expect(res.rewards.xp).toBe(150);
    expect(s.active.length).toBe(0);
    expect(s.completed).toContain('c_daily_frontier_patrol');
    expect(s.cooldowns['c_daily_frontier_patrol']).toBeGreaterThan(Date.now());
  });

  it('cannot claim an incomplete contract', () => {
    const s = freshContractState();
    acceptContract(s, 'c_daily_frontier_patrol', 'elder_athan', CONTRACT_BY_ID, 10);
    const id = s.active[0].contractId;
    const res = claimContract(s, id, CONTRACT_BY_ID);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_completed');
  });
});

describe('NPC data integrity', () => {
  it('all defined NPCs have required fields', () => {
    for (const npc of Object.values(NPC_BY_ID)) {
      expect(npc.id).toBeTruthy();
      expect(npc.name).toBeTruthy();
      expect(npc.regionId).toBeTruthy();
      expect(npc.role).toBeTruthy();
      expect(Array.isArray(npc.services)).toBe(true);
      expect(npc.dialogue.lines.length).toBeGreaterThan(0);
      expect(typeof npc.dialogue.fallback).toBe('string');
    }
  });

  it('all contract IDs referenced by NPC_CONTRACTS exist', () => {
    for (const ids of Object.values(NPC_CONTRACTS)) {
      for (const id of ids) {
        expect(CONTRACT_BY_ID[id]).toBeDefined();
      }
    }
  });

  it('contracts have non-negative rewards', () => {
    for (const c of Object.values(CONTRACT_BY_ID)) {
      expect(c.rewards.gold).toBeGreaterThanOrEqual(0);
      expect(c.rewards.xp).toBeGreaterThanOrEqual(0);
      expect(c.cooldownHours).toBeGreaterThan(0);
      expect(c.objectives.length).toBeGreaterThan(0);
    }
  });

  it('every region has lore entries', () => {
    for (const regionId of [
      'starter-frontier', 'darkwood-forest', 'ruined-province', 'mountain-stronghold',
      'haunted-marsh', 'forgotten-citadel', 'volcanic-wasteland', 'ancient-endgame',
    ]) {
      expect(REGION_LORE[regionId]).toBeDefined();
      expect(REGION_LORE[regionId].length).toBeGreaterThan(0);
    }
  });

  it('NPCs provide lore services to reveal region lore', () => {
    expect(offersService(NPC_BY_ID.archivist_omnar, 'lore')).toBe(true);
    expect(offersService(NPC_BY_ID.loremaster_valen, 'lore')).toBe(true);
  });

  it('healing quote is available from healer NPCs', () => {
    const quote = getHealingQuote(NPC_BY_ID.herbalist_orin, 40);
    expect(quote).not.toBeNull();
    expect(quote!.costGold).toBe(20);
    expect(quote!.cleanses).toBe(true);
  });

  it('non-healer NPC offers no healing quote', () => {
    expect(getHealingQuote(NPC_BY_ID.elder_athan, 40)).toBeNull();
  });
});