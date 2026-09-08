'use client';

import { useState } from 'react';
import type { SectionId } from '@premium-rpg/ui-tokens';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';
import { LuClock, LuLock, LuMap, LuCompass, LuSparkles, LuHammer, LuFlame, LuClipboardList, LuBookMarked, LuTrophy, LuShoppingBag, LuSearch, LuCoins, LuSwords, LuSlidersHorizontal, LuScrollText, LuBackpack, LuX, LuCircleCheck } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import type { QuestDefinition, PlayerSummary, EquipmentSlot, TaskAssignment } from '@premium-rpg/shared-types';
import type { Region } from '@premium-rpg/game-data';
import { ITEM_BY_ID, QUESTS, ALL_REGIONS, ALL_ENEMIES, TASK_BY_ID } from '@premium-rpg/game-data';
import { getCurrentTasks } from '@premium-rpg/game-engine';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlayer } from '@/lib/use-player';
import { useGame } from '@/lib/game-state';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { xpStepForLevel } from '@/lib/game/service';
import { itemBucket, itemHeal, itemName } from '@/lib/item-names';
import { SKILL_ORDER, skillLabel } from '@/lib/skills-meta';
import { SkillIcon, ITEM_KIND_ICONS, EQUIPMENT_SLOT_ICONS } from '@/components/game/icons';
import { useNav } from '@/components/shell';
import { SectionHeader, Panel, PanelLabel, StatRow, StatGrid, Bar, BarLabel, GameButton, ItemSlot, EmptyState } from '@/components/game/primitives';
import { AdventureSection } from '@/components/AdventureSection';
import { SkillPanel } from '@/components/SkillPanel';
import { ActivitiesSection } from '@/components/activity/ActivitiesSection';
import { ShopSection } from '@/components/ShopSection';
import { DungeonsSection } from '@/components/DungeonsSection';
import { getPlayerClass } from '@/lib/classes';
import { assetPath } from '@/lib/asset-path';

// ── SHARED HELPERS ──────────────────────────────────────────────

function itemArt(id: string): string | null {
  if (itemHeal(id) !== undefined) return assetPath('/art/item-potion.svg');
  const def = ITEM_BY_ID[id];
  if (def?.type === 'weapon') return assetPath('/art/weapon-sword.svg');
  return null;
}

function RarityLabel({ id, name }: { id: string; name: string }) {
  const def = ITEM_BY_ID[id];
  const treat = def ? RARITY_TREATMENTS[def.rarity] : undefined;
  return (
    <span className="truncate text-[11px] font-medium" style={{ color: treat?.bright ?? '#6b6660' }}>
      {name}
    </span>
  );
}

// ── SECTION: CHARACTER ──────────────────────────────────────────

function CharacterSection() {
  const { player: p, baseStats, characterClass } = usePlayer();
  const { state, skillView, maxHealth } = useGame();
  const combat = state.combat;
  const hpPct = Math.max(0, Math.min(100, Math.round((combat.playerHp / maxHealth) * 100)));
  const totalLevel = state.combatLevel + SKILL_ORDER.reduce((sum, id) => sum + skillView(id).level, 0);

  // Combat progress uses the same XP/level math as skill bars (xp within the
  // current level over the xp required for the next) — not XP modulo 100.
  const combatXpStep = xpStepForLevel(state.combatLevel);
  const combatIntoLevel = Math.max(0, state.combatXp - cumulativeXpForLevel(state.combatLevel));
  const combatPct = combatXpStep > 0 ? Math.min(100, Math.round((combatIntoLevel / combatXpStep) * 100)) : 100;

  const attributes = [
    { label: 'Strength', value: baseStats.strength },
    { label: 'Agility', value: baseStats.agility },
    { label: 'Intelligence', value: baseStats.intelligence },
    { label: 'Vitality', value: baseStats.vitality },
  ];
  const combatStats = [
    { label: 'Attack Speed', value: `${baseStats.attackSpeed}x` },
    { label: 'Accuracy', value: baseStats.accuracy },
    { label: 'Evasion', value: baseStats.evasion },
    { label: 'Crit Chance', value: `${baseStats.critChance}%` },
    { label: 'Crit Damage', value: `${baseStats.critDamage}%` },
    { label: 'Damage', value: Math.floor(baseStats.strength * 0.9), accent: 'ember' as const },
    { label: 'Armor', value: baseStats.armor },
    { label: 'Max Health', value: maxHealth, accent: 'danger' as const },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader
        title="Character"
        eyebrow="Hero Sheet"
        actions={
          <div className="flex items-center gap-1.5 rounded-sm border border-iron/70 bg-charcoal px-2.5 py-1.5">
            <LuCoins className="h-3.5 w-3.5 text-bronze" />
            <span className="text-xs font-semibold text-bronze tabular-nums">{state.gold.toLocaleString()}</span>
          </div>
        }
      />

      {/* Identity + vitals */}
      <Panel
        header={
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-iron bg-charcoal text-sm font-semibold text-bronze">
              {p.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="truncate font-display text-[15px] font-semibold text-bone">{p.name}</h2>
                <span className="font-mono text-[11px] text-stone">Lv {state.combatLevel}</span>
                {characterClass && (
                  <span className="rounded-sm border border-bronze/40 bg-bronze/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-bronzeLight">
                    {getPlayerClass(characterClass).name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-mist">Total level {totalLevel}</p>
            </div>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <BarLabel left="Combat progress" right={`${state.combatLevel} → ${state.combatLevel + 1}`} className="mb-1" />
            <Bar variant="xp" pct={combatPct} />
          </div>
          <div>
            <BarLabel left="Health" right={`${combat.playerHp} / ${maxHealth}`} className="mb-1" />
            <Bar variant="hp" pct={hpPct} height={12} />
          </div>
        </div>
      </Panel>

      {/* Attributes + combat stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel header={<PanelLabel>Attributes</PanelLabel>}>
          <StatGrid items={attributes} cols={2} />
        </Panel>
        <Panel header={<PanelLabel>Combat</PanelLabel>}>
          <StatGrid items={combatStats} cols={2} />
        </Panel>
      </div>

      {/* Skills */}
      <Panel header={<PanelLabel>Skills</PanelLabel>}>
        <div className="space-y-2.5">
          {SKILL_ORDER.map((id) => {
            const view = skillView(id);
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-iron/70 bg-charcoal text-bronze">
                  <SkillIcon id={id} className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-bone">{skillLabel(id)}</span>
                    <span className="font-mono text-[10px] text-stone">Lv {view.level}</span>
                  </div>
                  <Bar variant="resource" pct={view.pct} height={4} className="mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ── SECTION: SKILLS ─────────────────────────────────────────────

function SkillsSection() {
  return <SkillPanel />;
}

// ── SECTION: INVENTORY ──────────────────────────────────────────

type Bucket = 'all' | 'materials' | 'food' | 'equipment';

const BUCKET_LABEL: Record<Bucket, string> = {
  all: 'All',
  materials: 'Materials',
  food: 'Food',
  equipment: 'Equipment',
};

function InventorySection() {
  const { state } = useGame();
  const [bucket, setBucket] = useState<Bucket>('all');
  const [query, setQuery] = useState('');

  const entries = Object.entries(state.inventory)
    .filter(([, qty]) => qty > 0)
    .filter(([id, qty]) => {
      const b = itemBucket(id);
      const inBucket =
        bucket === 'all' ||
        (bucket === 'food' ? b === 'food' : b === bucket);
      return inBucket && qty > 0;
    })
    .filter(([id]) => {
      if (!query) return true;
      return itemName(id).toLowerCase().includes(query.toLowerCase()) || id.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => itemName(a[0]).localeCompare(itemName(b[0])));

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader
        title="Inventory"
        eyebrow="Satchel"
        actions={
          <>
            <div className="flex items-center rounded-sm border border-iron/70 bg-charcoal p-0.5">
              {(['all', 'materials', 'food', 'equipment'] as Bucket[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBucket(b)}
                  className={`rounded-[3px] px-2.5 py-1 text-[11px] transition-colors ${
                    bucket === b ? 'bg-ember/15 text-emberLight' : 'text-mist hover:text-bone'
                  }`}
                >
                  {BUCKET_LABEL[b]}
                </button>
              ))}
            </div>
            <div className="relative">
              <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="input w-40 pl-8"
              />
            </div>
          </>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<LuBackpack className="h-7 w-7" />}
          title={query ? 'No matches for your search' : 'Nothing here yet'}
          hint="Gather, fish, mine, or fight for spoils to fill your satchel."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {entries.map(([id, qty]) => {
            const heal = itemHeal(id);
            const bucketKind = itemBucket(id);
            const def = ITEM_BY_ID[id];
            const treat = def ? RARITY_TREATMENTS[def.rarity] : undefined;
            const Icon = bucketKind === 'equipment' && def ? (def.type === 'armor' ? ITEM_KIND_ICONS.armor : ITEM_KIND_ICONS.weapon) : ITEM_KIND_ICONS[bucketKind];
            const art = itemArt(id);
            const tip = `${itemName(id)}${heal !== undefined ? ` · Heals ${heal} HP` : ''} · ${qty}x`;
            return (
              <div key={id} className="flex flex-col items-center gap-1">
                <Tooltip content={tip} side="top">
                  <ItemSlot rarity={def?.rarity ?? 'common'} size="md" qty={qty} aria-label={itemName(id)}>
                    {art ? (
                      <img src={art} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <Icon className="h-5 w-5" style={{ color: treat?.bright ?? '#55514b' }} />
                    )}
                  </ItemSlot>
                </Tooltip>
                <RarityLabel id={id} name={itemName(id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SECTION: EQUIPMENT ──────────────────────────────────────────

const EQUIPMENT_SLOT_ORDER: (keyof PlayerSummary['equipment'])[] = [
  'weapon', 'offhand', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'amulet', 'ring', 'cape',
];

const SLOT_LABEL: Record<string, string> = {
  weapon: 'Weapon', offhand: 'Offhand', helmet: 'Helmet', chest: 'Chest', gloves: 'Gloves',
  legs: 'Legs', boots: 'Boots', amulet: 'Amulet', ring: 'Ring', cape: 'Cape',
};

function EquipmentSection() {
  const { baseStats } = usePlayer();
  const { state, repairAll, equipItem, unequipItem } = useGame();
  const equipment = state.equipment;

  const summaryStats = [
    { label: 'Strength', value: baseStats.strength },
    { label: 'Agility', value: baseStats.agility },
    { label: 'Intelligence', value: baseStats.intelligence },
    { label: 'Vitality', value: baseStats.vitality },
    { label: 'Armor', value: baseStats.armor },
    { label: 'Damage', value: Math.floor(baseStats.strength * 0.9), accent: 'ember' as const },
  ];

  // Get available items from inventory for each slot
  const availableItems = Object.entries(state.inventory)
    .filter(([id, qty]) => qty > 0 && ITEM_BY_ID[id] !== undefined)
    .map(([id]) => ({ id, def: ITEM_BY_ID[id] }));

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader
        title="Equipment"
        eyebrow="Loadout"
        actions={
          <GameButton variant="secondary" onClick={repairAll}>
            <LuSparkles className="h-3.5 w-3.5" /> Repair all
          </GameButton>
        }
      />

      <Panel header={<PanelLabel>Boon Summary</PanelLabel>}>
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
          {summaryStats.map((s) => <StatRow key={s.label} {...s} />)}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EQUIPMENT_SLOT_ORDER.map((slot) => {
          const equipped = equipment[slot];
          const SlotIcon = EQUIPMENT_SLOT_ICONS[slot as string] ?? LuSwords;

          // Get the item definition for equipped item
          const equippedDef = equipped ? ITEM_BY_ID[equipped.itemId] : undefined;

          // Find available items in inventory for this slot
          const availableForSlot = availableItems.filter((a) => a.def.equipmentSlot === slot);

          if (!equipped) {
            return (
              <div key={slot} className="panel flex items-center gap-3 p-3">
                <ItemSlot rarity="common" size="sm">
                  <SlotIcon className="h-4 w-4 text-stone/40" />
                </ItemSlot>
                <div className="min-w-0 flex-1">
                  <div className="section-label">{SLOT_LABEL[slot]}</div>
                  <div className="text-[11px] text-stone/60">Empty</div>
                </div>
                {availableForSlot.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableForSlot.map((a) => (
                      <GameButton
                        key={a.id}
                        variant="ghost"
                        onClick={() => equipItem(slot, a.id)}
                        className="px-2 py-1 text-[10px]"
                      >
                        Equip {a.def.name}
                      </GameButton>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const treat = RARITY_TREATMENTS[equippedDef?.rarity ?? 'common'] ?? RARITY_TREATMENTS.common;
          const dur = state.durability[equipped.uid] ?? 100;
          const art = itemArt(equipped.itemId);
          const style = { borderColor: treat.border, boxShadow: treat.animation === 'pulse' ? undefined : treat.glow === 'none' ? undefined : treat.glow };

          return (
            <div key={slot} className="panel flex items-center gap-3 p-3">
              <div className="slot h-11 w-11" style={style}>
                {art ? (
                  <img src={art} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <SlotIcon className="h-4 w-4" style={{ color: treat.bright }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="section-label">{SLOT_LABEL[slot]}</div>
                <div className="truncate text-xs font-semibold" style={{ color: treat.bright }}>{equippedDef?.name ?? 'Unknown'}</div>
                <div className="flex items-center gap-2">
                  <Bar variant="resource" pct={dur} height={4} className="mt-1 flex-1" />
                  <span className="font-mono text-[9px] text-stone">Dur {dur}%</span>
                </div>
              </div>
              <GameButton variant="ghost" onClick={() => unequipItem(slot)} className="ml-2">
                <LuX className="h-3.5 w-3.5" /> Unequip
              </GameButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SECTION: QUESTS ─────────────────────────────────────────────

function questProgress(q: QuestDefinition): { done: number; total: number } {
  return {
    done: 0,
    total: q.objectives.reduce((sum, o) => sum + o.required, 0),
  };
}

function QuestsSection() {
  const quests = QUESTS.slice(0, 5);

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader title="Quests" eyebrow="Journal" />

      {quests.length === 0 ? (
        <EmptyState icon={<LuScrollText className="h-7 w-7" />} title="No contracts " hint="Adventures will bring new contracts to the frontier." />
      ) : (
        quests.map((q) => {
          const { done, total } = questProgress(q);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={q.id} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-[15px] font-semibold text-bone">{q.name}</h3>
                <span className="rounded-sm border border-ember/40 bg-ember/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emberLight">
                  {q.category}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-mist">{q.description}</p>

              <div className="mt-3 space-y-1.5">
                {q.objectives.map((o) => (
                  <div key={o.description} className="flex items-center gap-2 text-[11px] text-mist">
                    <span className="h-1.5 w-1.5 rounded-sm border border-stone/60 bg-transparent" />
                    <span className="flex-1">{o.description}</span>
                    <span className="font-mono text-stone">{0}/{o.required}</span>
                  </div>
                ))}
              </div>

              <div className="divider-row mt-3 pt-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-stone">
                    <LuClock className="h-3 w-3" />
                    {done}/{total} objectives
                  </div>
                  <div className="text-[11px] text-bronze">+{q.rewards.gold}g · +{q.rewards.experience}xp</div>
                </div>
                <Bar variant="xp" pct={pct} height={4} className="mt-2" />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── SECTION: WORLD ──────────────────────────────────────────────

function WorldSection() {
  const { state, setCombatTarget } = useGame();
  const { setActiveSection } = useNav();
  const combatLevel = state.combatLevel;

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader title="World" eyebrow="Frontier Atlas" />

      <div className="space-y-3">
        {ALL_REGIONS.map((r: Region, i) => {
          const unlocked = combatLevel >= r.recommendedLevel;
          const firstFoe = ALL_ENEMIES.find((e) => e.regionId === r.id);
          const art = i === 0 ? assetPath('/art/region-starter-frontier.svg') : null;
          return (
            <button
              key={r.id}
              disabled={!unlocked}
              onClick={() => { if (firstFoe) { setCombatTarget(r.id, firstFoe.id); setActiveSection('adventure'); } }}
              className={`panel group w-full p-4 text-left transition-colors ${
                unlocked ? 'hover:border-bronze/50' : 'opacity-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {art ? (
                  <div className="art-frame h-14 w-14 flex-shrink-0">
                    <img src={art} alt="" className="h-12 w-12 object-contain" />
                  </div>
                ) : (
                  <div className="art-frame h-12 w-12 flex-shrink-0">
                    {unlocked
                      ? <LuMap className="h-5 w-5 text-bronze" />
                      : <LuLock className="h-4 w-4 text-stone/70" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[15px] font-semibold text-bone">{r.name}</h3>
                    <span className="font-mono text-[10px] text-stone">Lv {r.recommendedLevel}</span>
                    {unlocked && r.boss && (
                      <span className="flex items-center gap-1 rounded-sm border border-bronze/40 bg-bronze/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-bronzeLight">
                        <LuSwords className="h-3 w-3" /> {r.boss.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] capitalize text-mist">
                    {r.visualIdentity.replace(/-/g, ' ')} · {r.resources.length} resources ·{' '}
                    <span className={unlocked ? 'text-verdant' : 'text-stone'}>{unlocked ? 'Available in Adventure' : 'Locked'}</span>
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-stone group-hover:text-bronze">
                    {unlocked ? <LuCompass className="h-3 w-3" /> : <LuLock className="h-3 w-3" />}
                    {unlocked ? 'Enter the hunt' : `Required: combat level ${r.recommendedLevel}`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── GENERIC / PLACEHOLDER SECTIONS ──────────────────────────────

function TasksSection() {
  const { state, claimTask: claimTaskReward } = useGame();
  const current = getCurrentTasks(state.task, new Date());

  const group = (title: string, assignments: TaskAssignment[]) => (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="section-label">{title}</h2>
        <span className="font-mono text-[10px] text-stone">
          {assignments.filter((a) => a.completed).length}/{assignments.length} complete
        </span>
      </div>
      {assignments.map((assignment) => {
        const definition = TASK_BY_ID[assignment.taskId];
        const pct = Math.min(100, Math.round((assignment.current / assignment.required) * 100));
        return (
          <Panel key={assignment.taskId} bodyClassName="p-4">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border ${assignment.completed ? 'border-verdant/50 bg-verdant/10 text-verdantBright' : 'border-iron bg-charcoal text-bronze'}`}>
                {assignment.completed ? <LuCircleCheck className="h-4 w-4" /> : <LuClipboardList className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-bone">{definition?.name ?? assignment.taskId}</h3>
                  <span className="font-mono text-[10px] text-stone">{assignment.current}/{assignment.required}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-mist">{definition?.description}</p>
                <Bar variant={assignment.completed ? 'resource' : 'xp'} pct={pct} height={4} className="mt-2" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-bronze">
                    +{definition?.reward.gold ?? 0}g · +{definition?.reward.experience ?? 0} XP
                  </span>
                  {assignment.completed && !assignment.claimed && (
                    <GameButton variant="primary" onClick={() => claimTaskReward(assignment.taskId)}>Claim reward</GameButton>
                  )}
                  {assignment.claimed && <span className="text-[10px] uppercase tracking-wider text-verdantBright">Claimed</span>}
                </div>
              </div>
            </div>
          </Panel>
        );
      })}
    </section>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <SectionHeader title="Tasks" eyebrow="Daily & Weekly" />
      {group('Daily quests', current.daily)}
      {group('Weekly contracts', current.weekly)}
    </div>
  );
}

const PLACEHOLDER: Record<string, { icon: IconType; blurb: string; empty: string; hint: string }> = {
  crafting: { icon: LuHammer, blurb: 'Weapons, armor, bars and consumables, forged from gathered materials.', empty: 'The fires are cold', hint: 'Mine and smelt ores to unlock forging here.' },
  tasks: { icon: LuClipboardList, blurb: 'Daily and weekly objectives with steady rewards.', empty: 'No tasks issued', hint: 'New tasks arrive each day and week.' },
  collections: { icon: LuBookMarked, blurb: 'Bestiary, codex and completion tracking for hunters and scholars.', empty: 'Codex blank', hint: 'Defeat creatures and gather items to record them.' },
  achievements: { icon: LuTrophy, blurb: 'Milestones, titles and exclusive rewards for legendary hunters.', empty: 'No honours yet', hint: 'Bold hunts and long craft will earn your name.' },
};

function PlaceholderSection({ id }: { id: SectionId }) {
  const meta = PLACEHOLDER[id];
  const Icon = meta?.icon ?? LuSparkles;
  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title={id.charAt(0).toUpperCase() + id.slice(1)} eyebrow="Undertaking" />
      <Panel bodyClassName="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-iron bg-charcoal text-bronze">
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-mist">{meta?.blurb}</p>
        </div>
      </Panel>
      <EmptyState icon={<Icon className="h-7 w-7" />} title={meta?.empty ?? 'Not yet available'} hint={meta?.hint} />
    </div>
  );
}

// ── SETTINGS ────────────────────────────────────────────────────

const SETTING_ROWS = [
  { label: 'Audio volume', hint: 'Master volume for the tavern ambience' },
  { label: 'Music volume', hint: 'Battle and exploration themes' },
  { label: 'Effects', hint: 'Combat and gathering sound cues' },
  { label: 'Reduced motion', hint: 'Tone down animations and pulses' },
  { label: 'Notifications', hint: 'Toggle in-game alerts and loot toasts' },
];

function SettingsSection() {
  const { resetProgress } = useGame();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Audio volume': true,
    'Music volume': true,
    'Effects': true,
    'Reduced motion': true,
    'Notifications': true,
  });

  return (
    <div className="max-w-xl space-y-4">
      <SectionHeader title="Settings" eyebrow="Preference" />

      <Panel header={<PanelLabel>Tuning</PanelLabel>}>
        <div className="space-y-0.5">
          {SETTING_ROWS.map((row, i) => {
            const on = toggles[row.label];
            return (
              <div key={row.label} className={i > 0 ? 'divider-row py-2.5' : 'py-2.5'}>
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <div className="text-sm text-bone">{row.label}</div>
                    <div className="text-[11px] text-mist">{row.hint}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() => setToggles((t) => ({ ...t, [row.label]: !on }))}
                    className={`relative h-5 w-9 flex-shrink-0 rounded-sm border transition-colors ${
                      on ? 'border-ember/60 bg-ember/20' : 'border-iron bg-charcoal'
                    }`}
                  >
                    <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-sm transition-all ${on ? 'left-[18px] bg-emberBright' : 'left-0.5 bg-stone'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel header={<PanelLabel>Game Data</PanelLabel>}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <div className="min-w-0">
              <div className="text-sm text-bone">Reset progress</div>
              <div className="text-[11px] text-mist">Erase your save and start the hunt anew.</div>
            </div>
            <GameButton variant="danger" onClick={() => { if (window.confirm('Erase all progress and start over?')) resetProgress(); }}>
              Reset
            </GameButton>
          </div>
          <div className="divider-row" />
          <div className="flex items-center gap-2 px-1 pt-2 text-[11px] text-stone">
            <LuSlidersHorizontal className="h-3.5 w-3.5" /> Bladehound · dark fantasy idle RPG
            <span className="ml-auto font-mono">v0.1.0</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ── SECTION ROUTER ──────────────────────────────────────────────

export function SectionContent({ section }: { section: SectionId }) {
  switch (section) {
    case 'character': return <CharacterSection />;
    case 'skills': return <SkillsSection />;
    case 'inventory': return <InventorySection />;
    case 'quests': return <QuestsSection />;
    case 'world': return <WorldSection />;
    case 'equipment': return <EquipmentSection />;
    case 'adventure': return <AdventureSection />;
    case 'activities': return <ActivitiesSection />;
    case 'crafting': return <PlaceholderSection id={section} />;
    case 'tasks': return <TasksSection />;
    case 'collections':
    case 'achievements':
      return <PlaceholderSection id={section} />;
    case 'dungeons': return <DungeonsSection />;
    case 'shop': return <ShopSection />;
    case 'settings': return <SettingsSection />;
    default: return <PlaceholderSection id={section} />;
  }
}
