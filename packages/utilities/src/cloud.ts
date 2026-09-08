import type { SaveSnapshot } from '@premium-rpg/shared-types';
import type { SaveStorage } from './save-storage.interface';

export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error';

export interface CloudSaveRecord {
  id: string;
  version: number;
  timestamp: number;
  checksum: string;
  deviceId: string;
  metadata?: Record<string, unknown>;
}

export interface CloudSyncResult {
  success: boolean;
  savedVersion?: number;
  localVersion?: number;
  status: SyncStatus;
  errorMessage?: string;
  syncedAt?: number;
}

export interface CloudSaveAdapter {
  readonly name: string;

  /** Load the cloud save record for a given user/session */
  loadCloudSave: (userId: string, slot?: number) => Promise<CloudSaveRecord | null>;

  /** Save a save state to the cloud */
  saveCloudSave: (userId: string, record: CloudSaveRecord) => Promise<CloudSyncResult>;

  /** Delete a cloud save record */
  deleteCloudSave: (userId: string, slot?: number) => Promise<CloudSyncResult>;

  /** Check if cloud save exists for user */
  cloudSaveExists: (userId: string, slot?: number) => Promise<boolean>;

  /** Get the last sync timestamp */
  getLastSync: (userId: string) => Promise<number | null>;
}