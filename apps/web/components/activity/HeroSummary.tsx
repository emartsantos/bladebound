'use client';

import type { ReactNode } from 'react';
import { LuChevronRight, LuShield, LuSwords } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { usePlayer } from '@/lib/use-player';
import { xpStepForLevel } from '@/lib/game/service';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { useNav } from '@/components/shell';
import { Bar, BarLabel } from '@/components/game/primitives';

export function combatPower(stats: { strength: number; agility: number; intelligence: number; vitality: number; armor: number; critChance: number }): number {
  return Math.round(stats.strength * 1.6 + stats.agility * 1.1 + stats.vitality * 1.35 + stats.intelligence * 0.9 + stats.armor * 1.6 + stats.critChance * 2.2);
}

function StatLine({ left, value, tone = 'text-bone' }: { left: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-[3px]">
      <span className="stat-label">{left}</span>
      <span className={`stat-value ${tone}`}>{value}</span>
    </div>
  );
}

export function HeroSummary() {
  const { state, stats, maxHealth } = useGame();
  const { player } = usePlayer();
  const { setActiveSection } = useNav();

  const into = state.combatXp - cumulativeXpForLevel(state.combatLevel);
  const need = xpStepForLevel(state.combatLevel);
  const pct = Math.min(100, Math.round((into / need) * 100));
  const power = combatPower(stats);
  const attack = Math.floor(stats.strength * 0.9);
  const defense = Math.floor(stats.armor * 0.6);

  return (
    <section className="panel flex h-full flex-col">
      <header className="panel-header">
        <span className="section-label">Your Hero</span>
      </header>

      <div className="flex flex-col p-4">
        {/* Portrait */}
        <div className="art-frame relative mx-auto mb-3 h-24 w-24">
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-bronze/60 bg-charcoal text-2xl font-bold text-bronze shadow-inset">
              {player.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="absolute bottom-0 right-1 rounded-sm border border-iron bg-charcoal px-1.5 py-0.5 font-mono text-[10px] text-emberLight">
            LV {state.combatLevel}
          </span>
          <span className="absolute inset-0 rounded-sm shadow-[inset_0_0_0_1px_rgba(216,201,168,0.05)]" />
        </div>

        <div className="text-center">
          <div className="font-display text-base font-semibold tracking-wide text-bone">{player.name}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone">Hunter of the Frontier</div>
        </div>

        <div className="mt-3">
          <BarLabel left={<span className="font-mono text-[9px] text-stone">Combat XP</span>} right={<span className="font-mono text-[10px] text-bone">{pct}%</span>} className="mb-1" />
          <Bar variant="xp" pct={pct} height={5} />
        </div>

        <div className="mt-4 space-y-px border-t border-iron/60 pt-3">
          <StatLine left="Combat Power" value={power.toLocaleString()} tone="text-emberLight" />
          <StatLine left="Attack" value={attack} />
          <StatLine left="Defense" value={defense} />
          <StatLine left="Accuracy" value={stats.accuracy} />
          <StatLine left="Evasion" value={stats.evasion} />
          <StatLine left="Max HP" value={maxHealth} tone="text-danger" />
          <StatLine left="Crit" value={`${stats.critChance}%`} tone="text-bronzeLight" />
        </div>

        <button
          onClick={() => setActiveSection('character')}
          className="btn btn-ghost mt-4 w-full justify-between"
        >
          <span className="flex items-center gap-1.5">
            <LuSwords className="h-3.5 w-3.5" /> Character Sheet
          </span>
          <LuChevronRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}