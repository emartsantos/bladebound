import { describe, expect, it } from 'vitest';
import { createSeededRandom, hashSeed, mulberry32 } from '../../src/utils/random';

describe('mulberry32', () => {
  it('produces values in range [0, 1)', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; i += 1) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    for (let i = 0; i < 100; i += 1) {
      expect(a()).toBeCloseTo(b());
    }
  });
});

describe('createSeededRandom', () => {
  it('aliases mulberry32 behavior', () => {
    const a = createSeededRandom(7);
    const b = mulberry32(7);
    expect(a()).toBeCloseTo(b());
  });

  it('produces distinct sequences for different seeds', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    let anyDiff = false;
    for (let i = 0; i < 50; i += 1) {
      if (a() !== b()) {
        anyDiff = true;
        break;
      }
    }
    expect(anyDiff).toBe(true);
  });
});

describe('hashSeed', () => {
  it('is deterministic', () => {
    expect(hashSeed('player-1', 'mining', 7)).toBe(hashSeed('player-1', 'mining', 7));
  });

  it('varies by input', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
});