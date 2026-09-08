import type {
  StatBlock,
  AttackStyle,
  CombatLogEntry,
  CombatEncounter,
  CombatParticipant,
  CombatSummary,
  EncounterResult,
  EnemyDefinition,
  EnemyAbility,
  FoodItem,
  ActiveBuff,
  DeathPenalty,
  EffectResistanceProfile,
  EffectType,
} from '@premium-rpg/shared-types';
import { DEFAULT_DEATH_PENALTY } from '@premium-rpg/shared-types';
import {
  applyEffectFromPreset,
  computeEffectStatModifiers,
  tickEffects,
  applyShieldAbsorption,
} from './effects';
import { EFFECT_DEFINITION_BY_ID } from '@premium-rpg/game-data';

// ─── ATTACK STYLE SCALING ──────────────────────────────────────────

export interface AttackStyleConfig {
  primaryStat: keyof StatBlock;
  secondaryStat: keyof StatBlock;
  accuracyStat: keyof StatBlock;
  evasionStat: keyof StatBlock;
  description: string;
}

export const ATTACK_STYLE_CONFIGS: Record<AttackStyle, AttackStyleConfig> = {
  melee: {
    primaryStat: 'strength',
    secondaryStat: 'vitality',
    accuracyStat: 'accuracy',
    evasionStat: 'evasion',
    description: 'High damage, moderate accuracy. Uses Strength.',
  },
  ranged: {
    primaryStat: 'agility',
    secondaryStat: 'accuracy',
    accuracyStat: 'accuracy',
    evasionStat: 'evasion',
    description: 'High accuracy, moderate damage. Uses Agility.',
  },
  magic: {
    primaryStat: 'intelligence',
    secondaryStat: 'critChance',
    accuracyStat: 'intelligence',
    evasionStat: 'evasion',
    description: 'High crit chance, variable damage. Uses Intelligence.',
  },
};

// ─── ATTACK SPEED ──────────────────────────────────────────────────

// Attacks per second based on attack speed stat
export function getAttacksPerSecond(attackSpeed: number): number {
  // attackSpeed: 1.0 = 1 attack per second (base)
  // higher = faster, lower = slower
  const base = 1.0;
  return Math.max(0.1, base + (attackSpeed - 10) * 0.05);
}

// Time between attacks in seconds
export function getAttackCooldown(attackSpeed: number): number {
  return 1 / getAttacksPerSecond(attackSpeed);
}

// ─── DAMAGE FORMULA ────────────────────────────────────────────────

export function calculateBaseDamage(
  stats: StatBlock,
  attackStyle: AttackStyle
): number {
  const config = ATTACK_STYLE_CONFIGS[attackStyle];
  const primary = stats[config.primaryStat] as number;
  const secondary = stats[config.secondaryStat] as number;
  return primary + Math.floor(secondary * 0.5);
}

export function calculateArmorReduction(
  incomingDamage: number,
  defenderArmor: number,
  defenderDefense: number
): number {
  const totalReduction = defenderArmor + defenderDefense;
  const reductionPercent = Math.min(0.75, totalReduction / (totalReduction + 100));
  const reduced = incomingDamage * (1 - reductionPercent);
  return Math.max(1, Math.floor(reduced));
}

export function calculateDamageRange(
  baseDamage: number,
  isCritical: boolean,
  critDamageBonus: number
): { min: number; max: number; final: number } {
  const min = Math.floor(baseDamage * 0.85);
  const max = Math.ceil(baseDamage * 1.15);
  const critMult = isCritical ? 1.5 + critDamageBonus * 0.01 : 1.0;
  const variance = 0.85 + Math.random() * 0.3;
  const final = Math.max(1, Math.floor(baseDamage * critMult * variance));
  return { min, max, final };
}

// ─── HIT CHANCE ────────────────────────────────────────────────────

export function calculateHitChance(
  attacker: CombatParticipant,
  defender: CombatParticipant
): number {
  const config = ATTACK_STYLE_CONFIGS[attacker.attackStyle];
  const attackerAcc = (attacker.stats[config.accuracyStat] as number) || 0;
  const defenderEvasion = (defender.stats[config.evasionStat] as number) || 0;
  const levelDiff = attacker.level - defender.level;

  const baseHit = 85;
  const evasionFactor = defenderEvasion * 0.15;
  const levelPenalty = levelDiff * 2;
  const accuracyBonus = attacker.effects
    .filter(e => e.id === 'accuracy_buff')
    .reduce((sum, e) => sum + e.intensity, 0);
  const evasionBonus = defender.effects
    .filter(e => e.id === 'evasion_buff')
    .reduce((sum, e) => sum + e.intensity, 0);

  let chance = baseHit - evasionFactor - levelPenalty + accuracyBonus + evasionBonus;
  return Math.max(30, Math.min(98, chance));
}

// ─── CRIT CHANCE ───────────────────────────────────────────────────

export function calculateCritChance(critChance: number, attacker: CombatParticipant): number {
  const critBonus = attacker.effects
    .filter(e => e.id === 'critical_buff')
    .reduce((sum, e) => sum + e.intensity * 2, 0);
  return Math.min(75, critChance + critBonus);
}

// ─── PARTICIPANT CREATION ──────────────────────────────────────────

export function createPlayerParticipant(
  name: string,
  level: number,
  stats: StatBlock,
  health: number,
  attackStyle: AttackStyle = 'melee'
): CombatParticipant {
  return {
    id: 'player',
    name,
    level,
    maxHealth: stats.maxHealth,
    health,
    stats,
    attackStyle,
    buffs: [],
    abilityCooldowns: {},
    effects: [],
    resistanceProfile: { resistances: {}, immunities: [], categoryResistances: {} },
  };
}

export function createEnemyParticipant(enemy: EnemyDefinition): CombatParticipant {
  return {
    id: enemy.id,
    name: enemy.name,
    level: enemy.level,
    maxHealth: enemy.maxHealth,
    health: enemy.maxHealth,
    stats: enemy.stats,
    attackStyle: enemy.attackStyle,
    buffs: [],
    abilityCooldowns: {},
    abilities: enemy.abilities,
    effects: [],
    resistanceProfile: { resistances: {}, immunities: [], categoryResistances: {} },
  };
}

// ─── COMBAT ENCOUNTER ──────────────────────────────────────────────

export function startCombatEncounter(
  player: CombatParticipant,
  enemy: CombatParticipant
): CombatEncounter {
  return {
    player,
    enemy,
    round: 0,
    log: [],
    finished: false,
    result: null,
  };
}

// ─── COMBAT ROUND ──────────────────────────────────────────────────

// How much time passes in this round based on both participants' attack speeds
export function getRoundDuration(
  playerSpeed: number,
  enemySpeed: number
): number {
  // Harmonic mean of attack speeds — faster combatant acts more often
  const avgSpeed = (playerSpeed + enemySpeed) / 2;
  return 1 / avgSpeed; // seconds per round tick
}

export function executeCombatRound(
  encounter: CombatEncounter,
  options: {
    autoEat?: boolean;
    foodItems?: FoodItem[];
    autoEatThreshold?: number;
    maxRounds?: number;
    manualFight?: boolean;
  } = {}
): CombatEncounter {
  if (encounter.finished) return encounter;

  const newEncounter = { ...encounter, round: encounter.round + 1, log: [...encounter.log] };
  const player = { ...newEncounter.player, stats: { ...newEncounter.player.stats }, effects: [...newEncounter.player.effects] };
  const enemy = { ...newEncounter.enemy, stats: { ...newEncounter.enemy.stats }, effects: [...newEncounter.enemy.effects] };

  // Tick effects on player and enemy
  const playerTick = tickEffects(player.effects, player.stats);
  const enemyTick = tickEffects(enemy.effects, enemy.stats);
  newEncounter.log.push(...playerTick.log.map((text, i) => ({
    tick: newEncounter.log.length + i,
    actor: 'system' as const,
    text,
    type: 'effect' as const,
  })));
  newEncounter.log.push(...enemyTick.log.map((text, i) => ({
    tick: newEncounter.log.length + playerTick.log.length + i,
    actor: 'system' as const,
    text,
    type: 'effect' as const,
  })));

  // Apply effect stat modifiers to combat stats for this round
  const playerMods = computeEffectStatModifiers(player.effects);
  const enemyMods = computeEffectStatModifiers(enemy.effects);
  player.stats = applyStatModifiers(player.stats, playerMods);
  enemy.stats = applyStatModifiers(enemy.stats, enemyMods);

  // Check stun before attacks
  if (playerMods.preventsAttack) {
    newEncounter.log.push({ tick: newEncounter.log.length,
      actor: 'system' as const,
      text: `${player.name} is stunned and cannot attack!`,
      type: 'effect' as const,
    });
  } else {
    // Player attacks (only in manual fight mode or if not auto-repeating)
    if (!options.manualFight || newEncounter.round % 2 === 1) {
      const playerAttack = resolveAttack(player, enemy, newEncounter.round);
      newEncounter.log.push(...playerAttack.log);

      // Apply shield absorption on enemy
      const enemyShield = applyShieldAbsorption(enemy.effects, playerAttack.damageDealt, playerAttack.damageTags);
      newEncounter.log.push(...enemyShield.log.map((text, i) => ({
        tick: newEncounter.log.length + i,
        actor: 'system' as const,
        text,
        type: 'effect' as const,
      })));
      enemy.health = Math.max(0, enemy.health - enemyShield.damageAfterShield);
    }
  }

  // Check enemy death
  if (enemy.health <= 0) {
    newEncounter.enemy = enemy;
    newEncounter.log.push({ tick: newEncounter.log.length,
      actor: 'system' as const,
      text: `${enemy.name} has been defeated!`,
      type: 'death' as const,
    });
    newEncounter.finished = true;
    newEncounter.result = 'victory';
    return newEncounter;
  }

  if (enemyMods.preventsAttack) {
    newEncounter.log.push({ tick: newEncounter.log.length,
      actor: 'system' as const,
      text: `${enemy.name} is stunned and cannot attack!`,
      type: 'effect' as const,
    });
  } else {
    // Enemy attacks
    const enemyAttack = resolveAttack(enemy, player, newEncounter.round);
    newEncounter.log.push(...enemyAttack.log);

    // Apply shield absorption on player
    const playerShield = applyShieldAbsorption(player.effects, enemyAttack.damageDealt, enemyAttack.damageTags);
    newEncounter.log.push(...playerShield.log.map((text, i) => ({
      tick: newEncounter.log.length + i,
      actor: 'system' as const,
      text,
      type: 'effect' as const,
    })));
    player.health = Math.max(0, player.health - playerShield.damageAfterShield);
  }

  // Check player death
  if (player.health <= 0) {
    newEncounter.player = player;
    newEncounter.enemy = enemy;
    newEncounter.log.push({ tick: newEncounter.log.length,
      actor: 'system' as const,
      text: `${player.name} has been defeated!`,
      type: 'death' as const,
    });
    newEncounter.finished = true;
    newEncounter.result = 'defeat';
    return newEncounter;
  }

  // Process enemy abilities
  const abilityResult = processEnemyAbilities(enemy, player, newEncounter.round);
  newEncounter.log.push(...abilityResult.log);

  if (abilityResult.damageDealt > 0) {
    const playerShield = applyShieldAbsorption(player.effects, abilityResult.damageDealt, abilityResult.damageTags);
    newEncounter.log.push(...playerShield.log.map((text, i) => ({
      tick: newEncounter.log.length + i,
      actor: 'system' as const,
      text,
      type: 'effect' as const,
    })));
    player.health = Math.max(0, player.health - playerShield.damageAfterShield);
    if (player.health <= 0) {
      newEncounter.player = player;
      newEncounter.enemy = enemy;
      newEncounter.log.push({ tick: newEncounter.log.length,
        actor: 'system' as const,
        text: `${player.name} has been defeated!`,
        type: 'death' as const,
      });
      newEncounter.finished = true;
      newEncounter.result = 'defeat';
      return newEncounter;
    }
  }

  if (abilityResult.healing > 0) {
    enemy.health = Math.min(enemy.maxHealth, enemy.health + abilityResult.healing);
  }

  // Apply effects from abilities
  for (const applied of abilityResult.effectsApplied) {
    const target = applied.target === 'player' ? player : enemy;
    const result = applyEffectFromPreset(target.effects, applied.effectType, {
      source: applied.source,
      sourceId: applied.sourceId,
      baseIntensity: applied.intensity,
      baseDuration: applied.duration,
      chance: applied.chance,
      round: newEncounter.round,
    }, target.resistanceProfile);
    if (result.ok) {
      newEncounter.log.push({ tick: newEncounter.log.length,
        actor: 'system' as const,
        text: `${target.name} gains ${EFFECT_DEFINITION_BY_ID[applied.effectType].name} (${result.effect.stacks} stack${result.effect.stacks > 1 ? 's' : ''}).`,
        type: 'effect' as const,
      });
    }
  }

  newEncounter.player = player;
  newEncounter.enemy = enemy;

  return newEncounter;
}

// Helper: apply effect stat modifiers to a stat block
function applyStatModifiers(stats: StatBlock, mods: import('./effects').EffectStatModifiers): StatBlock {
  const result = { ...stats };
  // Flat modifiers
  for (const [key, value] of Object.entries(mods.flat)) {
    result[key as keyof StatBlock] = Math.max(0, (result[key as keyof StatBlock] ?? 0) + value);
  }
  // Percent modifiers
  for (const [key, value] of Object.entries(mods.percent)) {
    const base = result[key as keyof StatBlock] ?? 0;
    result[key as keyof StatBlock] = Math.max(0, Math.floor(base * (1 + value)));
  }
  return result;
}

// ─── ATTACK RESOLUTION ─────────────────────────────────────────────

function resolveAttack(
  attacker: CombatParticipant,
  defender: CombatParticipant,
  round: number
): { damageDealt: number; log: CombatLogEntry[]; damageTags: string[] } {
  const log: CombatLogEntry[] = [];
  const tick = round;

  // Calculate hit chance (uses extended stats which include effect modifiers)
  const hitChance = calculateHitChance(attacker, defender);
  const hitRoll = Math.random() * 100;
  const hit = hitRoll <= hitChance;

  if (!hit) {
    log.push({
      tick,
      actor: attacker.id === 'player' ? 'player' : 'enemy',
      text: `${attacker.name}'s attack misses ${defender.name}!`,
      type: 'miss' as const,
    });
    return { damageDealt: 0, log, damageTags: [] };
  }

  // Calculate critical
  const critChance = calculateCritChance(attacker.stats.critChance, attacker);
  const critRoll = Math.random() * 100;
  const critical = critRoll <= critChance;

  // Calculate damage
  const baseDamage = calculateBaseDamage(attacker.stats, attacker.attackStyle);
  const { final: rawDamage } = calculateDamageRange(baseDamage, critical, attacker.stats.critDamage);

  // Armor reduction from effects (replaces old armor_reduction buff)
  const armorReduction = attacker.effects
    .filter(e => e.id === 'armor_reduction')
    .reduce((sum, e) => sum + e.intensity, 0);
  const effectiveArmor = Math.max(0, defender.stats.armor - armorReduction);
  const damage = calculateArmorReduction(rawDamage, effectiveArmor, defender.stats.defense);

// Determine damage tags for shield interaction
  const damageTags: string[] = [attacker.attackStyle];
  if (attacker.attackStyle === 'magic') damageTags.push('magic', 'spell');

  const attackerName = attacker.id === 'player' ? attacker.name : attacker.name;
  const defenderName = defender.id === 'player' ? defender.name : defender.name;

  if (critical) {
    log.push({
      tick,
      actor: attacker.id === 'player' ? 'player' : 'enemy',
      text: `${attackerName} lands a CRITICAL HIT on ${defenderName} for ${damage} damage!`,
      isCritical: true,
      type: 'damage' as const,
    });
  } else {
    log.push({
      tick,
      actor: attacker.id === 'player' ? 'player' : 'enemy',
      text: `${attackerName} hits ${defenderName} for ${damage} damage.`,
      type: 'damage' as const,
    });
  }

  return { damageDealt: damage, log, damageTags };
}

// ─── BUFF TICKING ──────────────────────────────────────────────────

// ─── ENEMY ABILITY PROCESSING ──────────────────────────────────────

interface AbilityEffectApplication {
  target: 'player' | 'enemy';
  effectType: EffectType;
  source: 'player' | 'enemy' | 'item' | 'food' | 'ability' | 'environment';
  sourceId: string;
  intensity: number;
  duration: number;
  chance: number;
}

interface EnemyAbilityApplication {
  target: 'player' | 'enemy';
  effectType: EffectType;
  source: 'ability' | 'item' | 'food';
  sourceId: string;
  intensity: number;
  duration: number;
  chance: number;
}

function resolveStatusEffect(type: EnemyAbility['type']): EffectType {
  switch (type) {
    case 'stun': return 'stun';
    case 'buff': return 'damage_buff';
    case 'debuff': return 'slow';
    case 'dot': return 'poison';
    default: return 'stun';
  }
}

function processEnemyAbilities(
  enemy: CombatParticipant,
  player: CombatParticipant,
  round: number
): { damageDealt: number; healing: number; log: CombatLogEntry[]; effectsApplied: AbilityEffectApplication[]; damageTags: string[] } {
  const result: { damageDealt: number; healing: number; log: CombatLogEntry[]; effectsApplied: AbilityEffectApplication[]; damageTags: string[] } = { damageDealt: 0, healing: 0, log: [], effectsApplied: [], damageTags: [] };

  // Process each of the enemy's abilities
  for (const ability of enemy.abilities ?? []) {
    // Check cooldown
    const cooldownKey = ability.id;
    if (enemy.abilityCooldowns[cooldownKey] && enemy.abilityCooldowns[cooldownKey] > round) {
      continue; // On cooldown this round
    }

    // Check chance to use
    if (ability.chance < 1) {
      const roll = Math.random();
      if (roll > ability.chance) {
        continue; // Doesn't use this ability this round
      }
    }

    switch (ability.type) {
      case 'damage': {
        result.damageDealt += ability.intensity;
        result.log.push({
          tick: round,
          actor: 'enemy',
          text: `${enemy.name} uses ${ability.name} dealing ${ability.intensity} damage!`,
          type: 'damage' as const,
        });
        result.damageTags.push(enemy.attackStyle);
        enemy.abilityCooldowns[ability.id] = round + (ability.cooldown ?? 3);
        break;
      }
      case 'heal': {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + ability.intensity);
        result.healing += ability.intensity;
        result.log.push({
          tick: round,
          actor: 'enemy',
          text: `${enemy.name} uses ${ability.name} healing itself for ${ability.intensity} HP!`,
          type: 'heal' as const,
        });
        enemy.abilityCooldowns[ability.id] = round + (ability.cooldown ?? 3);
        break;
      }
      case 'stun':
      case 'dot':
      case 'buff':
      case 'debuff': {
        // Status abilities funnel through the effects engine. The actual
        // application happens once in `executeCombatRound` via the returned
        // `effectsApplied` list, so a single gate controls the effect.
        const target: 'player' | 'enemy' = ability.type === 'buff' ? 'enemy' : 'player';
        result.effectsApplied.push({
          target,
          effectType: resolveStatusEffect(ability.type),
          source: 'ability',
          sourceId: ability.id,
          intensity: ability.intensity,
          duration: ability.duration ?? 3,
          chance: ability.chance,
        });
        result.log.push({
          tick: round,
          actor: 'enemy',
          text: `${enemy.name} uses ${ability.name}.`,
          type: 'effect' as const,
        });
        enemy.abilityCooldowns[ability.id] = round + (ability.cooldown ?? 3);
        break;
      }
    }
  }

  return result;
}

// ─── FOOD / HEALING ───────────────────────────────────────────────

export function useFood(
  participant: CombatParticipant,
  food: FoodItem
): { healed: number; log: CombatLogEntry[] } {
  const log: CombatLogEntry[] = [];
  const healAmount = food.healAmount + Math.floor(participant.maxHealth * (food.healPercent ?? 0) / 100);
  const actualHeal = Math.min(healAmount, participant.maxHealth - participant.health);
  participant.health = Math.min(participant.maxHealth, participant.health + healAmount);

  log.push({ tick: 0,
    actor: participant.id === 'player' ? 'player' : 'enemy',
    text: `${participant.name} eats ${food.itemId} and heals ${actualHeal} HP.`,
    type: 'food' as const,
  });

  return { healed: actualHeal, log };
}

export function shouldAutoEat(
  participant: CombatParticipant,
  threshold: number = 30
): boolean {
  return (participant.health / participant.maxHealth) * 100 <= threshold;
}

export function findBestFood(
  foods: FoodItem[],
  participant: CombatParticipant,
  currentHealthPercent: number
): FoodItem | null {
  const needed = participant.maxHealth - participant.health;
  const sorted = [...foods].sort((a, b) => {
    const aHeal = a.healAmount + Math.floor(participant.maxHealth * (a.healPercent ?? 0) / 100);
    const bHeal = b.healAmount + Math.floor(participant.maxHealth * (b.healPercent ?? 0) / 100);
    return Math.abs(aHeal - needed) - Math.abs(bHeal - needed);
  });
  return sorted[0] ?? null;
}

// ─── RETREAT ───────────────────────────────────────────────────────

export function calculateRetreatChance(
  player: CombatParticipant,
  enemy: CombatParticipant
): number {
  const levelDiff = enemy.level - player.level;
  const baseChance = 70;
  const levelPenalty = levelDiff * 5;
  const evasionBonus = (player.stats.evasion || 0) * 0.5;
  return Math.max(10, Math.min(95, baseChance - levelPenalty + evasionBonus));
}

export function attemptRetreat(
  encounter: CombatEncounter
): { success: boolean; log: CombatLogEntry[] } {
  const log: CombatLogEntry[] = [];
  const chance = calculateRetreatChance(encounter.player, encounter.enemy);
  const roll = Math.random() * 100;
  const success = roll <= chance;

  if (success) {
    log.push({ tick: encounter.log.length,
      actor: 'player',
      text: `${encounter.player.name} successfully retreats from ${encounter.enemy.name}!`,
      type: 'retreat' as const,
    });
  } else {
    log.push({ tick: encounter.log.length,
      actor: 'system' as const,
      text: `${encounter.player.name} fails to retreat!`,
      type: 'retreat' as const,
    });
    const counterAttack = resolveAttack(encounter.enemy, encounter.player, encounter.round);
    log.push(...counterAttack.log);
  }

  return { success, log };
}

// ─── DEATH CONSEQUENCES ───────────────────────────────────────────

export function calculateDeathPenalty(
  participant: CombatParticipant,
  penalty: DeathPenalty = DEFAULT_DEATH_PENALTY
): { xpLoss: number; goldLoss: number } {
  const xpLoss = Math.floor(participant.stats.maxHealth * penalty.xpLossPercent / 100);
  const goldLoss = 0;
  return { xpLoss, goldLoss };
}

export function applyDeathPenalty(
  xp: number,
  gold: number,
  penalty: DeathPenalty = DEFAULT_DEATH_PENALTY
): { xp: number; gold: number; xpLost: number; goldLost: number } {
  const xpLost = Math.floor(xp * penalty.xpLossPercent / 100);
  const goldLost = Math.floor(gold * penalty.goldLossPercent / 100);
  return {
    xp: Math.max(0, xp - xpLost),
    gold: Math.max(0, gold - goldLost),
    xpLost,
    goldLost,
  };
}

// ─── DANGER ESTIMATION ────────────────────────────────────────────

export type DangerLevel = 'safe' | 'low' | 'medium' | 'high' | 'deadly';

export interface DangerAssessment {
  level: DangerLevel;
  score: number; // 0-100
  factors: string[];
}

export function estimateDanger(
  player: CombatParticipant,
  enemy: EnemyDefinition
): DangerAssessment {
  const factors: string[] = [];
  let score = 0;

  const levelDiff = enemy.level - player.level;
  if (levelDiff > 10) { score += 40; factors.push(`Enemy is ${levelDiff} levels higher`); }
  else if (levelDiff > 5) { score += 25; factors.push(`Enemy is ${levelDiff} levels higher`); }
  else if (levelDiff > 0) { score += 10; factors.push(`Enemy is slightly higher level`); }
  else if (levelDiff < -10) { score -= 20; factors.push('Enemy is much lower level'); }

  const playerDps = calculateBaseDamage(player.stats, player.attackStyle);
  const enemyDps = calculateBaseDamage(enemy.stats, enemy.attackStyle);
  const playerTimeToKill = enemy.maxHealth / Math.max(1, playerDps);
  const enemyTimeToKill = player.stats.maxHealth / Math.max(1, enemyDps);

  if (enemyTimeToKill < playerTimeToKill * 0.5) {
    score += 30; factors.push('Enemy kills you much faster than you kill it');
  } else if (enemyTimeToKill < playerTimeToKill) {
    score += 15; factors.push('Enemy kills you faster than you kill it');
  }

  if (enemy.category === 'boss') { score += 25; factors.push('Boss enemy'); }
  else if (enemy.category === 'elite') { score += 15; factors.push('Elite enemy'); }
  else if (enemy.category === 'rare') { score += 10; factors.push('Rare enemy'); }
  if (enemy.abilities.length > 3) { score += 10; factors.push('Many enemy abilities'); }
  if (enemy.stats.armor > player.stats.armor * 2) { score += 10; factors.push('Enemy has high armor'); }

  score = Math.max(0, Math.min(100, score));

  let level: DangerLevel;
  if (score <= 15) level = 'safe';
  else if (score <= 35) level = 'low';
  else if (score <= 55) level = 'medium';
  else if (score <= 75) level = 'high';
  else level = 'deadly';

  return { level, score, factors };
}

// ─── ENEMY PREVIEW ─────────────────────────────────────────────────

export interface EnemyPreview {
  name: string;
  level: number;
  category: string;
  maxHealth: number;
  attackStyle: AttackStyle;
  stats: {
    strength: number;
    armor: number;
    accuracy: number;
    evasion: number;
  };
  abilities: { name: string; description: string }[];
  estimatedDps: number;
}

export function previewEnemy(
  enemy: EnemyDefinition,
  playerAttackStyle: AttackStyle
): EnemyPreview {
  const estimatedDps = calculateBaseDamage(enemy.stats, enemy.attackStyle);
  return {
    name: enemy.name,
    level: enemy.level,
    category: enemy.category,
    maxHealth: enemy.maxHealth,
    attackStyle: enemy.attackStyle,
    stats: {
      strength: enemy.stats.strength,
      armor: enemy.stats.armor,
      accuracy: enemy.stats.accuracy,
      evasion: enemy.stats.evasion,
    },
    abilities: enemy.abilities.map(a => ({ name: a.name, description: a.description })),
    estimatedDps,
  };
}

// ─── COMBAT LOOP (full encounter) ─────────────────────────────────

export function runFullCombatEncounter(
  player: CombatParticipant,
  enemy: EnemyDefinition,
  options: {
    autoEat?: boolean;
    foodItems?: FoodItem[];
    autoEatThreshold?: number;
    maxRounds?: number;
    manualFight?: boolean;
  } = {}
): CombatSummary {
  const maxRounds = options.maxRounds ?? 100;
  const enemyParticipant = createEnemyParticipant(enemy);
  let encounter = startCombatEncounter(player, enemyParticipant);

  let totalDamageDealt = 0;
  let totalDamageTaken = 0;

  while (!encounter.finished && encounter.round < maxRounds) {
    const prevPlayerHealth = encounter.player.health;
    const prevEnemyHealth = encounter.enemy.health;

    encounter = executeCombatRound(encounter, options);

    // Track damage
    totalDamageDealt += Math.max(0, prevEnemyHealth - encounter.enemy.health);
    totalDamageTaken += Math.max(0, prevPlayerHealth - encounter.player.health);

    // Auto-eat
    if (options.autoEat && options.foodItems && !encounter.finished) {
      if (shouldAutoEat(encounter.player, options.autoEatThreshold ?? 30)) {
        const food = findBestFood(options.foodItems, encounter.player, (encounter.player.health / encounter.player.maxHealth) * 100);
        if (food) {
          const result = useFood(encounter.player, food);
          encounter.log.push(...result.log);
        }
      }
    }
  }

  // Build summary
  const summary: CombatSummary = {
    result: encounter.result ?? 'defeat',
    rounds: encounter.round,
    damageDealt: totalDamageDealt,
    damageTaken: totalDamageTaken,
    playerHealthRemaining: encounter.player.health,
    xpGained: encounter.result === 'victory' ? enemy.xpReward : 0,
    goldGained: encounter.result === 'victory' ? enemy.goldReward : 0,
    itemsGained: [],
    log: encounter.log,
  };

  return summary;
}

// ─── COMBAT STAT FORMATTING ────────────────────────────────────────

export function formatCombatTime(rounds: number, attackSpeed: number): string {
  const secondsPerRound = 2.4 / Math.max(0.5, attackSpeed);
  const totalSeconds = Math.ceil(rounds * secondsPerRound);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

export function getCombatStyleEmoji(style: AttackStyle): string {
  const emojis: Record<AttackStyle, string> = {
    melee: '⚔️',
    ranged: '🏹',
    magic: '✨',
  };
  return emojis[style];
}

export function getDangerColor(level: DangerLevel): string {
  const colors: Record<DangerLevel, string> = {
    safe: '#22c55e',
    low: '#84cc16',
    medium: '#eab308',
    high: '#f97316',
    deadly: '#ef4444',
  };
  return colors[level];
}