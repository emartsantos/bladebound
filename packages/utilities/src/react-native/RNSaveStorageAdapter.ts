import type { SaveSnapshot } from '@premium-rpg/shared-types';
import type { SaveStorage } from '../save-storage.interface';

const STORAGE_KEY = 'premium-rpg-save';

const g = globalThis as unknown as Record<string, (...args: unknown[]) => Promise<string | null> | Promise<void> | Promise<boolean> | null | undefined>;

const createRNStorage = (): SaveStorage => {
  const load = async (key: string = STORAGE_KEY): Promise<SaveSnapshot | null> => {
    try {
      const data = await g._readSaveFromAsyncStorage?.(key);
      if (!data) return null;
      return JSON.parse(data as string) as SaveSnapshot;
    } catch {
      return null;
    }
  };

  const save = async (key: string = STORAGE_KEY, data: SaveSnapshot): Promise<void> => {
    try {
      const json = JSON.stringify(data);
      await g._writeSaveToAsyncStorage?.(key, json);
    } catch {
      throw new Error('Failed to save to React Native storage');
    }
  };

  const remove = async (key: string = STORAGE_KEY): Promise<void> => {
    try {
      await g._removeSaveFromAsyncStorage?.(key);
    } catch {
      throw new Error('Failed to remove save from React Native storage');
    }
  };

  const keyExists = async (key: string = STORAGE_KEY): Promise<boolean> => {
    try {
      const value = await g._getAsyncStorageItem?.(key);
      return value !== null && value !== undefined;
    } catch {
      return false;
    }
  };

  return { load, save, remove, keyExists };
};

export const RNSaveStorageAdapter: {
  readonly storage: SaveStorage;
  readonly name: string;
} = {
  name: 'react-native',
  storage: createRNStorage(),
};