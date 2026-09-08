// Typed domain / API errors shared by the auth service, game client and UI.
// UI layers translate a DomainError into a readable message; raw database or
// network errors are never surfaced to players.

export const DOMAIN_ERROR_CODES = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  CHARACTER_NOT_FOUND: 'CHARACTER_NOT_FOUND',
  INVALID_ACTION: 'INVALID_ACTION',
  ACTION_ALREADY_RUNNING: 'ACTION_ALREADY_RUNNING',
  INSUFFICIENT_ITEMS: 'INSUFFICIENT_ITEMS',
  INSUFFICIENT_GOLD: 'INSUFFICIENT_GOLD',
  LEVEL_TOO_LOW: 'LEVEL_TOO_LOW',
  INVALID_EQUIPMENT: 'INVALID_EQUIPMENT',
  ENEMY_NOT_AVAILABLE: 'ENEMY_NOT_AVAILABLE',
  REGION_LOCKED: 'REGION_LOCKED',
  COMBAT_ALREADY_RUNNING: 'COMBAT_ALREADY_RUNNING',
  ACTION_ALREADY_CLAIMED: 'ACTION_ALREADY_CLAIMED',
  INTERNAL: 'INTERNAL',
} as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;

  constructor(code: DomainErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Normalise any thrown value into a DomainError so UI error paths only ever
 * handle one error shape.
 */
export function toDomainError(error: unknown, fallbackCode: DomainErrorCode = DOMAIN_ERROR_CODES.INTERNAL): DomainError {
  if (error instanceof DomainError) return error;
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return new DomainError(fallbackCode, message, error instanceof Error ? undefined : error);
}

/** Human-readable fallback per code; UI may override with tailored copy. */
export const DOMAIN_ERROR_MESSAGES: Record<DomainErrorCode, string> = {
  NOT_AUTHENTICATED: 'You must be signed in to do that.',
  CHARACTER_NOT_FOUND: 'Character not found.',
  INVALID_ACTION: 'That action is not allowed.',
  ACTION_ALREADY_RUNNING: 'Another action is already in progress.',
  INSUFFICIENT_ITEMS: 'You do not have enough items.',
  INSUFFICIENT_GOLD: 'You do not have enough gold.',
  LEVEL_TOO_LOW: 'Your level is too low.',
  INVALID_EQUIPMENT: 'That item cannot be equipped there.',
  ENEMY_NOT_AVAILABLE: 'That enemy is not available.',
  REGION_LOCKED: 'That region is locked.',
  COMBAT_ALREADY_RUNNING: 'A combat encounter is already in progress.',
  ACTION_ALREADY_CLAIMED: 'That reward has already been claimed.',
  INTERNAL: 'Something went wrong. Please try again.',
};