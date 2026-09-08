import { PALETTE } from './palette';

export const SURFACES = {
  base: PALETTE.smoke,
  page: PALETTE.night,
  panel: PALETTE.charcoal,
  raised: PALETTE.blackened,
  overlay: PALETTE.blackened,
  inset: PALETTE.iron,
  banner: '#201d1a',
} as const;

export const SURFACE_ALPHA = {
  shield: 'rgba(18, 16, 14, 0.82)',
  scrim: 'rgba(10, 9, 8, 0.72)',
  strip: 'rgba(0, 0, 0, 0.28)',
  tint: 'rgba(216, 201, 168, 0.03)',
  lift: 'rgba(255, 255, 255, 0.02)',
  hover: 'rgba(176, 135, 84, 0.06)',
  active: 'rgba(176, 135, 84, 0.1)',
} as const;

export type SurfaceToken = keyof typeof SURFACES;
export type SurfaceAlphaToken = keyof typeof SURFACE_ALPHA;