import { PALETTE } from './palette';

export const NAV_TOKENS = {
  rail: {
    background: 'rgba(16, 15, 13, 0.65)',
    border: 'rgba(138, 133, 125, 0.14)',
  },
  item: {
    idle: { color: PALETTE.mist, background: 'transparent' },
    hover: { color: PALETTE.parchment, background: 'rgba(176, 135, 84, 0.06)' },
    active: { color: PALETTE.bone, background: 'rgba(176, 135, 84, 0.1)' },
    disabled: { color: 'rgba(138, 133, 125, 0.35)', background: 'transparent' },
  },
  indicator: {
    color: PALETTE.bronze,
    width: 3,
  },
  badge: {
    color: PALETTE.ember,
    text: PALETTE.bone,
    background: 'rgba(156, 61, 48, 0.25)',
    border: 'rgba(156, 61, 48, 0.4)',
  },
} as const;

export type NavToken = keyof typeof NAV_TOKENS;