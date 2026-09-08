export type RandomSource = () => number;

export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: number): RandomSource {
  return mulberry32(seed);
}

export function hashSeed(...parts: Array<string | number>): number {
  let hash = 2166136261;
  for (const part of parts) {
    const value = String(part);
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}