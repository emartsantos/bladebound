/**
 * Best-effort mapping of enemy id to existing portfolio artwork.
 * Unknown foes fall back to the blade medallion in the UI.
 */
export function enemyArt(id: string): string | null {
  const lower = id.toLowerCase();
  if (lower.includes('goblin')) return '/art/enemy-goblin.svg';
  if (lower.includes('troll-king') || lower.includes('forest_troll') || lower.includes('forest-troll')) return '/art/boss-forest-troll-king.svg';
  return null;
}