'use client';

import { LuBed, LuPlay, LuPause, LuFlag, LuCircle, LuCircleCheck } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { Bar } from '@/components/game/primitives';
import { getCurrentTasks } from '@premium-rpg/game-engine';
import { TASK_BY_ID } from '@premium-rpg/game-data';

interface Goal {
  key: string;
  label: string;
  current: number;
  target: number;
  complete: boolean;
}

export function SideRail() {
  const { state } = useGame();
  const combat = state.combat;

  const goals: Goal[] = getCurrentTasks(state.task, new Date()).daily.map((assignment) => ({
    key: assignment.taskId,
    label: TASK_BY_ID[assignment.taskId]?.name ?? assignment.taskId,
    current: assignment.current,
    target: assignment.required,
    complete: assignment.completed,
  }));
  const done = goals.filter((g) => g.complete).length;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Active buffs / stance */}
      <section className="panel">
        <header className="panel-header">
          <span className="section-label">Active Buffs</span>
        </header>
        <div className="space-y-1.5 p-3">
          <BuffRow
            icon={combat.autoFight ? <LuPlay className="h-3 w-3" /> : <LuPause className="h-3 w-3" />}
            label={combat.autoFight ? 'Auto-Fighting' : 'Idle'}
            desc={combat.autoFight ? 'Hunting without rest' : 'No engagement'}
          />
          <BuffRow icon={<LuBed className="h-3 w-3" />} label="Resting" desc={combat.resting ? 'Recovering in camp' : 'Not resting'} dim={!combat.resting} />
          <p className="pt-1 text-[10px] leading-relaxed text-stone">
            Alchemy draughts and enchantments will surface as buffs once their systems are live.
          </p>
        </div>
      </section>

      {/* Persisted daily task progress from the authoritative game state. */}
      <section className="panel">
        <header className="panel-header">
          <span className="section-label">Today&apos;s Campaign</span>
        </header>
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between text-[10px] text-stone">
            <span>Daily quests</span>
            <span className="font-mono text-bone">{done}/{goals.length}</span>
          </div>
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <div key={g.key}>
                <div className="mb-1 flex items-center gap-1.5 text-[11px]">
                  {g.complete ? (
                    <LuCircleCheck className="h-3.5 w-3.5 text-verdantBright" />
                  ) : (
                    <LuCircle className="h-3.5 w-3.5 text-stone" />
                  )}
                  <span className={g.complete ? 'text-verdantBright line-through decoration-verdant/40' : 'text-mist'}>{g.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-stone">
                    {Math.min(g.current, g.target).toLocaleString()}/{g.target.toLocaleString()}
                  </span>
                </div>
                <Bar variant={g.complete ? 'resource' : 'xp'} pct={pct} height={4} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Session ledger */}
      <section className="panel-inset rounded-md p-3">
        <div className="section-label mb-2 flex items-center gap-1.5">
          <LuFlag className="h-3 w-3" /> Session Ledger
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-mono text-sm font-semibold text-bone tabular-nums">{combat.sessionKills}</div>
            <div className="text-[9px] uppercase tracking-wider text-stone">Kills</div>
          </div>
          <div>
            <div className="font-mono text-sm font-semibold text-bone tabular-nums">{combat.sessionXp.toLocaleString()}</div>
            <div className="text-[9px] uppercase tracking-wider text-stone">XP</div>
          </div>
          <div>
            <div className="font-mono text-sm font-semibold text-bronze tabular-nums">{combat.sessionGold.toLocaleString()}</div>
            <div className="text-[9px] uppercase tracking-wider text-stone">Gold</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BuffRow({ icon, label, desc, dim = false }: { icon: React.ReactNode; label: string; desc: string; dim?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${dim ? 'opacity-45' : ''}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-iron/70 bg-charcoal text-stone">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-bone">{label}</div>
        <div className="truncate text-[10px] text-stone">{desc}</div>
      </div>
    </div>
  );
}
