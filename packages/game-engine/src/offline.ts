import type {
  OfflineActionSnapshot,
  OfflinePolicies,
  OfflineResourceGain,
  OfflineRng,
  OfflineSessionStart,
  OfflineSkillResult,
  OfflineSummary,
  OfflineSummaryLine,
  PlayerOfflineState,
} from '@premium-rpg/shared-types';
import { levelForXp } from './progression/xp';
import type { GatheringNodeSnapshot } from '@premium-rpg/shared-types';

// ─── DEFAULT POLICY ─────────────────────────────────────────────────

export const DEFAULT_OFFLINE_POLICIES: OfflinePolicies = {
  maxRewardedMs: 8 * 60 * 60 * 1000,       // 8 hours hard cap
  maxAcceptedElapsedMs: 24 * 60 * 60 * 1000, // reject > 24h even if reported
  minOfflineMs: 60 * 1000,                  // 1 minute minimum
  clockSkewToleranceMs: 5 * 60 * 1000,      // 5 minutes skew tolerance
  requireServerValidation: false,
};

// ─── STATE FACTORY ──────────────────────────────────────────────────

export function createPlayerOfflineState(): PlayerOfflineState {
  return { session: null, lastSummary: null };
}

// ─── CAPTURE ON LEAVE ───────────────────────────────────────────────

export function captureSessionStart(
  state: PlayerOfflineState,
  action: OfflineActionSnapshot | null,
  leftAt: number,
  baseline: OfflineSessionStart['baseline']
): OfflineSessionStart {
  state.session = { leftAt, action, baseline };
  return state.session;
}

export function clearSession(state: PlayerOfflineState): void {
  state.session = null;
}

// ─── ANTI-EXPLOIT ELAPSED COMPUTATION ───────────────────────────────

export interface ElapsedComputation {
  elapsedMs: number;             // authoritative elapsed after capping
  elapsedCappedAwayMs: number;   // excess removed
  cappedByPolicy: boolean;
  reason: OfflineSummary['reason'];
}

// Compute authoritative elapsed time.
// - If serverElapsedMs is provided (registered account), it is authoritative.
// - clockElapsedMs (Date.now() - leftAt) is a cross-check; large deviation is flagged.
// - Rewarded time is hard-capped to maxRewardedMs regardless.
export function computeRewardedElapsed(
  session: OfflineSessionStart,
  policies: OfflinePolicies,
  opts: { nowMs: number; serverElapsedMs?: number }
): ElapsedComputation {
  const { nowMs, serverElapsedMs } = opts;

  // Baseline elapsed flowing through the clock.
  const reportedClockElapsed = Math.max(0, nowMs - session.leftAt);
  const maxAccepted = policies.requireServerValidation
    ? policies.maxAcceptedElapsedMs
    : policies.maxAcceptedElapsedMs;

  // For registered accounts the server is authoritative.
  const rawElapsed = serverElapsedMs !== undefined ? serverElapsedMs : reportedClockElapsed;

  // Reject absurd clock claims (travel back in time / huge forward skew).
  if (rawElapsed < 0) {
    return { elapsedMs: 0, elapsedCappedAwayMs: 0, cappedByPolicy: true, reason: 'clock_skew' };
  }

  // Optional cross-check for registered accounts: if the client's clock
  // says something wildly different from the server, we trust the server.
  if (policies.requireServerValidation && serverElapsedMs === undefined) {
    return { elapsedMs: 0, elapsedCappedAwayMs: 0, cappedByPolicy: true, reason: 'clock_skew' };
  }

  // Too short to grant anything.
  if (rawElapsed < policies.minOfflineMs) {
    return { elapsedMs: 0, elapsedCappedAwayMs: 0, cappedByPolicy: false, reason: 'too_short' };
  }

  // Exceeds the absolute max we will ever accept.
  if (rawElapsed > maxAccepted) {
    return {
      elapsedMs: maxAccepted,
      elapsedCappedAwayMs: rawElapsed - maxAccepted,
      cappedByPolicy: true,
      reason: 'cap_applied',
    };
  }

  // Hard cap on rewarded time.
  if (rawElapsed > policies.maxRewardedMs) {
    return {
      elapsedMs: policies.maxRewardedMs,
      elapsedCappedAwayMs: rawElapsed - policies.maxRewardedMs,
      cappedByPolicy: true,
      reason: 'cap_applied',
    };
  }

  return { elapsedMs: rawElapsed, elapsedCappedAwayMs: 0, cappedByPolicy: false, reason: 'ok' };
}

// ─── REWARD ROLLING ─────────────────────────────────────────────────

function rollGatheringResources(
  node: GatheringNodeSnapshot,
  toolBonus: { speedMultiplier: number; xpBonus: number; extraResourceChance: number } | undefined,
  rng: OfflineRng
): { itemId: string; name: string; quantity: number; rare: boolean }[] {
  const results: { itemId: string; name: string; quantity: number; rare: boolean }[] = [];
  const extraChance = toolBonus?.extraResourceChance ?? 0;

  for (const resource of node.resources) {
    if (rng() <= resource.chance) {
      const qty =
        Math.floor(rng() * (resource.maxQuantity - resource.minQuantity + 1)) +
        resource.minQuantity;
      results.push({
        itemId: resource.itemId,
        name: resource.name,
        quantity: qty,
        rare: resource.rare ?? false,
      });
    }
  }

  if (extraChance > 0 && node.resources.length > 0) {
    const resource = node.resources[Math.floor(rng() * node.resources.length)];
    if (rng() <= extraChance) {
      const qty =
        Math.floor(rng() * (resource.maxQuantity - resource.minQuantity + 1)) +
        resource.minQuantity;
      results.push({
        itemId: resource.itemId,
        name: resource.name,
        quantity: qty,
        rare: resource.rare ?? false,
      });
    }
  }

  return results;
}

function actionDuration(
  node: GatheringNodeSnapshot,
  toolBonus: { speedMultiplier: number; xpBonus: number; extraResourceChance: number } | undefined
): number {
  const mult = toolBonus?.speedMultiplier ?? 1;
  return Math.max(1, Math.round((node.baseDuration / mult)));
}

function actionXp(
  node: GatheringNodeSnapshot,
  toolBonus: { speedMultiplier: number; xpBonus: number; extraResourceChance: number } | undefined
): number {
  return node.baseXp + (toolBonus?.xpBonus ?? 0);
}

// ─── PROCESS OFFLINE RETURN ─────────────────────────────────────────

export interface ProcessOfflineInput {
  nowMs: number;
  serverElapsedMs?: number;
  policies?: Partial<OfflinePolicies>;
  // Current skill XP (skill name -> xp) to compute level deltas.
  currentSkillXp: Record<string, number>;
  // Server authoritative flag (a.k.a. requireServerValidation).
  serverValidated?: boolean;
  rng?: OfflineRng;
  // Resolve a persisted node snapshot by id (defaults to action.gathering).
  resolveNode?: (nodeId: string) => GatheringNodeSnapshot;
}

export function processOfflineReturn(
  state: PlayerOfflineState,
  input: ProcessOfflineInput
): OfflineSummary {
  const policies: OfflinePolicies = { ...DEFAULT_OFFLINE_POLICIES, ...input.policies };
  const rng = input.rng ?? Math.random;
  const now = input.nowMs;

  if (!state.session || !state.session.action) {
    return emptySummary(state, policies, { elapsedMs: 0, elapsedCappedAwayMs: 0, cappedByPolicy: false, reason: 'no_action' });
  }

  const session = state.session;
  const action = session.action!;

  const elapsed = computeRewardedElapsed(state.session, policies, {
    nowMs: now,
    serverElapsedMs: input.serverElapsedMs,
  });

  // Aggregation buckets.
  const resources: Record<string, OfflineResourceGain> = {};
  const rareDrops: OfflineResourceGain[] = [];
  let totalXp = 0;
  let actionsCompleted = 0;

  // Only gathering actions are fully simulated at this phase.
  if (action.kind === 'gathering' && action.gathering) {
    const node =
      input.resolveNode?.(action.gathering.id) ?? action.gathering;

    const toolBonus = action.toolId ? node.toolBonus : undefined;

    // The authoritative per-action duration. Prefer the resolved node when
    // supplied (server-validated), else the persisted snapshot duration.
    const perActionMs = input.resolveNode
      ? actionDuration(node, toolBonus)
      : action.durationMs > 0
        ? action.durationMs
        : actionDuration(node, toolBonus);
    const xpPerAction = actionXp(node, toolBonus);

    actionsCompleted = Math.floor(elapsed.elapsedMs / perActionMs);

    for (let i = 0; i < actionsCompleted; i += 1) {
      totalXp += xpPerAction;
      const rolled = rollGatheringResources(node, toolBonus, rng);
      for (const r of rolled) {
        const existing = resources[r.itemId];
        if (existing) {
          existing.quantity += r.quantity;
        } else {
          resources[r.itemId] = { ...r };
        }
        if (r.rare) rareDrops.push(r);
      }
    }
  }

  // Compute skill XP/level deltas.
  const skills: OfflineSkillResult[] = [];
  const levelUps: OfflineSummary['levelUps'] = [];
  if (action.kind === 'gathering' && action.gathering) {
    const skill = action.gathering.skill;
    const fromXp = input.currentSkillXp[skill] ?? 0;
    const fromLevel = levelForXp(fromXp);
    const toXp = fromXp + totalXp;
    const toLevel = levelForXp(toXp);
    skills.push({ skill, xpGained: totalXp, levelFrom: fromLevel, levelTo: toLevel });
    if (toLevel > fromLevel) {
      levelUps.push({ skill, from: fromLevel, to: toLevel });
    }
  }

  // Build human-readable lines matching the intended offline summary UX.
  const lines: OfflineSummaryLine[] = [];
  if (actionsCompleted > 0 && action.gathering) {
    const skill = action.gathering.skill;
    const capSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
    lines.push({
      text: `${capSkill} XP +${totalXp.toLocaleString()}`,
      kind: 'xp',
    });
  }
  for (const r of Object.values(resources).sort((a, b) => b.quantity - a.quantity)) {
    if (r.rare) {
      lines.push({ text: `Rare Drop: ${r.name} +${r.quantity}`, kind: 'rare_drop' });
    } else {
      lines.push({ text: `${r.name} +${r.quantity.toLocaleString()}`, kind: 'resource' });
    }
  }
  for (const lu of levelUps) {
    const label = typeof lu.skill === 'string'
      ? lu.skill.charAt(0).toUpperCase() + lu.skill.slice(1)
      : 'Character';
    lines.push({ text: `${label} Level ${lu.from} => ${lu.to}`, kind: 'level' });
  }

  const summary: OfflineSummary = {
    sessionStart: session,
    elapsedMs: elapsed.elapsedMs,
    elapsedCappedAwayMs: elapsed.elapsedCappedAwayMs,
    actionsCompleted,
    resources: Object.values(resources),
    skills,
    levelUps,
    rareDrops,
    lines,
    serverValidated: policies.requireServerValidation && !!input.serverValidated,
    cappedByPolicy: elapsed.cappedByPolicy,
    reason: elapsed.reason,
  };

  state.lastSummary = summary;
  return summary;
}

function emptySummary(
  state: PlayerOfflineState,
  policies: OfflinePolicies,
  elapsed: ElapsedComputation
): OfflineSummary {
  const summary: OfflineSummary = {
    sessionStart: state.session ?? {
      leftAt: 0,
      action: null,
      baseline: { skills: {}, resourcesHeld: {} },
    },
    elapsedMs: 0,
    elapsedCappedAwayMs: elapsed.elapsedCappedAwayMs,
    actionsCompleted: 0,
    resources: [],
    skills: [],
    levelUps: [],
    rareDrops: [],
    lines: [],
    serverValidated: policies.requireServerValidation,
    cappedByPolicy: elapsed.cappedByPolicy,
    reason: elapsed.reason,
  };
  state.lastSummary = summary;
  return summary;
}

// ─── CONVENIENCE: BUILD A SNAPSHOT FROM AN ENGINE GATHERING NODE ────

import type { GatheringNode, GatheringTool } from './progression/gathering';

export function gatheringNodeToSnapshot(
  node: GatheringNode,
  tool?: GatheringTool
): OfflineActionSnapshot['gathering'] {
  return {
    id: node.id,
    name: node.name,
    skill: node.skill,
    levelRequired: node.levelRequired,
    baseDuration: node.baseDuration,
    baseXp: node.baseXp,
    resources: node.resources.map((r) => ({
      itemId: r.itemId,
      name: r.name,
      minQuantity: r.minQuantity,
      maxQuantity: r.maxQuantity,
      chance: r.chance,
      rare: r.rare,
    })),
    toolRequired: node.toolRequired,
    toolBonus: node.toolBonus,
  };
}

export function computeActionDurationMs(
  node: GatheringNodeSnapshot,
  tool?: GatheringTool
): number {
  const mult = tool?.bonus.speedMultiplier ?? 1;
  return Math.max(1, Math.round(node.baseDuration / mult));
}

export type { OfflineRng, OfflineSummary, OfflineSessionStart, OfflinePolicies };
