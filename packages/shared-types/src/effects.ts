// ─── EXTENSIBLE EFFECTS SYSTEM ───────────────────────────────────────
// A generic effect framework supporting all status effects, buffs, debuffs,
// and persistent modifiers. No hardcoded per-effect logic in combat UI.

import type { StatBlock } from './combat';

// ─── CORE EFFECT TYPES ────────────────────────────────────────────────

export type EffectCategory =
  | 'damage_over_time'     // bleed, burn, poison
  | 'healing_over_time'    // regeneration
  | 'buff'                 // accuracy, evasion, crit, speed, damage, defense
  | 'debuff'               // slow, armor_reduction, accuracy_reduction
  | 'stun'                 // prevents action
  | 'shield'               // absorbs damage
  | 'utility';             // other (resource, etc.)

export type EffectType =
  // DoT
  | 'bleed'
  | 'burn'
  | 'poison'
  // HoT
  | 'regeneration'
  // Buffs
  | 'accuracy_buff'
  | 'evasion_buff'
  | 'critical_buff'
  | 'damage_buff'
  | 'defense_buff'
  | 'speed_buff'
  // Debuffs
  | 'slow'
  | 'armor_reduction'
  | 'accuracy_reduction'
  | 'evasion_reduction'
  // Control
  | 'stun'
  | 'root'
  | 'silence'
  // Defensive
  | 'shield'
  | 'barrier'
  // Utility
  | 'resource_regen'
  | 'resource_drain';

export type EffectStackingRule =
  | 'replace'        // new application replaces existing (reset duration)
  | 'refresh'        // extends duration, keeps highest intensity
  | 'stack_add'      // additive stacking of intensity
  | 'stack_multiply' // multiplicative stacking (for % effects)
  | 'unique';        // only one instance allowed ever

export interface EffectDefinition {
  id: EffectType;
  name: string;
  description: string;
  category: EffectCategory;
  // How this effect stacks with itself
  stacking: EffectStackingRule;
  // Maximum stacks allowed (for stack_add/stack_multiply)
  maxStacks?: number;
  // Base tick interval in rounds (1 = every round)
  tickInterval?: number;
  // Whether the effect can be resisted/cleansed
  resistible: boolean;
  // Tags for conditional logic (e.g. 'fire', 'physical', 'magic')
  tags: string[];
  // Visual/UI hint
  icon?: string;
  color?: string;
}

// ─── ACTIVE EFFECT INSTANCE ──────────────────────────────────────────

// Runtime instance of an effect on a participant
export interface ActiveEffect {
  id: EffectType;
  definition: EffectDefinition; // snapshot of definition at application time
  stacks: number;
  duration: number;             // remaining rounds
  tickCounter: number;          // counts down to next tick
  intensity: number;            // current effective intensity (may vary by stacks)
  source: 'player' | 'enemy' | 'item' | 'food' | 'ability' | 'environment';
  sourceId: string;             // item id, ability id, etc.
  appliedAt: number;            // round number when applied
  // For shields/barriers: remaining absorption capacity
  absorptionRemaining?: number;
}

// ─── EFFECT APPLICATION CONTEXT ──────────────────────────────────────

export interface EffectApplicationContext {
  // Who is applying the effect
  source: ActiveEffect['source'];
  sourceId: string;
  // Base intensity before modifiers
  baseIntensity: number;
  // Base duration in rounds
  baseDuration: number;
  // Chance to apply (0-1)
  chance: number;
  // Round number
  round: number;
  // Optional: target's resistances/immunities
  targetResistances?: Partial<Record<EffectType, number>>; // 0-1 reduction
  targetImmunities?: EffectType[];
}

// ─── EFFECT APPLICATION RESULT ───────────────────────────────────────

export type EffectApplicationResult =
  | { ok: true; effect: ActiveEffect; wasNew: boolean }
  | { ok: false; reason: 'immune' | 'resisted' | 'chance_failed' | 'max_stacks' | 'invalid' };

// ─── EFFECT TICK RESULT ──────────────────────────────────────────────

export interface EffectTickResult {
  // Damage/healing applied this tick
  damageDealt: number;
  healingDealt: number;
  // Shield absorption
  absorptionUsed: number;
  // Log entries
  log: string[];
  // Effects that expired this tick
  expired: EffectType[];
  // Effects that had stacks change
  stacksChanged: { effectId: EffectType; oldStacks: number; newStacks: number }[];
}

// ─── STAT MODIFIERS FROM EFFECTS ─────────────────────────────────────

// How an effect modifies stats (applied before combat calculations)
export interface EffectStatModifiers {
  // Flat stat additions
  flat: Partial<StatBlock>;
  // Percentage multipliers (e.g., 1.15 = +15%)
  percent: Partial<Record<keyof StatBlock, number>>;
  // Special flags
  preventsAction: boolean;        // stun, root, silence
  preventsAttack: boolean;        // stun, disarm
  preventsMovement: boolean;      // root, slow (partial)
  preventsAbilities: boolean;     // silence
  // Shield/barrier absorption
  absorption: number;
  // Damage/healing per tick
  dotPerTick: number;
  hotPerTick: number;
}

// ─── EFFECT PROCESSING EVENTS ────────────────────────────────────────

export interface EffectEvent {
  type: 'applied' | 'refreshed' | 'stacked' | 'expired' | 'removed' | 'tick';
  effectId: EffectType;
  targetId: string;
  sourceId: string;
  round: number;
  details?: Record<string, unknown>;
}

// ─── EFFECT RESISTANCE/IMMUNITY ──────────────────────────────────────

export interface EffectResistanceProfile {
  // Per-effect resistance (0-1, reduces intensity/duration/chance)
  resistances: Partial<Record<EffectType, number>>;
  // Full immunity to effect types
  immunities: EffectType[];
  // Category-wide resistance
  categoryResistances: Partial<Record<EffectCategory, number>>;
}

// ─── EFFECT CLEANSING ────────────────────────────────────────────────

export type CleanseType =
  | 'all'
  | 'debuffs_only'
  | 'buffs_only'
  | 'by_category'
  | 'by_tag'
  | 'by_type';

export interface CleanseOptions {
  type: CleanseType;
  category?: EffectCategory;
  tag?: string;
  effectType?: EffectType;
  maxCount?: number; // limit number cleansed
}

// ─── EFFECT PRESETS (for data-driven definitions) ────────────────────

export interface EffectPreset {
  id: EffectType;
  baseIntensity: number;
  baseDuration: number;
  chance: number;
  // Optional overrides
  stacking?: EffectStackingRule;
  maxStacks?: number;
  tickInterval?: number;
  resistible?: boolean;
  tags?: string[];
}