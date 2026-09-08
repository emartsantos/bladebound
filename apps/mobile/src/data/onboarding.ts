import type { Theme } from '../theme';

export type OnboardingColorKey = keyof Theme['colors'];

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  colorKey: OnboardingColorKey;
  cta: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'step1',
    title: 'Welcome to Emberhollow',
    body: 'Your journey begins in a dark fantasy world of monsters, mysteries, and loot. You are an adventurer with a single goal: grow stronger each day.',
    colorKey: 'ember',
    cta: 'Begin',
  },
  {
    id: 'step2',
    title: 'Offline Progression',
    body: 'The game continues even when you\'re away. Return each day to claim your offline rewards — resources gathered while you were gone.',
    colorKey: 'bone',
    cta: 'Continue',
  },
  {
    id: 'step3',
    title: 'Explore Regions',
    body: 'Travel to different regions to face stronger enemies and earn better loot. Each region has recommended levels — start where you feel comfortable.',
    colorKey: 'iron',
    cta: 'Explore',
  },
  {
    id: 'step4',
    title: 'Level Up Your Character',
    body: 'Earn XP to increase your combat level and unlock skills. Stronger skills = stronger attacks and better survival.',
    colorKey: 'success',
    cta: 'Continue',
  },
  {
    id: 'step5',
    title: 'Manage Your Inventory',
    body: 'Collect resources, items, and equipment. Equip better gear to boost your stats. Manage inventory space and salvage broken items.',
    colorKey: 'amber',
    cta: 'Play',
  },
];