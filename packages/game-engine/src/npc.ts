import type {
  ActiveContract,
  ContractDefinition,
  DialogueContext,
  NPCDefinition,
  PlayerContractState,
  PlayerNPCState,
  WorldState,
} from '@premium-rpg/shared-types';

// ─── WORLD STATE ─────────────────────────────────────────────────────

export function createWorldState(): WorldState {
  return {
    regionProgress: {},
    worldFlags: {},
    activeEvents: [],
  };
}

export function discoverRegion(state: WorldState, regionId: string): boolean {
  const existing = state.regionProgress[regionId];
  if (existing?.discovered) return false;
  state.regionProgress[regionId] = {
    discovered: true,
    completion: existing?.completion ?? 0,
    firstVisitAt: existing?.firstVisitAt ?? Date.now(),
  };
  return true;
}

export function setRegionCompletion(state: WorldState, regionId: string, completion: number): void {
  completion = Math.max(0, Math.min(100, completion));
  if (!state.regionProgress[regionId]) {
    state.regionProgress[regionId] = { discovered: true, completion: 0 };
  }
  state.regionProgress[regionId].completion = Math.max(
    state.regionProgress[regionId].completion,
    completion
  );
}

export function isRegionDiscovered(state: WorldState, regionId: string): boolean {
  return !!state.regionProgress[regionId]?.discovered;
}

export function getRegionCompletion(state: WorldState, regionId: string): number {
  return state.regionProgress[regionId]?.completion ?? 0;
}

// ─── NPC STATE ───────────────────────────────────────────────────────

export function createPlayerNPCState(): PlayerNPCState {
  return {
    reputations: {},
    interactions: {},
    flags: {},
  };
}

export function getNPCReputation(state: PlayerNPCState, npcId: string): number {
  return state.reputations[npcId]?.current ?? 0;
}

// Reputation change returns the amount actually applied (clamped to max/min).
export function changeNPCReputation(
  state: PlayerNPCState,
  npcId: string,
  delta: number,
  max = 100
): number {
  const rep = (state.reputations[npcId] ??= { current: 0, claimedThresholds: [] });
  const before = rep.current;
  rep.current = Math.max(-100, Math.min(max, rep.current + delta));
  return rep.current - before;
}

export function addWorldFlag(state: PlayerNPCState, flag: string, value = true): void {
  state.flags[flag] = value;
}

export function hasWorldFlag(state: PlayerNPCState, flag: string): boolean {
  return !!state.flags[flag];
}

// ─── DIALOGUE RESOLUTION ─────────────────────────────────────────────
// Concise and contextual: returns lines that match the current player state.

export interface DialogueContextState {
  context: DialogueContext;
  level: number;
  seenDialogue: string[];
  reputations: Record<string, number>;
  worldFlags: Record<string, boolean>;
  regionProgress: Record<string, { discovered: boolean; completion: number }>;
  // questId -> completion state (0 unavailable, 1 available, 2 active, 3 complete)
  questStates: Record<string, number>;
}

export interface ResolvedDialogue {
  npcId: string;
  lines: { id: string; text: string; action?: string }[];
  fallback: string;
}

export function resolveDialogue(
  npc: Pick<NPCDefinition, 'id' | 'dialogue'>,
  state: DialogueContextState
): ResolvedDialogue {
  const matching = npc.dialogue.lines
    .filter((l) => lineMatches(l, state))
    .filter((l) => !state.seenDialogue.includes(l.id) || state.context !== 'greeting');
  const lines: { id: string; text: string; action?: string }[] = matching.map((l) => ({
    id: l.id,
    text: l.text,
    action: l.action,
  }));
  return {
    npcId: npc.id,
    lines: lines.length
      ? lines
      : [{ id: `${npc.id}_fallback`, text: npc.dialogue.fallback ?? '' }],
    fallback: npc.dialogue.fallback ?? '',
  };
}

function lineMatches(
  line: { id: string; text: string; requires?: any; action?: string },
  state: DialogueContextState
): boolean {
  const req = line.requires;
  if (!req) return true;

  // Context filter (most specific)
  if (req.context && req.context !== state.context) return false;

  // Quest-state filters
  if (req.questState) {
    for (const q of req.questState) {
      const map: Record<string, number> = { unavailable: 0, available: 1, active: 2, complete: 3 };
      if ((state.questStates[q.questId] ?? 0) < map[q.state]) return false;
    }
  }

  // Region progress filters
  if (req.regionProgress) {
    for (const r of req.regionProgress) {
      if ((state.regionProgress[r.regionId]?.completion ?? 0) < r.minProgress) return false;
    }
  }

  // Reputation filters
  if (req.npcReputation) {
    if ((state.reputations[req.npcReputation.npcId] ?? 0) < req.npcReputation.minReputation) {
      return false;
    }
  }

  // Level filter
  if (req.playerLevel && state.level < req.playerLevel) return false;

  // Arbitrary flags
  if (req.flags) {
    for (const f of req.flags) {
      if (!state.worldFlags[f]) return false;
    }
  }

  return true;
}

// ─── CONTRACTS ───────────────────────────────────────────────────────

export function createPlayerContractState(): PlayerContractState {
  return {
    active: [],
    cooldowns: {},
    completed: [],
  };
}

export function canAcceptContract(
  state: PlayerContractState,
  contract: ContractDefinition,
  npcReputation: number
): { ok: boolean; reason?: string } {
  if (state.active.some((c) => c.contractId === contract.id)) {
    return { ok: false, reason: 'already_active' };
  }
  if (contract.oneTime && state.completed.includes(contract.id)) {
    return { ok: false, reason: 'already_completed' };
  }
  const cooldownUntil = state.cooldowns[contract.id];
  if (cooldownUntil && Date.now() < cooldownUntil) {
    return { ok: false, reason: 'on_cooldown' };
  }
  if (contract.requires.reputation && npcReputation < contract.requires.reputation.min) {
    return { ok: false, reason: 'reputation_too_low' };
  }
  return { ok: true };
}

export function acceptContract(
  state: PlayerContractState,
  contractId: string,
  npcId: string,
  contractDb: Record<string, ContractDefinition>,
  reputation: number
): { ok: boolean; reason?: string } {
  const contract = contractDb[contractId];
  if (!contract) return { ok: false, reason: 'unknown' };
  const check = canAcceptContract(state, contract, reputation);
  if (!check.ok) return check;

  const now = Date.now();
  const expiresAt = contract.tier === 'daily'
    ? now + 24 * 60 * 60 * 1000
    : contract.tier === 'weekly'
      ? now + 7 * 24 * 60 * 60 * 1000
      : now + 7 * 24 * 60 * 60 * 1000;

  state.active.push({
    contractId,
    npcId,
    startedAt: now,
    expiresAt,
    progress: contract.objectives.map(() => 0),
    completed: false,
    claimed: false,
  });
  return { ok: true };
}

export function progressContract(
  state: PlayerContractState,
  contractId: string,
  objectiveIndex: number,
  amount = 1,
  contractDb: Record<string, ContractDefinition>
): boolean {
  const active = state.active.find((c) => c.contractId === contractId);
  if (!active || active.completed) return false;
  const def = contractDb[contractId];
  if (!def) return false;
  const obj = def.objectives[objectiveIndex];
  if (!obj) return false;
  const slot = active.progress[objectiveIndex] ?? 0;
  active.progress[objectiveIndex] = Math.min(obj.count, slot + amount);
  if (def.objectives.every((o, i) => (active.progress[i] ?? 0) >= o.count)) {
    active.completed = true;
  }
  return true;
}

// Returns reward bundle for a claimed contract (does not apply to caller yet).
export interface ContractClaimResult {
  ok: boolean;
  reason?: string;
  contract?: ContractDefinition;
  rewards: {
    gold: number;
    xp: number;
    dungeonSeals: number;
    reputation: { npcId: string; amount: number } | null;
    items: { itemId: string; quantity: number; chance: number }[];
  };
}

export function claimContract(
  state: PlayerContractState,
  contractId: string,
  contractDb: Record<string, ContractDefinition>
): ContractClaimResult {
  const active = state.active.find((c) => c.contractId === contractId);
  if (!active) return { ok: false, reason: 'not_active', rewards: emptyRewards() };
  if (!active.completed) return { ok: false, reason: 'not_completed', rewards: emptyRewards() };
  if (active.claimed) return { ok: false, reason: 'already_claimed', rewards: emptyRewards() };

  const def = contractDb[contractId];
  if (!def) return { ok: false, reason: 'unknown', rewards: emptyRewards() };

  active.claimed = true;
  state.active = state.active.filter((c) => c.contractId !== contractId);
  state.completed.push(contractId);
  if (!def.oneTime) {
    state.cooldowns[contractId] = Date.now() + def.cooldownHours * 60 * 60 * 1000;
  }

  return {
    ok: true,
    contract: def,
    rewards: {
      gold: def.rewards.gold,
      xp: def.rewards.xp,
      dungeonSeals: def.rewards.dungeonSeals ?? 0,
      reputation: def.rewards.reputation ?? null,
      items: def.rewards.items ?? [],
    },
  };
}

function emptyRewards(): ContractClaimResult['rewards'] {
  return { gold: 0, xp: 0, dungeonSeals: 0, reputation: null, items: [] };
}

// ─── NPC SERVICES ────────────────────────────────────────────────────

export interface HealingQuote {
  costGold: number;
  // Whether this NPC's healing also cleanses
  cleanses: boolean;
}

export function getHealingQuote(
  npc: Pick<NPCDefinition, 'services'>,
  missingHealth: number
): HealingQuote | null {
  const healing = npc.services.find((s) => s.type === 'healing');
  if (!healing) return null;
  const cost = healing.healCostGold ?? 20;
  return { costGold: cost, cleanses: true };
}

// Whether an NPC offers a given service type.
export function offersService(npc: Pick<NPCDefinition, 'services'>, type: string): boolean {
  return npc.services.some((s) => s.type === type);
}
