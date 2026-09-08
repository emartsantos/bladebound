'use client';

// ────────────────────────────────────────────────────────────
// ACTIVITY CATALOGUE
// Presentation-only config. The presentation layer reacts to this
// config and to game state — it never computes game outcomes.
// Adding a future activity = add one entry here.
// ────────────────────────────────────────────────────────────

import type { IconType } from 'react-icons';
import { LuSwords, LuPickaxe, LuAxe, LuFish, LuFlaskConical, LuHammer } from 'react-icons/lu';
import { getNodesForSkill, SMITHING_RECIPES } from '@premium-rpg/game-engine';
import type { SkillId } from '@premium-rpg/shared-types';

export type ActivityId = 'fighting' | 'mining' | 'woodcutting' | 'fishing' | 'alchemy' | 'forge';

export type ActivityWorkspaceKind = 'fighting' | 'gathering' | 'crafting';

export type ActivityAccent = 'ember' | 'verdant' | 'water' | 'arcane' | 'forge';

export interface ActivityConfig {
  id: ActivityId;
  /** Selector / small labels */
  name: string;
  /** One-line purpose shown under the selector */
  tagline: string;
  /** Hero description copy (short, keeps in-world voice) */
  description: string;
  /** Large display kicker in the hero, e.g. FIGHT / MINE */
  kicker: string;
  icon: IconType;
  /** Backing skill for gathering/crafting activities */
  skill?: SkillId;
  workspace: ActivityWorkspaceKind;
  accent: ActivityAccent;
}

export const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'fighting',
    name: 'Fighting',
    tagline: 'Hunt Monsters',
    description: 'Track the creatures of the Frontier. Steel, blood and ember — nothing more.',
    kicker: 'FIGHT',
    icon: LuSwords,
    workspace: 'fighting',
    accent: 'ember',
  },
  {
    id: 'mining',
    name: 'Mining',
    tagline: 'Extract Resources',
    description: 'Crack ore veins in the low mines. Every strike is heavy and physical.',
    kicker: 'MINE',
    icon: LuPickaxe,
    skill: 'mining',
    workspace: 'gathering',
    accent: 'ember',
  },
  {
    id: 'woodcutting',
    name: 'Woodcutting',
    tagline: 'Gather Logs',
    description: 'Fell frontier timber for bows, frames and the forge bellows.',
    kicker: 'CHOP',
    icon: LuAxe,
    skill: 'woodcutting',
    workspace: 'gathering',
    accent: 'verdant',
  },
  {
    id: 'fishing',
    name: 'Fishing',
    tagline: 'Catch Fish',
    description: 'Work the cold rivers while the moon rides high. Patience is the hook.',
    kicker: 'FISH',
    icon: LuFish,
    skill: 'fishing',
    workspace: 'gathering',
    accent: 'water',
  },
  {
    id: 'alchemy',
    name: 'Alchemy',
    tagline: 'Create Potions',
    description: 'Brew potent draughts from gathered reagents. Method outweighs magic.',
    kicker: 'BREW',
    icon: LuFlaskConical,
    skill: 'alchemy',
    workspace: 'crafting',
    accent: 'arcane',
  },
  {
    id: 'forge',
    name: 'Forge',
    tagline: 'Craft Equipment',
    description: 'Smith steel at the anvil while the coals glow. Heat, hammer, patience.',
    kicker: 'FORGE',
    icon: LuHammer,
    skill: 'smithing',
    workspace: 'crafting',
    accent: 'forge',
  },
];

export const ACTIVITY_BY_ID: Record<ActivityId, ActivityConfig> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a]),
) as Record<ActivityId, ActivityConfig>;

// Reverse maps ingredient items to the activity that produces them, so the
// UI can send a player to the right Trade skill when a craft is short on
// materials (mining/woodcutting/fishing nodes + smithing outputs).
const ITEM_SOURCE: Record<string, ActivityId> = (() => {
  const map: Record<string, ActivityId> = {};
  const collect = (skill: SkillId, activity: ActivityId) => {
    for (const node of getNodesForSkill(skill as 'mining' | 'woodcutting' | 'fishing')) {
      for (const r of node.resources) map[r.itemId] = activity;
    }
  };
  collect('mining', 'mining');
  collect('woodcutting', 'woodcutting');
  collect('fishing', 'fishing');
  for (const recipe of SMITHING_RECIPES) for (const o of recipe.output) map[o.itemId] = 'forge';
  return map;
})();

export function producingActivityFor(itemId: string): ActivityId | null {
  return ITEM_SOURCE[itemId] ?? null;
}