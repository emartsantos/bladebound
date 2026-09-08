/** Resolve an enemy id to a bundled bestiary medallion. */
import { assetPath } from '@/lib/asset-path';

export function enemyArt(id: string): string | null {
  const lower = id.toLowerCase();

  if (lower.includes('goblin')) return assetPath('/art/enemy-goblin.svg');
  if (lower.includes('troll-king') || lower.includes('forest_troll') || lower.includes('forest-troll')) return assetPath('/art/boss-forest-troll-king.svg');

  // Specific creatures first so broader family names cannot shadow them.
  if (lower.includes('werewolf')) return assetPath('/art/creatures/enemy-werewolf.svg');
  if (lower.includes('count_vlad') || lower.includes('vampire')) return assetPath('/art/creatures/enemy-vampire.svg');
  if (lower.includes('spider')) return assetPath('/art/creatures/enemy-spider.svg');
  if (lower.includes('bat')) return assetPath('/art/creatures/enemy-bat.svg');
  if (lower.includes('golem') || lower.includes('elemental')) return assetPath('/art/creatures/enemy-golem.svg');
  if (lower.includes('serpent') || lower.includes('tyrant_of_the_deep')) return assetPath('/art/creatures/enemy-serpent.svg');
  if (lower.includes('dragon') || lower.includes('drake') || lower.includes('wyvern')) return assetPath('/art/creatures/enemy-dragon.svg');
  if (lower.includes('giant') || lower.includes('mountain_king')) return assetPath('/art/creatures/enemy-giant.svg');
  if (lower.includes('troll')) return assetPath('/art/creatures/enemy-troll.svg');
  if (lower.includes('arch_demon') || lower.includes('pyro_lord') || lower.includes('magma_tyrant')) return assetPath('/art/creatures/enemy-demon.svg');
  if (
    lower.includes('wraith') ||
    lower.includes('shade') ||
    lower.includes('stalker') ||
    lower.includes('reaper') ||
    lower.includes('herald') ||
    lower.includes('unmaker') ||
    lower.includes('void_lord') ||
    lower.includes('time_reaver')
  ) return assetPath('/art/creatures/enemy-wraith.svg');
  if (lower.includes('skeleton') || lower.includes('guardian') || lower.includes('knight')) return assetPath('/art/creatures/enemy-skeleton.svg');
  if (lower.includes('zombie') || lower.includes('ghoul') || lower.includes('lich') || lower.includes('hollow')) return assetPath('/art/creatures/enemy-undead.svg');
  if (lower.includes('wolf')) return assetPath('/art/creatures/enemy-wolf.svg');

  return null;
}
