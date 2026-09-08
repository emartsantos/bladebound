// ─── MOTION AND GAME FEEDBACK ENGINE ────────────────────────────────
// Phase 25: a data-driven registry mapping game events → animation
// descriptors, with reduced-motion support and instance tracking.
//
// Pure functions, framework-independent. The UI renders these descriptors
// directly — no React, no DOM, no timers.

import type {
  MotionEventKind,
  MotionEventDescriptor,
  MotionEvent,
  MotionEventPayload,
  MotionPolicy,
  MotionInstanceState,
  ReducedMotionFallback,
  AnimationStep,
} from '@premium-rpg/shared-types';

// Re-export the motion tokens for convenience (these live in ui-tokens)
// so the registry can reference them without a package dependency.
const DURATION = {
  instant: 60,
  fast: 120,
  base: 180,
  slow: 260,
  deliberate: 400,
} as const;

const EASING = {
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
  accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)',
  linear: 'linear',
} as const;

// ─── HELPERS ────────────────────────────────────────────────────────

let _counter = 0;
function nextId(): string {
  return `motion_${Date.now()}_${++_counter}`;
}

// ─── EVENT REGISTRY ─────────────────────────────────────────────────
// One entry per MotionEventKind. Each defines:
//   - animations: the full-motion animation steps
//   - reducedMotion: the fallback for prefers-reduced-motion: reduce
//   - stacking/maxInstances/autoDismissMs: behavior tuning

const MOTION_REGISTRY: Record<MotionEventKind, MotionEventDescriptor> = {
  // ── XP GAIN ──────────────────────────────────────────────────────
  xp_gain: {
    kind: 'xp_gain',
    label: 'Floating XP number',
    cssClass: 'motion-xp-gain',
    target: 'floating_text',
    animations: [
      { property: 'opacity', from: 1, to: 0, durationMs: 1200, easing: EASING.decelerate },
      { property: 'translateY', from: 0, to: -40, durationMs: 1200, easing: EASING.decelerate },
      { property: 'scale', from: 0.8, to: 1.1, durationMs: 200, easing: EASING.standard },
      { property: 'scale', from: 1.1, to: 1, durationMs: 300, easing: EASING.standard, delayMs: 200 },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 200, opacityOnly: true },
    stacking: 'stack',
    maxInstances: 5,
    autoDismissMs: 1500,
  },

  // ── LEVEL UP ─────────────────────────────────────────────────────
  level_up: {
    kind: 'level_up',
    label: 'Level-up banner',
    cssClass: 'motion-level-up',
    target: 'full_screen_overlay',
    animations: [
      { property: 'opacity', from: 0, to: 1, durationMs: 300, easing: EASING.decelerate },
      { property: 'scale', from: 0.6, to: 1, durationMs: 500, easing: EASING.decelerate },
      { property: 'opacity', from: 1, to: 0, durationMs: 400, easing: EASING.accelerate, delayMs: 1500 },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 400, opacityOnly: true },
    stacking: 'replace',
    maxInstances: 1,
    autoDismissMs: 2500,
  },

  // ── LOOT ACQUISITION ─────────────────────────────────────────────
  loot_acquisition: {
    kind: 'loot_acquisition',
    label: 'Item pop-in',
    cssClass: 'motion-loot',
    target: 'inventory_slot',
    animations: [
      { property: 'scale', from: 0, to: 1.3, durationMs: 200, easing: EASING.standard },
      { property: 'scale', from: 1.3, to: 1, durationMs: 300, easing: EASING.decelerate, delayMs: 200 },
      { property: 'opacity', from: 0, to: 1, durationMs: 150, easing: EASING.decelerate },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 150, opacityOnly: true },
    stacking: 'stack',
    maxInstances: 3,
    autoDismissMs: 1500,
  },

  // ── EQUIPMENT CHANGE ─────────────────────────────────────────────
  equipment_change: {
    kind: 'equipment_change',
    label: 'Gear swap flash',
    cssClass: 'motion-equip',
    target: 'inventory_slot',
    animations: [
      { property: 'backgroundColor', from: 'rgba(111, 143, 90, 0.4)', to: 'transparent', durationMs: 600, easing: EASING.decelerate },
      { property: 'boxShadow', from: '0 0 12px rgba(111, 143, 90, 0.6)', to: '0 0 0px transparent', durationMs: 800, easing: EASING.decelerate },
    ],
    reducedMotion: { mode: 'none' },
    stacking: 'replace',
    maxInstances: 1,
    autoDismissMs: 1000,
  },

  // ── DAMAGE NUMBER ────────────────────────────────────────────────
  damage_number: {
    kind: 'damage_number',
    label: 'Floating damage',
    cssClass: 'motion-damage',
    target: 'floating_text',
    animations: [
      { property: 'opacity', from: 1, to: 0, durationMs: 900, easing: EASING.decelerate },
      { property: 'translateY', from: 0, to: -30, durationMs: 900, easing: EASING.decelerate },
      { property: 'scale', from: 1.3, to: 1, durationMs: 200, easing: EASING.standard },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 150, opacityOnly: true },
    stacking: 'stack',
    maxInstances: 8,
    autoDismissMs: 1200,
  },

  // ── HEALING NUMBER ───────────────────────────────────────────────
  healing_number: {
    kind: 'healing_number',
    label: 'Floating heal',
    cssClass: 'motion-heal',
    target: 'floating_text',
    animations: [
      { property: 'opacity', from: 1, to: 0, durationMs: 1000, easing: EASING.decelerate },
      { property: 'translateY', from: 0, to: -25, durationMs: 1000, easing: EASING.decelerate },
      { property: 'color', from: 'rgba(111, 143, 90, 1)', to: 'rgba(111, 143, 90, 0.5)', durationMs: 1000, easing: EASING.linear },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 200, opacityOnly: true },
    stacking: 'stack',
    maxInstances: 5,
    autoDismissMs: 1200,
  },

  // ── BOSS APPEARANCE ──────────────────────────────────────────────
  boss_appearance: {
    kind: 'boss_appearance',
    label: 'Boss entrance',
    cssClass: 'motion-boss',
    target: 'full_screen_overlay',
    animations: [
      { property: 'opacity', from: 0, to: 1, durationMs: 400, easing: EASING.decelerate },
      { property: 'brightness', from: 0.3, to: 1, durationMs: 600, easing: EASING.decelerate },
      { property: 'opacity', from: 1, to: 0, durationMs: 500, easing: EASING.accelerate, delayMs: 2000 },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 300, opacityOnly: true },
    stacking: 'replace',
    maxInstances: 1,
    autoDismissMs: 3000,
  },

  // ── RARE DROP ────────────────────────────────────────────────────
  rare_drop: {
    kind: 'rare_drop',
    label: 'Golden particle burst',
    cssClass: 'motion-rare-drop',
    target: 'notification',
    animations: [
      { property: 'opacity', from: 0, to: 1, durationMs: 200, easing: EASING.decelerate },
      { property: 'scale', from: 0.5, to: 1, durationMs: 400, easing: EASING.decelerate },
      { property: 'boxShadow', from: '0 0 30px rgba(194, 153, 79, 0.8)', to: '0 0 0px transparent', durationMs: 1500, easing: EASING.decelerate, delayMs: 300 },
      { property: 'opacity', from: 1, to: 0, durationMs: 500, easing: EASING.accelerate, delayMs: 2000 },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 500, opacityOnly: true },
    stacking: 'replace',
    maxInstances: 1,
    autoDismissMs: 3000,
  },

  // ── ACHIEVEMENT UNLOCK ───────────────────────────────────────────
  achievement_unlock: {
    kind: 'achievement_unlock',
    label: 'Trophy card slide-in',
    cssClass: 'motion-achievement',
    target: 'notification',
    animations: [
      { property: 'opacity', from: 0, to: 1, durationMs: 300, easing: EASING.decelerate },
      { property: 'translateY', from: -60, to: 0, durationMs: 400, easing: EASING.decelerate },
      { property: 'opacity', from: 1, to: 0, durationMs: 400, easing: EASING.accelerate, delayMs: 3000 },
    ],
    reducedMotion: { mode: 'flash', flashDurationMs: 300, opacityOnly: true },
    stacking: 'stack',
    maxInstances: 2,
    autoDismissMs: 4000,
  },

  // ── NAVIGATION TRANSITION ────────────────────────────────────────
  navigation_transition: {
    kind: 'navigation_transition',
    label: 'Section fade/slide',
    cssClass: 'motion-nav',
    target: 'context_panel',
    animations: [
      { property: 'opacity', from: 0, to: 1, durationMs: 200, easing: EASING.decelerate },
      { property: 'translateX', from: 12, to: 0, durationMs: 200, easing: EASING.decelerate },
    ],
    reducedMotion: { mode: 'none' },
    stacking: 'replace',
    maxInstances: 1,
    autoDismissMs: 0,
  },
};

// ─── PUBLIC API ─────────────────────────────────────────────────────

/** Get the raw descriptor for a motion event kind. */
export function getMotionDescriptor(kind: MotionEventKind): MotionEventDescriptor {
  return MOTION_REGISTRY[kind];
}

/** Get all registered motion event kinds. */
export function getAllMotionKinds(): MotionEventKind[] {
  return Object.keys(MOTION_REGISTRY) as MotionEventKind[];
}

/**
 * Resolve a motion event instance. Applies the motion policy (reduced
 * motion / none), and returns a fully resolved MotionEvent with the
 * correct descriptor (potentially degraded for reduced motion).
 */
export function resolveMotionEvent(
  kind: MotionEventKind,
  payload: MotionEventPayload,
  policy: MotionPolicy,
  id?: string
): MotionEvent {
  const baseDescriptor = MOTION_REGISTRY[kind];

  // Apply policy overrides.
  const effectiveReducedMotion: ReducedMotionFallback =
    policy.overrides?.[kind] ?? baseDescriptor.reducedMotion;

  let descriptor = baseDescriptor;
  let reducedMotionApplied = false;

  if (policy.kind === 'reduced') {
    descriptor = {
      ...baseDescriptor,
      reducedMotion: effectiveReducedMotion,
      animations: effectiveReducedMotion.mode === 'none'
        ? []
        : effectiveReducedMotion.mode === 'flash'
          ? [
              {
                property: 'opacity' as const,
                from: effectiveReducedMotion.opacityOnly ? 0 : 0,
                to: effectiveReducedMotion.opacityOnly ? 1 : 0.7,
                durationMs: effectiveReducedMotion.flashDurationMs ?? 200,
                easing: 'linear',
              },
            ]
          : baseDescriptor.animations,
    };
    reducedMotionApplied = true;
  } else if (policy.kind === 'none') {
    descriptor = {
      ...baseDescriptor,
      animations: [],
      autoDismissMs: 0,
    };
    reducedMotionApplied = true;
  }

  return {
    id: id ?? nextId(),
    kind,
    triggeredAt: Date.now(),
    payload,
    descriptor,
    reducedMotionApplied,
  };
}

/**
 * Check whether a new motion event can be added to the instance state
 * (respecting maxInstances). If not, the oldest matching event should
 * be evicted first (stacking mode determines what happens).
 */
export function canAddMotionEvent(
  state: MotionInstanceState,
  kind: MotionEventKind
): { allowed: boolean; evictionTarget?: string } {
  const desc = MOTION_REGISTRY[kind];
  if (desc.maxInstances === 0) return { allowed: true };

  const active = state.active.filter((e) => e.kind === kind);
  if (active.length < desc.maxInstances) return { allowed: true };

  // Eviction: stack → remove oldest; replace → remove all of this kind.
  if (desc.stacking === 'replace') {
    return { allowed: true, evictionTarget: active.map((e) => e.id).join(',') };
  }

  return { allowed: false, evictionTarget: active[0]?.id };
}

/**
 * Push a motion event into the instance state. Handles stacking
 * (evict oldest if at max) and returns the final active list length.
 */
export function pushMotionEvent(
  state: MotionInstanceState,
  event: MotionEvent
): MotionInstanceState {
  const check = canAddMotionEvent(state, event.kind);
  let active = [...state.active];

  if (check.evictionTarget) {
    const ids = new Set(check.evictionTarget.split(','));
    active = active.filter((e) => !ids.has(e.id));
  }

  // Respect maxInstances after eviction.
  const desc = MOTION_REGISTRY[event.kind];
  const sameKind = active.filter((e) => e.kind === event.kind);
  if (desc.maxInstances > 0 && sameKind.length >= desc.maxInstances) {
    active = active.filter((e) => e.kind !== event.kind);
  }

  active.push(event);

  return {
    ...state,
    active,
    recentKinds: [...state.recentKinds, event.kind].slice(-20),
  };
}

/**
 * Remove expired events from the instance state based on autoDismissMs.
 */
export function pruneExpiredMotionEvents(
  state: MotionInstanceState,
  nowMs: number = Date.now()
): MotionInstanceState {
  const active = state.active.filter((e) => {
    const desc = MOTION_REGISTRY[e.kind];
    if (desc.autoDismissMs <= 0) return true;
    return nowMs - e.triggeredAt < desc.autoDismissMs;
  });
  return { ...state, active };
}

/** Create a fresh motion state with a policy. */
export function createMotionState(
  policy: MotionPolicy = { kind: 'normal' }
): MotionInstanceState {
  return { active: [], policy, recentKinds: [] };
}

/** Get the CSS class hint for a descriptor (or undefined). */
export function getMotionCssClass(kind: MotionEventKind): string | undefined {
  return MOTION_REGISTRY[kind].cssClass;
}

/** Get a human-readable label for a motion event kind. */
export function getMotionLabel(kind: MotionEventKind): string {
  return MOTION_REGISTRY[kind].label;
}

/** Check if the user has reduced-motion preference. */
export function prefersReducedMotion(
  policy: MotionPolicy,
  kind: MotionEventKind
): boolean {
  return policy.kind === 'reduced' || policy.kind === 'none';
}
