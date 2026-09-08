'use client';

import { useMemo } from 'react';
import type { CombatParticipant, EnemyCategory, BaseStats, StatBlock } from '@premium-rpg/shared-types';
import { ALL_REGIONS, ALL_ENEMIES } from '@premium-rpg/game-data';
import {
  createPlayerParticipant,
  estimateDanger,
  type DangerLevel,
} from '@premium-rpg/game-engine';
import { LuMap, LuLock, LuPause, LuPlay, LuBed, LuDrumstick, LuSkull, LuSwords, LuCrown, LuScrollText, LuX } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useGame } from '@/lib/game-state';
import { usePlayer } from '@/lib/use-player';
import { assetPath } from '@/lib/asset-path';
import { xpStepForLevel } from '@/lib/game/service';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { COMBAT_STYLE_ICONS } from '@/components/game/icons';
import { SectionHeader, Panel, PanelLabel, Bar, BarLabel, GameButton, EmptyState } from '@/components/game/primitives';

// Bar-math uses the engine XP step (BASE_XP * level^XP_GROWTH), the single source of truth.

const CATEGORY_LABEL: Record<EnemyCategory, string> = {
  normal: 'Common',
  elite: 'Elite',
  rare: 'Rare',
  boss: 'Boss',
};

const CATEGORY_ICON: Record<EnemyCategory, IconType> = {
  normal: LuSwords,
  elite: LuSkull,
  rare: LuCrown,
  boss: LuCrown,
};

const CATEGORY_COLOR: Record<EnemyCategory, string> = {
  normal: '#6b6660',
  elite: '#65758a',
  rare: '#b08754',
  boss: '#d4692f',
};

const DANGER_TEXT: Record<DangerLevel, string> = {
  safe: 'text-verdant',
  low: 'text-verdantBright',
  medium: 'text-amber',
  high: 'text-emberLight',
  deadly: 'text-dangerBright',
};

function enemyArt(id: string): string | null {
  const lower = id.toLowerCase();
  if (lower.includes('goblin')) return assetPath('/art/enemy-goblin.svg');
  if (lower.includes('troll-king') || lower.includes('forest_troll') || lower.includes('forest-troll')) return assetPath('/art/boss-forest-troll-king.svg');
  return null;
}

function toStatBlock(stats: BaseStats): StatBlock {
  return { ...stats, damage: Math.floor(stats.strength * 0.9), defense: Math.floor(stats.armor * 0.6) };
}

export function AdventureSection() {
  const { player } = usePlayer();
  const game = useGame();
  const { state, stats, maxHealth, fight, toggleAutoFight, toggleRest, eatFood, clearCombatLog, setCombatTarget } = game;

  const combat = state.combat;
  const enemy = useMemo(() => ALL_ENEMIES.find((e) => e.id === combat.enemyId) ?? null, [combat.enemyId]);
  const enemiesByRegion = useMemo(() => {
    const map = new Map<string, typeof ALL_ENEMIES>();
    for (const e of ALL_ENEMIES) {
      const list = map.get(e.regionId) ?? [];
      list.push(e);
      map.set(e.regionId, list);
    }
    return map;
  }, []);

  const participant = (hp: number): CombatParticipant =>
    createPlayerParticipant(player.name, state.combatLevel, toStatBlock(stats), hp, 'melee');

  const danger = enemy ? estimateDanger(participant(maxHealth), enemy) : null;
  const FocusStyleIcon = enemy ? COMBAT_STYLE_ICONS[enemy.attackStyle] : LuSwords;

  // Combat XP progress
  const combatInto = state.combatXp - cumulativeXpForLevel(state.combatLevel);
  const combatNeed = xpStepForLevel(state.combatLevel);
  const combatPct = Math.min(100, Math.round((combatInto / combatNeed) * 100));

  const foodCount = game.foods.reduce((sum, f) => sum + (state.inventory[f.itemId] ?? 0), 0);
  const hpPct = Math.max(0, Math.min(100, Math.round((combat.playerHp / maxHealth) * 100)));
  const enemyHpPct = enemy ? Math.max(0, Math.min(100, Math.round((combat.enemyHp / enemy.maxHealth) * 100))) : 100;
  const enemyHp = enemy ? Math.min(combat.enemyHp, enemy.maxHealth) : 0;
  const fightActive = combat.encounter !== null && !combat.encounter.finished;
  const isInCombat = combat.autoFight || combat.resting || fightActive;

  const statusText = combat.resting
    ? 'Resting — healing in camp'
    : fightActive
      ? `In battle — round ${combat.encounter?.round ?? 1}`
      : combat.autoFight
        ? 'Auto-fighting — hunting has begun'
        : null;

  return (
    <div className="max-w-5xl space-y-4">
      <SectionHeader
        title="Adventure"
        eyebrow="The Hunt"
        actions={
          <div className="flex items-center gap-3 text-[11px] text-mist">
            <span>Kills <span className="font-semibold text-bone tabular-nums">{combat.sessionKills}</span></span>
            <span className="hidden sm:inline">XP <span className="font-semibold text-bone tabular-nums">{combat.sessionXp.toLocaleString()}</span></span>
            <span>Gold <span className="font-semibold text-bronze tabular-nums">{combat.sessionGold.toLocaleString()}</span></span>
          </div>
        }
      />

      {/* Combat XP */}
      <Panel bodyClassName="px-4 py-3">
        <BarLabel left="Combat progress" right={`Level ${state.combatLevel} · ${combatInto.toLocaleString()} / ${combatNeed.toLocaleString()}`} className="mb-1.5" />
        <Bar variant="xp" pct={combatPct} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* LEFT: areas + creatures */}
        <div className="space-y-4 lg:col-span-2">
          <Panel header={<PanelLabel>Areas</PanelLabel>}>
            <div className="space-y-0.5">
              {ALL_REGIONS.map((r) => {
                const unlocked = state.combatLevel >= r.recommendedLevel;
                const selected = r.id === combat.regionId;
                const firstFoe = enemiesByRegion.get(r.id)?.[0];
                return (
                  <button
                    key={r.id}
                    disabled={!unlocked}
                    onClick={() => firstFoe && setCombatTarget(r.id, firstFoe.id)}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors disabled:cursor-not-allowed ${
                      selected
                        ? 'border border-ember/40 bg-ember/10 text-parchment'
                        : unlocked
                          ? 'border border-transparent text-mist hover:bg-iron/30 hover:text-bone'
                          : 'border border-transparent text-stone/50'
                    }`}
                  >
                    {unlocked
                      ? <LuMap className="h-3.5 w-3.5 text-bronze" />
                      : <LuLock className="h-3.5 w-3.5 text-stone/60" />}
                    <span className="flex-1 text-left">{r.name}</span>
                    <span className="font-mono text-[10px] text-stone">Lv {r.recommendedLevel}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel header={<PanelLabel>Creatures</PanelLabel>}>
            <div className="space-y-3">
              {(['normal', 'elite', 'rare', 'boss'] as EnemyCategory[]).map((category) => {
                const foes = (enemiesByRegion.get(combat.regionId) ?? []).filter((e) => e.category === category);
                if (foes.length === 0) return null;
                const CatIcon = CATEGORY_ICON[category];
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center gap-1.5 px-1 text-[9px] uppercase tracking-wider text-stone">
                      <CatIcon className="h-3 w-3" style={{ color: CATEGORY_COLOR[category] }} />
                      {CATEGORY_LABEL[category]}
                    </div>
                    <div className="space-y-1">
                      {foes.map((e) => {
                        const selected = e.id === combat.enemyId;
                        const d = estimateDanger(participant(maxHealth), e);
                        const StyleIcon = COMBAT_STYLE_ICONS[e.attackStyle];
                        const art = enemyArt(e.id);
                        return (
                          <button
                            key={e.id}
                            onClick={() => setCombatTarget(combat.regionId, e.id)}
                            className={`flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-xs transition-colors ${
                              selected
                                ? 'border-ember/40 bg-ember/10 text-parchment'
                                : 'border-transparent text-mist hover:bg-iron/30 hover:text-bone'
                            }`}
                          >
                            {art ? (
                              <img src={art} alt="" className="h-6 w-6 flex-shrink-0 object-contain" />
                            ) : (
                              <StyleIcon className="h-4 w-4 flex-shrink-0 text-stone" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-left">{e.name}</span>
                            <span className={`text-[9px] ${DANGER_TEXT[d.level]}`}>{d.level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* RIGHT: fight panel */}
        <div className="lg:col-span-3">
          <Panel
            className="h-full"
            header={
              <>
                <PanelLabel>Fight</PanelLabel>
                {statusText && (
                  <span className="flex items-center gap-1.5 text-[10px] text-emberLight">
                    {combat.resting ? <LuBed className="h-3 w-3" /> : <LuSwords className="h-3 w-3" />}
                    {statusText}
                  </span>
                )}
              </>
            }
          >
            {!enemy ? (
              <EmptyState
                icon={<LuSwords className="h-7 w-7" />}
                title="No prey selected"
                hint="Choose an area and a creature from the lists to begin the fight."
              />
            ) : (
              <div className="space-y-4">
                {/* Enemy focus */}
                <div className="flex items-center gap-3">
                  <div
                    className="art-frame h-16 w-16 flex-shrink-0"
                    style={{ borderColor: CATEGORY_COLOR[enemy.category] }}
                  >
                    {enemyArt(enemy.id) ? (
                      <img src={enemyArt(enemy.id) ?? ''} alt="" className="h-14 w-14 object-contain" />
                    ) : (
                      <FocusStyleIcon className="h-6 w-6" style={{ color: CATEGORY_COLOR[enemy.category] }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="truncate font-display text-base font-semibold text-bone">{enemy.name}</h2>
                      <span className="font-mono text-[11px] text-stone">Lv {enemy.level}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: CATEGORY_COLOR[enemy.category] }}>
                      <span>{CATEGORY_LABEL[enemy.category]}</span>
                      {danger && <span className={`normal-case tracking-normal ${DANGER_TEXT[danger.level]}`}>· {danger.level} danger</span>}
                    </div>
                  </div>
                </div>

                {/* HP bars */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-12 flex-shrink-0 text-right text-[10px] text-mist">Hunter</span>
                    <Bar variant="hp" pct={hpPct} height={16} className="flex-1">
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-bone/90">
                        {combat.playerHp} / {maxHealth}
                      </span>
                    </Bar>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 flex-shrink-0 truncate text-right text-[10px] text-mist">{enemy.name}</span>
                    <Bar variant="hp" pct={enemyHpPct} height={16} className="flex-1">
                      <span className="absolute inset-0 flex items-center justify-center truncate font-mono text-[9px] text-bone/90">
                        {enemyHp} / {enemy.maxHealth}
                      </span>
                    </Bar>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <GameButton variant="primary" disabled={combat.playerHp <= 0 || isInCombat} onClick={fight}>
                    <LuSwords className="h-3.5 w-3.5" /> Fight
                  </GameButton>
                  {!combat.autoFight ? (
                    <GameButton variant="secondary" disabled={combat.playerHp <= 0} onClick={toggleAutoFight}>
                      <LuPlay className="h-3 w-3" /> Auto-fight
                    </GameButton>
                  ) : (
                    <GameButton variant="danger" onClick={toggleAutoFight}>
                      <LuPause className="h-3 w-3" /> Stop auto
                    </GameButton>
                  )}
                  <GameButton
                    variant={combat.resting ? 'success' : 'secondary'}
                    disabled={combat.playerHp >= maxHealth && combat.playerHp > 0}
                    onClick={toggleRest}
                  >
                    <LuBed className="h-3 w-3" /> Rest
                  </GameButton>
                  <GameButton
                    variant="secondary"
                    disabled={foodCount === 0 || combat.playerHp >= maxHealth}
                    onClick={eatFood}
                  >
                    <LuDrumstick className="h-3 w-3" /> Eat food <span className="font-mono text-stone">({foodCount})</span>
                  </GameButton>
                </div>

                {danger && (
                  <p className="text-[11px] text-mist">
                    <span>Danger: <span className={DANGER_TEXT[danger.level]}>{danger.level}</span></span>
                    <span className="mx-1.5 text-stone">·</span>
                    {danger.factors.slice(0, 2).join(' · ')}
                  </p>
                )}

                {/* Gains feed */}
                {state.gains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {state.gains.slice(0, 8).map((g) => (
                      <span
                        key={g.id}
                        className={`gain-pop rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${
                          g.kind === 'level'
                            ? 'border-ember/40 bg-ember/15 text-emberLight'
                            : g.kind === 'rare'
                              ? 'border-amber/40 bg-amber/10 text-amber'
                              : g.kind === 'gold'
                                ? 'border-bronze/40 bg-bronze/10 text-bronzeLight'
                                : 'border-iron/60 bg-charcoal text-mist'
                        }`}
                      >
                        {g.text}
                      </span>
                    ))}
                  </div>
                )}

                {/* Combat log */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <PanelLabel>Combat Log</PanelLabel>
                    <button onClick={clearCombatLog} className="flex items-center gap-1 text-[10px] text-mist transition-colors hover:text-bone">
                      <LuX className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-sm border border-iron/50 bg-charcoal/60 p-3">
                    {combat.combatLog.length === 0 && <div className="text-xs text-stone">No combat yet.</div>}
                    {combat.combatLog.map((entry, i) => (
                      <div
                        key={i}
                        className={`font-mono text-[11px] ${
                          entry.isCritical ? 'text-emberLight' : entry.type === 'death' ? 'text-dangerBright' : entry.type === 'food' ? 'text-verdant' : 'text-mist'
                        }`}
                      >
                        <span className="text-stone">r{entry.tick}</span>
                        {entry.actor !== 'system' && <span className="uppercase text-stone"> [{entry.actor}]</span>} {entry.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone">
                    <LuScrollText className="h-3 w-3" />
                    A new kill marks your ledger.
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}