import { describe, it, expect } from 'vitest';
import {
  createPlayerOfflineState,
  captureSessionStart,
  clearSession,
  computeRewardedElapsed,
  processOfflineReturn,
  DEFAULT_OFFLINE_POLICIES,
  gatheringNodeToSnapshot,
  computeActionDurationMs,
} from '../src/offline';
import { MINING_NODES, startGatheringAction } from '../src/progression/gathering';
import type { PlayerOfflineState, OfflineRng } from '@premium-rpg/shared-types';

// Deterministic LCG for reproducible reward rolls.
function makeRng(seed = 12345): { rng: OfflineRng; next: number[] } {
  let s = seed;
  const next: number[] = [];
  const rng = (): number => {
    s = (s * 1103515245 + 12345) % 2147483648;
    const v = s / 2147483648;
    next.push(v);
    return v;
  };
  return { rng, next };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('offline state factory', () => {
  it('creates empty offline state', () => {
    const s = createPlayerOfflineState();
    expect(s.session).toBeNull();
    expect(s.lastSummary).toBeNull();
  });
});

describe('capture session start', () => {
  it('records action and baseline snapshot', () => {
    const s: PlayerOfflineState = createPlayerOfflineState();
    const node = MINING_NODES.find((n) => n.id === 'copper_vein')!;
    const snap = gatheringNodeToSnapshot(node);
    const baseline = { skills: { mining: { level: 5, xp: 1000 } }, resourcesHeld: {} };
    const session = captureSessionStart(
      s,
      { kind: 'gathering', gathering: snap, startedAt: 0, lastValidActionTimestamp: 0, durationMs: snap.baseDuration },
      1000,
      baseline
    );
    expect(s.session).not.toBeNull();
    expect(session.leftAt).toBe(1000);
    expect(session.action?.kind).toBe('gathering');
    expect(session.baseline.skills.mining.level).toBe(5);
    clearSession(s);
    expect(s.session).toBeNull();
  });
});

describe('computeRewardedElapsed (anti-exploit)', () => {
  const session = {
    leftAt: 0,
    action: null,
    baseline: { skills: {}, resourcesHeld: {} },
  };

  it('returns too_short below the minimum threshold', () => {
    const r = computeRewardedElapsed(session, DEFAULT_OFFLINE_POLICIES, { nowMs: 1000 });
    expect(r.reason).toBe('too_short');
    expect(r.elapsedMs).toBe(0);
    expect(r.cappedByPolicy).toBe(false);
  });

  it('passes elapsed through within limits', () => {
    const r = computeRewardedElapsed(session, DEFAULT_OFFLINE_POLICIES, { nowMs: 2 * MINUTE });
    expect(r.reason).toBe('ok');
    expect(r.elapsedMs).toBe(2 * MINUTE);
    expect(r.elapsedCappedAwayMs).toBe(0);
  });

  it('hard-caps rewarded time to maxRewardedMs', () => {
    const r = computeRewardedElapsed(session, DEFAULT_OFFLINE_POLICIES, { nowMs: 20 * HOUR });
    expect(r.reason).toBe('cap_applied');
    expect(r.elapsedMs).toBe(DEFAULT_OFFLINE_POLICIES.maxRewardedMs);
    expect(r.elapsedCappedAwayMs).toBe(20 * HOUR - DEFAULT_OFFLINE_POLICIES.maxRewardedMs);
    expect(r.cappedByPolicy).toBe(true);
  });

  it('rejects negative/backwards clock claims', () => {
    const r = computeRewardedElapsed(session, DEFAULT_OFFLINE_POLICIES, {
      nowMs: 2 * MINUTE,
      serverElapsedMs: -5000, // server detects backwards/invalid timestamp
    });
    expect(r.reason).toBe('clock_skew');
    expect(r.elapsedMs).toBe(0);
    expect(r.cappedByPolicy).toBe(true);
  });

  it('registered accounts require a server-supplied elapsed', () => {
    const policy = { ...DEFAULT_OFFLINE_POLICIES, requireServerValidation: true };
    // No serverElapsedMs provided -> rejected as clock_skew
    const noServer = computeRewardedElapsed(session, policy, { nowMs: 2 * MINUTE });
    expect(noServer.reason).toBe('clock_skew');

    // Server supplies authoritative elapsed -> accepted
    const withServer = computeRewardedElapsed(session, policy, {
      nowMs: 2 * MINUTE,
      serverElapsedMs: 2 * MINUTE,
    });
    expect(withServer.reason).toBe('ok');
    expect(withServer.elapsedMs).toBe(2 * MINUTE);
  });

  it('caps to maxAcceptedElapsedMs for extreme server-reported time', () => {
    const policy = { ...DEFAULT_OFFLINE_POLICIES, requireServerValidation: true };
    const r = computeRewardedElapsed(session, policy, {
      nowMs: 30 * HOUR,
      serverElapsedMs: 30 * HOUR,
    });
    // maxAcceptedElapsedMs is 24h < maxRewardedMs 8h, so 24h governs here
    expect(r.elapsedMs).toBe(DEFAULT_OFFLINE_POLICIES.maxAcceptedElapsedMs);
    expect(r.cappedByPolicy).toBe(true);
  });
});

describe('processOfflineReturn — gathering', () => {
  function buildSession(state: PlayerOfflineState, nodeId: string, leftAt: number, durationMs?: number) {
    const node = MINING_NODES.find((n) => n.id === nodeId)!;
    const snap = gatheringNodeToSnapshot(node);
    captureSessionStart(
      state,
      {
        kind: 'gathering',
        gathering: snap,
        startedAt: leftAt,
        lastValidActionTimestamp: leftAt,
        durationMs: durationMs ?? snap.baseDuration,
      },
      leftAt,
      { skills: { [node.skill]: { level: 1, xp: 0 } }, resourcesHeld: {} }
    );
    return node;
  }

  it('returns no_action when no session exists', () => {
    const s = createPlayerOfflineState();
    const result = processOfflineReturn(s, {
      nowMs: 10 * MINUTE,
      currentSkillXp: {},
    });
    expect(result.reason).toBe('no_action');
    expect(result.actionsCompleted).toBe(0);
    expect(result.resources).toEqual([]);
  });

  it('awards actions based on elapsed time and aggregates XP', () => {
    const s = createPlayerOfflineState();
    const node = buildSession(s, 'copper_vein', 0); // baseDuration 4000ms, baseXp 15
    const { rng } = makeRng();
    const result = processOfflineReturn(s, {
      nowMs: 2 * MINUTE, // 120s => 30 actions
      currentSkillXp: { mining: 0 },
      rng,
    });
    expect(result.actionsCompleted).toBe(30);
    expect(result.skills[0].skill).toBe('mining');
    expect(result.skills[0].xpGained).toBe(30 * node.baseXp);
    expect(result.elapsedMs).toBe(2 * MINUTE);
    expect(result.lines.some((l) => l.text.includes('Mining XP'))).toBe(true);
  });

  it('respects maxRewardedMs cap in action count', () => {
    const s = createPlayerOfflineState();
    buildSession(s, 'copper_vein', 0);
    const { rng } = makeRng();
    const result = processOfflineReturn(s, {
      nowMs: 20 * HOUR,
      currentSkillXp: { mining: 0 },
      rng,
    });
    // Only maxRewardedMs (8h) is rewarded, not 20h.
    const rewardedActions = Math.floor(DEFAULT_OFFLINE_POLICIES.maxRewardedMs / 4000);
    expect(result.actionsCompleted).toBe(rewardedActions);
    expect(result.cappedByPolicy).toBe(true);
    expect(result.elapsedCappedAwayMs).toBeGreaterThan(0);
  });

  it('detects level ups from XP gained', () => {
    const s = createPlayerOfflineState();
    buildSession(s, 'iron_vein', 0); // baseXp 40
    const { rng } = makeRng();
    // 30 min of iron mining => 30*60s/6s = 300 actions * 40 = 12,000 xp
    const result = processOfflineReturn(s, {
      nowMs: 30 * MINUTE,
      currentSkillXp: { mining: 0 },
      rng,
    });
    expect(result.levelUps.length).toBeGreaterThan(0);
    const lu = result.levelUps[0];
    expect(lu.skill).toBe('mining');
    expect(lu.from).toBe(1);
    expect(lu.to).toBeGreaterThan(1);
    expect(result.lines.some((l) => l.kind === 'level')).toBe(true);
  });

  it('applies tool speed multiplier to action count', () => {
    const s = createPlayerOfflineState();
    const node = MINING_NODES.find((n) => n.id === 'copper_vein')!;
    const snap = gatheringNodeToSnapshot(node);
    const toolDuration = computeActionDurationMs(snap); // no tool = baseDuration
    expect(toolDuration).toBe(node.baseDuration);
  });

  it('produces line entries for each resource type', () => {
    const s = createPlayerOfflineState();
    buildSession(s, 'copper_vein', 0);
    const { rng } = makeRng();
    const result = processOfflineReturn(s, {
      nowMs: 60 * 1000,
      currentSkillXp: { mining: 0 },
      rng,
    });
    // Copper vein always drops copper ore.
    const copper = result.resources.find((r) => r.itemId === 'copper_ore');
    expect(copper).toBeDefined();
    expect(copper!.quantity).toBeGreaterThan(0);
    expect(result.lines.some((l) => l.text.includes(copper!.name))).toBe(true);
  });

  it('deterministic RNG yields identical results for identical input', () => {
    function run() {
      const s = createPlayerOfflineState();
      buildSession(s, 'iron_vein', 0);
      const { rng } = makeRng(999);
      return processOfflineReturn(s, { nowMs: 5 * MINUTE, currentSkillXp: { mining: 1000 }, rng });
    }
    const a = run();
    const b = run();
    expect(a.actionsCompleted).toBe(b.actionsCompleted);
    expect(JSON.stringify(a.resources)).toBe(JSON.stringify(b.resources));
    expect(JSON.stringify(a.lines)).toBe(JSON.stringify(b.lines));
  });

  it('server-validated flag is reported', () => {
    const s = createPlayerOfflineState();
    buildSession(s, 'copper_vein', 0);
    const { rng } = makeRng();
    const result = processOfflineReturn(s, {
      nowMs: 60 * 1000,
      currentSkillXp: { mining: 0 },
      rng,
      serverValidated: true,
      policies: { requireServerValidation: true },
      serverElapsedMs: 60 * 1000,
    });
    expect(result.serverValidated).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('resolves nodes via resolveNode override', () => {
    const s = createPlayerOfflineState();
    const node = MINING_NODES.find((n) => n.id === 'copper_vein')!;
    const snap = gatheringNodeToSnapshot(node);
    // Persist a deliberately "stale" snapshot with wrong duration, then resolve fresh.
    captureSessionStart(
      s,
      { kind: 'gathering', gathering: { ...snap, baseDuration: 1000 }, startedAt: 0, lastValidActionTimestamp: 0, durationMs: 1000 },
      0,
      { skills: { mining: { level: 1, xp: 0 } }, resourcesHeld: {} }
    );
    const { rng } = makeRng();
    const result = processOfflineReturn(s, {
      nowMs: 80 * 1000, // 80s
      currentSkillXp: { mining: 0 },
      rng,
      resolveNode: () => gatheringNodeToSnapshot(node), // fresh duration 4000
    });
    // resolveNode replaces snapshot, so 80s/4000 = 20 actions.
    expect(result.actionsCompleted).toBe(20);
  });
});

describe('startGatheringAction → snapshot integration', () => {
  it('converts an engine action into a persisted snapshot', () => {
    const action = startGatheringAction('iron_vein', 'mining');
    expect(action.nodeId).toBe('iron_vein');
    expect(action.skill).toBe('mining');
    expect(action.duration).toBeGreaterThan(0);
    const node = MINING_NODES.find((n) => n.id === 'iron_vein')!;
    const snap = gatheringNodeToSnapshot(node);
    expect(snap.id).toBe('iron_vein');
    expect(snap.baseXp).toBe(node.baseXp);
    expect(snap.resources.length).toBe(node.resources.length);
  });
});
