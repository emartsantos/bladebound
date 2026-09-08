import type {
  EffectCategory,
  EffectDefinition,
  EffectPreset,
  EffectStackingRule,
  EffectType,
} from '@premium-rpg/shared-types';

// ─── EFFECT DEFINITIONS ──────────────────────────────────────────────
// Central registry of all status effects. Adding a new effect only requires
// an entry here — no combat code changes needed.

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // ─── DAMAGE OVER TIME ──────────────────────────────────────────────
  {
    id: 'bleed',
    name: 'Bleed',
    description: 'Physical damage over time. Stacks additively.',
    category: 'damage_over_time',
    stacking: 'stack_add',
    maxStacks: 5,
    tickInterval: 1,
    resistible: true,
    tags: ['physical', 'bleed', 'dot'],
    icon: '🩸',
    color: '#dc2626',
  },
  {
    id: 'burn',
    name: 'Burn',
    description: 'Fire damage over time. Higher intensity, fewer stacks.',
    category: 'damage_over_time',
    stacking: 'refresh',
    maxStacks: 3,
    tickInterval: 1,
    resistible: true,
    tags: ['fire', 'magic', 'dot'],
    icon: '🔥',
    color: '#ef4444',
  },
  {
    id: 'poison',
    name: 'Poison',
    description: 'Nature damage over time. Long duration, low intensity per tick.',
    category: 'damage_over_time',
    stacking: 'stack_add',
    maxStacks: 10,
    tickInterval: 1,
    resistible: true,
    tags: ['nature', 'poison', 'dot'],
    icon: '☠️',
    color: '#22c55e',
  },

  // ─── HEALING OVER TIME ─────────────────────────────────────────────
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Heals over time. Stacks refresh duration.',
    category: 'healing_over_time',
    stacking: 'refresh',
    maxStacks: 3,
    tickInterval: 1,
    resistible: false,
    tags: ['healing', 'hot', 'nature'],
    icon: '💚',
    color: '#16a34a',
  },

  // ─── BUFFS ─────────────────────────────────────────────────────────
  {
    id: 'accuracy_buff',
    name: 'Precision',
    description: 'Increases hit chance.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['buff', 'accuracy'],
    icon: '🎯',
    color: '#3b82f6',
  },
  {
    id: 'evasion_buff',
    name: 'Evasion',
    description: 'Increases evasion chance.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['buff', 'evasion'],
    icon: '💨',
    color: '#06b6d4',
  },
  {
    id: 'critical_buff',
    name: 'Critical Focus',
    description: 'Increases critical hit chance.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['buff', 'crit'],
    icon: '⚡',
    color: '#fbbf24',
  },
  {
    id: 'damage_buff',
    name: 'Might',
    description: 'Increases damage dealt.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['buff', 'damage'],
    icon: '💪',
    color: '#f97316',
  },
  {
    id: 'defense_buff',
    name: 'Fortitude',
    description: 'Increases armor and defense.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['buff', 'defense'],
    icon: '🛡️',
    color: '#64748b',
  },
  {
    id: 'speed_buff',
    name: 'Haste',
    description: 'Increases attack speed.',
    category: 'buff',
    stacking: 'stack_add',
    maxStacks: 3,
    resistible: false,
    tags: ['buff', 'speed'],
    icon: '⚡',
    color: '#a855f7',
  },

  // ─── DEBUFFS ───────────────────────────────────────────────────────
  {
    id: 'slow',
    name: 'Slow',
    description: 'Reduces attack speed. Stacks additively.',
    category: 'debuff',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: true,
    tags: ['debuff', 'slow', 'crowd_control'],
    icon: '🐌',
    color: '#64748b',
  },
  {
    id: 'armor_reduction',
    name: 'Armor Shred',
    description: 'Reduces target armor. Stacks additively.',
    category: 'debuff',
    stacking: 'stack_add',
    maxStacks: 10,
    resistible: true,
    tags: ['debuff', 'armor', 'physical'],
    icon: '🔨',
    color: '#ef4444',
  },
  {
    id: 'accuracy_reduction',
    name: 'Blind',
    description: 'Reduces hit chance.',
    category: 'debuff',
    stacking: 'refresh',
    maxStacks: 3,
    resistible: true,
    tags: ['debuff', 'accuracy', 'crowd_control'],
    icon: '🌫️',
    color: '#94a3b8',
  },
  {
    id: 'evasion_reduction',
    name: 'Marked',
    description: 'Reduces evasion chance.',
    category: 'debuff',
    stacking: 'refresh',
    maxStacks: 3,
    resistible: true,
    tags: ['debuff', 'evasion'],
    icon: '🎯',
    color: '#dc2626',
  },

  // ─── CONTROL ───────────────────────────────────────────────────────
  {
    id: 'stun',
    name: 'Stun',
    description: 'Prevents all actions. Does not stack — refreshes duration.',
    category: 'stun',
    stacking: 'refresh',
    maxStacks: 1,
    resistible: true,
    tags: ['cc', 'stun', 'control'],
    icon: '💫',
    color: '#fbbf24',
  },
  {
    id: 'root',
    name: 'Root',
    description: 'Prevents movement. Allows attacks and abilities.',
    category: 'stun',
    stacking: 'refresh',
    maxStacks: 1,
    resistible: true,
    tags: ['cc', 'root', 'control'],
    icon: '🌱',
    color: '#84cc16',
  },
  {
    id: 'silence',
    name: 'Silence',
    description: 'Prevents ability usage. Allows basic attacks.',
    category: 'stun',
    stacking: 'refresh',
    maxStacks: 1,
    resistible: true,
    tags: ['cc', 'silence', 'control'],
    icon: '🤐',
    color: '#a855f7',
  },

  // ─── DEFENSIVE ─────────────────────────────────────────────────────
  {
    id: 'shield',
    name: 'Shield',
    description: 'Absorbs incoming damage. Does not tick.',
    category: 'shield',
    stacking: 'stack_add',
    maxStacks: 10,
    resistible: false,
    tags: ['shield', 'defensive', 'absorption'],
    icon: '🛡️',
    color: '#0ea5e9',
  },
  {
    id: 'barrier',
    name: 'Magic Barrier',
    description: 'Absorbs magical damage only.',
    category: 'shield',
    stacking: 'stack_add',
    maxStacks: 5,
    resistible: false,
    tags: ['shield', 'magic', 'defensive', 'absorption'],
    icon: '✨',
    color: '#a855f7',
  },

  // ─── UTILITY ───────────────────────────────────────────────────────
  {
    id: 'resource_regen',
    name: 'Focus',
    description: 'Restores resource/energy over time.',
    category: 'utility',
    stacking: 'refresh',
    maxStacks: 3,
    tickInterval: 1,
    resistible: false,
    tags: ['utility', 'resource', 'regen'],
    icon: '💙',
    color: '#3b82f6',
  },
  {
    id: 'resource_drain',
    name: 'Drain',
    description: 'Drains resource/energy over time.',
    category: 'utility',
    stacking: 'stack_add',
    maxStacks: 5,
    tickInterval: 1,
    resistible: true,
    tags: ['utility', 'resource', 'drain'],
    icon: '💜',
    color: '#a855f7',
  },
];

// ─── LOOKUP MAPS ─────────────────────────────────────────────────────

export const EFFECT_DEFINITION_BY_ID: Record<EffectType, EffectDefinition> =
  Object.fromEntries(EFFECT_DEFINITIONS.map((d) => [d.id, d])) as Record<
    EffectType,
    EffectDefinition
  >;

export const EFFECTS_BY_CATEGORY: Record<EffectCategory, EffectDefinition[]> = {
  damage_over_time: EFFECT_DEFINITIONS.filter((d) => d.category === 'damage_over_time'),
  healing_over_time: EFFECT_DEFINITIONS.filter((d) => d.category === 'healing_over_time'),
  buff: EFFECT_DEFINITIONS.filter((d) => d.category === 'buff'),
  debuff: EFFECT_DEFINITIONS.filter((d) => d.category === 'debuff'),
  stun: EFFECT_DEFINITIONS.filter((d) => d.category === 'stun'),
  shield: EFFECT_DEFINITIONS.filter((d) => d.category === 'shield'),
  utility: EFFECT_DEFINITIONS.filter((d) => d.category === 'utility'),
};

// ─── EFFECT PRESETS (for abilities/items to reference) ──────────────

// Common preset configurations that abilities/items can use
export const EFFECT_PRESETS: EffectPreset[] = [
  // DoT presets
  { id: 'bleed', baseIntensity: 3, baseDuration: 3, chance: 0.3, stacking: 'stack_add', maxStacks: 5, tags: ['physical'] },
  { id: 'burn', baseIntensity: 8, baseDuration: 2, chance: 0.25, stacking: 'refresh', maxStacks: 3, tags: ['fire'] },
  { id: 'poison', baseIntensity: 2, baseDuration: 6, chance: 0.2, stacking: 'stack_add', maxStacks: 10, tags: ['nature'] },

  // HoT presets
  { id: 'regeneration', baseIntensity: 10, baseDuration: 4, chance: 1.0, stacking: 'refresh', maxStacks: 3, resistible: false },

  // Buff presets
  { id: 'accuracy_buff', baseIntensity: 5, baseDuration: 3, chance: 1.0, resistible: false },
  { id: 'evasion_buff', baseIntensity: 5, baseDuration: 3, chance: 1.0, resistible: false },
  { id: 'critical_buff', baseIntensity: 8, baseDuration: 3, chance: 1.0, resistible: false },
  { id: 'damage_buff', baseIntensity: 10, baseDuration: 3, chance: 1.0, resistible: false },
  { id: 'defense_buff', baseIntensity: 15, baseDuration: 3, chance: 1.0, resistible: false },
  { id: 'speed_buff', baseIntensity: 0.15, baseDuration: 3, chance: 1.0, resistible: false },

  // Debuff presets
  { id: 'slow', baseIntensity: 0.2, baseDuration: 3, chance: 0.4, stacking: 'stack_add', maxStacks: 5 },
  { id: 'armor_reduction', baseIntensity: 5, baseDuration: 4, chance: 0.3, stacking: 'stack_add', maxStacks: 10 },
  { id: 'accuracy_reduction', baseIntensity: 15, baseDuration: 2, chance: 0.3, stacking: 'refresh', maxStacks: 3 },
  { id: 'evasion_reduction', baseIntensity: 15, baseDuration: 3, chance: 0.3, stacking: 'refresh', maxStacks: 3 },

  // Control presets
  { id: 'stun', baseIntensity: 1, baseDuration: 1, chance: 0.2, stacking: 'refresh', maxStacks: 1 },
  { id: 'root', baseIntensity: 1, baseDuration: 2, chance: 0.25, stacking: 'refresh', maxStacks: 1 },
  { id: 'silence', baseIntensity: 1, baseDuration: 2, chance: 0.2, stacking: 'refresh', maxStacks: 1 },

  // Shield presets
  { id: 'shield', baseIntensity: 50, baseDuration: 3, chance: 1.0, stacking: 'stack_add', maxStacks: 10, resistible: false },
  { id: 'barrier', baseIntensity: 40, baseDuration: 3, chance: 1.0, stacking: 'stack_add', maxStacks: 5, resistible: false },

  // Utility presets
  { id: 'resource_regen', baseIntensity: 5, baseDuration: 4, chance: 1.0, resistible: false },
  { id: 'resource_drain', baseIntensity: 3, baseDuration: 3, chance: 0.3, stacking: 'stack_add', maxStacks: 5 },
];

export const EFFECT_PRESET_BY_ID: Record<EffectType, EffectPreset> =
  Object.fromEntries(EFFECT_PRESETS.map((p) => [p.id, p])) as Record<EffectType, EffectPreset>;

export type { EffectType, EffectCategory, EffectStackingRule, EffectDefinition, EffectPreset };