/**
 * Mirror of the basePath in next.config.js. NEXT_PUBLIC_ values are inlined
 * into the browser bundle at build time, so this stays in sync with how the
 * app was actually exported.
 */
const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function assetPath(path: string): string {
  if (!BASE_PATH || !path || !path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}