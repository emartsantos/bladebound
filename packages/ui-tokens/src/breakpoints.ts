export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export type BreakpointToken = keyof typeof BREAKPOINTS;

export const MEDIA = {
  desktop: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  mobile: `@media (max-width: ${BREAKPOINTS.sm - 1}px)`,
  ltTablet: `@media (max-width: ${BREAKPOINTS.sm - 1}px)`,
  gteTablet: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  gteDesktop: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  gteWide: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  gteUltraWide: `@media (min-width: ${BREAKPOINTS.xxl}px)`,
} as const;

export type MediaToken = keyof typeof MEDIA;

export const SHELL_LAYOUT = {
  topBarHeight: 56,
  topBarHeightMobile: 48,
  sideNavWidth: 232,
  contextPanelWidth: 320,
  contextPanelWidthTablet: 288,
  workspacePadding: 24,
  workspacePaddingWide: 32,
} as const;

export type ShellLayoutToken = keyof typeof SHELL_LAYOUT;