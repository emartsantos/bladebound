import type { SaveSnapshot } from '@premium-rpg/shared-types';
import type { SaveStorage } from '../save-storage.interface';

const STORAGE_KEY = 'premium-rpg-save';

const g = globalThis as unknown as Record<string, (...args: unknown[]) => Promise<string | null> | Promise<void> | Promise<boolean> | null | undefined>;

const createBrowserStorage = (): SaveStorage => {
  const load = async (key: string = STORAGE_KEY): Promise<SaveSnapshot | null> => {
    try {
      const data = await g._readSaveFromLocalStorage?.(key);
      if (!data) return null;
      return JSON.parse(data as string) as SaveSnapshot;
    } catch {
      return null;
    }
  };

  const save = async (key: string = STORAGE_KEY, data: SaveSnapshot): Promise<void> => {
    try {
      const json = JSON.stringify(data);
      await g._writeSaveToLocalStorage?.(key, json);
    } catch {
      throw new Error('Failed to save to browser localStorage');
    }
  };

  const remove = async (key: string = STORAGE_KEY): Promise<void> => {
    try {
      await g._removeSaveFromLocalStorage?.(key);
    } catch {
      throw new Error('Failed to remove from browser localStorage');
    }
  };

  const keyExists = async (key: string = STORAGE_KEY): Promise<boolean> => {
    try {
      const value = await g._getLocalStorageItem?.(key);
      return value !== null && value !== undefined;
    } catch {
      return false;
    }
  };

  return { load, save, remove, keyExists };
};

export const BrowserSaveStorageAdapter: {
  readonly storage: SaveStorage;
  readonly name: string;
} = {
  name: 'browser',
  storage: createBrowserStorage(),
};