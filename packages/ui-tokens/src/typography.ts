import { PALETTE } from './palette';

export const TEXT_TOKENS = {
  primary: PALETTE.parchment,
  bone: PALETTE.bone,
  secondary: PALETTE.mist,
  muted: PALETTE.coldStone,
  faint: 'rgba(138, 133, 125, 0.45)',
  ember: PALETTE.ember,
  bronze: PALETTE.bronze,
  bronzeBright: PALETTE.bronzeLight,
  onDark: PALETTE.night,
  onEmber: PALETTE.night,
  onBronze: PALETTE.night,
  danger: PALETTE.blood,
  dangerBright: PALETTE.bloodBright,
  success: PALETTE.verdant,
  successBright: PALETTE.verdantBright,
  warning: PALETTE.amber,
  info: PALETTE.steelBlue,
} as const;

export type TextToken = keyof typeof TEXT_TOKENS;

export const FONT_STACKS = {
  body: '"Crimson Text", Georgia, "Times New Roman", serif',
  display: '"Cinzel", "Trajan Pro", Georgia, serif',
  mono: '"IBM Plex Mono", "Courier New", monospace',
  ui: '"Inter", -apple-system, "Segoe UI", sans-serif',
} as const;

export const FONT_SIZES = {
  xs: '0.6875rem', // 11
  sm: '0.75rem', // 12
  base: '0.8125rem', // 13
  md: '0.875rem', // 14
  lg: '1.0625rem', // 17
  xl: '1.25rem', // 20
  xxl: '1.5rem', // 24
  display: '2rem', // 32
} as const;

export const FONT_WEIGHTS = {
  hairline: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.15,
  ui: 1.3,
  body: 1.5,
  loose: 1.7,
} as const;

export const LETTER_SPACING = {
  tight: '-0.01em',
  normal: '0',
  caps: '0.06em',
  wide: '0.12em',
} as const;

export type FontScaleToken = keyof typeof FONT_SIZES;
export type FontWeightToken = keyof typeof FONT_WEIGHTS;
export type LineHeightToken = keyof typeof LINE_HEIGHTS;
export type LetterSpacingToken = keyof typeof LETTER_SPACING;

export const TYPE_HIERARCHY = {
  display: {
    fontFamily: FONT_STACKS.display,
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.caps,
    color: TEXT_TOKENS.bone,
  },
  title: {
    fontFamily: FONT_STACKS.display,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.caps,
    color: TEXT_TOKENS.bone,
  },
  subtitle: {
    fontFamily: FONT_STACKS.display,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.caps,
    color: TEXT_TOKENS.bronze,
  },
  section: {
    fontFamily: FONT_STACKS.ui,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.ui,
    letterSpacing: LETTER_SPACING.wide,
    color: TEXT_TOKENS.secondary,
  },
  body: {
    fontFamily: FONT_STACKS.body,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: LINE_HEIGHTS.body,
    color: TEXT_TOKENS.primary,
  },
  bodyBold: {
    fontFamily: FONT_STACKS.body,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.body,
    color: TEXT_TOKENS.bone,
  },
  mono: {
    fontFamily: FONT_STACKS.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: LINE_HEIGHTS.ui,
    color: TEXT_TOKENS.secondary,
  },
  label: {
    fontFamily: FONT_STACKS.ui,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.ui,
    letterSpacing: LETTER_SPACING.caps,
    color: TEXT_TOKENS.secondary,
  },
} as const;

export type TypeRole = keyof typeof TYPE_HIERARCHY;