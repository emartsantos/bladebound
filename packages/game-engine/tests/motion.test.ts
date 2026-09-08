import { describe, it, expect } from 'vitest';
import {
  getMotionDescriptor,
  getAllMotionKinds,
  resolveMotionEvent,
  canAddMotionEvent,
  pushMotionEvent,
  pruneExpiredMotionEvents,
  createMotionState,
  getMotionCssClass,
  getMotionLabel,
  prefersReducedMotion,
} from '../src/motion';
import type {
  MotionEventKind,
  MotionEvent,
  MotionPolicy,
  MotionInstanceState,
  XpGainPayload,
  DamagePayload,
  LevelUpPayload,
  LootPayload,
} from '@premium-rpg/shared-types';

// ── Registry ─────────────────────────────────────────────────────

describe('motion registry', () => {
  it('has a descriptor for every event kind', () => {
    const kinds = getAllMotionKinds();
    const expected: MotionEventKind[] = [
      'xp_gain', 'level_up', 'loot_acquisition', 'equipment_change',
      'damage_number', 'healing_number', 'boss_appearance', 'rare_drop',
      'achievement_unlock', 'navigation_transition',
    ];
    expect(kinds.sort()).toEqual(expected.sort());
  });

  it('every descriptor has animations, label, target, stacking, maxInstances', () => {
    for (const kind of getAllMotionKinds()) {
      const desc = getMotionDescriptor(kind);
      expect(desc.kind).toBe(kind);
      expect(desc.label.length).toBeGreaterThan(0);
      expect(desc.target).toBeTruthy();
      expect(desc.reducedMotion).toBeDefined();
      expect(desc.reducedMotion.mode).toBeTruthy();
      expect(typeof desc.maxInstances).toBe('number');
      expect(typeof desc.autoDismissMs).toBe('number');
      expect(['none', 'stack', 'replace']).toContain(desc.stacking);
    }
  });

  it('every descriptor with animations has valid properties', () => {
    for (const kind of getAllMotionKinds()) {
      const desc = getMotionDescriptor(kind);
      for (const anim of desc.animations) {
        expect(anim.property).toBeTruthy();
        expect(anim.durationMs).toBeGreaterThan(0);
        expect(typeof anim.easing).toBe('string');
        expect(anim.easing.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── resolveMotionEvent ──────────────────────────────────────────────

describe('resolveMotionEvent', () => {
  const normalPolicy: MotionPolicy = { kind: 'normal' };

  it('resolves a normal-motion event with full animations', () => {
    const payload: XpGainPayload = { amount: 100, skill: 'mining' };
    const event = resolveMotionEvent('xp_gain', payload, normalPolicy, 'test_1');
    expect(event.id).toBe('test_1');
    expect(event.kind).toBe('xp_gain');
    expect(event.payload).toBe(payload);
    expect(event.descriptor.animations.length).toBeGreaterThan(0);
    expect(event.reducedMotionApplied).toBe(false);
  });

  it('applies reduced-motion policy with flash fallback', () => {
    const reducedPolicy: MotionPolicy = { kind: 'reduced' };
    const payload: DamagePayload = { amount: 25, isCritical: false, source: 'player' };
    const event = resolveMotionEvent('damage_number', payload, reducedPolicy);
    expect(event.reducedMotionApplied).toBe(true);
    // Should have reduced animations (flash mode)
    expect(event.descriptor.animations.length).toBeGreaterThan(0);
    expect(event.descriptor.animations[0].property).toBe('opacity');
  });

  it('removes all animations for kind: none', () => {
    const nonePolicy: MotionPolicy = { kind: 'none' };
    const payload: XpGainPayload = { amount: 50, skill: 'combat' };
    const event = resolveMotionEvent('xp_gain', payload, nonePolicy);
    expect(event.reducedMotionApplied).toBe(true);
    expect(event.descriptor.animations.length).toBe(0);
    expect(event.descriptor.autoDismissMs).toBe(0);
  });

  it('respects policy overrides for a specific event kind', () => {
    const policy: MotionPolicy = {
      kind: 'reduced',
      overrides: {
        xp_gain: { mode: 'none' },
      },
    };
    const payload: XpGainPayload = { amount: 50, skill: 'mining' };
    const event = resolveMotionEvent('xp_gain', payload, policy);
    expect(event.descriptor.animations.length).toBe(0);
    // damage_number should still use default reduced (flash)
    const dmg = resolveMotionEvent('damage_number', { amount: 10, isCritical: false, source: 'enemy' } as DamagePayload, policy);
    expect(dmg.descriptor.animations.length).toBeGreaterThan(0);
  });
});

// ── canAddMotionEvent ───────────────────────────────────────────────

describe('canAddMotionEvent', () => {
  it('allows when under maxInstances', () => {
    const state = createMotionState();
    expect(canAddMotionEvent(state, 'xp_gain').allowed).toBe(true);
  });

  it('returns allowed: false with eviction target when at max (stack)', () => {
    let state = createMotionState();
    // Push 5 xp_gain events (maxInstances = 5)
    for (let i = 0; i < 5; i++) {
      const e = resolveMotionEvent('xp_gain', { amount: 10, skill: 'mining' }, { kind: 'normal' }, `ev_${i}`);
      state = pushMotionEvent(state, e);
    }
    const check = canAddMotionEvent(state, 'xp_gain');
    expect(check.allowed).toBe(false);
    expect(check.evictionTarget).toBeTruthy();
  });

  it('allows unlimited for maxInstances = 0', () => {
    const state = createMotionState();
    expect(canAddMotionEvent(state, 'navigation_transition').allowed).toBe(true);
  });
});

// ── pushMotionEvent / pruneExpiredMotionEvents ──────────────────────

describe('pushMotionEvent', () => {
  it('adds an event to the state', () => {
    let state = createMotionState();
    const event = resolveMotionEvent('xp_gain', { amount: 10, skill: 'mining' }, { kind: 'normal' }, 'push_1');
    state = pushMotionEvent(state, event);
    expect(state.active.length).toBe(1);
    expect(state.active[0].id).toBe('push_1');
    expect(state.recentKinds).toContain('xp_gain');
  });

  it('evicts oldest when at max (stack mode)', () => {
    let state = createMotionState();
    // healing_number has maxInstances: 5
    for (let i = 0; i < 6; i++) {
      const e = resolveMotionEvent('healing_number', { amount: 5 + i, source: 'potion' }, { kind: 'normal' }, `heal_${i}`);
      state = pushMotionEvent(state, e);
    }
    const healEvents = state.active.filter((e) => e.kind === 'healing_number');
    expect(healEvents.length).toBeLessThanOrEqual(5);
    expect(healEvents.some((e) => e.id === 'heal_0')).toBe(false);
  });

  it('replaces all of kind for replace stacking', () => {
    let state = createMotionState();
    state = pushMotionEvent(state, resolveMotionEvent('level_up', { fromLevel: 1, toLevel: 2, skill: 'mining' }, { kind: 'normal' }, 'lu_1'));
    state = pushMotionEvent(state, resolveMotionEvent('level_up', { fromLevel: 2, toLevel: 3, skill: 'mining' }, { kind: 'normal' }, 'lu_2'));
    const levelUp = state.active.filter((e) => e.kind === 'level_up');
    expect(levelUp.length).toBe(1);
    expect(levelUp[0].id).toBe('lu_2');
  });
});

describe('pruneExpiredMotionEvents', () => {
  it('removes expired events', () => {
    let state = createMotionState();
    // xp_gain autoDismissMs = 1500
    state = pushMotionEvent(state, resolveMotionEvent('xp_gain', { amount: 10, skill: 'mining' }, { kind: 'normal' }, 'prune_1'));
    expect(state.active.length).toBe(1);
    // Simulate 2 seconds passing
    state = pruneExpiredMotionEvents(state, Date.now() + 2000);
    expect(state.active.length).toBe(0);
  });

  it('keeps events that have not expired', () => {
    let state = createMotionState();
    state = pushMotionEvent(state, resolveMotionEvent('xp_gain', { amount: 10, skill: 'mining' }, { kind: 'normal' }, 'keep_1'));
    state = pruneExpiredMotionEvents(state, Date.now() + 500);
    expect(state.active.length).toBe(1);
  });
});

// ── Utilities ───────────────────────────────────────────────────────

describe('motion utilities', () => {
  it('getMotionCssClass returns class hint', () => {
    expect(getMotionCssClass('xp_gain')).toBe('motion-xp-gain');
    expect(getMotionCssClass('boss_appearance')).toBe('motion-boss');
  });

  it('getMotionLabel returns human-readable label', () => {
    expect(getMotionLabel('level_up')).toBe('Level-up banner');
    expect(getMotionLabel('rare_drop')).toBe('Golden particle burst');
  });

  it('prefersReducedMotion returns correct results', () => {
    expect(prefersReducedMotion({ kind: 'normal' }, 'xp_gain')).toBe(false);
    expect(prefersReducedMotion({ kind: 'reduced' }, 'xp_gain')).toBe(true);
    expect(prefersReducedMotion({ kind: 'none' }, 'damage_number')).toBe(true);
  });
});

// ── createMotionState ───────────────────────────────────────────────

describe('createMotionState', () => {
  it('creates empty state with default normal policy', () => {
    const s = createMotionState();
    expect(s.active).toEqual([]);
    expect(s.policy.kind).toBe('normal');
    expect(s.recentKinds).toEqual([]);
  });

  it('accepts custom policy', () => {
    const s = createMotionState({ kind: 'reduced' });
    expect(s.policy.kind).toBe('reduced');
  });
});

// ── Data integrity ──────────────────────────────────────────────────

describe('motion data integrity', () => {
  it('all stacking modes are valid', () => {
    for (const kind of getAllMotionKinds()) {
      const desc = getMotionDescriptor(kind);
      expect(['none', 'stack', 'replace']).toContain(desc.stacking);
    }
  });

  it('maxInstances is non-negative', () => {
    for (const kind of getAllMotionKinds()) {
      const desc = getMotionDescriptor(kind);
      expect(desc.maxInstances).toBeGreaterThanOrEqual(0);
    }
  });

  it('autoDismissMs is non-negative', () => {
    for (const kind of getAllMotionKinds()) {
      const desc = getMotionDescriptor(kind);
      expect(desc.autoDismissMs).toBeGreaterThanOrEqual(0);
    }
  });
});
