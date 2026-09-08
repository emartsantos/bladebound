'use client';

import { useMemo } from 'react';
import {
  LuBed, LuDrumstick, LuLock, LuMap, LuPause, LuPlay, LuSwords, LuX, LuClock3,
} from 'react-icons/lu';
import type { EnemyCategory } from '@premium-rpg/shared-types';
import { ALL_REGIONS, ALL_ENEMIES, LOOT_TABLES } from '@premium-rpg/game-data';
import {
  estimateDanger,
  getRoundDuration,
  createPlayerParticipant,
  type DangerLevel,
} from '@premium-rpg/game-engine';
import type { StatBlock } from '@premium-rpg/shared-types';
import { useGame } from '@/lib/game-state';
import { usePlayer } from '@/lib/use-player';
import { itemName, itemBucket } from '@/lib/item-names';
import { enemyArt } from '@/lib/enemy-art';
import { Bar, BarLabel, GameButton } from '@/components/game/primitives';
import { useNow } from './useNow';

const DANGER_TEXT: Record<DangerLevel, string> = {
  safe: 'text-verdant',
  low: 'text-verdantBright',
  medium: 'text-amber',
  high: 'text-emberLight',
  deadly: 'text-dangerBright',
};

const CATEGORY_LABEL: Record<EnemyCategory, string> = {
  normal: 'Common',
  elite: 'Elite',
  rare: 'Rare',
  boss: 'Boss',
};

const CATEGORY_COLOR: Record<EnemyCategory, string> = {
  normal: '#6b6660',
  elite: '#65758a',
  rare: '#b08754',
  boss: '#d4692f',
};

export function FightWorkspace() {
  const { player } = usePlayer();
  const { state, stats, maxHealth, fight, toggleAutoFight, toggleRest, eatFood, clearCombatLog, setCombatTarget } = useGame();
  const combat = state.combat;
  const now = useNow(100);

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

  const drops = enemy ? (LOOT_TABLES[enemy.lootTableId]?.drops ?? []) : [];
  const playerStats: StatBlock = {
    ...stats,
    damage: Math.floor(stats.strength * 0.9),
    defense: Math.floor(stats.armor * 0.6),
  };
  const danger = enemy
    ? estimateDanger(createPlayerParticipant(player.name, state.combatLevel, playerStats, maxHealth, 'melee'), enemy)
    : null;

  const hpPct = Math.max(0, Math.min(100, Math.round((combat.playerHp / maxHealth) * 100)));
  const enemyHpPct = enemy ? Math.max(0, Math.min(100, Math.round((combat.enemyHp / enemy.maxHealth) * 100))) : 100;
  const enemyHp = enemy ? Math.min(combat.enemyHp, enemy.maxHealth) : 0;
  const fightActive = combat.encounter !== null && !combat.encounter.finished;

  // Round clock (presentation): where are we inside the current round.
  let roundPct = 0;
  let roundLabel = 'Idle — await engagement';
  if (fightActive && combat.encounter && combat.nextRoundAt) {
    const delay = getRoundDuration(combat.encounter.player.stats.attackSpeed, combat.encounter.enemy.stats.attackSpeed) * 1000;
    const start = combat.nextRoundAt - delay;
    roundPct = Math.max(0, Math.min(100, ((now - start) / delay) * 100));
    roundLabel = `Round ${combat.encounter.round} · striking`;
  } else if (combat.resting) {
    roundLabel = 'Resting — campfire heal';
  } else if (combat.autoFight) {
    roundLabel = 'Auto-hunt — seeking next foe';
  }

  const foodCount = Object.entries(state.inventory).reduce((n, [id, qty]) => (itemBucket(id) === 'food' ? n + qty : n), 0);

  return (
    <section className="panel">
      <header className="panel-header">
        <span className="section-label">The Hunt</span>
        <span className="ml-auto hidden items-center gap-3 font-mono text-[10px] text-stone sm:flex">
          <span>Kills <b className="text-bone tabular-nums">{combat.sessionKills}</b></span>
          <span>XP <b className="text-bone tabular-nums">{combat.sessionXp.toLocaleString()}</b></span>
          <span>Gold <b className="text-bronze tabular-nums">{combat.sessionGold.toLocaleString()}</b></span>
        </span>
      </header>

      <div className="space-y-4 p-4">
        {/* Target focus */}
        <div className="flex items-center gap-3">
          <div className="art-frame h-16 w-16 flex-shrink-0" style={{ borderColor: enemy ? CATEGORY_COLOR[enemy.category] : undefined }}>
            {enemy && enemyArt(enemy.id) ? (
              <img src={enemyArt(enemy.id) ?? ''} alt="" className="h-14 w-14 object-contain" />
            ) : (
              <LuSwords className="h-6 w-6 text-stone" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {enemy ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="truncate font-display text-base font-semibold text-bone">{enemy.name}</h2>
                  <span className="font-mono text-[11px] text-stone">Lv {enemy.level}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: CATEGORY_COLOR[enemy.category] }}>
                  <span>{CATEGORY_LABEL[enemy.category]}</span>
                  {danger && (
                    <span className={`flex items-center gap-1 normal-case tracking-normal ${DANGER_TEXT[danger.level]}`}>
                      · <b className="font-mono">{danger.level}</b>
                      <span className="hidden text-[9px] text-stone sm:inline">({danger.score}% threat)</span>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-stone">No prey selected — choose an area and creature below.</div>
            )}
          </div>
        </div>

        {/* HP bars */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-12 flex-shrink-0 text-right text-[10px] text-mist">Hunter</span>
            <Bar variant="player" pct={hpPct} height={16} className="flex-1">
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-bone/90">
                {combat.playerHp} / {maxHealth}
              </span>
            </Bar>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 flex-shrink-0 truncate text-right text-[10px] text-mist">{enemy ? enemy.name : '—'}</span>
            <Bar variant="hp" pct={enemyHpPct} height={16} className="flex-1">
              <span className="absolute inset-0 flex items-center justify-center truncate font-mono text-[9px] text-bone/90">
                {enemyHp} / {enemy?.maxHealth ?? 0}
              </span>
            </Bar>
          </div>
        </div>

        {/* Round clock */}
        <div>
          <BarLabel left={<span className="flex items-center gap-1"><LuClock3 className="h-3 w-3" />{roundLabel}</span>} right={fightActive ? `${Math.round(roundPct)}%` : undefined} className="mb-1" />
          <Bar variant={fightActive ? 'energy' : 'resource'} pct={roundPct} height={4} />
        </div>

        {/* Drops preview */}
        {enemy && drops.length > 0 && (
          <div>
            <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-stone">Potential Drops</div>
            <div className="flex flex-wrap gap-1.5">
              {drops.slice(0, 6).map((d) => (
                <span key={d.itemId} className="rounded-sm border border-iron/60 bg-charcoal px-1.5 py-0.5 text-[10px] text-mist">
                  <span className="font-mono text-stone">{Math.round(d.chance * 100)}%</span>{' '}
                  {itemName(d.itemId)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <GameButton variant="primary" disabled={!enemy || combat.playerHp <= 0 || fightActive} onClick={fight}>
            <LuSwords className="h-3.5 w-3.5" /> Fight
          </GameButton>
          {!combat.autoFight ? (
            <GameButton variant="secondary" disabled={!enemy || combat.playerHp <= 0} onClick={toggleAutoFight}>
              <LuPlay className="h-3 w-3" /> Auto-fight
            </GameButton>
          ) : (
            <GameButton variant="danger" onClick={toggleAutoFight}>
              <LuPause className="h-3 w-3" /> Stop auto
            </GameButton>
          )}
          <GameButton variant={combat.resting ? 'success' : 'secondary'} disabled={combat.playerHp >= maxHealth && combat.playerHp > 0} onClick={toggleRest}>
            <LuBed className="h-3 w-3" /> Rest
          </GameButton>
          <GameButton variant="secondary" disabled={foodCount === 0 || combat.playerHp >= maxHealth} onClick={eatFood}>
            <LuDrumstick className="h-3 w-3" /> Eat <span className="font-mono text-stone">({foodCount})</span>
          </GameButton>
        </div>

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

        {/* Area + creature pickers */}
        <div className="border-t border-iron/60 pt-3">
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-stone">Areas</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_REGIONS.map((r) => {
              const unlocked = state.combatLevel >= r.recommendedLevel;
              const selected = r.id === combat.regionId;
              const first = enemiesByRegion.get(r.id)?.[0];
              return (
                <button
                  key={r.id}
                  disabled={!unlocked}
                  onClick={() => first && setCombatTarget(r.id, first.id)}
                  className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] transition-colors disabled:cursor-not-allowed disabled:text-stone/40 ${
                    selected ? 'border-ember/40 bg-ember/10 text-parchment' : 'border-iron/60 bg-charcoal text-mist hover:bg-iron/30 hover:text-bone'
                  }`}
                >
                  {unlocked ? <LuMap className="h-3 w-3 text-bronze" /> : <LuLock className="h-3 w-3 text-stone/50" />}
                  {r.name} <span className="font-mono text-stone">{r.recommendedLevel}</span>
                </button>
              );
            })}
          </div>

          {enemy && (
            <>
              <div className="mb-1.5 mt-3 text-[9px] uppercase tracking-[0.16em] text-stone">Creatures · {enemy.regionId}</div>
              <div className="flex flex-wrap gap-1.5">
                {(enemiesByRegion.get(combat.regionId) ?? []).map((e) => {
                  const selected = e.id === combat.enemyId;
                  const art = enemyArt(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setCombatTarget(combat.regionId, e.id)}
                      className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] transition-colors ${
                        selected ? 'border-ember/40 bg-ember/10 text-parchment' : 'border-iron/60 bg-charcoal text-mist hover:bg-iron/30 hover:text-bone'
                      }`}
                    >
                      {art ? <img src={art} alt="" className="h-4 w-4 object-contain" /> : <LuSwords className="h-3 w-3 text-stone" />}
                      {e.name} <span className="font-mono text-stone">Lv{e.level}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Combat log */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.16em] text-stone">Combat Log</span>
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
        </div>
      </div>
    </section>
  );
}

function isFood(id: string): boolean {
  if (id.includes('food') || id.includes('bread') || id.includes('shrimp') || id.includes('lobster')) return true;
  return itemName(id).toLowerCase().includes('meat') || itemName(id).toLowerCase().includes('cheese');
}