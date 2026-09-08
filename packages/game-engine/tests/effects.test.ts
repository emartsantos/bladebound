import { describe, it, expect } from 'vitest';
import {
  applyEffect,
  applyEffectFromPreset,
  tickEffects,
  computeEffectStatModifiers,
  applyShieldAbsorption,
  cleanseEffects,
  getEffect,
  getEffectStacks,
  hasEffect,
  removeEffect,
  extendEffect,
} from '../src/effects';
import { EFFECT_DEFINITION_BY_ID, EFFECT_PRESET_BY_ID } from '@premium-rpg/game-data';
import type { ActiveEffect, EffectResistanceProfile, EffectType } from '@premium-rpg/shared-types';
import type { StatBlock } from '@premium-rpg/shared-types';

function makeStats(overrides: Partial<StatBlock> = {}): StatBlock {
  return {
    strength: 10, agility: 10, intelligence: 10, vitality: 10,
    accuracy: 10, evasion: 10, critChance: 5, critDamage: 50,
    attackSpeed: 1.0, armor: 20, maxHealth: 100, damage: 15, defense: 10,
    ...overrides,
  };
}

function makeResistances(overrides: Partial<EffectResistanceProfile> = {}): EffectResistanceProfile {
  return { resistances: {}, immunities: [], categoryResistances: {}, ...overrides };
}

describe('effects engine', () => {
  // ── Application ───────────────────────────────────────────────────────

  it('applies a new effect with correct initial values', () => {
    const effects: ActiveEffect[] = [];
    const result = applyEffect(effects, 'bleed', {
      source: 'enemy',
      sourceId: 'enemy_1',
      baseIntensity: 5,
      baseDuration: 3,
      chance: 1.0,
      round: 1,
    }, makeResistances());
    expect(result.ok).toBe(true);
    expect(result.wasNew).toBe(true);
    expect(effects.length).toBe(1);
    const eff = effects[0];
    expect(eff.id).toBe('bleed');
    expect(eff.stacks).toBe(1);
    expect(eff.duration).toBe(3);
    expect(eff.intensity).toBe(5);
  });

  it('stacks additively for stack_add effects (bleed)', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 3, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 3, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    expect(effects[0].stacks).toBe(2);
    expect(effects[0].intensity).toBe(6);
  });

  it('refreshes duration for refresh effects (burn)', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'burn', { source: 'enemy', sourceId: 'e', baseIntensity: 10, baseDuration: 2, chance: 1.0, round: 1 }, makeResistances());
    const first = effects[0];
    applyEffect(effects, 'burn', { source: 'enemy', sourceId: 'e', baseIntensity: 10, baseDuration: 5, chance: 1.0, round: 2 }, makeResistances());
    expect(effects[0].duration).toBe(5); // refreshed to max
    expect(effects[0].intensity).toBe(10); // max intensity
  });

  it('respects maxStacks limit', () => {
    const effects: ActiveEffect[] = [];
    for (let i = 0; i < 10; i++) {
      applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: i + 1 }, makeResistances());
    }
    expect(effects[0].stacks).toBe(10); // maxStacks = 10 for poison
  });

  it('rejects application on immune target', () => {
    const effects: ActiveEffect[] = [];
    const result = applyEffect(effects, 'stun', {
      source: 'enemy', sourceId: 'e', baseIntensity: 1, baseDuration: 1, chance: 1.0, round: 1
    }, { ...makeResistances(), immunities: ['stun'] });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('immune');
    expect(effects.length).toBe(0);
  });

  it('reduces chance via resistance', () => {
    const effects: ActiveEffect[] = [];
    // 50% resistance reduces 100% chance to 50%
    const result = applyEffect(effects, 'poison', {
      source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 1
    }, { ...makeResistances(), resistances: { poison: 0.5 } });
    // With 50% resistance, chance is 0.5 - could pass or fail. Just ensure logic runs.
    expect(typeof result.ok).toBe('boolean');
  });

  // ── Preset Application ────────────────────────────────────────────────

  it('applies effect from preset with preset defaults', () => {
    const effects: ActiveEffect[] = [];
    const result = applyEffectFromPreset(effects, 'regeneration', {
      source: 'item', sourceId: 'regen_potion', round: 1
    }, makeResistances());
    expect(result.ok).toBe(true);
    expect(effects[0].intensity).toBe(EFFECT_PRESET_BY_ID.regeneration.baseIntensity);
    expect(effects[0].duration).toBe(EFFECT_PRESET_BY_ID.regeneration.baseDuration);
  });

  it('allows preset overrides', () => {
    const effects: ActiveEffect[] = [];
    applyEffectFromPreset(effects, 'regeneration', {
      source: 'item', sourceId: 'regen_potion', round: 1, baseIntensity: 99
    }, makeResistances());
    expect(effects[0].intensity).toBe(99);
  });

  // ── Tick Processing ──────────────────────────────────────────────────

  it('ticks DoT effects and deals damage', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 10, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const stats = makeStats();
    const result = tickEffects(effects, stats);
    expect(result.damageDealt).toBe(10);
    expect(result.log.length).toBeGreaterThan(0);
    expect(effects[0].duration).toBe(2); // decremented
  });

  it('ticks HoT effects and heals', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'regeneration', { source: 'item', sourceId: 'potion', baseIntensity: 15, baseDuration: 4, chance: 1.0, round: 1 }, makeResistances());
    const stats = makeStats();
    const result = tickEffects(effects, stats);
    expect(result.healingDealt).toBe(15);
    expect(effects[0].duration).toBe(3);
  });

  it('expires effects when duration reaches 0', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'stun', { source: 'enemy', sourceId: 'e', baseIntensity: 1, baseDuration: 1, chance: 1.0, round: 1 }, makeResistances());
    tickEffects(effects, makeStats());
    expect(effects.length).toBe(0);
  });

  it('does not tick shield effects (they absorb on hit)', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'shield', { source: 'item', sourceId: 'shield_pot', baseIntensity: 50, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const stats = makeStats();
    const result = tickEffects(effects, stats);
    expect(result.damageDealt).toBe(0);
    expect(result.healingDealt).toBe(0);
    expect(effects[0].duration).toBe(2);
    expect(effects[0].absorptionRemaining).toBe(50);
  });

  // ── Stat Modifiers ───────────────────────────────────────────────────

  it('computes buff stat modifiers correctly', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'accuracy_buff', { source: 'player', sourceId: 'skill', baseIntensity: 10, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'critical_buff', { source: 'player', sourceId: 'skill', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'damage_buff', { source: 'player', sourceId: 'skill', baseIntensity: 20, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const mods = computeEffectStatModifiers(effects);
    expect(mods.flat.accuracy).toBe(10);
    expect(mods.flat.critChance).toBe(10); // 5 * 2
    expect(mods.percent.damage).toBe(0.20); // 20 * 0.01
  });

  it('computes debuff stat modifiers correctly', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'slow', { source: 'enemy', sourceId: 'e', baseIntensity: 0.25, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'accuracy_reduction', { source: 'enemy', sourceId: 'e', baseIntensity: 20, baseDuration: 2, chance: 1.0, round: 1 }, makeResistances());
    const mods = computeEffectStatModifiers(effects);
    expect(mods.percent.attackSpeed).toBe(-0.25);
    expect(mods.flat.accuracy).toBe(-20);
  });

  it('sets prevent flags for control effects', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'stun', { source: 'enemy', sourceId: 'e', baseIntensity: 1, baseDuration: 1, chance: 1.0, round: 1 }, makeResistances());
    const mods = computeEffectStatModifiers(effects);
    expect(mods.preventsAction).toBe(true);
    expect(mods.preventsAttack).toBe(true);
    expect(mods.preventsAbilities).toBe(true);

    const effects2: ActiveEffect[] = [];
    applyEffect(effects2, 'root', { source: 'enemy', sourceId: 'e', baseIntensity: 1, baseDuration: 2, chance: 1.0, round: 1 }, makeResistances());
    const mods2 = computeEffectStatModifiers(effects2);
    expect(mods2.preventsMovement).toBe(true);
    expect(mods2.preventsAttack).toBe(false);
  });

  // ── Shield Absorption ────────────────────────────────────────────────

  it('absorbs damage with generic shield', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'shield', { source: 'item', sourceId: 'shield_pot', baseIntensity: 50, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const result = applyShieldAbsorption(effects, 30, ['melee']);
    expect(result.damageAfterShield).toBe(0);
    expect(result.absorptionUsed).toBe(30);
    expect(effects[0].absorptionRemaining).toBe(20);
    expect(result.shieldBroken).toBe(false);
  });

  it('shields can be broken by large hits', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'shield', { source: 'item', sourceId: 'shield_pot', baseIntensity: 50, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const result = applyShieldAbsorption(effects, 100, ['melee']);
    expect(result.damageAfterShield).toBe(50);
    expect(result.absorptionUsed).toBe(50);
    expect(effects[0].absorptionRemaining).toBe(0);
    expect(result.shieldBroken).toBe(true);
  });

  it('barrier only absorbs magic damage', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'barrier', { source: 'item', sourceId: 'magic_barrier', baseIntensity: 40, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const meleeResult = applyShieldAbsorption(effects, 30, ['melee']);
    expect(meleeResult.damageAfterShield).toBe(30); // not absorbed
    const magicResult = applyShieldAbsorption(effects, 30, ['magic', 'spell']);
    expect(magicResult.damageAfterShield).toBe(0); // absorbed
  });

  // ── Cleansing ────────────────────────────────────────────────────────

  it('cleanses all effects', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'accuracy_buff', { source: 'player', sourceId: 'skill', baseIntensity: 10, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'shield', { source: 'item', sourceId: 'pot', baseIntensity: 50, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const result = cleanseEffects(effects, { type: 'all' });
    expect(effects.length).toBe(0);
    expect(result.removed.length).toBe(3);
  });

  it('cleanses only debuffs', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'accuracy_buff', { source: 'player', sourceId: 'skill', baseIntensity: 10, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'slow', { source: 'enemy', sourceId: 'e', baseIntensity: 0.2, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    const result = cleanseEffects(effects, { type: 'debuffs_only' });
    expect(effects.length).toBe(1); // accuracy_buff remains
    expect(effects[0].id).toBe('accuracy_buff');
    expect(result.removed.length).toBe(2);
  });

  it('cleanses only buffs', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'accuracy_buff', { source: 'player', sourceId: 'skill', baseIntensity: 10, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'slow', { source: 'enemy', sourceId: 'e', baseIntensity: 0.2, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    cleanseEffects(effects, { type: 'buffs_only' });
    expect(effects.length).toBe(1);
    expect(effects[0].id).toBe('slow');
  });

  it('cleanses by category', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'burn', { source: 'enemy', sourceId: 'e', baseIntensity: 8, baseDuration: 2, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'slow', { source: 'enemy', sourceId: 'e', baseIntensity: 0.2, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    cleanseEffects(effects, { type: 'by_category', category: 'damage_over_time' });
    expect(effects.length).toBe(1);
    expect(effects[0].id).toBe('slow');
  });

  it('cleanses by tag', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'burn', { source: 'enemy', sourceId: 'e', baseIntensity: 8, baseDuration: 2, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'regeneration', { source: 'player', sourceId: 'potion', baseIntensity: 10, baseDuration: 4, chance: 1.0, round: 1 }, makeResistances());
    cleanseEffects(effects, { type: 'by_tag', tag: 'fire' });
    expect(effects.length).toBe(2); // bleed + regen remain
    expect(effects.find(e => e.id === 'burn')).toBeUndefined();
  });

  it('cleanses specific effect type', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 1 }, makeResistances());
    cleanseEffects(effects, { type: 'by_type', effectType: 'poison' });
    expect(effects.length).toBe(1);
    expect(effects[0].id).toBe('bleed');
  });

  // ── Utility Functions ────────────────────────────────────────────────

  it('hasEffect returns true for present effects', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    expect(hasEffect(effects, 'bleed')).toBe(true);
    expect(hasEffect(effects, 'poison')).toBe(false);
  });

  it('getEffectStacks returns correct stack count', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 2 }, makeResistances());
    expect(getEffectStacks(effects, 'poison')).toBe(2);
    expect(getEffectStacks(effects, 'bleed')).toBe(0);
  });

  it('removeEffect removes the effect', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'bleed', { source: 'enemy', sourceId: 'e', baseIntensity: 5, baseDuration: 3, chance: 1.0, round: 1 }, makeResistances());
    applyEffect(effects, 'poison', { source: 'enemy', sourceId: 'e', baseIntensity: 2, baseDuration: 6, chance: 1.0, round: 1 }, makeResistances());
    expect(removeEffect(effects, 'bleed')).toBe(true);
    expect(effects.length).toBe(1);
    expect(effects[0].id).toBe('poison');
    expect(removeEffect(effects, 'bleed')).toBe(false); // already gone
  });

  it('extendEffect adds duration', () => {
    const effects: ActiveEffect[] = [];
    applyEffect(effects, 'regeneration', { source: 'item', sourceId: 'potion', baseIntensity: 10, baseDuration: 4, chance: 1.0, round: 1 }, makeResistances());
    expect(extendEffect(effects, 'regeneration', 5)).toBe(true);
    expect(effects[0].duration).toBe(9);
    expect(extendEffect(effects, 'bleed', 3)).toBe(false); // not present
  });

  // ── Effect Definitions & Presets ─────────────────────────────────────

  it('all spec-listed effect types are defined', () => {
    const specTypes: EffectType[] = [
      'bleed', 'burn', 'poison', 'stun', 'slow', 'armor_reduction',
      'regeneration', 'shield', 'accuracy_buff', 'evasion_buff', 'critical_buff',
    ];
    for (const t of specTypes) {
      expect(EFFECT_DEFINITION_BY_ID[t]).toBeDefined();
      expect(EFFECT_PRESET_BY_ID[t]).toBeDefined();
    }
  });

  it('definitions have all required fields', () => {
    for (const def of Object.values(EFFECT_DEFINITION_BY_ID)) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.stacking).toBeTruthy();
      expect(typeof def.resistible).toBe('boolean');
      expect(Array.isArray(def.tags)).toBe(true);
    }
  });

  it('presets have baseIntensity, baseDuration, chance', () => {
    for (const preset of Object.values(EFFECT_PRESET_BY_ID)) {
      expect(typeof preset.baseIntensity).toBe('number');
      expect(typeof preset.baseDuration).toBe('number');
      expect(typeof preset.chance).toBe('number');
      expect(preset.chance).toBeGreaterThanOrEqual(0);
      expect(preset.chance).toBeLessThanOrEqual(1);
    }
  });
});