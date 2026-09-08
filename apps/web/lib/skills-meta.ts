// Skill metadata + action catalogue mapping every SkillId to a playable
// action list (gathering nodes or crafting recipes) from the game engine.

import type { SkillId, CraftingRecipe } from '@premium-rpg/shared-types';
import {
  getNodesForSkill,
  getBestTool,
  formatTimeRemaining,
  getRecipeById,
  SMITHING_RECIPES,
  COOKING_RECIPES,
  FLETCHING_RECIPES,
  ALCHEMY_RECIPES,
  RUNECRAFTING_RECIPES,
} from '@premium-rpg/game-engine';
import {
  LuPickaxe, LuAxe, LuFish, LuFlame, LuHammer,
  LuChefHat, LuTarget, LuFlaskConical, LuGem,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { itemName } from './item-names';

export const SKILL_ORDER: SkillId[] = [
  'mining', 'woodcutting', 'fishing', 'smelting',
  'smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting',
];

export const SKILL_ICONS: Record<SkillId, IconType> = {
  mining: LuPickaxe,
  woodcutting: LuAxe,
  fishing: LuFish,
  smelting: LuFlame,
  smithing: LuHammer,
  cooking: LuChefHat,
  fletching: LuTarget,
  alchemy: LuFlaskConical,
  runecrafting: LuGem,
};

export function skillLabel(id: SkillId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export type ActionKind = 'gathering' | 'crafting';

export interface ActionIngredient {
  itemId: string;
  name: string;
  quantity: number;
}

export interface ActionRow {
  id: string;
  kind: ActionKind;
  name: string;
  levelRequired: number;
  duration: number;
  xp: number;
  toolName: string | null;
  preview: { name: string; qty: string; chance: number; rare: boolean }[];
  ingredients: ActionIngredient[];
  outputs: { name: string; qty: number }[];
  locked: boolean;
}

function gatheringRows(skill: Extract<SkillId, 'mining' | 'woodcutting' | 'fishing'>, level: number): ActionRow[] {
  return getNodesForSkill(skill).map((node) => {
    const tool = getBestTool(skill, level);
    return {
      id: node.id,
      kind: 'gathering',
      name: node.name,
      levelRequired: node.levelRequired,
      duration: node.baseDuration,
      xp: node.baseXp + (tool?.bonus.xpBonus ?? 0),
      toolName: tool?.name ?? null,
      preview: node.resources.map((r) => ({
        name: r.name,
        qty: r.maxQuantity > 1 ? `${r.minQuantity}-${r.maxQuantity}` : '1',
        chance: r.chance,
        rare: r.rare ?? false,
      })),
      ingredients: [],
      outputs: [],
      locked: level < node.levelRequired,
    };
  });
}

function craftingRows(recipes: CraftingRecipe[], level: number): ActionRow[] {
  return recipes.map((r) => ({
    id: r.id,
    kind: 'crafting',
    name: r.name,
    levelRequired: r.levelRequired,
    duration: r.duration,
    xp: r.xp,
    toolName: null,
preview: [],
      ingredients: r.ingredients.map((i) => ({ itemId: i.itemId, name: itemName(i.itemId), quantity: i.quantity })),
      outputs: r.output.map((o) => ({ name: itemName(o.itemId), qty: o.quantity })),
    locked: level < r.levelRequired,
  }));
}

function barsForSmelting(): CraftingRecipe[] {
  return SMITHING_RECIPES.filter((r) => r.output.some((o) => o.itemId.endsWith('_bar')));
}

function gearForSmithing(): CraftingRecipe[] {
  return SMITHING_RECIPES.filter((r) => !r.output.some((o) => o.itemId.endsWith('_bar')));
}

export function actionsForSkill(skill: SkillId, level: number): ActionRow[] {
  switch (skill) {
    case 'mining': return gatheringRows('mining', level);
    case 'woodcutting': return gatheringRows('woodcutting', level);
    case 'fishing': return gatheringRows('fishing', level);
    case 'smelting': return craftingRows(barsForSmelting(), level);
    case 'smithing': return craftingRows(gearForSmithing(), level);
    case 'cooking': return craftingRows(COOKING_RECIPES, level);
    case 'fletching': return craftingRows(FLETCHING_RECIPES, level);
    case 'alchemy': return craftingRows(ALCHEMY_RECIPES, level);
    case 'runecrafting': return craftingRows(RUNECRAFTING_RECIPES, level);
  }
}

export function formatDuration(ms: number): string {
  return formatTimeRemaining(ms);
}

export function actionName(skill: SkillId, kind: ActionKind, nodeId?: string, recipeId?: string): string {
  if (kind === 'gathering' && nodeId && skill !== 'smelting') {
    const node = getNodesForSkill(skill as 'mining' | 'woodcutting' | 'fishing').find((n) => n.id === nodeId);
    if (node) return node.name;
  }
  if (kind === 'crafting' && recipeId) {
    const recipe = getRecipeById(recipeId);
    if (recipe) return recipe.name;
  }
  return nodeId ?? recipeId ?? skillLabel(skill);
}

/**
 * Forge flow: smelt ore into bars first, then the gear recipes beneath them.
 * Keeps the Forge activity playable from bare ore without engine changes.
 */
export function forgeRows(level: number): ActionRow[] {
  return [...craftingRows(barsForSmelting(), level), ...craftingRows(gearForSmithing(), level)];
}