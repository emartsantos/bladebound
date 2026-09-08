export interface StateTreatment {
  background: string;
  color: string;
  border: string;
  opacity?: number;
}

export const LOADING_TOKENS = {
  shimmer:
    'linear-gradient(90deg, rgba(138, 133, 125, 0.06) 0%, rgba(138, 133, 125, 0.12) 50%, rgba(138, 133, 125, 0.06) 100%)',
  base: 'rgba(138, 133, 125, 0.08)',
  spinner: 'rgba(176, 135, 84, 0.8)',
  track: 'rgba(138, 133, 125, 0.14)',
} as const;

export const EMPTY_STATE: StateTreatment = {
  background: 'transparent',
  color: 'rgba(138, 133, 125, 0.5)',
  border: 'rgba(138, 133, 125, 0.14)',
};

export const DISABLED_STATE: StateTreatment = {
  background: 'rgba(138, 133, 125, 0.05)',
  color: 'rgba(138, 133, 125, 0.35)',
  border: 'rgba(138, 133, 125, 0.1)',
  opacity: 0.6,
};

export const DANGER_STATE: StateTreatment = {
  background: 'rgba(156, 61, 48, 0.14)',
  color: '#e06a54',
  border: 'rgba(156, 61, 48, 0.5)',
};

export const SUCCESS_STATE: StateTreatment = {
  background: 'rgba(111, 143, 90, 0.12)',
  color: '#b6d17f',
  border: 'rgba(111, 143, 90, 0.45)',
};