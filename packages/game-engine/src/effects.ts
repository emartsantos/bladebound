import type {
  ActiveEffect,
  EffectApplicationContext,
  EffectApplicationResult,
  EffectCategory,
  EffectDefinition,
  EffectEvent,
  EffectPreset,
  EffectResistanceProfile,
  EffectStatModifiers,
  EffectTickResult,
  EffectType,
} from '@premium-rpg/shared-types';
import type { StatBlock } from '@premium-rpg/shared-types';
import {
  EFFECT_DEFINITION_BY_ID,
  EFFECT_PRESET_BY_ID,
} from '@premium-rpg/game-data';

// ─── EFFECTS ENGINE ──────────────────────────────────────────────────
// Generic, extensible effect processing. No hardcoded per-effect logic.

// ─── APPLICATION ─────────────────────────────────────────────────────

/**
 * Attempts to apply an effect to a target, respecting stacking rules,
 * resistances, immunities, and application chance.
 */
export function applyEffect(
  targetEffects: ActiveEffect[],
  effectType: EffectType,
  context: EffectApplicationContext,
  resistanceProfile: EffectResistanceProfile = { resistances: {}, immunities: [], categoryResistances: {} }
): EffectApplicationResult {
  const definition = EFFECT_DEFINITION_BY_ID[effectType];
  if (!definition) return { ok: false, reason: 'invalid' };

  // Immunity check
  if (resistanceProfile.immunities.includes(effectType)) {
    return { ok: false, reason: 'immune' };
  }

  // Category immunity
  if (resistanceProfile.categoryResistances[definition.category] === 1) {
    return { ok: false, reason: 'immune' };
  }

  // Resistance reduces chance
  const effectResistance = resistanceProfile.resistances[effectType] ?? 0;
  const categoryResistance = resistanceProfile.categoryResistances[definition.category] ?? 0;
  const totalResistance = Math.max(effectResistance, categoryResistance);
  const effectiveChance = context.chance * (1 - totalResistance);

  // Roll for application
  if (Math.random() > effectiveChance) {
    return { ok: false, reason: 'chance_failed' };
  }

  // Check existing effect
  const existingIndex = targetEffects.findIndex((e) => e.id === effectType);
  const now = context.round;

  // Calculate modified intensity/duration
  const intensity = context.baseIntensity * (1 - totalResistance * 0.5);
  const duration = Math.max(1, Math.floor(context.baseDuration * (1 - totalResistance * 0.3)));

  if (existingIndex >= 0) {
    const existing = targetEffects[existingIndex];
    const newStacks = Math.min(
      existing.stacks + 1,
      definition.maxStacks ?? 1
    );

    // Max stacks reached
    if (newStacks <= existing.stacks && definition.stacking !== 'refresh') {
      return { ok: false, reason: 'max_stacks' };
    }

    let newIntensity = existing.intensity;
    let newDuration = existing.duration;

    switch (definition.stacking) {
      case 'replace':
        newIntensity = intensity;
        newDuration = duration;
        break;
      case 'refresh':
        newDuration = Math.max(existing.duration, duration);
        newIntensity = Math.max(existing.intensity, intensity);
        break;
      case 'stack_add':
        newIntensity += intensity;
        newDuration = Math.max(existing.duration, duration);
        break;
      case 'stack_multiply':
        newIntensity *= 1 + intensity * 0.01; // intensity as percent
        newDuration = Math.max(existing.duration, duration);
        break;
      case 'unique':
        return { ok: false, reason: 'max_stacks' };
    }

    // Cap stacks
    const finalStacks = Math.min(newStacks, definition.maxStacks ?? 1);

    const updated: ActiveEffect = {
      ...existing,
      stacks: finalStacks,
      duration: newDuration,
      intensity: newIntensity,
      tickCounter: definition.tickInterval ?? 1,
    };
    targetEffects[existingIndex] = updated;

    return {
      ok: true,
      effect: updated,
      wasNew: false,
    };
  }

  // New effect
  const newEffect: ActiveEffect = {
    id: effectType,
    definition,
    stacks: 1,
    duration,
    tickCounter: definition.tickInterval ?? 1,
    intensity,
    source: context.source,
    sourceId: context.sourceId,
    appliedAt: now,
    absorptionRemaining: definition.category === 'shield' ? intensity : undefined,
  };

  targetEffects.push(newEffect);

  return {
    ok: true,
    effect: newEffect,
    wasNew: true,
  };
}

/**
 * Applies an effect from a preset (ability/item data-driven).
 */
export function applyEffectFromPreset(
  targetEffects: ActiveEffect[],
  effectType: EffectType,
  context: Partial<EffectApplicationContext> & { source: EffectApplicationContext['source']; sourceId: string; round: number },
  resistanceProfile?: EffectResistanceProfile
): EffectApplicationResult {
  const preset = EFFECT_PRESET_BY_ID[effectType];
  if (!preset) return { ok: false, reason: 'invalid' };

  return applyEffect(targetEffects, effectType, {
    source: context.source,
    sourceId: context.sourceId,
    baseIntensity: context.baseIntensity ?? preset.baseIntensity,
    baseDuration: context.baseDuration ?? preset.baseDuration,
    chance: context.chance ?? preset.chance,
    round: context.round,
    targetResistances: context.targetResistances,
    targetImmunities: context.targetImmunities,
  }, resistanceProfile);
}

// ─── TICK PROCESSING ─────────────────────────────────────────────────

/**
 * Processes all active effects for one round tick.
 * Returns tick results and mutates the effects array (removing expired).
 */
export function tickEffects(targetEffects: ActiveEffect[], targetStats: StatBlock): EffectTickResult {
  const result: EffectTickResult = {
    damageDealt: 0,
    healingDealt: 0,
    absorptionUsed: 0,
    log: [],
    expired: [],
    stacksChanged: [],
  };

  const stillActive: ActiveEffect[] = [];

  for (const effect of targetEffects) {
    // Decrement duration
    effect.duration -= 1;

    // Handle tick-based effects (DoT, HoT)
    if (effect.definition.tickInterval && effect.definition.tickInterval > 0) {
      effect.tickCounter -= 1;
      if (effect.tickCounter <= 0) {
        effect.tickCounter = effect.definition.tickInterval;
        processEffectTick(effect, targetStats, result);
      }
    }

    // Shield absorption doesn't tick — it absorbs on hit
    if (effect.definition.category === 'shield') {
      // Shield persists until absorption depleted or duration expires
    }

    // Check expiry
    if (effect.duration <= 0) {
      result.expired.push(effect.id);
      result.log.push(`${effect.definition.name} wears off.`);
    } else {
      stillActive.push(effect);
    }
  }

  // Remove expired
  targetEffects.length = 0;
  targetEffects.push(...stillActive);

  return result;
}

/**
 * Processes a single effect tick (DoT/HoT).
 */
function processEffectTick(effect: ActiveEffect, targetStats: StatBlock, result: EffectTickResult): void {
  const def = effect.definition;
  const intensity = effect.intensity;

  switch (def.category) {
    case 'damage_over_time': {
      // Damage ignores armor (true damage) unless specified
      const damage = Math.max(1, Math.floor(intensity * effect.stacks));
      result.damageDealt += damage;
      result.log.push(`${def.name} deals ${damage} damage.`);
      break;
    }
    case 'healing_over_time': {
      const heal = Math.max(1, Math.floor(intensity * effect.stacks));
      const actualHeal = Math.min(heal, targetStats.maxHealth - (targetStats.maxHealth - targetStats.maxHealth + 0)); // simplified
      result.healingDealt += heal;
      result.log.push(`${def.name} heals ${heal} HP.`);
      break;
    }
    case 'utility': {
      // resource_regen / resource_drain handled by caller
      break;
    }
  }
}

// ─── STAT MODIFIERS ──────────────────────────────────────────────────

/**
 * Computes combined stat modifiers from all active effects.
 * Used by combat engine before damage/hit calculations.
 */
export function computeEffectStatModifiers(effects: ActiveEffect[]): EffectStatModifiers {
  const modifiers: EffectStatModifiers = {
    flat: {},
    percent: {},
    preventsAction: false,
    preventsAttack: false,
    preventsMovement: false,
    preventsAbilities: false,
    absorption: 0,
    dotPerTick: 0,
    hotPerTick: 0,
  };

  for (const effect of effects) {
    const def = effect.definition;
    const intensity = effect.intensity * effect.stacks;

    switch (effect.id) {
      // Buffs
      case 'accuracy_buff':
        addFlat(modifiers.flat, 'accuracy', intensity);
        break;
      case 'evasion_buff':
        addFlat(modifiers.flat, 'evasion', intensity);
        break;
      case 'critical_buff':
        addFlat(modifiers.flat, 'critChance', intensity * 2); // buff adds 2% per intensity
        break;
      case 'damage_buff':
        addPercent(modifiers.percent, 'damage', intensity * 0.01); // 1 intensity = 1%
        break;
      case 'defense_buff':
        addFlat(modifiers.flat, 'armor', intensity);
        addFlat(modifiers.flat, 'defense', intensity * 0.5);
        break;
      case 'speed_buff':
        addPercent(modifiers.percent, 'attackSpeed', intensity); // intensity as multiplier

      // Debuffs
      case 'slow':
        addPercent(modifiers.percent, 'attackSpeed', -intensity); // negative = reduction
        modifiers.preventsMovement = true; // partial
        break;
      case 'armor_reduction':
        // Handled in damage calculation directly (see combat.ts)
        break;
      case 'accuracy_reduction':
        addFlat(modifiers.flat, 'accuracy', -intensity);
        break;
      case 'evasion_reduction':
        addFlat(modifiers.flat, 'evasion', -intensity);
        break;

      // Control
      case 'stun':
        modifiers.preventsAction = true;
        modifiers.preventsAttack = true;
        modifiers.preventsAbilities = true;
        break;
      case 'root':
        modifiers.preventsMovement = true;
        break;
      case 'silence':
        modifiers.preventsAbilities = true;
        break;

      // Defensive
      case 'shield':
        modifiers.absorption += effect.absorptionRemaining ?? 0;
        break;
      case 'barrier':
        // Magic-only absorption — handled in damage calc with tag check
        break;

      // DoT/HoT per-tick values
      case 'bleed':
      case 'burn':
      case 'poison':
        modifiers.dotPerTick += intensity * effect.stacks;
        break;
      case 'regeneration':
        modifiers.hotPerTick += intensity * effect.stacks;
        break;
    }
  }

  return modifiers;
}

function addFlat(obj: Partial<StatBlock>, key: keyof StatBlock, value: number): void {
  obj[key] = (obj[key] ?? 0) + value;
}

function addPercent(obj: Partial<Record<keyof StatBlock, number>>, key: keyof StatBlock, value: number): void {
  obj[key] = (obj[key] ?? 0) + value;
}

// ─── SHIELD ABSORPTION ───────────────────────────────────────────────

/**
 * Applies shield absorption to incoming damage.
 * Returns { damageAfterShield, absorptionUsed, shieldBroken }.
 */
export function applyShieldAbsorption(
  effects: ActiveEffect[],
  incomingDamage: number,
  damageTags: string[] = []
): { damageAfterShield: number; absorptionUsed: number; shieldBroken: boolean; log: string[] } {
  const log: string[] = [];
  let remainingDamage = incomingDamage;
  let totalAbsorptionUsed = 0;
  let anyShieldBroken = false;

  // Process shields in order: barrier (magic only) first, then generic shield
  const shields = effects.filter((e) =>
    e.definition.category === 'shield' && e.absorptionRemaining !== undefined && e.absorptionRemaining > 0
  );

  for (const shield of shields) {
    const def = shield.definition;
    const isMagicDamage = damageTags.includes('magic') || damageTags.includes('spell');

    // Barrier only absorbs magic
    if (def.id === 'barrier' && !isMagicDamage) continue;

    const absorption = shield.absorptionRemaining!;
    const used = Math.min(absorption, remainingDamage);
    remainingDamage -= used;
    shield.absorptionRemaining = absorption - used;
    totalAbsorptionUsed += used;

    if (used > 0) {
      log.push(`${def.name} absorbs ${used} damage.`);
    }

    if (shield.absorptionRemaining === 0) {
      log.push(`${def.name} shatters!`);
      anyShieldBroken = true;
    }

    if (remainingDamage <= 0) break;
  }

  return {
    damageAfterShield: Math.max(0, remainingDamage),
    absorptionUsed: totalAbsorptionUsed,
    shieldBroken: anyShieldBroken,
    log,
  };
}

// ─── CLEANSING ───────────────────────────────────────────────────────

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
  maxCount?: number;
}

/**
 * Removes effects matching the cleanse criteria.
 * Returns removed effects and log entries.
 */
export function cleanseEffects(
  targetEffects: ActiveEffect[],
  options: CleanseOptions
): { removed: ActiveEffect[]; log: string[] } {
  const removed: ActiveEffect[] = [];
  const log: string[] = [];
  const kept: ActiveEffect[] = [];
  let count = 0;

  for (const effect of targetEffects) {
    const def = effect.definition;
    let shouldRemove = false;

    if (count >= (options.maxCount ?? Infinity)) {
      kept.push(effect);
      continue;
    }

    switch (options.type) {
      case 'all':
        shouldRemove = true;
        break;
      case 'debuffs_only':
        shouldRemove = def.category === 'debuff' || def.category === 'damage_over_time' || def.category === 'stun';
        break;
      case 'buffs_only':
        shouldRemove = def.category === 'buff' || def.category === 'healing_over_time' || def.category === 'shield';
        break;
      case 'by_category':
        shouldRemove = def.category === options.category;
        break;
      case 'by_tag':
        shouldRemove = def.tags.includes(options.tag ?? '');
        break;
      case 'by_type':
        shouldRemove = effect.id === options.effectType;
        break;
    }

    if (shouldRemove) {
      removed.push(effect);
      log.push(`${def.name} is cleansed.`);
      count++;
    } else {
      kept.push(effect);
    }
  }

  targetEffects.length = 0;
  targetEffects.push(...kept);

  return { removed, log };
}

// ─── UTILITY ─────────────────────────────────────────────────────────

/** Gets an active effect by type, or undefined. */
export function getEffect(effects: ActiveEffect[], effectType: EffectType): ActiveEffect | undefined {
  return effects.find((e) => e.id === effectType);
}

/** Gets all effects of a category. */
export function getEffectsByCategory(effects: ActiveEffect[], category: EffectCategory): ActiveEffect[] {
  return effects.filter((e) => e.definition.category === category);
}

/** Checks if target has a specific effect. */
export function hasEffect(effects: ActiveEffect[], effectType: EffectType): boolean {
  return effects.some((e) => e.id === effectType);
}

/** Gets total stacks of an effect. */
export function getEffectStacks(effects: ActiveEffect[], effectType: EffectType): number {
  const effect = effects.find((e) => e.id === effectType);
  return effect?.stacks ?? 0;
}

/** Gets remaining duration of an effect. */
export function getEffectDuration(effects: ActiveEffect[], effectType: EffectType): number {
  const effect = effects.find((e) => e.id === effectType);
  return effect?.duration ?? 0;
}

/** Removes a specific effect entirely. */
export function removeEffect(effects: ActiveEffect[], effectType: EffectType): boolean {
  const idx = effects.findIndex((e) => e.id === effectType);
  if (idx >= 0) {
    effects.splice(idx, 1);
    return true;
  }
  return false;
}

/** Extends duration of an effect. */
export function extendEffect(effects: ActiveEffect[], effectType: EffectType, rounds: number): boolean {
  const effect = effects.find((e) => e.id === effectType);
  if (effect) {
    effect.duration += rounds;
    return true;
  }
  return false;
}

/** Sets effect intensity directly (for snapshot/save). */
export function setEffectIntensity(effects: ActiveEffect[], effectType: EffectType, intensity: number): boolean {
  const effect = effects.find((e) => e.id === effectType);
  if (effect) {
    effect.intensity = intensity;
    return true;
  }
  return false;
}

// ─── RE-EXPORTS FOR COMBAT ENGINE ────────────────────────────────────
export type {
  ActiveEffect,
  EffectApplicationContext,
  EffectApplicationResult,
  EffectCategory,
  EffectDefinition,
  EffectEvent,
  EffectPreset,
  EffectResistanceProfile,
  EffectStatModifiers,
  EffectTickResult,
  EffectType,
} from '@premium-rpg/shared-types';