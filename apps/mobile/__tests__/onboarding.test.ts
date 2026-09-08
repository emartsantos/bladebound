import { describe, it, expect } from 'vitest';
import { ONBOARDING_STEPS } from '../src/data/onboarding';

describe('onboarding flow data', () => {
  it('defines exactly 5 steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(5);
  });

  it('has unique step ids', () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every step has a title, body and call to action', () => {
    for (const s of ONBOARDING_STEPS) {
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(s.body.trim().length).toBeGreaterThan(0);
      expect(s.cta.trim().length).toBeGreaterThan(0);
    }
  });

  it('references only valid theme color keys', () => {
    // colorKey is typed as keyof Theme['colors'] at compile time; assert non-empty at runtime.
    for (const s of ONBOARDING_STEPS) {
      expect(typeof s.colorKey).toBe('string');
      expect(s.colorKey.length).toBeGreaterThan(0);
    }
  });

  it('walks from welcome to play in order', () => {
    expect(ONBOARDING_STEPS[0].id).toBe('step1');
    expect(ONBOARDING_STEPS[0].title).toContain('Emberhollow');
    expect(ONBOARDING_STEPS[1].title).toContain('Offline');
    expect(ONBOARDING_STEPS[2].title).toContain('Regions');
    expect(ONBOARDING_STEPS[3].title).toContain('Level');
    expect(ONBOARDING_STEPS[4].cta).toBe('Play');
  });
});