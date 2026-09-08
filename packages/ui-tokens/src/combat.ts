import { PALETTE } from './palette';

export const COMBAT_TOKENS = {
  player: {
    color: PALETTE.parchment,
    fill: PALETTE.steelBlue,
  },
  enemy: {
    color: PALETTE.bloodBright,
    fill: PALETTE.blood,
  },
  healthBar: {
    track: 'rgba(156, 61, 48, 0.18)',
    fill: PALETTE.blood,
    fillBright: PALETTE.bloodBright,
    text: PALETTE.bone,
  },
  damage: {
    color: PALETTE.bloodBright,
    text: '#e06a54',
  },
  heal: {
    color: PALETTE.verdantBright,
    text: '#b6d17f',
  },
  shield: {
    color: PALETTE.steelBlue,
    fill: 'rgba(101, 117, 138, 0.5)',
  },
  mana: {
    color: PALETTE.steelBlue,
    fill: 'rgba(101, 117, 138, 0.55)',
  },
} as const;

export const STATUS_EFFECT_TOKENS = {
  bleed: { color: '#e06a54', tint: 'rgba(224, 106, 84, 0.12)' },
  burn: { color: PALETTE.ember, tint: 'rgba(212, 105, 47, 0.14)' },
  poison: { color: PALETTE.sickly, tint: 'rgba(110, 125, 69, 0.16)' },
  stun: { color: PALETTE.stone, tint: 'rgba(138, 133, 125, 0.14)' },
  slow: { color: PALETTE.steelBlue, tint: 'rgba(101, 117, 138, 0.14)' },
  armor_reduction: { color: PALETTE.mist, tint: 'rgba(138, 133, 125, 0.12)' },
  healing_over_time: { color: PALETTE.verdantBright, tint: 'rgba(135, 167, 107, 0.14)' },
  damage_over_time: { color: '#e06a54', tint: 'rgba(224, 106, 84, 0.12)' },
  shield: { color: PALETTE.steelBlue, tint: 'rgba(101, 117, 138, 0.14)' },
  accuracy_buff: { color: PALETTE.amber, tint: 'rgba(194, 153, 79, 0.12)' },
  evasion_buff: { color: PALETTE.amber, tint: 'rgba(194, 153, 79, 0.12)' },
  critical_buff: { color: PALETTE.emberLight, tint: 'rgba(224, 138, 68, 0.14)' },
} as const;

export type StatusEffectToken =
  keyof typeof STATUS_EFFECT_TOKENS;

export const DANGER_ESTIMATE = {
  trivial: { color: PALETTE.verdantBright, label: 'Trivial' },
  easy: { color: PALETTE.verdant, label: 'Easy' },
  fair: { color: PALETTE.amber, label: 'Fair' },
  dangerous: { color: PALETTE.ember, label: 'Dangerous' },
  deadly: { color: PALETTE.bloodBright, label: 'Deadly' },
} as const;

export type DangerTier = keyof typeof DANGER_ESTIMATE;