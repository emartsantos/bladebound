import { PALETTE } from './palette';

export const BAR_TOKENS = {
  health: {
    track: 'rgba(156, 61, 48, 0.16)',
    fill: PALETTE.blood,
    fillBright: PALETTE.bloodBright,
  },
  xp: {
    track: 'rgba(176, 135, 84, 0.16)',
    fill: PALETTE.bronze,
    fillBright: PALETTE.bronzeLight,
  },
  resource: {
    track: 'rgba(138, 133, 125, 0.16)',
    fill: PALETTE.mist,
    fillBright: PALETTE.coldStone,
  },
  progress: {
    track: 'rgba(138, 133, 125, 0.16)',
    fill: PALETTE.steelBlue,
    fillBright: PALETTE.steelBlue,
  },
  energy: {
    track: 'rgba(194, 153, 79, 0.16)',
    fill: PALETTE.amber,
    fillBright: '#d9ad62',
  },
} as const;

export type BarToken = keyof typeof BAR_TOKENS;

export const BAR_SIZES = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;