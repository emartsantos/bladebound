'use client';

import type { IconType } from 'react-icons';
import {
  LuSwords, LuTarget, LuSparkles,
  LuSword, LuShield, LuShieldCheck, LuShirt, LuHand, LuBlocks, LuFootprints, LuDiamond, LuGem, LuWind, LuPickaxe,
  LuPackage, LuDrumstick, LuBackpack,
} from 'react-icons/lu';
import type { AttackStyle, SkillId } from '@premium-rpg/shared-types';
import { SKILL_ICONS } from '@/lib/skills-meta';

export const COMBAT_STYLE_ICONS: Record<AttackStyle, IconType> = {
  melee: LuSwords,
  ranged: LuTarget,
  magic: LuSparkles,
};

export function SkillIcon({ id, className }: { id: SkillId; className?: string }) {
  const Icon = SKILL_ICONS[id];
  return <Icon className={className} aria-hidden />;
}

export const EQUIPMENT_SLOT_ICONS: Record<string, IconType> = {
  weapon: LuSword,
  offhand: LuShield,
  helmet: LuShieldCheck,
  chest: LuShirt,
  gloves: LuHand,
  legs: LuBlocks,
  boots: LuFootprints,
  amulet: LuGem,
  ring: LuDiamond,
  cape: LuWind,
};

export const ITEM_KIND_ICONS: Record<string, IconType> = {
  weapon: LuSword,
  armor: LuShirt,
  material: LuPackage,
  food: LuDrumstick,
  potion: LuDrumstick,
  tool: LuPickaxe,
  misc: LuBackpack,
};