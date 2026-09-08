// ─── MOTION AND GAME FEEDBACK ───────────────────────────────────────
// Phase 25: define what animations exist, when they trigger, and how
// they degrade for reduced-motion users.
//
// This is NOT the animation engine (CSS keyframes, RAF) — it is the
// motion event contract that the UI renders. Every animation is a data
// descriptor, keeping the system pure, testable, and framework-agnostic.

// ─── EVENT TAXONOMY ─────────────────────────────────────────────────
// Maps 1:1 to the spec's animation trigger list.

export type MotionEventKind =
  | 'xp_gain'                // floating XP number
  | 'level_up'               // level-up banner
  | 'loot_acquisition'       // item icon pop-in
  | 'equipment_change'       // gear swap flash
  | 'damage_number'          // floating damage
  | 'healing_number'         // floating heal
  | 'boss_appearance'        // screen-wide entrance
  | 'rare_drop'              // golden particle burst
  | 'achievement_unlock'     // trophy card slide-in
  | 'navigation_transition'; // section fade/slide

// ─── ANIMATABLE PROPERTIES ──────────────────────────────────────────
// A constrained union so renderers know exactly what they might receive.

export type AnimatableProperty =
  | 'opacity'
  | 'scale'
  | 'translateY'
  | 'translateX'
  | 'rotate'
  | 'blur'
  | 'brightness'
  | 'color'
  | 'backgroundColor'
  | 'boxShadow';

// ─── MOTION TARGETS ─────────────────────────────────────────────────
// Which element receives the animation.

export type MotionTarget =
  | 'self'                 // the element that triggered the event
  | 'notification'         // toast/notification container
  | 'xp_bar'               // XP progress bar
  | 'health_bar'           // health bar
  | 'character_portrait'   // player avatar
  | 'enemy_portrait'       // enemy avatar
  | 'inventory_slot'       // a single inventory cell
  | 'context_panel'        // the right sidebar
  | 'full_screen_overlay'  // a full-screen flash/modal
  | 'floating_text';       // a floating number element

// ─── SINGLE ANIMATION STEP ──────────────────────────────────────────

export interface AnimationStep {
  property: AnimatableProperty;
  from?: number | string;
  to?: number | string;
  durationMs: number;
  easing: string; // CSS easing function
  delayMs?: number;
}

// ─── REDUCED-MOTION FALLBACK ────────────────────────────────────────
// What to do when prefers-reduced-motion: reduce is active.

export type ReducedMotionMode = 'instant' | 'flash' | 'none';

export interface ReducedMotionFallback {
  mode: ReducedMotionMode;
  /** Duration of the flash (ms) when mode === 'flash'. */
  flashDurationMs?: number;
  /** The flash uses opacity only when true. */
  opacityOnly?: boolean;
}

// ─── MOTION POLICY (user preference) ────────────────────────────────

export type MotionPolicyKind = 'normal' | 'reduced' | 'none';

export interface MotionPolicy {
  kind: MotionPolicyKind;
  /** Override per-event-kind reduced-motion behavior. */
  overrides?: Partial<Record<MotionEventKind, ReducedMotionFallback>>;
}

// ─── MOTION EVENT DESCRIPTOR (the definition) ───────────────────────
// One per event kind — the full animation spec.

export interface MotionEventDescriptor {
  kind: MotionEventKind;
  /** Short label for developer tools / debugging. */
  label: string;
  /** CSS class hint for renderers that use class-based animation. */
  cssClass?: string;
  /** Target element. */
  target: MotionTarget;
  /** The animation steps to apply. */
  animations: AnimationStep[];
  /** What to do under reduced-motion. */
  reducedMotion: ReducedMotionFallback;
  /** Whether this event stacks (e.g. rapid XP gains). */
  stacking: 'none' | 'stack' | 'replace';
  /** Maximum concurrent instances (0 = unlimited). */
  maxInstances: number;
  /** Auto-dismiss after this many ms (0 = stays until removed). */
  autoDismissMs: number;
}

// ─── MOTION EVENT INSTANCE (a triggered occurrence) ─────────────────
// Created when a game event fires. Contains the event descriptor +
// contextual data the renderer needs.

export interface MotionEvent {
  /** Unique instance id for dedup / removal. */
  id: string;
  /** The event kind. */
  kind: MotionEventKind;
  /** Timestamp when this event was triggered. */
  triggeredAt: number;
  /** Contextual payload — varies by event kind. */
  payload: MotionEventPayload;
  /** The resolved descriptor (after reduced-motion policy applied). */
  descriptor: MotionEventDescriptor;
  /** Whether reduced-motion was applied. */
  reducedMotionApplied: boolean;
}

// ─── PAYLOADS (per-event-kind data) ─────────────────────────────────

export interface XpGainPayload {
  amount: number;
  skill: string;
  /** Where to show the floating number (relative to target). */
  offsetX?: number;
  offsetY?: number;
}

export interface LevelUpPayload {
  fromLevel: number;
  toLevel: number;
  skill: string;
}

export interface LootPayload {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface EquipmentChangePayload {
  slot: string;
  beforeItemId?: string;
  afterItemId?: string;
}

export interface DamagePayload {
  amount: number;
  isCritical: boolean;
  source: 'player' | 'enemy';
}

export interface HealingPayload {
  amount: number;
  source: 'player' | 'food' | 'effect';
}

export interface BossAppearancePayload {
  bossName: string;
  regionId: string;
}

export interface RareDropPayload {
  itemId: string;
  itemName: string;
}

export interface AchievementPayload {
  achievementId: string;
  name: string;
}

export interface NavigationPayload {
  fromSection: string;
  toSection: string;
}

export type MotionEventPayload =
  | XpGainPayload
  | LevelUpPayload
  | LootPayload
  | EquipmentChangePayload
  | DamagePayload
  | HealingPayload
  | BossAppearancePayload
  | RareDropPayload
  | AchievementPayload
  | NavigationPayload;

// ─── MOTION STATE (per-session tracking) ────────────────────────────

export interface MotionInstanceState {
  /** Active motion events currently being rendered. */
  active: MotionEvent[];
  /** Policy governing motion behavior. */
  policy: MotionPolicy;
  /** History of recent events (bounded). */
  recentKinds: MotionEventKind[];
}
