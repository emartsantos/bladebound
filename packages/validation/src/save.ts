import { SAVE_SCHEMA_VERSION, MIGRATION_FUNCTIONS, getMigrationPath, migrateSave, validateSaveVersion } from '@premium-rpg/game-data';

export interface SaveValidationResult {
  valid: boolean;
  version: number;
  errors: string[];
}

export function validateSavePayload(payload: unknown): SaveValidationResult {
  const errors: string[] = [];
  if (payload === null || typeof payload !== 'object') {
    return { valid: false, version: 0, errors: ['Save payload must be an object'] };
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.version !== 'number') {
    errors.push('Save payload missing numeric version');
  } else {
    const versionCheck = validateSaveVersion(record.version);
    if (!versionCheck.valid) {
      errors.push(versionCheck.error || '');
    }
  }

  if (record.player === null || typeof record.player !== 'object') {
    errors.push('Save payload missing player object');
  }
  
  return {
    valid: errors.length === 0,
    version: typeof record.version === 'number' ? record.version : 0,
    errors,
  };
}