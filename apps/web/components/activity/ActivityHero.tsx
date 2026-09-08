'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LuSwords, LuFlameKindling } from 'react-icons/lu';
import { ALL_REGIONS } from '@premium-rpg/game-data';
import type { EnemyDefinition } from '@premium-rpg/shared-types';
import { useGame } from '@/lib/game-state';
import { actionsForSkill, skillLabel, forgeRows, type ActionRow } from '@/lib/skills-meta';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { xpStepForLevel } from "@/lib/game/service";
import { Bar } from '@/components/game/primitives';
import { ACTIVITY_SCENES, type SceneEvent } from './activity-scenes';
import { IngredientChip } from './IngredientChip';
import type { ActivityConfig, ActivityId } from './activity-config';

function sceneAccent(activity: ActivityConfig): string {
  switch (activity.accent) {
    case 'ember':
    case 'forge':
      return 'text-emberLight';
    case 'verdant':
      return 'text-verdantBright';
    case 'water':
      return 'text-[#9db7ca]';
    case 'arcane':
      return 'text-[#a8c9a0]';
  }
}

export function ActivityHero({
  activity,
  event,
  enemy,
  medallion,
  onNavigateActivity,
}: {
  activity: ActivityConfig;
  event: SceneEvent | null;
  enemy?: EnemyDefinition | null;
  medallion?: string | null;
  onNavigateActivity?: (id: ActivityId) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [previous, setPrevious] = useState<ActivityConfig | null>(null);
  const prevRef = useRef<ActivityConfig>(activity);

  const { state, fight, stopAction, startAction, skillView, maxHealth, stats } = useGame();

  // Crossfade on activity switch (no page reload, ~400ms).
  useEffect(() => {
    if (prevRef.current === activity) return;
    setPrevious(prevRef.current);
    prevRef.current = activity;
    const t = window.setTimeout(() => setPrevious(null), 460);
    return () => window.clearTimeout(t);
  }, [activity]);

  // Pause expensive scene motion while the tab is hidden.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sync = () => root.setAttribute('data-paused', String(document.hidden));
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // Subtle layered parallax (disabled for reduced motion / touch).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return;
    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      root.style.setProperty('--px', nx.toFixed(3));
      root.style.setProperty('--py', ny.toFixed(3));
    };
    const onLeave = () => {
      root.style.setProperty('--px', '0');
      root.style.setProperty('--py', '0');
    };
    root.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => onMove(e));
    });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const combat = state.combat;
  const Scene = ACTIVITY_SCENES[activity.id];
  const isFight = activity.id === 'fighting';
  const activeSkill = activity.skill;
  const sv = activeSkill ? skillView(activeSkill) : null;
  const isForge = activity.id === 'forge';
  const rows = activeSkill ? (isForge ? forgeRows(sv?.level ?? 1) : actionsForSkill(activeSkill, sv?.level ?? 1)) : [];
  const toolName = rows.find((r) => r.toolName)?.toolName ?? null;

  const hasIngredientsFor = (row: ActionRow): boolean => {
    if (row.kind === 'gathering') return true;
    return row.ingredients.every((ing) => (state.inventory[ing.itemId] ?? 0) >= ing.quantity);
  };

  let primaryLabel: string;
  let primaryRun: () => void;
  let primaryDisabled = false;
  let missingRow: ActionRow | null = null;

  if (isFight) {
    const hasTarget = !combat.mustPick && !!combat.enemyId;
    primaryLabel = combat.encounter && !combat.encounter.finished ? 'CONTINUE FIGHTING' : combat.autoFight ? 'AUTO-FIGHT ON' : 'ATTACK NOW';
    primaryRun = () => fight();
    primaryDisabled = !hasTarget || combat.playerHp <= 0;
  } else if (activeSkill) {
    const current = state.activeAction && state.activeAction.skill === activeSkill ? state.activeAction : null;
    if (current) {
      primaryLabel = `STOP ${activity.kicker}`;
      primaryRun = () => stopAction();
    } else {
      const next = rows.find((r) => !r.locked && hasIngredientsFor(r));
      missingRow = next ? null : (rows.find((r) => !r.locked) ?? null);
      primaryLabel = `START ${activity.kicker}`;
      primaryRun = () => next && startAction(activeSkill, next.id, next.kind);
      primaryDisabled = !next;
    }
  } else {
    primaryLabel = activity.kicker;
    primaryRun = () => {};
    primaryDisabled = true;
  }

  const region = isFight ? ALL_REGIONS.find((r) => r.id === combat.regionId) : undefined;
  const combatInto = state.combatXp - cumulativeXpForLevel(state.combatLevel);
  const combatNeed = xpStepForLevel(state.combatLevel);
  const combatPct = Math.min(100, Math.round((combatInto / combatNeed) * 100));
  const activeNow = state.activeAction && state.activeAction.skill === activeSkill;

  return (
    <div
      ref={rootRef}
      className="scene-frame relative flex h-[280px] w-full flex-col overflow-hidden rounded-lg border border-iron bg-[#100e0c] md:h-[340px] lg:h-[400px]"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' } as CSSProperties}
    >
      {/* Active scene */}
      <div key={`scene-${activity.id}`} className="scene-enter absolute inset-0">
        <Scene uid={`act-${activity.id}`} event={event} enemy={enemy ?? null} medallion={medallion ?? null} />
      </div>

      {/* Crossfaded outgoing scene underneath */}
      {previous && previous.id !== activity.id && (
        <div key={`leaving-${previous.id}`} className="scene-leave absolute inset-0 z-[2]">
          {(() => {
            const PrevScene = ACTIVITY_SCENES[previous.id];
            return <PrevScene uid={`prev-${previous.id}`} event={null} enemy={null} medallion={null} />;
          })()}
        </div>
      )}

      {/* Atmosphere + readability scrims */}
      <div className="scene-veil scene-scrim-l z-[3]" />
      <div className="scene-veil scene-scrim-r z-[3] hidden sm:block" />
      <div className="scene-veil scene-blend z-[3]" />

      {/* Overlay text — above the art, not pasted on it */}
      <div className="relative z-[4] flex h-full flex-col justify-between gap-3 p-4 sm:p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-md">
            <div className={`flex items-center gap-2 text-xs font-semibold tracking-[0.24em] ${sceneAccent(activity)}`}>
              <activity.icon className="h-3.5 w-3.5" />
              <span>{activity.kicker}</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[0.08em] text-bone sm:text-3xl md:text-4xl">
              {activity.name}
            </h2>
            <p className="mt-1 hidden text-sm italic text-parchment/90 sm:block md:text-[15px]">{activity.description}</p>
          </div>

          <SceneDatabox
            isFight={isFight}
            enemy={enemy ?? null}
            regionName={region?.name}
            combatPct={combatPct}
            skillName={activeSkill ? skillLabel(activeSkill) : null}
            skillLevel={sv?.level ?? null}
            skillPct={sv?.pct ?? null}
            activeNow={Boolean(activeNow)}
            toolName={toolName}
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={primaryRun}
                disabled={primaryDisabled}
                aria-label={primaryLabel}
                className={`btn h-9 px-4 font-mono text-xs tracking-[0.14em] ${isFight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {isFight ? <LuSwords className="h-3.5 w-3.5" /> : <LuFlameKindling className="h-3.5 w-3.5" />}
                {primaryLabel}
              </button>
              <span className="hidden text-[10px] text-mist sm:inline">
                {isFight
                  ? enemy
                    ? `Lv ${enemy.level} · ${enemy.name}`
                    : 'Pick a target below'
                  : activeSkill
                    ? `${skillLabel(activeSkill)} Lv ${sv?.level ?? 1} · ${activity.tagline}`
                    : activity.tagline}
              </span>
            </div>

            {missingRow && missingRow.kind === 'crafting' && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-dangerBright">Needs</span>
                {missingRow.ingredients.map((ing) => (
                  <IngredientChip key={ing.itemId} ing={ing} have={state.inventory[ing.itemId] ?? 0} onNavigate={onNavigateActivity} />
                ))}
              </div>
            )}
          </div>
          {isFight && (
            <div className="hidden items-center gap-2 text-[10px] text-mist md:flex">
              <LuSwords className="h-3 w-3 text-stone" />
              <span className="font-mono tabular-nums">HP {combat.playerHp} / {maxHealth} · STR {stats.strength}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SceneDatabox({
  isFight,
  enemy,
  regionName,
  combatPct,
  skillName,
  skillLevel,
  skillPct,
  activeNow,
  toolName,
}: {
  isFight: boolean;
  enemy: EnemyDefinition | null;
  regionName?: string;
  combatPct: number;
  skillName: string | null;
  skillLevel: number | null;
  skillPct: number | null;
  activeNow: boolean;
  toolName: string | null;
}) {
  return (
    <div className="hidden min-w-[150px] max-w-[220px] rounded-sm border border-iron/60 bg-charcoal/55 p-3 shadow-inset md:block">
      {isFight ? (
        <>
          <div className="text-[9px] uppercase tracking-[0.18em] text-stone">Engagement</div>
          {enemy ? (
            <>
              <div className="mt-1 truncate font-display text-sm text-bone">{enemy.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-mist">
                <span>Lv {enemy.level}</span>
                <span className="capitalize">{enemy.category}</span>
              </div>
              {regionName && <div className="mt-0.5 truncate text-[10px] text-stone">Region · {regionName}</div>}
            </>
          ) : (
            <div className="mt-1 text-[11px] text-stone">No target yet.</div>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[9px] text-stone">XP</span>
            <Bar variant="xp" pct={combatPct} height={4} className="flex-1" />
          </div>
        </>
      ) : skillName && skillLevel != null ? (
        <>
          <div className="text-[9px] uppercase tracking-[0.18em] text-stone">Venture</div>
          <div className="mt-1 truncate font-display text-sm text-bone">{skillName}</div>
          <div className="mt-0.5 font-mono text-[11px] text-mist">Lv {skillLevel} · {skillPct ?? 0}%</div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[9px] text-stone">XP</span>
            <Bar variant="xp" pct={skillPct ?? 0} height={4} className="flex-1" />
          </div>
          <div className="mt-2 text-[10px] text-stone">
            {activeNow ? 'Strike in progress' : 'Ready'}
            {toolName ? ` · ${toolName}` : ''}
          </div>
        </>
      ) : null}
    </div>
  );
}