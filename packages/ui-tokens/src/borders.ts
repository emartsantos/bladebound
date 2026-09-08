import { PALETTE } from './palette';

export const BORDER_TOKENS = {
  steel: PALETTE.steel,
  iron: PALETTE.iron,
  bronze: PALETTE.bronze,
  ember: PALETTE.ember,
  parchDark: PALETTE.leather,
  bone: PALETTE.bone,
  dim: 'rgba(138, 133, 125, 0.28)',
  faint: 'rgba(138, 133, 125, 0.14)',
  parchment: 'rgba(216, 201, 168, 0.22)',
  dark: 'rgba(10, 9, 8, 0.6)',
} as const;

export type BorderToken = keyof typeof BORDER_TOKENS;

export const BORDER_WIDTHS = {
  hairline: 1,
  thin: 1,
  standard: 1,
  thick: 2,
  heavy: 3,
} as const;

export type BorderWidthToken = keyof typeof BORDER_WIDTHS;