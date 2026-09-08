'use client';

import { useMemo, useState } from 'react';
import {
  LuArrowRight, LuClock3, LuLock, LuSwords, LuX,
} from 'react-icons/lu';
import type { SkillId } from '@premium-rpg/shared-types';
import { getRecipeById } from '@premium-rpg/game-engine';
import { useGame } from '@/lib/game-state';
import { actionsForSkill, skillLabel, SKILL_ICONS, forgeRows, type ActionRow } from '@/lib/skills-meta';
import { Bar } from '@/components/game/primitives';
import { IngredientChip } from './IngredientChip';
import { ActionQueue } from '@/components/ActionQueue';
import { useNow } from './useNow';
import type { ActivityConfig, ActivityId } from './activity-config';

export function GatherWorkspace({ skill, activity, onNavigateActivity }: { skill: SkillId; activity: ActivityConfig; onNavigateActivity: (id: ActivityId) => void }) {
  const { state, startAction, stopAction, skillView } = useGame();
  const sv = skillView(skill);
  const forge = activity.id === 'forge';
  const rows = useMemo(() => (forge ? forgeRows(sv.level) : actionsForSkill(skill, sv.level)), [forge, skill, sv.level]);
  const hasSmelt = forge && rows.some((r) => r.id.endsWith('_bar'));
  const now = useNow(100);

  const active = state.activeAction && state.activeAction.skill === skill ? state.activeAction : null;
  const activeRow = active
    ? rows.find((r) => r.id === (active.kind === 'gathering' ? active.nodeId : active.recipeId))
    : null;

  const msLeft = active && activeRow ? active.startTime + activeRow.duration * 1000 - now : 0;
  const activePct = active && activeRow ? Math.max(0, Math.min(100, ((now - active.startTime) / (activeRow.duration * 1000)) * 100)) : 0;

  const SkillIcon = SKILL_ICONS[skill];
  const satchel = Object.values(state.inventory).reduce((n, q) => n + q, 0);

  return (
    <section className="panel">
      <header className="panel-header">
        <span className="section-label flex items-center gap-1.5">
          <SkillIcon className="h-3.5 w-3.5" /> {activity.kicker}
        </span>
        <span className="ml-auto font-mono text-[10px] text-stone">
          {skillLabel(skill)} <b className="text-bone">Lv {sv.level}</b> · {sv.pct ?? 0}%
        </span>
      </header>

      <div className="space-y-4 p-4">
        {/* Current action progress */}
        <div className="rounded-sm border border-ember/25 bg-ember/5 p-3">
          {active && activeRow ? (
            <>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-display text-sm text-bone">{activeRow.name}</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-emberLight">
                  <LuClock3 className="h-3 w-3" /> {Math.max(0, Math.ceil(msLeft / 1000))}s
                </span>
              </div>
              <Bar variant="energy" pct={activePct} height={5} />
              <div className="mt-1 text-[10px] text-mist">
                Strike in progress · {Math.round((now - active.startTime) / 1000)}s / {activeRow.duration}s
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-mist">No work underway.</span>
              <span className="text-[10px] text-stone">Ready to toil</span>
            </div>
          )}
        </div>

        <ActionQueue />

        {/* Action list */}
        <div className="space-y-2">
          {rows.map((row, i) => {
            const isActive = active?.kind === row.kind && ((active.kind === 'gathering' && active.nodeId === row.id) || (active.kind === 'crafting' && active.recipeId === row.id));
            return (
              <div key={row.id}>
                {hasSmelt && i === 0 && (
                  <div className="pb-1 text-[9px] uppercase tracking-[0.16em] text-stone">Smelt ore into bars</div>
                )}
                {hasSmelt && i > 0 && row.id.endsWith('_bar') === false && !rows[i - 1].id.endsWith('_bar') && (
                  <div className="pb-1 pt-2 text-[9px] uppercase tracking-[0.16em] text-stone">Forge gear</div>
                )}
                <ActionRowCard
                  row={row}
                  skill={skill}
                  active={isActive}
                  queueing={Boolean(state.activeAction)}
                  queueFull={state.actionQueue.length >= 10}
                  inventory={state.inventory}
                  hasIngredients={hasIngredients(row)}
                  onNavigateActivity={onNavigateActivity}
                  onStart={(repetitions) => startAction(skill, row.id, row.kind, repetitions)}
                  onStop={stopAction}
                />
              </div>
            );
          })}
        </div>

        {/* Satchel note */}
        <div className="rounded-sm border border-iron/50 bg-charcoal/50 p-3">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-stone">Satchel</span>
            <span className="font-mono text-bone">{satchel.toLocaleString()} items</span>
          </div>
          <p className="text-[10px] leading-relaxed text-stone">
            Resources gathered here feed the smithy and alchemy stations. Crafting consumes them at the recipe&apos;s quantity.
          </p>
          {activity.id === 'forge' && (
            <>
              <p className="mt-1.5 text-[10px] leading-relaxed text-stone">
                Forge gear advances <span className="text-bronze">Smithing</span> — bars and blades unlock as your level rises.
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-stone">
                Smelt mined ore into bars here, then forge them into gear. A fresh satchel starts with copper and tin to work with.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );

  function hasIngredients(row: ActionRow): boolean {
    if (row.kind === 'gathering') return true;
    const recipe = getRecipeById(row.id);
    if (!recipe) return true;
    return recipe.ingredients.every((i) => (state.inventory[i.itemId] ?? 0) >= i.quantity);
  }
}

function ActionRowCard({
  row,
  skill,
  active,
  queueing,
  queueFull,
  inventory,
  hasIngredients,
  onNavigateActivity,
  onStart,
  onStop,
}: {
  row: ActionRow;
  skill: SkillId;
  active: boolean;
  queueing: boolean;
  queueFull: boolean;
  inventory: Record<string, number>;
  hasIngredients: boolean;
  onNavigateActivity: (id: ActivityId) => void;
  onStart: (repetitions: number) => void;
  onStop: () => void;
}) {
  const SkillIcon = SKILL_ICONS[skill];
  const [repetitions, setRepetitions] = useState(1);
  const locked = row.locked;
  const blocked = locked || !hasIngredients || (!active && queueFull);
  return (
    <div
      className={`rounded-sm border p-3 transition-colors ${
        active
          ? 'border-ember/40 bg-ember/10'
          : blocked
            ? 'border-iron/50 bg-charcoal/40 opacity-70'
            : 'border-iron/60 bg-charcoal/60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border ${locked ? 'border-iron/60 bg-charcoal text-stone/50' : 'border-bronze/40 bg-charcoal text-bronze'}`}>
          {locked ? <LuLock className="h-3.5 w-3.5" /> : <SkillIcon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-semibold text-bone">{row.name}</span>
            <span className="font-mono text-[10px] text-stone">{row.duration}s · {row.xp} XP</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-stone">
            {row.toolName && (
              <span className="flex items-center gap-1">
                <LuSwords className="h-2.5 w-2.5" /> {row.toolName}
              </span>
            )}
            <span>Requires Lv {row.levelRequired}</span>
            {row.kind === 'crafting' && !hasIngredients && !locked && (
              <span className="text-dangerBright">Missing materials</span>
            )}
          </div>
        </div>
        {!active && (
          <label className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-stone" title="Number of repetitions">
            ×
            <input
              type="number"
              min={1}
              max={1000}
              value={repetitions}
              onChange={(event) => setRepetitions(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))}
              className="h-7 w-16 rounded-sm border border-iron bg-black/20 px-1.5 text-right text-[10px] text-bone outline-none focus:border-bronze"
              aria-label={`Repetitions for ${row.name}`}
            />
          </label>
        )}
        <button
          onClick={active ? onStop : () => onStart(repetitions)}
          disabled={blocked}
          className="btn btn-secondary h-7 shrink-0 px-2.5 font-mono text-[10px]"
        >
          {active ? <LuX className="h-3 w-3" /> : <LuArrowRight className="h-3 w-3" />}
          {active ? 'Stop' : queueing ? 'Queue' : 'Do'}
        </button>
      </div>

      {/* Ingredient → output */}
      {row.kind === 'crafting' && (row.ingredients.length > 0 || row.outputs.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-iron/40 pt-2 text-[10px]">
          {!hasIngredients && (
            <span className="mr-0.5 text-[9px] uppercase tracking-[0.14em] text-dangerBright">Needs</span>
          )}
          {row.ingredients.map((ing) => (
            <IngredientChip key={ing.itemId} ing={ing} have={inventory[ing.itemId] ?? 0} onNavigate={onNavigateActivity} />
          ))}
          {row.outputs.length > 0 && (
            <>
              <LuArrowRight className="h-3 w-3 text-stone" />
              {row.outputs.map((o, i) => (
                <span key={i} className="rounded-sm border border-bronze/40 bg-charcoal px-1.5 py-0.5 text-bronzeLight">
                  {o.qty > 1 ? `${o.qty}x ` : ''}{o.name}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Gathering preview */}
      {row.kind === 'gathering' && row.preview.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-iron/40 pt-2 text-[10px]">
          {row.preview.map((p, i) => (
            <span key={i} className="rounded-sm border border-iron/50 bg-charcoal px-1.5 py-0.5 text-stone">
              <span className="font-mono">{Math.round(p.chance * 100)}%</span> {p.qty} {p.name}
              {p.rare ? ' ✦' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
