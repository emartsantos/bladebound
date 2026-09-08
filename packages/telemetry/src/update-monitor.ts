export type PromptDecision = 'prompt' | 'suppress-cooldown' | 'required';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  required: boolean;
}

export interface PromptCheckResult {
  decision: PromptDecision;
  reason: string;
}

export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

export function parseVersion(version: string): number[] {
  const numeric = version.split('-')[0].trim();
  const parts = numeric.split('.');
  if (parts.length === 0 || parts.every((part) => part.trim() === '')) {
    throw new Error(`Invalid version: "${version}"`);
  }
  const parsed = parts.map((part) => {
    if (!/^\d+$/.test(part)) throw new Error(`Invalid version segment: "${part}"`);
    return parseInt(part, 10);
  });
  return parsed;
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

export function checkForUpdate(
  currentVersion: string,
  latestVersion: string,
  minRequiredVersion?: string,
): UpdateCheckResult {
  const required = !!minRequiredVersion && compareVersions(currentVersion, minRequiredVersion) < 0;
  return {
    updateAvailable: isNewerVersion(latestVersion, currentVersion),
    currentVersion,
    latestVersion,
    required,
  };
}

export function shouldPromptUpdate(options: {
  currentVersion: string;
  latestVersion: string;
  minRequiredVersion?: string;
  lastPromptedAt?: number | null;
  now: number;
  cooldownMs: number;
}): PromptCheckResult {
  const { currentVersion, latestVersion, minRequiredVersion, lastPromptedAt, now, cooldownMs } = options;
  const result = checkForUpdate(currentVersion, latestVersion, minRequiredVersion);

  if (result.required) {
    return { decision: 'required', reason: 'current version below minimum required' };
  }
  if (!result.updateAvailable) {
    return { decision: 'suppress-cooldown', reason: 'no update available' };
  }
  if (lastPromptedAt != null && now - lastPromptedAt < cooldownMs) {
    return { decision: 'suppress-cooldown', reason: 'within prompt cooldown' };
  }
  return { decision: 'prompt', reason: 'update available and cooldown elapsed' };
}