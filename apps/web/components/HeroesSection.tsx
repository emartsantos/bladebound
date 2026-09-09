'use client';

// Merged "Heroes" system: the account roster (up to HERO_CAP playable heroes,
// each with a rarity) is the single hero concept. Every new account starts
// with one free common hero; additional heroes are summoned with BHC (blocked
// at the cap). Summoning bookkeeping (pity/essence/history/reward battles)
// lives in the active hero's save and keeps the same settlement economy.

import { useMemo, useState } from 'react';
import { LuCoins, LuClock, LuFlame, LuGem, LuHistory, LuShield, LuSparkles, LuSwords, LuUserRound } from 'react-icons/lu';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';
import { useGame } from '@/lib/game-state';
import { useAuth } from '@/context/auth-context';
import { getPlayerClass } from '@/lib/classes';
import { HERO_CAP, SUMMON_BURN, SUMMON_COST, SUMMON_RARITY_ODDS, SUMMON_REWARD_POOL, SUMMON_TREASURY, SUMMONED_HERO_BATTLE_CAP } from '@/lib/game/service';
import type { SummonRarity } from '@/lib/persistence/game-persistence';
import { EmptyState, GameButton, Panel, PanelLabel, SectionHeader } from '@/components/game/primitives';

const rarityColor = (rarity: SummonRarity | undefined): string => rarity ? RARITY_TREATMENTS[rarity]?.bright ?? '#aaa49a' : '#aaa49a';

export function HeroesSection() {
  const { state, summonHero, runSummonedHeroBattle } = useGame();
  const { state: authState, selectCharacter, archiveCharacter } = useAuth();
  const characters = authState.characters ?? (authState.character ? [authState.character] : []);
  const [message, setMessage] = useState('');
  const canAfford = state.investment.bhc + 0.000001 >= SUMMON_COST;
  const rosterFull = characters.length >= HERO_CAP;
  const canSummon = canAfford && !rosterFull && !authState.isGuest;
  const today = new Date().toISOString().slice(0, 10);
  const battlesToday = state.summoning.battleDay === today ? state.summoning.battlesToday : 0;
  const ledger = useMemo(() => state.summoning.heroes, [state.summoning.heroes]);

  async function handleSummon() {
    if (authState.isGuest) { setMessage('Create an account to grow a hero roster.'); return; }
    setMessage('');
    const result = await summonHero();
    if (!result) { setMessage(rosterFull ? `Your roster is full (${HERO_CAP}/${HERO_CAP} heroes).` : 'You need more BHC to summon.'); return; }
    if (result.duplicate) setMessage(`${result.name} · duplicate — +${result.essenceGain} essence. That hero is already in your roster.`);
    else setMessage(`${result.rarity} ${result.name} summoned and added to your roster.`);
  }

  return (
    <div className="max-w-5xl space-y-4">
      <SectionHeader
        title="Heroes"
        eyebrow="Roster & Ember Gate"
        actions={<div className="flex items-center gap-1.5 rounded-sm border border-iron/70 bg-charcoal px-2.5 py-1.5"><LuCoins className="h-3.5 w-3.5 text-bronze" /><span className="font-mono text-xs text-emberLight">{state.investment.bhc.toFixed(3)} BHC</span></div>}
      />

      <Panel bodyClassName="p-3">
        <div className="grid gap-3 text-center sm:grid-cols-4">
          <div><div className="section-label">Heroes</div><div className="font-mono text-lg text-bone">{characters.length} / {HERO_CAP}</div></div>
          <div><div className="section-label">Summons</div><div className="font-mono text-lg text-bone">{state.summoning.totalSummons}</div></div>
          <div><div className="section-label">Legendary pity</div><div className="font-mono text-lg text-bronze">{state.summoning.pity} / 100</div></div>
          <div><div className="section-label">Essence</div><div className="font-mono text-lg text-emberLight">{state.summoning.essence}</div></div>
        </div>
      </Panel>

      <Panel header={<><LuUserRound className="h-4 w-4 text-bronze" /><PanelLabel>Hero roster</PanelLabel><span className="ml-auto font-mono text-[10px] text-stone">{characters.length} / {HERO_CAP} heroes</span></>}>
        {characters.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((hero) => {
              const active = hero.id === authState.character?.id;
              const color = rarityColor(hero.rarity);
              const record = hero.summonId ? ledger.find((entry) => entry.id === hero.summonId) : undefined;
              const waiting = record ? record.nextBattleAt > Date.now() : false;
              return (
                <div key={hero.id} className={`rounded-sm border p-3 ${active ? 'border-bronze/60 bg-bronze/10' : 'border-iron bg-charcoal'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-black/20" style={{ borderColor: color }}><LuUserRound className="h-6 w-6" style={{ color }} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-bone">
                        {hero.name}
                        <span className="ml-2 text-[9px] uppercase tracking-wider" style={{ color }}>{hero.rarity ?? 'common'}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-stone">{getPlayerClass(hero.class ?? 'warrior').name} · Lv {hero.combatLevel}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-wider text-verdantBright">{active ? 'Active hero' : 'Select hero'}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!active && <GameButton variant="secondary" onClick={() => void selectCharacter(hero.id)}>Select</GameButton>}
                    {!active && characters.length > 1 && <GameButton variant="ghost" onClick={() => void archiveCharacter(hero.id).then((result) => setMessage(result.success ? 'Hero archived.' : (result.error ?? 'Archive failed.')))}>Archive</GameButton>}
                    {record && (
                      <GameButton variant="secondary" disabled={waiting || battlesToday >= SUMMONED_HERO_BATTLE_CAP || state.summoning.rewardPool <= 0} onClick={() => runSummonedHeroBattle(record.id)} className="font-mono">
                        {waiting ? <><LuClock className="h-3.5 w-3.5" /> On cooldown</> : <><LuSwords className="h-3.5 w-3.5" /> Reward battle</>}
                      </GameButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<LuUserRound className="h-7 w-7" />} title="No heroes yet" hint="Your free common hero arrives with your account." />
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Panel bodyClassName="relative overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(156,61,48,.22),transparent_60%)]" />
          <div className="relative">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-ember/50 bg-ember/10 shadow-[0_0_50px_rgba(156,61,48,.2)]"><LuSparkles className="h-11 w-11 text-emberLight" /></div>
            <h2 className="mt-4 text-xl font-semibold text-bone">{rosterFull ? 'Your roster is full' : 'Call a Hero through the Gate'}</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-mist">
              {rosterFull
                ? 'Your company already has 5 heroes — archive one or keep building your existing lineup.'
                : 'Summon a new hero directly into your roster. Every account begins with one free common hero; the Gate joins a fresh hero at level 1.'}
            </p>
            <GameButton variant="primary" disabled={!canSummon} onClick={() => void handleSummon()} className="mx-auto mt-5 px-6 py-2">
              <LuFlame className="h-4 w-4" /> {rosterFull ? 'Roster full' : authState.isGuest ? 'Create an account to summon' : `Summon · ${SUMMON_COST.toFixed(2)} BHC`}
            </GameButton>
            <p className="mt-2 text-[10px] text-stone">Single summon only · no discount · server-verifiable roll in production</p>
            {message && <p className="mt-3 text-[11px] text-mist">{message}</p>}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel header={<><LuGem className="h-4 w-4 text-bronze" /><PanelLabel>Rarity odds</PanelLabel></>}>
            <div className="space-y-2">
              {SUMMON_RARITY_ODDS.map((entry) => (
                <div key={entry.rarity} className="flex items-center justify-between text-xs capitalize">
                  <span style={{ color: rarityColor(entry.rarity) }}>{entry.rarity}</span>
                  <span className="font-mono text-mist">{entry.chance * 100}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-iron/60 pt-3 text-[10px] text-stone">Every 10th guarantees Rare+, every 50th Epic+, and summon 100 guarantees Legendary if pity has not reset. Duplicate rolls grant Essence.</p>
          </Panel>
          <Panel header={<><LuShield className="h-4 w-4 text-bronze" /><PanelLabel>1.00 BHC settlement</PanelLabel></>}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-mist">Permanently burned</span><span className="font-mono text-emberLight">{SUMMON_BURN.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-mist">Battle Reward Pool</span><span className="font-mono text-verdant">{SUMMON_REWARD_POOL.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-mist">Treasury</span><span className="font-mono text-bronze">{SUMMON_TREASURY.toFixed(2)}</span></div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel header={<><LuHistory className="h-4 w-4 text-bronze" /><PanelLabel>Summoning history</PanelLabel></>}>
        <div className="space-y-2">
          {state.summoning.history.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b border-iron/50 pb-2 text-[11px]">
              <div>
                <span className="font-semibold" style={{ color: rarityColor(entry.rarity) }}>{entry.heroName}</span>
                <span className="ml-2 capitalize text-mist">{entry.rarity} {entry.heroClass}</span>
                {entry.duplicate && <span className="ml-2 text-emberLight">Duplicate</span>}
              </div>
              <span className="font-mono text-stone">#{entry.id.slice(-6)}</span>
            </div>
          ))}
          {!state.summoning.history.length && <EmptyState icon={<LuSparkles className="h-7 w-7" />} title="The Gate is quiet" hint="Your summon results will be recorded here." />}
        </div>
      </Panel>
    </div>
  );
}