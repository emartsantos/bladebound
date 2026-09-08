export const ICON_TREATMENTS = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  stroke: {
    hair: 1,
    regular: 1.5,
    bold: 2,
  },
  fill: 'none',
  lineCap: 'round',
} as const;

export type IconSizeToken = keyof typeof ICON_TREATMENTS.size;
export type IconStrokeToken = keyof typeof ICON_TREATMENTS.stroke;

export const ICON_FRAME_STYLES = {
  none: {},
  circle: {
    borderRadius: 999,
  },
  shield: {
    borderRadius: '38% 38% 46% 46% / 46% 46% 54% 54%',
  },
  plate: {
    borderRadius: 3,
  },
} as const;

export type IconFrameStyleToken = keyof typeof ICON_FRAME_STYLES;