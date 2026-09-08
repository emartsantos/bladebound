'use client';

import { ALL_DUNGEONS, ALL_ENEMIES } from '@premium-rpg/game-data';
import type {
  DungeonDefinition,
  DungeonEncounter,
  DungeonRunState,
  PlayerDungeonState,
} from '@premium-rpg/shared-types';
import { getRunProgress } from '@premium-rpg/game-engine';
import { LuSkull, LuSwords, LuScroll, LuDoorOpen, LuShield, LuZap, LuFlame } from 'react-icons/lu';
import { useGame } from '@/lib/game-state';
import { itemName } from '@/lib/item-names';
import { SectionHeader, Panel, PanelLabel, GameButton, Bar, EmptyState } from '@/components/game/primitives';
import { usePlayer } from '@/lib/use-player';
import { enemyArt } from '@/lib/enemy-art';

const MODIFIER_LABEL: Record<string, string> = {
  defensive: 'Defensive',
  offensive: 'Offensive',
  quick: 'Quick',
  tanky: 'Tanky',
  regenerating: 'Regenerating',
  cursed: 'Cursed',
};

const TYPE_LABEL: Record<string, string> = {
  trash: 'Trash',
  elite: 'Elite',
  miniboss: 'Miniboss',
  boss: 'Boss',
};

function enemyName(id: string | undefined): string {
  if (!id) return 'Unknown';
  const e = ALL_ENEMIES.find((e) => e.id === id);
  return e ? e.name.replace(/_/g, ' ') : id.replace(/_/g, ' ');
}

function EncounterRow({ encounter, isCurrent }: { encounter: DungeonEncounter; isCurrent: boolean }) {
  const mods = (encounter.modifiers ?? []).map((m) => MODIFIER_LABEL[m]).filter(Boolean);
  const representativeEnemy = encounter.enemyId ?? encounter.enemyIds?.[0];
  const art = representativeEnemy ? enemyArt(representativeEnemy) : null;
  return (
    <div
      className={`flex items-center gap-3 rounded-sm border p-2.5 ${
        isCurrent ? 'border-bronze/50 bg-bronze/5' : 'border-iron/50 bg-charcoal/40'
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-iron/70 bg-charcoal text-bronze">
        {art ? (
          <img src={art} alt="" className="h-6 w-6 object-contain" />
        ) : encounter.type === 'boss' ? (
          <LuFlame className="h-3.5 w-3.5" />
        ) : (
          <LuSwords className="h-3.5 w-3.5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-bone">{encounter.name}</span>
          <span className="rounded-sm border border-iron/60 px-1 py-0.5 text-[9px] uppercase tracking-wider text-stone">
            {TYPE_LABEL[encounter.type] ?? encounter.type}
          </span>
        </div>
        <div className="text-[10px] capitalize text-mist">
          {encounter.enemyId ? enemyName(encounter.enemyId) : (encounter.enemyIds ?? []).map(enemyName).join(' · ')}
          {mods.length > 0 && <span className="text-bronzeLight"> · {mods.join(', ')}</span>}
        </div>
      </div>
    </div>
  );
}

function ActiveRunView({
  run,
  dungeon,
  dungeonState,
}: {
  run: DungeonRunState;
  dungeon: DungeonDefinition;
  dungeonState: PlayerDungeonState;
}) {
  const { state, dungeonFight, abandonDungeon, clearDungeon } = useGame();
  const progress = getRunProgress(run, dungeon);
  const dc = state.dungeonCombat;
  const fighting = dc.encounter && !dc.encounter.finished;
  const encounter = dc.encounter;
  const runFinished = run.status === 'completed' || run.status === 'failed' || run.status === 'abandoned';

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader title={dungeon.name} eyebrow="Expedition" />

      {!runFinished && (
        <Panel header={<PanelLabel>{progress.currentEncounter?.name ?? 'Floor ' + progress.currentFloor}</PanelLabel>}>
          {fighting && encounter ? (
            <div className="space-y-3">
              <Bar variant="hp" pct={hpPct(encounter.player.health, encounter.player.maxHealth)} height={8} />
              <Bar variant="xp" pct={hpPct(encounter.enemy.health, encounter.enemy.maxHealth)} height={8} />
              <div className="flex justify-between text-[11px] text-mist">
                <span>{encounter.player.name} · {Math.max(0, Math.round(encounter.player.health))}/{encounter.player.maxHealth} HP</span>
                <span>{encounter.enemy.name} · {Math.max(0, Math.round(encounter.enemy.health))}/{encounter.enemy.maxHealth} HP</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-mist">
              {progress.currentEncounter?.description ?? 'Descend to the next floor.'}
            </p>
          )}
        </Panel>
      )}

      {(run.status === 'completed' || run.status === 'failed' || run.status === 'abandoned') && (
        <Panel bodyClassName="p-4">
          <div className="flex items-center gap-2 text-sm text-bone">
            <LuScroll className="h-4 w-4 text-bronze" />
            {run.status === 'completed' && `Run complete — floor ${run.currentFloor} of ${progress.totalFloors}`}
            {run.status === 'failed' && `You fell on floor ${run.currentFloor}.`}
            {run.status === 'abandoned' && 'You abandoned this expedition.'}
          </div>
          {run.status === 'completed' && progress.totalFloors > 0 && (
            <div className="mt-2">
              <Bar variant="resource" pct={Math.round((run.currentFloor / progress.totalFloors) * 100)} height={4} />
            </div>
          )}
        </Panel>
      )}

      <Panel header={<PanelLabel>Floors</PanelLabel>}>
        <div className="space-y-2">
          {dungeon.encounters.map((enc) => (
            <EncounterRow key={enc.id} encounter={enc} isCurrent={enc.id === progress.currentEncounter?.id} />
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {!fighting && !runFinished && (
          <GameButton variant="primary" onClick={dungeonFight}>
            <LuSwords className="h-3.5 w-3.5" /> Fight this floor
          </GameButton>
        )}
        {!runFinished && (
          <GameButton variant="danger" onClick={abandonDungeon}>
            <LuDoorOpen className="h-3.5 w-3.5" /> Abandon
          </GameButton>
        )}
        {runFinished && (
          <GameButton variant="secondary" onClick={clearDungeon}>
            Return to the surface
          </GameButton>
        )}
      </div>
    </div>
  );
}

function hpPct(hp: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((hp / max) * 100)));
}

export function DungeonsSection() {
  const { state, startDungeon, clearDungeon } = useGame();
  const { player } = usePlayer();
  const run = state.dungeon.currentRun;
  const activeDungeon = run ? ALL_DUNGEONS.find((d) => d.id === run.dungeonId) : null;

  if (run && run.status === 'active' && activeDungeon) {
    return (
      <ActiveRunView
        key={run.dungeonId}
        run={run}
        dungeon={activeDungeon}
        dungeonState={state.dungeon}
      />
    );
  }

  // Finished run awaiting reset: show the run result first.
  if (run && activeDungeon) {
    return (
      <ActiveRunView run={run} dungeon={activeDungeon} dungeonState={state.dungeon} />
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader title="Dungeons" eyebrow="Expeditions" />

      {ALL_DUNGEONS.length === 0 ? (
        <EmptyState icon={<LuSkull className="h-7 w-7" />} title="No expeditions" hint="Dungeons open as you prove your strength above ground." />
      ) : (
        ALL_DUNGEONS.map((d) => {
          const progress = state.dungeon.progress[d.id];
          const locked = player.combatLevel < d.entryRequirement.level;
          const hasKey = !d.entryRequirement.keyId || (state.inventory[d.entryRequirement.keyId] ?? 0) > 0;
          const keyName = d.entryRequirement.keyId ? itemName(d.entryRequirement.keyId) : null;
          const bestFloor = progress?.bestFloor ?? 0;
          const clears = progress?.clears ?? 0;

          return (
            <Panel key={d.id} header={
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[15px] font-semibold text-bone">{d.name}</h3>
                <span className="font-mono text-[11px] text-stone">Rec. Lv {d.recommendedLevel}</span>
              </div>
            }>
              <p className="text-xs text-mist">{d.description}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone">
                <span className="rounded-sm border border-iron/60 px-2 py-1">Floors {d.maxFloor}</span>
                {d.entryRequirement.keyId && (
                  <span className="rounded-sm border px-2 py-1" style={{ borderColor: hasKey ? '#3f7d4e' : '#8a2626' }}>
                    <LuShield className="mr-1 inline h-3 w-3" />
                    {keyName}: {hasKey ? 'Held' : 'Missing'}
                  </span>
                )}
                {bestFloor > 0 && <span className="rounded-sm border border-iron/60 px-2 py-1">Best floor {bestFloor}</span>}
                {clears > 0 && <span className="rounded-sm border border-iron/60 px-2 py-1">{clears} clear{clears > 1 ? 's' : ''}</span>}
              </div>

              <div className="mt-4 flex items-center gap-2">
                {locked ? (
                  <GameButton variant="secondary" disabled>
                    <LuZap className="h-3.5 w-3.5" /> Requires level {d.entryRequirement.level}
                  </GameButton>
                ) : hasKey ? (
                  <GameButton variant="primary" onClick={() => startDungeon(d.id)}>
                    <LuSkull className="h-3.5 w-3.5" /> Descend
                  </GameButton>
                ) : (
                  <GameButton variant="secondary" disabled>
                    <LuShield className="h-3.5 w-3.5" /> Need {keyName}
                  </GameButton>
                )}
                {d.reward.weightedLootTableId && (
                  <span className="text-[10px] italic text-stone">First clear grants bonus spoils</span>
                )}
              </div>
            </Panel>
          );
        })
      )}
    </div>
  );
}
