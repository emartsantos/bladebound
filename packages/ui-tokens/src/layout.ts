export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
  huge: 64,
} as const;

export type SpacingToken = keyof typeof SPACING;

export const RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  full: 999,
} as const;

export type RadiusToken = keyof typeof RADIUS;

export const SIZING = {
  controlSm: 28,
  controlMd: 34,
  controlLg: 40,
  iconXs: 12,
  iconSm: 14,
  iconMd: 16,
  iconLg: 20,
  iconXl: 24,
  avatarSm: 24,
  avatarMd: 32,
  avatarLg: 40,
  inventorySlot: 48,
  inventorySlotSm: 36,
  barSm: 4,
  barMd: 6,
  barLg: 10,
} as const;

export type SizingToken = keyof typeof SIZING;

export const CONTENT_WIDTHS = {
  narrow: 560,
  standard: 720,
  wide: 960,
} as const;

export type ContentWidthToken = keyof typeof CONTENT_WIDTHS;