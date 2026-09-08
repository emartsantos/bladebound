export const MOTION = {
  duration: {
    instant: 60,
    fast: 120,
    base: 180,
    slow: 260,
    deliberate: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
    accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)',
    linear: 'linear',
  },
} as const;

export const TRANSITIONS = {
  color: 'color 120ms cubic-bezier(0.22, 1, 0.36, 1)',
  background: 'background-color 120ms cubic-bezier(0.22, 1, 0.36, 1)',
  border: 'border-color 120ms cubic-bezier(0.22, 1, 0.36, 1)',
  boxShadow: 'box-shadow 120ms cubic-bezier(0.22, 1, 0.36, 1)',
  transform:
    'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
  opacity: 'opacity 120ms cubic-bezier(0.22, 1, 0.36, 1)',
  layout: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
  interactive:
    'background-color 120ms cubic-bezier(0.22, 1, 0.36, 1), color 120ms cubic-bezier(0.22, 1, 0.36, 1), border-color 120ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 120ms cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export type MotionDurationToken = keyof typeof MOTION.duration;
export type MotionEasingToken = keyof typeof MOTION.easing;
export type TransitionToken = keyof typeof TRANSITIONS;

export const MOTION_PREFERENCE = {
  reduced: '@media (prefers-reduced-motion: reduce)',
} as const;