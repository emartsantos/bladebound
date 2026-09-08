import type { SaveSnapshot } from '@premium-rpg/shared-types';

export type SaveStorage = {
  load: (key: string) => Promise<SaveSnapshot | null>;
  save: (key: string, data: SaveSnapshot) => Promise<void>;
  remove: (key: string) => Promise<void>;
  keyExists: (key: string) => Promise<boolean>;
};