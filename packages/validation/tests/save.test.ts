import { describe, expect, it } from 'vitest';
import { validateSavePayload } from '../src/save';

describe('validateSavePayload', () => {
  it('accepts a well-formed minimal save', () => {
    const result = validateSavePayload({
      version: 1,
      player: { id: 'p1', name: 'Thane' },
    });
    expect(result.valid).toBe(true);
  });

  it('rejects null payload', () => {
    const result = validateSavePayload(null);
    expect(result.valid).toBe(false);
  });

  it('rejects non-object payload', () => {
    const result = validateSavePayload('save');
    expect(result.valid).toBe(false);
  });

  it('rejects missing version', () => {
    const result = validateSavePayload({ player: {} });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('rejects unsupported future version', () => {
    const result = validateSavePayload({ version: 99, player: {} });
    expect(result.valid).toBe(false);
  });

  it('rejects missing player object', () => {
    const result = validateSavePayload({ version: 1 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('player'))).toBe(true);
  });
});