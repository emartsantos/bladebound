'use client';

import { LuListOrdered, LuTrash2, LuX } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { MAX_ACTION_QUEUE } from '@/lib/game/service';
import { actionName, skillLabel } from '@/lib/skills-meta';
import { SkillIcon } from '@/components/game/icons';

export function ActionQueue() {
  const { state, removeQueuedAction, clearActionQueue } = useGame();
  const queue = state.actionQueue;

  return (
    <div className="rounded-sm border border-iron/60 bg-charcoal/50 p-3">
      <div className="flex items-center gap-2">
        <LuListOrdered className="h-3.5 w-3.5 text-bronze" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist">Action queue</span>
        <span className="ml-auto font-mono text-[10px] text-stone">{queue.length}/{MAX_ACTION_QUEUE}</span>
        {queue.length > 0 && (
          <button onClick={clearActionQueue} className="flex items-center gap-1 text-[10px] text-stone hover:text-dangerBright">
            <LuTrash2 className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      {queue.length === 0 ? (
        <p className="mt-2 text-[10px] text-stone">Start another trade action while one is running to add it here.</p>
      ) : (
        <ol className="mt-2 space-y-1">
          {queue.map((action, index) => (
            <li key={`${action.skill}-${action.nodeId ?? action.recipeId}-${index}`} className="flex items-center gap-2 rounded-sm border border-iron/40 bg-black/10 px-2 py-1.5">
              <span className="w-4 font-mono text-[9px] text-stone">{index + 1}</span>
              <SkillIcon id={action.skill} className="h-3 w-3 shrink-0 text-bronze" />
              <span className="min-w-0 flex-1 truncate text-[10px] text-mist">
                {skillLabel(action.skill)} · {actionName(action.skill, action.kind, action.nodeId, action.recipeId)}
              </span>
              <button
                onClick={() => removeQueuedAction(index)}
                aria-label={`Remove queued action ${index + 1}`}
                className="text-stone transition-colors hover:text-dangerBright"
              >
                <LuX className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
