export const SHADOWS = {
  panel: 'inset 0 1px 0 rgba(216, 201, 168, 0.03), 0 1px 0 rgba(0, 0, 0, 0.4)',
  raised:
    'inset 0 1px 0 rgba(216, 201, 168, 0.04), 0 2px 6px rgba(0, 0, 0, 0.45)',
  overlay: 'inset 0 1px 0 rgba(216, 201, 168, 0.04), 0 8px 24px rgba(0, 0, 0, 0.55)',
  scrim: 'inset 0 1px 0 rgba(216, 201, 168, 0.03), 0 12px 40px rgba(0, 0, 0, 0.6)',
  inset: 'inset 0 2px 6px rgba(0, 0, 0, 0.5)',
  ember: '0 0 0 1px rgba(212, 105, 47, 0.35), 0 2px 12px rgba(212, 105, 47, 0.1)',
  bronze: '0 0 0 1px rgba(176, 135, 84, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4)',
  danger: '0 0 0 1px rgba(156, 61, 48, 0.4), 0 2px 12px rgba(156, 61, 48, 0.12)',
  success: '0 0 0 1px rgba(111, 143, 90, 0.35), 0 2px 10px rgba(111, 143, 90, 0.1)',
  focus: '0 0 0 2px rgba(176, 135, 84, 0.4)',
  toast: 'inset 0 1px 0 rgba(216, 201, 168, 0.05), 0 6px 20px rgba(0, 0, 0, 0.6)',
} as const;

export type ShadowToken = keyof typeof SHADOWS;