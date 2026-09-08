import { beforeEach, describe, expect, it } from 'vitest';
import type { GameSaveData } from '@/lib/persistence/game-persistence';
import { GAME_SAVE_SCHEMA_VERSION } from '@/lib/persistence/game-persistence';
import { localGamePersistence, migrateLocalGameSave } from '@/lib/persistence/local-game-persistence';

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
  clear: () => values.clear(),
  key: (index: number) => [...values.keys()][index] ?? null,
  get length() { return values.size; },
};

const save = { gold: 725, skills: { mining: 42 } } as unknown as GameSaveData;

describe('local game persistence recovery', () => {
  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  });

  it('recovers from a malformed primary save', () => {
    localGamePersistence.save('player', save);
    values.set('premium-rpg:game:player', '{broken-json');
    expect(localGamePersistence.load('player')).toMatchObject(save);
  });

  it('migrates a legacy character save to the stable account key', () => {
    localGamePersistence.save('char-123', save);
    migrateLocalGameSave('char-123', 'account:raymart');
    expect(localGamePersistence.load('account:raymart')).toMatchObject(save);
  });

  it('never overwrites an existing account save during migration', () => {
    localGamePersistence.save('char-123', save);
    const current = { ...save, gold: 999 };
    localGamePersistence.save('account:raymart', current);
    migrateLocalGameSave('char-123', 'account:raymart');
    expect(localGamePersistence.load('account:raymart')).toMatchObject(current);
  });

  it('upgrades an older unversioned save without changing a zero balance', () => {
    values.set('premium-rpg:game:player', JSON.stringify({ ...save, gold: 0 }));
    const migrated = localGamePersistence.load('player');
    expect(migrated?.schemaVersion).toBe(GAME_SAVE_SCHEMA_VERSION);
    expect(migrated?.gold).toBe(0);
    expect(migrated?.ledger).toEqual([]);
  });
});
