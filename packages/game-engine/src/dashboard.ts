// ─── DASHBOARD CONTEXT ENGINE ───────────────────────────────────────
// Computes contextual dashboard panels from player state.
// Each panel is a set of questions + answers, plus typed data for the UI.
// Every question must correspond to something the player actually wants to know.
//
// Pure functions, framework-independent, deterministic given input.

import type {
  DashboardContextInput,
  DashboardPanelData,
  DashboardQuestion,
  GatheringPanelData,
  GatheringResourceRate,
  CombatPanelData,
  CraftingPanelData,
} from '@premium-rpg/shared-types';
import { levelForXp, xpForLevel, xpForNextLevel } from './progression/xp';

// ─── HELPER ─────────────────────────────────────────────────────────

const SECS_PER_HOUR = 3600;
const MS_PER_HOUR = 3_600_000;

function q(question: string, primary: string, opts: Partial<DashboardQuestion> = {}): DashboardQuestion {
  return { question, primary, ...opts };
}

function fmtRate(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

// ─── MAIN ENTRY POINT ───────────────────────────────────────────────

export function buildDashboardPanel(input: DashboardContextInput): DashboardPanelData {
  switch (input.activity) {
    case 'gathering':
      return buildGatheringPanel(input);
    case 'combat':
      return buildCombatPanel(input);
    case 'crafting':
      return buildCraftingPanel(input);
  }
}

// ─── GATHERING PANEL ────────────────────────────────────────────────

function buildGatheringPanel(input: DashboardContextInput): GatheringPanelData {
  const { activeGathering, skills, nextGatheringNode } = input;
  const hours = input.secondsPerHour ?? SECS_PER_HOUR;

  const activeNode = activeGathering
    ? { id: activeGathering.nodeId, name: activeGathering.nodeName }
    : null;

  const toolBonusRaw = activeGathering?.toolBonus ?? null;
  const toolId = activeGathering?.toolId ?? null;
  const speedMult = toolBonusRaw?.speedMultiplier ?? 1;
  const xpBonus = toolBonusRaw?.xpBonus ?? 0;
  const extraChance = toolBonusRaw?.extraResourceChance ?? 0;

  const toolBonus = toolBonusRaw && toolId
    ? { ...toolBonusRaw, toolId }
    : null;

  const timePerActionMs = activeGathering
    ? Math.max(1, Math.round(activeGathering.baseDurationMs / speedMult))
    : 0;

  const xpPerAction = activeGathering
    ? activeGathering.baseXp + xpBonus
    : 0;

  const actionsPerHour = timePerActionMs > 0
    ? Math.floor((hours * MS_PER_HOUR) / timePerActionMs)
    : 0;

  const xpPerHour = xpPerAction * actionsPerHour;

  // Resource rates: expected items per hour per resource.
  const resourceRates: GatheringResourceRate[] = [];
  if (activeGathering) {
    for (const r of activeGathering.resources) {
      const baseRate = r.chance * actionsPerHour * ((r.minQuantity + r.maxQuantity) / 2);
      const rate = Math.round(baseRate * 100) / 100;
      if (rate > 0) {
        resourceRates.push({
          itemId: r.itemId,
          name: r.name,
          perHour: rate,
          rare: r.rare ?? false,
        });
      }
    }
    // Extra resource bonus.
    if (extraChance > 0 && activeGathering.resources.length > 0) {
      const avgResource = activeGathering.resources[Math.floor(extraChance * activeGathering.resources.length)];
      const extraRate = Math.round(extraChance * actionsPerHour * ((avgResource.minQuantity + avgResource.maxQuantity) / 2) * 100) / 100;
      if (extraRate > 0) {
        resourceRates.push({
          itemId: avgResource.itemId,
          name: `${avgResource.name} (bonus)`,
          perHour: extraRate,
          rare: avgResource.rare ?? false,
        });
      }
    }
  }

  const skill = activeGathering?.skill ?? 'mining';
  const skillXp = skills[skill] ?? 0;
  const currentLevel = levelForXp(skillXp);

  // Next unlock.
  let nextUnlock: GatheringPanelData['nextUnlock'] = null;
  if (nextGatheringNode) {
    nextUnlock = {
      target: nextGatheringNode.name,
      requiredLevel: nextGatheringNode.requiredLevel,
      currentLevel,
      xpToUnlock: nextGatheringNode.xpToUnlock,
    };
  }

  // Questions.
  const questions: DashboardQuestion[] = [];

  if (activeNode) {
    questions.push(q('What am I gathering?', activeNode.name, { primary: activeNode.name, supporting: `${skill} level ${currentLevel}` }));
    questions.push(q('How long per action?', formatDuration(timePerActionMs), {
      primary: formatDuration(timePerActionMs),
      supporting: toolBonus ? `${speedMult}x speed from ${toolId}` : 'No tool',
    }));
    questions.push(q('How much XP per hour?', `${fmtRate(xpPerHour)} XP/h`, {
      primary: `${fmtRate(xpPerHour)} XP/h`,
      supporting: `${fmtRate(xpPerAction)} per action`,
      delta: xpPerHour > 0 ? `+${fmtRate(xpPerHour)}/h` : undefined,
    }));
    if (resourceRates.length > 0) {
      const topRate = resourceRates
        .filter((r) => !r.rare)
        .sort((a, b) => b.perHour - a.perHour)[0];
      if (topRate) {
        questions.push(q('How many resources per hour?', `${fmtRate(topRate.perHour)} ${topRate.name}/h`, {
          primary: `${fmtRate(topRate.perHour)} ${topRate.name}/h`,
          supporting: resourceRates.filter((r) => r.rare).length > 0 ? `+ rare drops` : undefined,
        }));
      }
    }
    if (toolBonus) {
      questions.push(q('What is my tool bonus?', `+${xpBonus} XP, ${extraChance * 100}% extra`, {
        primary: `${speedMult}x speed, +${xpBonus} XP`,
        supporting: `Extra resource chance: ${(extraChance * 100).toFixed(0)}%`,
      }));
    }
  } else {
    questions.push(q('What should I do?', 'No gathering action active', {
      primary: 'No gathering action active',
      supporting: `${skill} level ${currentLevel}`,
      tone: 'warning',
    }));
  }

  if (nextUnlock) {
    if (currentLevel >= nextUnlock.requiredLevel) {
      questions.push(q('What can I unlock now?', nextUnlock.target, {
        primary: nextUnlock.target,
        supporting: `Required: ${nextUnlock.requiredLevel} — You: ${currentLevel}`,
        tone: 'good',
        progress: 1,
      }));
    } else {
      const xpCurrent = xpForLevel(currentLevel);
      const xpNeeded = xpForLevel(nextUnlock.requiredLevel);
      const progress = xpNeeded > xpCurrent
        ? Math.min(1, (skillXp - xpCurrent) / (xpNeeded - xpCurrent))
        : 0;
      questions.push(q('What is my next unlock?', nextUnlock.target, {
        primary: nextUnlock.target,
        supporting: `${nextUnlock.requiredLevel} required — ${xpForNextLevel(skillXp)} XP to go`,
        progress,
        tone: progress > 0.8 ? 'good' : 'neutral',
      }));
    }
  }

  return {
    activity: 'gathering',
    skill,
    activeNode,
    timePerActionMs,
    xpPerAction,
    xpPerHour,
    resourceRates,
    toolBonus,
    nextUnlock,
    questions,
  };
}

// ─── COMBAT PANEL ───────────────────────────────────────────────────

function buildCombatPanel(input: DashboardContextInput): CombatPanelData {
  const { combat, recommendedEnemy } = input;
  const questions: DashboardQuestion[] = [];

  if (combat) {
    const playerHpPct = combat.playerMaxHp > 0 ? combat.playerHp / combat.playerMaxHp : 0;
    const enemyHpPct = combat.enemyMaxHp > 0 ? combat.enemyHp / combat.enemyMaxHp : 0;

    questions.push(q('How healthy am I?', `${combat.playerHp}/${combat.playerMaxHp}`, {
      primary: `${combat.playerHp}/${combat.playerMaxHp}`,
      supporting: `${(playerHpPct * 100).toFixed(0)}%`,
      progress: playerHpPct,
      tone: playerHpPct < 0.3 ? 'bad' : playerHpPct < 0.6 ? 'warning' : 'good',
    }));

    questions.push(q('How healthy is the enemy?', `${combat.enemyHp}/${combat.enemyMaxHp}`, {
      primary: `${combat.enemyHp}/${combat.enemyMaxHp}`,
      supporting: combat.enemyName,
      progress: enemyHpPct,
      tone: enemyHpPct < 0.3 ? 'good' : enemyHpPct < 0.6 ? 'neutral' : 'bad',
    }));

    if (combat.attackTimerMs > 0) {
      questions.push(q('When do I attack next?', formatDuration(combat.attackTimerMs), {
        primary: formatDuration(combat.attackTimerMs),
        tone: combat.attackTimerMs < 500 ? 'good' : 'neutral',
      }));
    }

    if (combat.buffs.length > 0) {
      const buffText = combat.buffs
        .map((b) => b.stacks > 1 ? `${b.name} x${b.stacks}` : b.name)
        .join(', ');
      questions.push(q('What active buffs do I have?', buffText, {
        primary: buffText,
        supporting: `${combat.buffs.length} active effect${combat.buffs.length !== 1 ? 's' : ''}`,
      }));
    }

    if (combat.food) {
      questions.push(q('Do I have food?', `${combat.food.name} (x${combat.food.quantity})`, {
        primary: `${combat.food.name} x${combat.food.quantity}`,
        supporting: `Heals ${combat.food.healAmount} HP`,
        tone: combat.food.quantity < 3 ? 'warning' : 'neutral',
      }));
    }

    if (combat.log.length > 0) {
      const lastEntry = combat.log[combat.log.length - 1];
      questions.push(q('What just happened?', lastEntry, {
        primary: lastEntry,
      }));
    }
  } else if (recommendedEnemy) {
    questions.push(q('What should I fight next?', recommendedEnemy.enemyName, {
      primary: recommendedEnemy.enemyName,
      supporting: `Recommended level: ${recommendedEnemy.recommendedLevel} — Region: ${recommendedEnemy.regionId}`,
      tone: input.player.level >= recommendedEnemy.recommendedLevel ? 'good' : 'warning',
    }));
    questions.push(q('Why should I fight it?', recommendedEnemy.bestLoot, {
      primary: recommendedEnemy.bestLoot,
      supporting: 'Best available drop in this region',
    }));
  } else {
    questions.push(q('What should I do?', 'No active combat — visit Adventure to embark.', {
      primary: 'No active combat',
      supporting: 'Visit Adventure to embark',
      tone: 'warning',
    }));
  }

  return {
    activity: 'combat',
    combat: combat ?? null,
    recommended: recommendedEnemy ?? null,
    questions,
  };
}

// ─── CRAFTING PANEL ─────────────────────────────────────────────────

function buildCraftingPanel(input: DashboardContextInput): CraftingPanelData {
  const { activeCrafting, craftingQueueLength, ingredients, nextRecipe, skills } = input;
  const hours = input.secondsPerHour ?? SECS_PER_HOUR;
  const questions: DashboardQuestion[] = [];

  let xpPerHour = 0;
  const activeRecipe = activeCrafting
    ? {
        id: activeCrafting.recipeId,
        name: activeCrafting.recipeName,
        skill: activeCrafting.skill,
        durationMs: activeCrafting.durationMs,
        xpPerCraft: activeCrafting.xp,
      }
    : null;

  if (activeRecipe) {
    const actionsPerHour = activeRecipe.durationMs > 0
      ? Math.floor((hours * MS_PER_HOUR) / activeRecipe.durationMs)
      : 0;
    xpPerHour = activeRecipe.xpPerCraft * actionsPerHour;

    questions.push(q('What am I crafting?', activeRecipe.name, {
      primary: activeRecipe.name,
      supporting: `${activeRecipe.skill} recipe`,
    }));
    questions.push(q('How long per craft?', formatDuration(activeRecipe.durationMs), {
      primary: formatDuration(activeRecipe.durationMs),
      supporting: `${actionsPerHour} crafts/hour`,
    }));
    questions.push(q('How much XP per hour?', `${fmtRate(xpPerHour)} XP/h`, {
      primary: `${fmtRate(xpPerHour)} XP/h`,
      delta: `+${fmtRate(xpPerHour)}/h`,
    }));
    if (craftingQueueLength && craftingQueueLength > 0) {
      questions.push(q('How many in queue?', `${craftingQueueLength} remaining`, {
        primary: `${craftingQueueLength}`,
        supporting: `${formatDuration(activeRecipe.durationMs * craftingQueueLength)} until clear`,
        tone: 'neutral',
      }));
    }
  } else {
    questions.push(q('What should I craft?', 'No active recipe', {
      primary: 'No active recipe',
      supporting: `${(skills)[activeCrafting?.skill ?? 'smithing'] ?? 1} skill level`,
      tone: 'warning',
    }));
  }

  // Ingredient status: report held quantities.  Caller populates `needed`
  // from recipe data when computing the input.
  const ingredientStatus: CraftingPanelData['ingredientStatus'] = [];
  if (ingredients) {
    for (const [itemId, held] of Object.entries(ingredients)) {
      ingredientStatus.push({
        itemId,
        name: itemId.replace(/_/g, ' '),
        held,
        needed: 0,
        sufficient: true,
      });
    }
  }

  if (ingredientStatus.some((i) => !i.sufficient)) {
    const deficit = ingredientStatus.filter((i) => !i.sufficient);
    questions.push(q('Am I missing ingredients?', `${deficit.length} ingredient(s) short`, {
      primary: `${deficit.length} shortage(s)`,
      supporting: deficit.map((d) => `${d.name}: ${d.held}/${d.needed}`).join('; '),
      tone: 'bad',
    }));
  }

  // XP total for session.
  if (activeRecipe && craftingQueueLength) {
    const totalXp = activeRecipe.xpPerCraft * (1 + craftingQueueLength);
    questions.push(q('Total XP from queue?', `${fmtRate(totalXp)} XP`, {
      primary: `${fmtRate(totalXp)} XP`,
      supporting: `${1 + craftingQueueLength} crafts total`,
    }));
  }

  // Next unlock.
  if (nextRecipe) {
    const skill = activeCrafting?.skill ?? 'smithing';
    const skillXp = skills[skill] ?? 0;
    const currentLevel = levelForXp(skillXp);
    if (currentLevel >= nextRecipe.levelRequired) {
      questions.push(q('What recipe unlocks next?', nextRecipe.name, {
        primary: nextRecipe.name,
        supporting: `${nextRecipe.levelRequired} required — You: ${currentLevel}`,
        tone: 'good',
        progress: 1,
      }));
    } else {
      const xpNeeded = xpForLevel(nextRecipe.levelRequired) - skillXp;
      questions.push(q('What recipe unlocks next?', nextRecipe.name, {
        primary: nextRecipe.name,
        supporting: `${nextRecipe.levelRequired} required — ${fmtRate(xpNeeded)} XP to go`,
      }));
    }
  }

  return {
    activity: 'crafting',
    activeRecipe,
    queueLength: craftingQueueLength ?? 0,
    ingredientStatus,
    xpPerHour,
    nextRecipe: nextRecipe ?? null,
    questions,
  };
}

// ─── UTILITIES ──────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

export { formatDuration };
