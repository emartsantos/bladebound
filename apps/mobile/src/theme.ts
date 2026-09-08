import { PALETTE } from '@premium-rpg/ui-tokens';

/**
 * Mobile theme tokens derived from the shared ui-tokens palette.
 * Reuses palette, does not re-declare colors.
 */
export const theme = {
  colors: {
    background: PALETTE.night,
    surface: PALETTE.charcoal,
    surfaceElevated: PALETTE.blackened,
    border: PALETTE.iron,
    text: PALETTE.bone,
    textMuted: PALETTE.mist,
    accent: PALETTE.ember,
    accentLight: PALETTE.emberLight,
    success: PALETTE.verdantBright,
    danger: PALETTE.bloodBright,
    warning: PALETTE.amber,
    rare: PALETTE.bronzeLight,
    ember: PALETTE.ember,
    bone: PALETTE.bone,
    iron: PALETTE.iron,
    amber: PALETTE.amber,
    blackened: PALETTE.blackened,
    onAccent: PALETTE.blackened,
    secondary: PALETTE.steel,
    onSecondary: PALETTE.bone,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    pill: 999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
  },
} as const;

export type Theme = typeof theme;
