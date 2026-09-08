import { describe, expect, it } from 'vitest';
import {
  applyMultipliers,
  getActiveEvents,
  getRotatedItems,
  getUnlockedRegions,
  isEventActive,
} from '../src/live-ops';

const now = 2000;

const event = (overrides: Record<string, unknown>) => ({
  id: 'e1',
  name: 'ember-fest',
  startsAt: 1000,
  endsAt: 3000,
  multipliers: { xp: 2, gold: 3 },
  ...overrides,
});

describe('isEventActive', () => {
  it('activates within [start, end]', () => {
    expect(isEventActive(event({}), 1000)).toBe(true);
    expect(isEventActive(event({}), 3000)).toBe(true);
    expect(isEventActive(event({}), 3001)).toBe(false);
    expect(isEventActive(event({}), 999)).toBe(false);
  });

  it('respects explicit disabled flag', () => {
    expect(isEventActive(event({ enabled: false }), now)).toBe(false);
  });
});

describe('getActiveEvents', () => {
  it('filters and sorts by start time', () => {
    const events = [
      event({ id: 'late', startsAt: 2000, endsAt: 6000 }),
      event({ id: 'over', startsAt: 100, endsAt: 500 }),
      event({ id: 'mid', startsAt: 1500, endsAt: 2500 }),
    ];
    expect(getActiveEvents(events, now).map((e) => e.id)).toEqual(['mid', 'late']);
  });
});

describe('multipliers', () => {
  it('applies active multipliers to base values', () => {
    const base = { xp: 100, gold: 50, kills: 3 };
    const result = applyMultipliers(base, [event({})], now);
    expect(result).toEqual({ xp: 200, gold: 150, kills: 3 });
  });

  it('uses the highest factor across overlapping events', () => {
    const events = [
      event({ multipliers: { xp: 2 } }),
      event({ id: 'stack', startsAt: 1500, endsAt: 2500, multipliers: { xp: 5, gold: 1.5 } }),
    ];
    const result = applyMultipliers({ xp: 10, gold: 10 }, events, now);
    expect(result.xp).toBe(50);
    expect(result.gold).toBe(15);
  });

  it('ignores inactive events', () => {
    const events = [event({ startsAt: 5000, endsAt: 6000, multipliers: { xp: 9 } })];
    const result = applyMultipliers({ xp: 10 }, events, now);
    expect(result.xp).toBe(10);
  });
});

describe('rotations and unlocks', () => {
  it('collects rotated items from active events only', () => {
    const events = [
      event({ itemRotations: [{ itemId: 'ember-cape', quantity: 5 }] }),
      event({ id: 'over', startsAt: 100, endsAt: 500, itemRotations: [{ itemId: 'old-potion' }] }),
    ];
    const items = getRotatedItems(events, now);
    expect(items.map((i) => i.itemId)).toEqual(['ember-cape']);
  });

  it('unlocks regions from active events', () => {
    const events = [
      event({ unlockRegions: ['ashlands', 'frostreach'] }),
      event({ id: 'over', startsAt: 100, endsAt: 500, unlockRegions: ['spoiled'] }),
    ];
    expect(getUnlockedRegions(events, now)).toEqual(['ashlands', 'frostreach']);
  });
});