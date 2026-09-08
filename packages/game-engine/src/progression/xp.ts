export const BASE_XP = 52;
export const XP_GROWTH = 1.1;
export const MAX_LEVEL = 99;

// XP growth curve configuration
export const PROGRESSION_CONFIG = {
  baseXp: BASE_XP,
  growthFactor: XP_GROWTH,
  maxLevel: MAX_LEVEL,
};

// Core XP step formula: BASE_XP * level^XP_GROWTH
// This provides an accelerating curve: early levels fast, late levels grind
function xpStepForLevel(skillLevel: number): number {
  return Math.floor(BASE_XP * Math.pow(skillLevel, XP_GROWTH));
}

// Get total XP required for a given level (sum of all steps from 1 to level-1)
// Level 1 requires 0 XP, level 2 requires 1 step, etc.
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new Error(`Invalid level: ${level}`);
  }
  if (level <= 1) return 0;
  let total = 0;
  for (let step = 1; step < level; step += 1) {
    total += xpStepForLevel(step);
  }
  return total;
}

// Get current level from total XP
export function levelForXp(xp: number): number {
  if (xp < 0 || !Number.isFinite(xp)) {
    throw new Error(`Invalid XP: ${xp}`);
  }
  if (xp === 0) return 1;

  let lo = 1;
  let hi = MAX_LEVEL;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midXp = xpForLevel(mid);

    if (midXp <= xp) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return lo - 1;
}

// Get XP required for next level from current XP
export function xpForNextLevel(currentXp: number): number {
  if (currentXp < 0 || !Number.isFinite(currentXp)) {
    throw new Error(`Invalid XP: ${currentXp}`);
  }
  const level = levelForXp(currentXp);
  if (level >= MAX_LEVEL) {
    return 0; // Max level reached
  }
  return xpForLevel(level + 1) - currentXp;
}

// Gain experience - returns new XP, new level, levels gained, xp to next level
export function gainExperience(
  currentXp: number,
  amount: number
): { newXp: number; newLevel: number; levelsGained: number; xpToNextLevel: number } {
  if (amount < 0 || !Number.isFinite(amount)) {
    throw new Error(`Invalid XP gain amount: ${amount}`);
  }
  if (currentXp < 0 || !Number.isFinite(currentXp)) {
    throw new Error(`Invalid current XP: ${currentXp}`);
  }

  const oldLevel = levelForXp(currentXp);
  const newXp = currentXp + amount;
  const newLevel = levelForXp(newXp);
  const levelsGained = newLevel - oldLevel;
  const xpToNextLevel = xpForNextLevel(newXp);

  return { newXp, newLevel, levelsGained, xpToNextLevel };
}

// Skill progression data structure
export interface SkillProgression {
  name: string;
  level: number;
  currentXp: number;
  totalXp: number; // XP accumulated for this skill
  xpToNextLevel: number;
  progressPercentage: number; // 0-100
}

// Create a new skill progression at level 1 with 0 XP
export function createSkillProgression(
  name: string
): SkillProgression {
  return {
    name,
    level: 1,
    currentXp: 0,
    totalXp: 0,
    xpToNextLevel: xpForLevel(2), // XP needed to reach level 2
    progressPercentage: 0,
  };
}

// Character progression data structure
export interface CharacterProgression {
  characterLevel: number;
  currentXp: number;
  totalXp: number; // XP accumulated across all sources
  xpToNextLevel: number;
  progressPercentage: number; // 0-100
  skills: Record<string, SkillProgression>;
  totalLevel: number; // Sum of all skill levels + base contribution
}

// Create a new skill progression at level 1 with 0 XP (internal helper)
function createSkillProgression__internal(
  name: string
): SkillProgression {
  return {
    name,
    level: 1,
    currentXp: 0,
    totalXp: 0,
    xpToNextLevel: xpForLevel(2),
    progressPercentage: 0,
  };
}

// Create a character progression with default skills
export function createCharacterProgression(
  skillNames: string[] = [
    'mining', 'woodcutting', 'fishing', 'combat', 'defense',
  ]
): CharacterProgression {
  const skills: Record<string, SkillProgression> = {} as Record<string, SkillProgression>;

  for (const skillName of skillNames) {
    skills[skillName] = createSkillProgression__internal(skillName);
  }

  const totalSkillLevels = Object.values(skills).reduce(
    (sum, skill) => sum + skill.level,
    0
  );

  // Character level based on average of skill levels
  const charLevel = Math.min(
    MAX_LEVEL,
    Math.max(1, Math.floor(totalSkillLevels / skillNames.length))
  );

  const currentXp = xpForLevel(charLevel);
  const nextLevelXp = xpForLevel(charLevel + 1 || 1);
  const progressPercentage = charLevel > 0
    ? ((currentXp - xpForLevel(Math.max(1, charLevel - 1))) /
       (nextLevelXp - xpForLevel(Math.max(1, charLevel - 1)) || 1) * 100)
    : 0;

  return {
    characterLevel: charLevel,
    currentXp,
    totalXp: currentXp,
    xpToNextLevel: nextLevelXp - currentXp,
    progressPercentage,
    skills,
    totalLevel: totalSkillLevels,
  };
}

// Level up a single skill
export function levelUpSkill(
  skillProgression: SkillProgression,
  amount: number = 1
): SkillProgression {
  const { newXp, newLevel, levelsGained } = gainExperience(
    skillProgression.currentXp,
    amount
  );

  return {
    ...skillProgression,
    currentXp: newXp,
    level: newLevel,
    xpToNextLevel: xpForNextLevel(newXp),
    progressPercentage: newLevel > 1
      ? ((newXp - xpForLevel(newLevel - 1)) /
         (xpForLevel(newLevel) - xpForLevel(newLevel - 1)) * 100)
      : 0,
  };
}

// Level up character with XP gains per skill
export function levelUpCharacter(
  progression: CharacterProgression,
  skillXpGains: Record<string, number>
): CharacterProgression {
  let totalLevelsGained = 0;
  const newSkills: Record<string, SkillProgression> = {} as Record<string, SkillProgression>;

  // Apply XP gains to each skill
  for (const [skillName, xpGain] of Object.entries(skillXpGains)) {
    if (progression.skills[skillName]) {
      const leveledUp = levelUpSkill(progression.skills[skillName], xpGain);
      newSkills[skillName] = leveledUp;
      totalLevelsGained += leveledUp.level - progression.skills[skillName].level;
    } else {
      newSkills[skillName] = createSkillProgression__internal(skillName);
    }
  }

  // Include any skills not in the gain dict
  for (const [skillName, skillProgression] of Object.entries(progression.skills)) {
    if (!(skillName in newSkills)) {
      newSkills[skillName] = skillProgression;
    }
  }

  // Recompute character level based on all skill levels
  const totalSkillLevels = Object.values(newSkills).reduce(
    (sum, skill) => sum + skill.level,
    0
  );

  const charLevel = Math.min(
    MAX_LEVEL,
    Math.max(1, Math.floor(totalSkillLevels / Object.keys(newSkills).length))
  );

  const currentXp = xpForLevel(charLevel);
  const nextLevelXp = xpForLevel(charLevel + 1 || 1);
  const progressPercentage = charLevel > 0
    ? ((currentXp - xpForLevel(Math.max(1, charLevel - 1))) /
       (nextLevelXp - xpForLevel(Math.max(1, charLevel - 1)) || 1) * 100)
    : 0;

  return {
    characterLevel: charLevel,
    currentXp,
    totalXp: currentXp,
    xpToNextLevel: nextLevelXp - currentXp,
    progressPercentage,
    skills: newSkills,
    totalLevel: totalSkillLevels,
  };
}

// Reset a skill to level 1 with 0 XP
export function resetSkillXp(
  skillProgression: SkillProgression
): SkillProgression {
  return createSkillProgression__internal(skillProgression.name);
}

// Reset character progression
export function resetCharacterXp(
  progression: CharacterProgression,
  skillNames: string[] = [
    'mining', 'woodcutting', 'fishing', 'combat', 'defense',
  ]
): CharacterProgression {
  const skills: Record<string, SkillProgression> = {} as Record<string, SkillProgression>;

  for (const skillName of skillNames) {
    skills[skillName] = createSkillProgression__internal(skillName);
  }

  return createCharacterProgression(skillNames);
}

// Simulate XP gain (for development/tools)
export function simulateXpGain(
  currentXp: number,
  amount: number,
  skillNames: string[] = [
    'mining', 'woodcutting', 'fishing', 'combat', 'defense',
]
): {
  newProgression: CharacterProgression;
  wouldLevelUp: boolean;
  levelsGained: number;
} {
  const { newLevel, levelsGained, newXp } = gainExperience(currentXp, amount);
  const wouldLevelUp = levelsGained > 0;

  const newProgression = createCharacterProgression(skillNames);
  newProgression.currentXp = newLevel > 0 ? newXp : currentXp;
  newProgression.totalXp = newProgression.currentXp;
  newProgression.xpToNextLevel = xpForNextLevel(newProgression.currentXp);

  return { newProgression, wouldLevelUp, levelsGained };
}