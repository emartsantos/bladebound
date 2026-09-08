import { PALETTE } from './palette';

export const STATUS_TOKENS = {
  neutral: {
    color: PALETTE.coldStone,
    tint: 'rgba(138, 133, 125, 0.1)',
  },
  info: {
    color: PALETTE.steelBlue,
    tint: 'rgba(101, 117, 138, 0.12)',
  },
  success: {
    color: PALETTE.verdant,
    bright: PALETTE.verdantBright,
    tint: 'rgba(111, 143, 90, 0.12)',
  },
  warning: {
    color: PALETTE.amber,
    tint: 'rgba(194, 153, 79, 0.12)',
  },
  danger: {
    color: PALETTE.blood,
    bright: PALETTE.bloodBright,
    tint: 'rgba(156, 61, 48, 0.14)',
  },
  ember: {
    color: PALETTE.ember,
    bright: PALETTE.emberLight,
    tint: 'rgba(212, 105, 47, 0.12)',
  },
  disabled: {
    color: 'rgba(138, 133, 125, 0.35)',
    tint: 'rgba(138, 133, 125, 0.05)',
  },
} as const;

export type StatusToken = keyof typeof STATUS_TOKENS;