import type { StatusToken } from './status';

export interface NotifyTreatment {
  icon: string;
  border: string;
  tint: string;
}

export const NOTIFY_TOKENS: Record<StatusToken, NotifyTreatment> = {
  neutral: {
    icon: 'info',
    border: 'rgba(138, 133, 125, 0.28)',
    tint: 'rgba(35, 33, 30, 0.85)',
  },
  info: {
    icon: 'info',
    border: 'rgba(101, 117, 138, 0.4)',
    tint: 'rgba(25, 30, 36, 0.85)',
  },
  success: {
    icon: 'check',
    border: 'rgba(111, 143, 90, 0.45)',
    tint: 'rgba(24, 30, 21, 0.85)',
  },
  warning: {
    icon: 'alert',
    border: 'rgba(194, 153, 79, 0.45)',
    tint: 'rgba(34, 29, 20, 0.85)',
  },
  danger: {
    icon: 'alert',
    border: 'rgba(156, 61, 48, 0.55)',
    tint: 'rgba(36, 22, 19, 0.88)',
  },
  ember: {
    icon: 'spark',
    border: 'rgba(212, 105, 47, 0.45)',
    tint: 'rgba(34, 25, 20, 0.85)',
  },
  disabled: {
    icon: 'info',
    border: 'rgba(138, 133, 125, 0.14)',
    tint: 'rgba(18, 17, 15, 0.85)',
  },
} as const;

export type NotifyToken = keyof typeof NOTIFY_TOKENS;