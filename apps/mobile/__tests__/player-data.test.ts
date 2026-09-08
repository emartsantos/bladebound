import { describe, it, expect, vi, afterEach } from 'vitest';
import { MOCK_PLAYER, buildOfflineSummary } from '../src/data/player';

afterEach(() => {
  vi.restoreAllMocks();
});

const MINUTE = 60 * 1000;
const HOUR = 3600 * 1000;

describe('MOCK_PLAYER snapshot integrity', () => {
  it('has a stable identity and progression fields', () => {
    expect(MOCK_PLAYER.playerId).toBe('player_mobile_demo');
    expect(typeof MOCK_PLAYER.name).toBe('string');
    expect(MOCK_PLAYER.name.length).toBeGreaterThan(0);
    expect(MOCK_PLAYER.combatLevel).toBeGreaterThan(0);
    expect(MOCK_PLAYER.totalLevel).toBeGreaterThan(0);
    expect(MOCK_PLAYER.level).toBeGreaterThan(0);
  });

  it('has skills with positive levels', () => {
    const entries = Object.entries(MOCK_PLAYER.skills);
    expect(entries.length).toBeGreaterThan(0);
    for (const [, s] of entries) {
      expect(s.level).toBeGreaterThan(0);
      expect(s.xp).toBeGreaterThan(0);
    }
  });

  it('has a baseline inventory on hand', () => {
    expect(MOCK_PLAYER.inventory.length).toBeGreaterThan(0);
    for (const item of MOCK_PLAYER.inventory) {
      expect(item.itemId.length).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
    }
  });

  it('has timelines and save metadata', () => {
    expect(typeof MOCK_PLAYER.lastSavedAt).toBe('number');
    expect(MOCK_PLAYER.lastSavedAt).toBeGreaterThan(0);
    expect(MOCK_PLAYER.playtime).toBeGreaterThan(0);
  });
});

describe('buildOfflineSummary', () => {
  it('rewards nothing below the 1 minute minimum', () => {
    const s = buildOfflineSummary(30 * 1000);
    expect(s.elapsedMs).toBe(30 * 1000);
    expect(s.rewardMs).toBe(0);
    expect(s.capped).toBe(true);
  });

  it('passes through elapsed time within policy limits', () => {
    const s = buildOfflineSummary(2 * MINUTE);
    expect(s.elapsedMs).toBe(2 * MINUTE);
    expect(s.rewardMs).toBe(2 * MINUTE);
    expect(s.capped).toBe(false);
  });

  it('rewards an exact hour without capping', () => {
    const s = buildOfflineSummary(1 * HOUR);
    expect(s.rewardMs).toBe(1 * HOUR);
    expect(s.capped).toBe(false);
  });

  it('hard-caps to the 8 hour policy when away much longer', () => {
    const s = buildOfflineSummary(20 * HOUR);
    const maxRewardedMs = 8 * HOUR;
    expect(s.rewardMs).toBe(maxRewardedMs);
    expect(s.capped).toBe(true);
  });

  it('is deterministic across calls for the same elapsed value', () => {
    // Date.now is captured; both calls must agree since formulas are pure.
    const a = buildOfflineSummary(3 * HOUR);
    const b = buildOfflineSummary(3 * HOUR);
    expect(a).toEqual(b);
    expect(a.rewardMs).toBe(3 * HOUR);
  });
});