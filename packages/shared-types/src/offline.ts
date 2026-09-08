// ─── OFFLINE PROGRESSION ────────────────────────────────────────────
// When a player leaves while an action is running, capture a snapshot.
// On return, compute elapsed time, cap rewarded time, aggregate rewards,
// and emit a concise offline summary. Designed to resist clock
// manipulation: rewarded time is server-validated and hard-capped, and
// reward rolls are deterministic given an injected RNG so the client can
// never claim more than the rules allow.

import type { SkillId } from './skill';

// ─── GATHERING NODE SNAPSHOT ────────────────────────────────────────
// A serializable snapshot of a gathering node used by offline progression.
// Mirrors the engine's GatheringNode without coupling to the engine.

export interface GatheringResourceSnapshot {
  itemId: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  chance: number;
  rare?: boolean;
}

export interface GatheringNodeSnapshot {
  id: string;
  name: string;
  skill: SkillId;
  levelRequired: number;
  baseDuration: number;
  baseXp: number;
  resources: GatheringResourceSnapshot[];
  toolRequired: boolean;
  toolBonus?: {
    speedMultiplier: number;
    xpBonus: number;
    extraResourceChance: number;
  };
}

// ─── ACTIVE ACTION SNAPSHOT ─────────────────────────────────────────

export type OfflineActionKind = 'gathering' | 'combat' | 'crafting';

export interface OfflineActionSnapshot {
  kind: OfflineActionKind;
  // The action that was running when the player left.
  gathering?: GatheringNodeSnapshot;
  // Combat / crafting snapshots reserved for later phases; kept minimal.
  combatTargetId?: string;
  craftingRecipeId?: string;
  // When the action was started (server timestamp).
  startedAt: number;
  // Server-validated timestamp of the last login/action.
  lastValidActionTimestamp: number;
  // Per-action duration in ms (server-derived at start).
  durationMs: number;
  // Tool/gathering modifiers captured at start (speed, xp bonus).
  toolId?: string;
}

// ─── OFFLINE SESSION START (persisted on leave) ─────────────────────

export interface OfflineSessionStart {
  // When the player left.
  leftAt: number;
  // Snapshot of the in-progress action at leave time.
  action: OfflineActionSnapshot | null;
  // Baseline skill levels/XP the rewards will be validated against
  // (server-side, to prevent level-clawback conflicts).
  baseline: {
    skills: Record<string, { level: number; xp: number }>;
    resourcesHeld: Record<string, number>;
  };
}

// ─── POLICY: LIMITS & ANTI-EXPLOIT ──────────────────────────────────

export interface OfflinePolicies {
  // Hard cap on rewarded offline time regardless of reported elapsed (ms).
  maxRewardedMs: number;
  // Server-authoritative max elapsed accepted from a dirty client (ms).
  maxAcceptedElapsedMs: number;
  // Minimum idle before offline rewards accrue at all (ms).
  minOfflineMs: number;
  // Tolerance for clock skew between client-server before rejection (ms).
  clockSkewToleranceMs: number;
  // Whether a server timestamp is required (registered accounts).
  requireServerValidation: boolean;
}

// ─── OFFLINE SUMMARY ────────────────────────────────────────────────

export interface OfflineResourceGain {
  itemId: string;
  name: string;
  quantity: number;
  rare: boolean;
}

export interface OfflineSkillResult {
  skill: string;
  xpGained: number;
  levelFrom: number;
  levelTo: number;
}

export interface OfflineSummaryLine {
  // A short, human-readable line for the offline summary screen.
  text: string;
  kind: 'xp' | 'resource' | 'level' | 'rare_drop' | 'info';
}

export interface OfflineSummary {
  sessionStart: OfflineSessionStart;
  // Authoritative elapsed used (after capping), in ms.
  elapsedMs: number;
  // How many unrewarded (excess) time capped away, in ms.
  elapsedCappedAwayMs: number;
  // Number of completed actions awarded.
  actionsCompleted: number;
  // Aggregated resources gathered.
  resources: OfflineResourceGain[];
  // XP/level results per skill.
  skills: OfflineSkillResult[];
  // Did the player level up (character or skill)?
  levelUps: { skill: string | 'character'; from: number; to: number }[];
  // Rare drops encountered.
  rareDrops: OfflineResourceGain[];
  // Human-readable lines for display.
  lines: OfflineSummaryLine[];
  // Whether the server validated this result (registered accounts).
  serverValidated: boolean;
  // Whether the elapsed time was rejected/capped due to exploit risk.
  cappedByPolicy: boolean;
  reason?: 'ok' | 'too_short' | 'no_action' | 'clock_skew' | 'cap_applied';
}

// ─── RNG HOOK ────────────────────────────────────────────────────────
// Server passes a seeded deterministic RNG so rewards can be replayed
// and verified (anti-cheat). Defaults to Math.random for offline/single.

export type OfflineRng = () => number;

// ─── SAVE-STATE SLOT ────────────────────────────────────────────────

export interface PlayerOfflineState {
  // The persisted session-start snapshot (written on leave).
  session: OfflineSessionStart | null;
  // Whether the last offline return produced a validated summary.
  lastSummary: OfflineSummary | null;
  // Anti-abuse: total rewarded offline ms tracked (rolling window).
  serverValidation?: {
    // Server-issued nonce/token for the active action (anti-replay).
    nonce: string;
    issuedAt: number;
  };
}
