'use client';

import { LuSquare } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { skillLabel, formatDuration, actionName } from '@/lib/skills-meta';
import { SkillIcon } from '@/components/game/icons';
import { Bar } from '@/components/game/primitives';
import { useNow } from '@/components/activity/useNow';

export function CurrentAction() {
  const { state, stopAction } = useGame();
  const now = useNow(100);
  const active = state.activeAction;
  if (!active) return null;

  const elapsed = Math.max(0, now - active.startTime);
  const remaining = Math.max(0, active.duration - elapsed);
  const pct = Math.min(100, (elapsed / active.duration) * 100);

  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-sm border border-iron/70 bg-charcoal/80 px-3 py-1">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm border border-iron/60 bg-charcoal text-bronze">
        <SkillIcon id={active.skill} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="max-w-44 truncate text-[10px] leading-none text-mist">
          {skillLabel(active.skill)} — {actionName(active.skill, active.kind, active.nodeId, active.recipeId)}
          <span className="ml-1 font-mono text-bronzeLight">{active.repetitionsRemaining.toLocaleString()}×</span>
          {state.actionQueue.length > 0 && <span className="ml-1 text-bronze">+{state.actionQueue.length} queued</span>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Bar variant="energy" pct={pct} height={3} className="w-28" />
          <span className="font-mono text-[9px] text-stone">{formatDuration(remaining)}</span>
        </div>
      </div>
      <button
        onClick={stopAction}
        title="Stop action"
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm text-stone transition-colors hover:bg-iron/30 hover:text-danger"
      >
        <LuSquare className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
