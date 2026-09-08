'use client';

import { useState } from 'react';
import type { SkillId } from '@premium-rpg/shared-types';
import { LuLock, LuPlay, LuSquare, LuX } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { skillLabel, actionsForSkill, formatDuration, type ActionIngredient } from '@/lib/skills-meta';
import { SkillIcon } from '@/components/game/icons';
import { SectionHeader, Panel, PanelLabel, Bar, BarLabel, GameButton, EmptyState } from '@/components/game/primitives';
import { IngredientChip } from './activity/IngredientChip';
import { ActionQueue } from './ActionQueue';

const SKILL_COPY: Partial<Record<SkillId, string>> = {
  mining: 'Extract ores from veins. Ores power smelting and smithing.',
  woodcutting: 'Chop trees for logs. Logs feed fletching and the market.',
  fishing: 'Catch fish to cook into combat food.',
  smelting: 'Smelt ore and coal into metal bars.',
  smithing: 'Forge bars into weapons and armor.',
  cooking: 'Cook raw fish into food that heals in combat.',
  fletching: 'Craft arrows, shafts, and bows from logs.',
  alchemy: 'Brew potions and elixirs from herbs and materials.',
  runecrafting: 'Infuse rune essence into combat runes.',
};

export function SkillPanel() {
  const { state, skillView, startAction, stopAction, clearActionLog } = useGame();
  const skill = state.selectedSkill;
  const view = skillView(skill);
  const actions = actionsForSkill(skill, view.level);
  const active = state.activeAction;
  const inventory = state.inventory;
  const [rareOnly, setRareOnly] = useState(false);
  const [repetitions, setRepetitions] = useState<Record<string, number>>({});

  const isActiveRow = (id: string) => active && (active.nodeId === id || active.recipeId === id);
  const logLines = rareOnly ? state.actionLog.filter((l) => l.rare) : state.actionLog;

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title={skillLabel(skill)} eyebrow="Trade Skill" />

      {/* Skill header */}
      <Panel>
        <div className="flex items-center gap-3">
          <div className="art-frame h-12 w-12 flex-shrink-0">
            <div className="flex h-full w-full items-center justify-center text-bronze">
              <SkillIcon id={skill} className="h-6 w-6" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm text-mist">{SKILL_COPY[skill]}</p>
              <span className="font-mono text-[11px] text-stone">Lv {view.level}</span>
            </div>
            <BarLabel left={`${view.xp.toLocaleString()} XP`} right={`${view.needNext.toLocaleString()} to next`} className="mb-1 mt-2" />
            <Bar variant="xp" pct={view.pct} />
          </div>
        </div>
      </Panel>

      <ActionQueue />

      {/* Actions */}
      <div className="space-y-2">
        {actions.map((row) => {
          const isActive = isActiveRow(row.id);
          return (
            <div
              key={row.id}
              className={`panel p-3 transition-colors ${
                isActive ? 'border-ember/50' : row.locked ? 'opacity-55' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-bone">{row.name}</span>
                    {row.locked && <LuLock className="h-3 w-3 flex-shrink-0 text-stone" />}
                    {row.toolName && <span className="flex-shrink-0 rounded-sm border border-iron/70 bg-charcoal px-1.5 py-0.5 text-[9px] text-mist">Tool: {row.toolName}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-mist">
                    <span className="text-stone">Req Lv {row.levelRequired}</span>
                    <span>{formatDuration(row.duration)}</span>
                    <span className="text-bronzeLight">+{row.xp} XP</span>
                    {row.kind === 'crafting' && row.ingredients.length > 0 && (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {row.ingredients.map((ing: ActionIngredient) => (
                          <IngredientChip key={ing.itemId} ing={ing} have={inventory[ing.itemId] ?? 0} />
                        ))}
                        <span className="text-stone">→</span>
                      </span>
                    )}
                    {row.outputs.length > 0 && (
                      <span>{row.outputs.map((o) => (o.qty > 1 ? `${o.qty}x ` : '') + o.name).join(', ')}</span>
                    )}
                    {row.preview.length > 0 && (
                      <span className="text-stone">
                        Drops: {row.preview.map((p) => `${p.name} (${Math.round(p.chance * 100)}%)${p.rare ? ' ✦' : ''}`).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isActive ? (
                    <GameButton variant="danger" onClick={stopAction}>
                      <LuSquare className="h-3 w-3" /> Stop
                    </GameButton>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1 font-mono text-[9px] text-stone">
                        ×
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={repetitions[row.id] ?? 1}
                          onChange={(event) => setRepetitions((current) => ({
                            ...current,
                            [row.id]: Math.max(1, Math.min(1000, Number(event.target.value) || 1)),
                          }))}
                          aria-label={`Repetitions for ${row.name}`}
                          className="h-8 w-16 rounded-sm border border-iron bg-black/20 px-1.5 text-right text-[10px] text-bone outline-none focus:border-bronze"
                        />
                      </label>
                      <GameButton variant="primary" disabled={row.locked || state.actionQueue.length >= 10} onClick={() => startAction(skill, row.id, row.kind, repetitions[row.id] ?? 1)}>
                        <LuPlay className="h-3 w-3" /> {active ? 'Queue' : 'Start'}
                      </GameButton>
                    </div>
                  )}
                </div>
              </div>
              {isActive && active && (
                <Bar variant="energy" pct={Math.min(100, ((Date.now() - active.startTime) / active.duration) * 100)} height={4} className="mt-2.5" />
              )}
            </div>
          );
        })}
        {actions.length === 0 && (
          <EmptyState title="No actions available yet" hint="Raise this skill to unlock gathering nodes and recipes." />
        )}
      </div>

      {/* Action log */}
      <Panel
        header={
          <>
            <PanelLabel>Action Log</PanelLabel>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-mist">
                <input type="checkbox" checked={rareOnly} onChange={(e) => setRareOnly(e.target.checked)} className="accent-ember" />
                Rare drops only
              </label>
              <button onClick={clearActionLog} className="flex items-center gap-1 text-[10px] text-mist transition-colors hover:text-bone">
                <LuX className="h-3 w-3" /> Clear
              </button>
            </div>
          </>
        }
      >
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-sm border border-iron/50 bg-charcoal/60 p-3">
          {logLines.length === 0 && <div className="text-xs text-stone">Nothing logged yet. Start an action above.</div>}
          {logLines.map((entry) => (
            <div key={entry.id} className={`font-mono text-[11px] ${entry.rare ? 'text-amber' : 'text-mist'}`}>
              <span className="mr-1 inline-flex align-[-1px] text-bronze">
                <SkillIcon id={entry.skill} className="h-3 w-3" />
              </span>
              {entry.text}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
