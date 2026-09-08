export type SkillId =
  | 'mining'
  | 'woodcutting'
  | 'fishing'
  | 'smelting'
  | 'smithing'
  | 'cooking'
  | 'fletching'
  | 'alchemy'
  | 'runecrafting';

export interface SkillLevel {
  level: number;
  xp: number;
}