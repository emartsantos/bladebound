'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuCalendarDays, LuClock3, LuCrown, LuHistory, LuSparkles } from 'react-icons/lu';
import { GAME_EVENTS, activeEvents, eventDay, eventStatus, expiredEvents, upcomingEvents, emptyParticipation, type GameEventDefinition } from '@/lib/game/events';
import { useGame } from '@/lib/game-state';
import { Panel, PanelLabel, GameButton } from '@/components/game/primitives';

type View = 'calendar' | 'upcoming' | 'archive';
const fmt = (value: number) => new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
const remaining = (end: number, now: number) => {
  const ms = Math.max(0, end - now);
  return `${Math.floor(ms / 86_400_000)}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
};

export function EventHub() {
  const { state, challengeEmberColossus } = useGame();
  const [view, setView] = useState<View>('calendar');
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const lists = useMemo(() => ({ active: activeEvents(now), upcoming: upcomingEvents(now), expired: expiredEvents(now) }), [now]);
  if (!now) return null;

  return (
    <Panel header={<><LuSparkles className="h-4 w-4 text-emberLight" /><PanelLabel>Event Calendar</PanelLabel><span className="ml-auto font-mono text-[9px] text-stone">All schedules UTC</span></>}>
      <div className="mb-3 flex gap-1 rounded-sm border border-iron/60 bg-black/15 p-1">
        {(['calendar', 'upcoming', 'archive'] as View[]).map((id) => (
          <button key={id} onClick={() => setView(id)} className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] capitalize ${view === id ? 'bg-ember/15 text-emberLight' : 'text-stone hover:text-bone'}`}>
            {id === 'archive' ? <LuHistory className="h-3 w-3" /> : <LuCalendarDays className="h-3 w-3" />}{id}
          </button>
        ))}
      </div>

      {view === 'calendar' && <div className="space-y-3">
        {lists.active.length > 0 && <div><div className="mb-1.5 text-[9px] uppercase tracking-[.16em] text-verdantBright">In progress</div>{lists.active.map((event) => <EventCard key={event.id} event={event} now={now} participation={state.events.participation[event.id]} onChallenge={event.id === 'ember-colossus-2026' ? challengeEmberColossus : undefined} />)}</div>}
        <div className="grid gap-2 sm:grid-cols-2">{GAME_EVENTS.map((event) => <CalendarRow key={event.id} event={event} now={now} />)}</div>
      </div>}

      {view === 'upcoming' && <div className="space-y-2">{lists.upcoming.map((event) => <EventCard key={event.id} event={event} now={now} participation={state.events.participation[event.id]} />)}{lists.upcoming.length === 0 && <p className="text-xs text-stone">No upcoming events announced.</p>}</div>}
      {view === 'archive' && <div className="space-y-2">{lists.expired.map((event) => <EventCard key={event.id} event={event} now={now} participation={state.events.participation[event.id]} />)}{lists.expired.length === 0 && <p className="text-xs text-stone">Completed events will appear here with your participation history.</p>}</div>}
    </Panel>
  );
}

function CalendarRow({ event, now }: { event: GameEventDefinition; now: number }) {
  const status = eventStatus(event, now);
  return <div className="rounded-sm border border-iron/60 bg-charcoal/50 p-2.5"><div className="flex justify-between gap-2"><span className="text-xs font-semibold text-bone">{event.name}</span><span className={`text-[9px] uppercase ${status === 'active' ? 'text-verdantBright' : status === 'upcoming' ? 'text-bronze' : 'text-stone'}`}>{status}</span></div><div className="mt-1 font-mono text-[9px] text-stone">{fmt(event.startsAt)} – {fmt(event.endsAt)}</div></div>;
}

function EventCard({ event, now, participation = emptyParticipation(), onChallenge }: { event: GameEventDefinition; now: number; participation?: ReturnType<typeof emptyParticipation>; onChallenge?: () => void }) {
  const status = eventStatus(event, now);
  const used = Boolean(participation.attemptsByDay[eventDay(now)]);
  return <div className={`rounded-sm border p-3 ${status === 'active' ? 'border-ember/60 bg-[radial-gradient(circle_at_top_right,rgba(212,105,47,.2),transparent_60%)]' : 'border-iron/60 bg-charcoal/50'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-xl"><div className="flex items-center gap-2"><LuCrown className="h-4 w-4 text-emberLight" /><h3 className="font-display text-base text-bone">{event.name}</h3></div><p className="mt-1 text-[11px] text-mist">{event.description}</p><p className="mt-1 text-[10px] text-bronze">{event.rewardSummary}</p></div>{status === 'active' && onChallenge && <GameButton variant="primary" disabled={used} onClick={onChallenge}>{used ? 'Attempt used today' : 'Challenge boss'}</GameButton>}</div>
    <div className="mt-2 flex flex-wrap gap-3 border-t border-iron/40 pt-2 font-mono text-[9px] text-stone"><span>{fmt(event.startsAt)} – {fmt(event.endsAt)}</span>{status === 'active' && <span className="text-emberLight"><LuClock3 className="mr-1 inline h-3 w-3" />{remaining(event.endsAt, now)} left</span>}<span>{event.cadence}</span><span>Attempts {Object.keys(participation.attemptsByDay).length} · Wins {participation.victories}</span></div>
    {participation.history.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{participation.history.slice(0, 7).map((entry) => <span key={`${entry.day}-${entry.createdAt}`} className={`rounded-sm px-1.5 py-0.5 text-[9px] ${entry.victory ? 'bg-verdant/15 text-verdantBright' : 'bg-danger/10 text-dangerBright'}`}>{entry.day} · {entry.victory ? 'Victory' : 'Defeat'}</span>)}</div>}
  </div>;
}
