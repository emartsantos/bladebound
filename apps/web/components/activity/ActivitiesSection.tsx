'use client';

import { useEffect, useRef, useState } from 'react';
import { ALL_ENEMIES } from '@premium-rpg/game-data';
import { useGame } from '@/lib/game-state';
import { enemyArt } from '@/lib/enemy-art';
import { ACTIVITY_BY_ID, type ActivityId } from './activity-config';
import type { SceneEvent, SceneEventKind } from './activity-scenes';
import { ActivitySelector } from './ActivitySelector';
import { ActivityHero } from './ActivityHero';
import { HeroSummary } from './HeroSummary';
import { FightWorkspace } from './FightWorkspace';
import { GatherWorkspace } from './GatherWorkspace';
import { SideRail } from './SideRail';

const STORAGE_KEY = 'bladehound.activity';

function loadActivity(): ActivityId {
  if (typeof window === 'undefined') return 'fighting';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && ACTIVITY_BY_ID[raw as ActivityId]) return raw as ActivityId;
  } catch {
    /* storage unavailable */
  }
  return 'fighting';
}

/**
 * The Activities hub: cinematic hero + selector + three-column workspace.
 * Scene events are watched from real game logs (combat log / action log /
 * gains feed) and forwarded to the scene as short-lived pulses. The scenes
 * only OBSERVE — they never influence outcomes.
 */
export function ActivitiesSection() {
  const { state } = useGame();
  const combat = state.combat;
  const [activityId, setActivityId] = useState<ActivityId>(loadActivity);
  const [event, setEvent] = useState<SceneEvent | null>(null);

  const activity = ACTIVITY_BY_ID[activityId];

  // ── event derivation ──────────────────────────────────────────
  const prevLogs = useRef({ combat: 0, action: 0, gain: 0, active: '' });
  const keyRef = useRef(0);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const combatLen = combat.combatLog.length;
    const actionLen = state.actionLog.length;
    const gainLen = state.gains.length;
    const activeStamp = state.activeAction ? `${state.activeAction.skill}:${state.activeAction.startTime}` : 'none';
    const p = prevLogs.current;

    let kind: SceneEventKind | null = null;

    if (activity.id === 'fighting') {
      if (combatLen > p.combat) {
        const entry = combat.combatLog[combatLen - 1];
        if (entry.type === 'death') {
          kind = entry.actor === 'enemy' ? 'defeat' : 'hurt';
        } else if (entry.type === 'loot' || entry.type === 'xp') {
          kind = 'reward';
        } else if (entry.actor === 'player') {
          kind = entry.isCritical ? 'crit' : 'hit';
        } else if (entry.actor === 'enemy') {
          kind = 'hurt';
        }
      }
    } else if (state.activeAction?.skill === activity.skill) {
      if (activeStamp !== p.active && activity.id !== 'alchemy') {
        kind = activity.id === 'fishing' ? 'bite' : 'impact';
      }
    }

    if (!kind && actionLen > p.action) {
      const entry = state.actionLog[actionLen - 1];
      if (entry.skill === activity.skill) {
        kind = activity.id === 'fishing' ? 'catch' : 'complete';
      }
    }

    if (!kind && gainLen > p.gain && state.gains[gainLen - 1]?.kind === 'rare') {
      kind = 'rare';
    }

    prevLogs.current = { combat: combatLen, action: actionLen, gain: gainLen, active: activeStamp };

    if (kind) {
      const k = ++keyRef.current;
      setEvent({ key: k, kind });
      if (clearRef.current) clearTimeout(clearRef.current);
      clearRef.current = setTimeout(() => setEvent(null), 700);
    }
  }, [activity, activity.id, combat.combatLog, state.actionLog, state.gains, state.activeAction]);

  useEffect(() => () => {
    if (clearRef.current) clearTimeout(clearRef.current);
  }, []);

  const changeActivity = (id: ActivityId) => {
    setActivityId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable */
    }
  };

  const focusEnemy = ALL_ENEMIES.find((e) => e.id === combat.enemyId) ?? null;

  return (
    <div className="space-y-4">
      <ActivitySelector value={activityId} onChange={changeActivity} />

      <ActivityHero
        activity={ACTIVITY_BY_ID[activityId]}
        event={event}
        enemy={focusEnemy}
        medallion={focusEnemy ? enemyArt(focusEnemy.id) : null}
        onNavigateActivity={changeActivity}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(230px,280px)_minmax(0,1fr)_280px]">
        <div className="order-2 xl:order-1">
          <HeroSummary />
        </div>
        <div className="order-1 xl:order-2">
          {activity.id === 'fighting' ? (
            <FightWorkspace />
          ) : (
            <GatherWorkspace
              skill={activity.skill as import('@premium-rpg/shared-types').SkillId}
              activity={activity}
              onNavigateActivity={changeActivity}
            />
          )}
        </div>
        <div className="order-3">
          <SideRail />
        </div>
      </div>
    </div>
  );
}