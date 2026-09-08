'use client';

import { useMemo, useState } from 'react';
import { LuClock, LuFlame, LuGem, LuShield, LuSparkles, LuSwords, LuUserRound } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { SUMMON_BURN, SUMMON_COST, SUMMON_REWARD_POOL, SUMMON_RARITY_ODDS, SUMMON_TREASURY, SUMMONED_HERO_BATTLE_CAP } from '@/lib/game/service';
import type { SummonRarity } from '@/lib/persistence/game-persistence';
import { EmptyState, GameButton, Panel, PanelLabel, SectionHeader } from '@/components/game/primitives';

const RARITY_COLOR: Record<SummonRarity, string> = { common: '#aaa49a', uncommon: '#6fbf73', rare: '#5f9fd7', epic: '#a875d5', legendary: '#d6a84c' };

export function SummoningSection() {
  const { state, summonHero, runSummonedHeroBattle } = useGame();
  const [tab, setTab] = useState<'summon' | 'roster' | 'history'>('summon');
  const heroes = useMemo(() => [...state.summoning.heroes].sort((a, b) => {
    const order: SummonRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return order.indexOf(b.rarity) - order.indexOf(a.rarity) || b.summonedAt - a.summonedAt;
  }), [state.summoning.heroes]);
  const canSummon = state.investment.bhc + 0.000001 >= SUMMON_COST;
  const today = new Date().toISOString().slice(0, 10);
  const battlesToday = state.summoning.battleDay === today ? state.summoning.battlesToday : 0;

  return <div className="max-w-5xl space-y-4">
    <SectionHeader title="Summoning" eyebrow="The Ember Gate" actions={<div className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 font-mono text-xs text-emberLight">{state.investment.bhc.toFixed(3)} BHC</div>} />
    <Panel bodyClassName="p-3"><div className="grid gap-3 text-center sm:grid-cols-4"><div><div className="section-label">Summons</div><div className="font-mono text-lg text-bone">{state.summoning.totalSummons}</div></div><div><div className="section-label">Unique Heroes</div><div className="font-mono text-lg text-bone">{state.summoning.heroes.length} / 125</div></div><div><div className="section-label">Legendary pity</div><div className="font-mono text-lg text-bronze">{state.summoning.pity} / 100</div></div><div><div className="section-label">Essence</div><div className="font-mono text-lg text-emberLight">{state.summoning.essence}</div></div></div></Panel>
    <div className="flex rounded-sm border border-iron bg-charcoal p-0.5">{(['summon', 'roster', 'history'] as const).map((entry) => <button key={entry} onClick={() => setTab(entry)} className={`flex-1 rounded-[3px] px-3 py-2 text-[11px] capitalize ${tab === entry ? 'bg-ember/15 text-emberLight' : 'text-mist hover:text-bone'}`}>{entry}</button>)}</div>

    {tab === 'summon' && <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <Panel bodyClassName="relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(156,61,48,.22),transparent_60%)]" />
        <div className="relative"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-ember/50 bg-ember/10 shadow-[0_0_50px_rgba(156,61,48,.2)]"><LuSparkles className="h-11 w-11 text-emberLight" /></div><h2 className="mt-4 text-xl font-semibold text-bone">Call a Hero through the Gate</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-mist">One of 125 class, rarity, and variation combinations. Duplicates grant Essence instead of extra battle capacity.</p><GameButton variant="primary" disabled={!canSummon} onClick={summonHero} className="mx-auto mt-5 px-6 py-2"><LuFlame className="h-4 w-4" /> Summon · {SUMMON_COST.toFixed(2)} BHC</GameButton><p className="mt-2 text-[10px] text-stone">Single summon only · no discount · server-verifiable roll in production</p></div>
      </Panel>
      <div className="space-y-4">
        <Panel header={<><LuGem className="h-4 w-4 text-bronze" /><PanelLabel>Rarity odds</PanelLabel></>}><div className="space-y-2">{SUMMON_RARITY_ODDS.map((entry) => <div key={entry.rarity} className="flex items-center justify-between text-xs capitalize"><span style={{ color: RARITY_COLOR[entry.rarity] }}>{entry.rarity}</span><span className="font-mono text-mist">{entry.chance * 100}%</span></div>)}</div><p className="mt-3 border-t border-iron/60 pt-3 text-[10px] text-stone">Every 10th guarantees Rare+, every 50th Epic+, and summon 100 guarantees Legendary if pity has not reset.</p></Panel>
        <Panel header={<><LuShield className="h-4 w-4 text-bronze" /><PanelLabel>1.00 BHC settlement</PanelLabel></>}><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-mist">Permanently burned</span><span className="font-mono text-emberLight">{SUMMON_BURN.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-mist">Battle Reward Pool</span><span className="font-mono text-verdant">{SUMMON_REWARD_POOL.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-mist">Treasury</span><span className="font-mono text-bronze">{SUMMON_TREASURY.toFixed(2)}</span></div></div></Panel>
      </div>
    </div>}

    {tab === 'roster' && <>
      <Panel bodyClassName="p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-mist"><span><LuSwords className="mr-1 inline h-3.5 w-3.5 text-bronze" /> Each unique Hero may run one reward battle every 24 hours.</span><span className="font-mono">Daily account cap {battlesToday}/{SUMMONED_HERO_BATTLE_CAP} · Pool {state.summoning.rewardPool.toFixed(3)} BHC</span></div></Panel>
      {heroes.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{heroes.map((hero) => {
        const waiting = hero.nextBattleAt > Date.now();
        return <div key={hero.id} className="panel p-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full border bg-black/20" style={{ borderColor: RARITY_COLOR[hero.rarity] }}><LuUserRound className="h-6 w-6" style={{ color: RARITY_COLOR[hero.rarity] }} /></div><div className="min-w-0 flex-1"><div className="font-semibold text-bone">{hero.name}</div><div className="text-[10px] capitalize" style={{ color: RARITY_COLOR[hero.rarity] }}>{hero.rarity} {hero.class} · V{hero.variation}</div><div className="mt-1 text-[10px] text-stone">Copies {hero.copies} · Essence {hero.essence}</div></div></div><GameButton variant="secondary" disabled={waiting || battlesToday >= SUMMONED_HERO_BATTLE_CAP || state.summoning.rewardPool <= 0} onClick={() => runSummonedHeroBattle(hero.id)} className="mt-3 w-full justify-center">{waiting ? <><LuClock className="h-3.5 w-3.5" /> On cooldown</> : <><LuSwords className="h-3.5 w-3.5" /> Reward battle</>}</GameButton></div>;
      })}</div> : <EmptyState icon={<LuSparkles className="h-7 w-7" />} title="No summoned Heroes" hint="Open the Ember Gate to begin your roster." />}
    </>}

    {tab === 'history' && <Panel header={<PanelLabel>Summoning history</PanelLabel>}><div className="space-y-2">{state.summoning.history.map((entry) => <div key={entry.id} className="flex items-center justify-between border-b border-iron/50 pb-2 text-[11px]"><div><span className="font-semibold" style={{ color: RARITY_COLOR[entry.rarity] }}>{entry.heroName}</span><span className="ml-2 capitalize text-mist">{entry.rarity} {entry.heroClass}</span>{entry.duplicate && <span className="ml-2 text-emberLight">Duplicate</span>}</div><span className="font-mono text-stone">#{entry.id.slice(-6)}</span></div>)}{!state.summoning.history.length && <EmptyState icon={<LuSparkles className="h-7 w-7" />} title="The Gate is quiet" hint="Your summon results will be recorded here." />}</div></Panel>}
  </div>;
}
