import { describe, expect, it } from 'vitest';
import {
  checkForUpdate,
  compareVersions,
  parseVersion,
  shouldPromptUpdate,
} from '../src/update-monitor';

describe('parseVersion', () => {
  it('parses numeric segments', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('0.1.0')).toEqual([0, 1, 0]);
    expect(parseVersion('1.2.3-beta')).toEqual([1, 2, 3]);
  });

  it('rejects malformed versions', () => {
    expect(() => parseVersion('abc')).toThrow(/Invalid version/);
    expect(() => parseVersion('1.x.3')).toThrow(/Invalid version/);
  });
});

describe('compareVersions', () => {
  it('orders versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.4', '1.2.3')).toBe(1);
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('1.2.0', '1.2')).toBe(0);
  });
});

describe('checkForUpdate', () => {
  it('flags availability and required', () => {
    expect(checkForUpdate('1.0.0', '1.2.0')).toEqual({
      updateAvailable: true,
      currentVersion: '1.0.0',
      latestVersion: '1.2.0',
      required: false,
    });
    expect(checkForUpdate('1.2.0', '1.2.0').updateAvailable).toBe(false);
    expect(checkForUpdate('0.9.0', '1.2.0', '1.0.0').required).toBe(true);
    expect(checkForUpdate('1.1.0', '1.2.0', '1.0.0').required).toBe(false);
  });
});

describe('shouldPromptUpdate', () => {
  const base = {
    currentVersion: '1.0.0',
    latestVersion: '1.2.0',
    now: 1000,
    cooldownMs: 5000,
  };

  it('prompts when update available and cooldown elapsed', () => {
    const result = shouldPromptUpdate({ ...base, lastPromptedAt: -100000 });
    expect(result.decision).toBe('prompt');
  });

  it('suppresses within cooldown', () => {
    const result = shouldPromptUpdate({ ...base, lastPromptedAt: 900 });
    expect(result.decision).toBe('suppress-cooldown');
  });

  it('suppresses when no update and no last prompt', () => {
    const result = shouldPromptUpdate({ ...base, latestVersion: '1.0.0', lastPromptedAt: null });
    expect(result.decision).toBe('suppress-cooldown');
    expect(result.reason).toBe('no update available');
  });

  it('forces required above cooldown regardless', () => {
    const result = shouldPromptUpdate({
      ...base,
      minRequiredVersion: '1.1.0',
      lastPromptedAt: 999,
    });
    expect(result.decision).toBe('required');
  });

  it('prompts on first run when no last prompt', () => {
    const result = shouldPromptUpdate({ ...base, lastPromptedAt: null });
    expect(result.decision).toBe('prompt');
  });
});