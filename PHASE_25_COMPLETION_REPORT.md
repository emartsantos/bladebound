# Phase 25 — Motion and Game Feedback (COMPLETED)

## Summary
Pure-function motion event system that maps gameplay events to animation descriptors with reduced-motion accessibility. All types are framework-agnostic — UI consumes them directly.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/motion.ts` | Event types, policy, payload unions, instance state |
| `packages/game-engine/src/motion.ts` | Event registry, resolver, stacking, pruning, state factory |
| `packages/game-engine/tests/motion.test.ts` | 23 tests across registry, resolution, eviction, pruning |

## API

**Types** (`shared-types`)
- `MotionEventKind` — 10 event kinds: `xp_gain | level_up | loot_acquisition | equipment_change | damage_number | healing_number | boss_appearance | rare_drop | achievement_unlock | navigation_transition`
- `MotionPolicy` — `{ kind: 'normal' | 'reduced' | 'none', overrides?: ... }`
- `MotionEventDescriptor` — animations, reduced-motion fallback, stacking rules, targets, CSS classes
- `MotionEvent` — resolved instance with descriptor, payload, timestamp
- `MotionInstanceState` — tracks active events for dedup/eviction
- Typed payloads for every event kind

**Engine** (`game-engine`)
- `getMotionDescriptor(kind)` — raw descriptor from registry
- `getAllMotionKinds()` — all registered event kinds
- `resolveMotionEvent(kind, payload, policy, id?)` — resolves with policy (normal → full, reduced → flash fallback, none → no animations)
- `canAddMotionEvent(state, kind)` — check + eviction target
- `pushMotionEvent(state, event)` — add with auto-eviction (stack removes oldest, replace removes all of kind)
- `pruneExpiredMotionEvents(state, nowMs)` — remove expired based on autoDismissMs
- `createMotionState(policy?)` — fresh factory
- `getMotionCssClass(kind)` / `getMotionLabel(kind)` — metadata

## Design Decisions

- **Registry-driven**: every MotionEventKind maps to exactly one MotionEventDescriptor with animations, reduced-motion fallback, and stacking rules. No per-component config needed.
- **Reduced-motion = flash mode**: reduced-motion events degrade to a single opacity flash (no translate/scale). `mode: 'none'` disables even that.
- **Stacking semantics**: `'stack'` keeps max N, evicting oldest; `'replace'` replaces all of that kind; `'none'` means unlimited.
- **Pruning is explicit**: `pruneExpiredMotionEvents` must be called by the host — the engine never runs timers.
- **No continuous motion**: all animations have finite duration with explicit autoDismissMs. No loops.
- **CSS classes**: each event kind has a class (`motion-xp-gain`, `motion-level-up`, etc.) so UI can apply custom styling.
- **Reduced-motion overrides**: policy can override any individual event kind's reduced-motion behavior via `policy.overrides`.
