// Playable character classes for new-account registration. Each class defines
// identity (name/title/attack style), a starter weapon + chest from real
// `@premium-rpg/game-data` item ids, and a trade-skill lean applied to a newly
// created character so the choice is visible from level 1.

import type { AttackStyle, SkillId } from '@premium-rpg/shared-types';

export type PlayerClassId = 'warrior' | 'ranger' | 'mage';

export interface PlayerClassDefinition {
  id: PlayerClassId;
  name: string;
  title: string;
  description: string;
  attackStyle: AttackStyle;
  weaponId: string;
  chestId: string;
  skillLean: Partial<Record<SkillId, number>>;
}

export const PLAYER_CLASSES: readonly PlayerClassDefinition[] = [
  {
    id: 'warrior',
    name: 'Bladebound',
    title: 'Vanguard of the Embers',
    description: 'A front-line fighter sworn to steel and smithy. Starts with forge-crafting discipline.',
    attackStyle: 'melee',
    weaponId: 'iron_sword',
    chestId: 'iron_platebody',
    skillLean: { smelting: 1, smithing: 1 },
  },
  {
    id: 'ranger',
    name: 'Greycloak',
    title: 'Warden of the Wilds',
    description: 'A woodland hunter and fletcher, at home among the trees of the frontier.',
    attackStyle: 'ranged',
    weaponId: 'iron_sword',
    chestId: 'iron_platebody',
    skillLean: { woodcutting: 1, fletching: 1 },
  },
  {
    id: 'mage',
    name: 'Emberweaver',
    title: 'Keeper of the Arcane',
    description: 'A scholar of flame and essence, drawn to the deeper mysteries of the embers.',
    attackStyle: 'magic',
    weaponId: 'iron_sword',
    chestId: 'iron_platebody',
    skillLean: { alchemy: 1, runecrafting: 1 },
  },
];

export const PLAYER_CLASS_BY_ID: Record<PlayerClassId, PlayerClassDefinition> =
  Object.fromEntries(PLAYER_CLASSES.map((c) => [c.id, c])) as Record<PlayerClassId, PlayerClassDefinition>;

export const DEFAULT_PLAYER_CLASS: PlayerClassId = 'warrior';

export function getPlayerClass(id: string): PlayerClassDefinition {
  return PLAYER_CLASS_BY_ID[id as PlayerClassId] ?? PLAYER_CLASS_BY_ID[DEFAULT_PLAYER_CLASS];
}