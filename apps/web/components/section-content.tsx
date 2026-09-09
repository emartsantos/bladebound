'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SectionId } from '@premium-rpg/ui-tokens';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';
import { LuClock, LuLock, LuMap, LuCompass, LuSparkles, LuHammer, LuFlame, LuClipboardList, LuBookMarked, LuTrophy, LuShoppingBag, LuSearch, LuCoins, LuSwords, LuSlidersHorizontal, LuScrollText, LuBackpack, LuX, LuCircleCheck, LuHistory, LuMail, LuCalendarDays, LuRefreshCw } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import type { QuestDefinition, PlayerSummary, EquipmentSlot, TaskAssignment, Rarity } from '@premium-rpg/shared-types';
import type { Region } from '@premium-rpg/game-data';
import { ITEM_BY_ID, QUESTS, ALL_REGIONS, ALL_ENEMIES, TASK_BY_ID, ACHIEVEMENTS, COLLECTION_ENTRIES } from '@premium-rpg/game-data';
import { getCurrentTasks } from '@premium-rpg/game-engine';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlayer } from '@/lib/use-player';
import { useGame } from '@/lib/game-state';
import { cumulativeXpForLevel } from '@/lib/player-summary';
import { xpStepForLevel, FORGE_COSTS, AWAKENING_COSTS, REBIRTH_COSTS, REBIRTH_LEVELS, heroReforgeCost, weaponRerollCost, forgedInventoryRarity } from '@/lib/game/service';
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
import { MarketplaceSection } from '@/components/MarketplaceSection';
import { SummoningSection } from '@/components/SummoningSection';
import { getPlayerClass } from '@/lib/classes';
import { assetPath } from '@/lib/asset-path';
import { APP_VERSION_LABEL } from '@/lib/version';
import { equipmentPower } from '@/lib/combat-progression';
import { enemyArt } from '@/lib/enemy-art';
import { checkSupabaseReadiness, type SupabaseReadiness } from '@/lib/supabase/config';
import { useAuth } from '@/context/auth-context';

// ── SHARED HELPERS ──────────────────────────────────────────────

function itemArt(id: string): string | null {
  if (itemHeal(id) !== undefined) return assetPath('/art/item-potion.svg');
  const def = ITEM_BY_ID[id];
  if (def?.type === 'weapon') return assetPath('/art/weapon-sword.svg');
  return null;
}

function RarityLabel({ id, name, rarity }: { id: string; name: string; rarity?: Rarity }) {
  const def = ITEM_BY_ID[id];
  const effectiveRarity = rarity ?? def?.rarity;
  const treat = effectiveRarity ? RARITY_TREATMENTS[effectiveRarity] : undefined;
  return (
    <span className="text-center text-[11px] font-medium" style={{ color: treat?.bright ?? '#6b6660' }}>
      <span className="block truncate">{name}</span>
      {effectiveRarity && <span className="block text-[9px] uppercase tracking-wide">{effectiveRarity}</span>}
    </span>
  );
}

// ── SECTION: CHARACTER ──────────────────────────────────────────

function CharacterSection() {
  const { player: p, baseStats, characterClass } = usePlayer();
  const { state: authState, selectCharacter, createCharacter, archiveCharacter } = useAuth();
  const [newHeroName, setNewHeroName] = useState('');
  const [heroMessage, setHeroMessage] = useState('');
  const { state, skillView, maxHealth, claimMail } = useGame();
  const combat = state.combat;
  const hpPct = Math.max(0, Math.min(100, Math.round((combat.playerHp / maxHealth) * 100)));
  const totalLevel = state.combatLevel + SKILL_ORDER.reduce((sum, id) => sum + skillView(id).level, 0);
  const power = equipmentPower(state.equipment);

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
            <span className="ml-2 border-l border-iron pl-2 font-mono text-xs text-emberLight">{state.investment.bhc.toFixed(3)} BHC</span>
          </div>
        }
      />

      {(authState.characters?.length ?? 0) > 0 && (
        <Panel header={<><PanelLabel>Hero roster</PanelLabel><span className="ml-auto font-mono text-[10px] text-stone">{authState.characters?.length ?? 0} / 3 slots</span></>}>
          <div className="grid gap-2 sm:grid-cols-3">
            {authState.characters?.map((hero) => {
              const active = hero.id === authState.character?.id;
              return (
                <button key={hero.id} disabled={active} onClick={() => void selectCharacter(hero.id)} className={`rounded-sm border p-3 text-left transition-colors ${active ? 'border-bronze/60 bg-bronze/10' : 'border-iron bg-charcoal hover:border-bronze/40'}`}>
                  <div className="truncate text-xs font-semibold text-bone">{hero.name}</div>
                  <div className="mt-1 text-[10px] text-stone">{getPlayerClass(hero.class ?? 'warrior').name} · Lv {hero.combatLevel}</div>
                  <div className={`mt-2 text-[9px] uppercase tracking-wider ${active ? 'text-verdantBright' : 'text-bronzeLight'}`}>{active ? 'Active hero' : 'Select hero'}</div>
                  {!active && (authState.characters?.length ?? 0) > 1 && (
                    <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); void archiveCharacter(hero.id).then((result) => setHeroMessage(result.success ? 'Hero archived.' : (result.error ?? 'Archive failed.'))); }} className="mt-2 inline-block text-[9px] text-dangerBright hover:underline">Archive</span>
                  )}
                </button>
              );
            })}
          </div>
          {(authState.characters?.length ?? 0) < 3 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-iron/60 pt-3">
              <input value={newHeroName} maxLength={24} onChange={(event) => setNewHeroName(event.target.value)} placeholder="New hero name" className="min-w-40 flex-1 rounded-sm border border-iron bg-charcoal px-2.5 py-1.5 text-xs text-bone outline-none focus:border-bronze/60" />
              <GameButton variant="secondary" disabled={newHeroName.trim().length < 2} onClick={() => void createCharacter({ name: newHeroName.trim(), class: 'warrior' }).then((result) => { setHeroMessage(result.success ? 'Hero created and selected.' : (result.error ?? 'Creation failed.')); if (result.success) setNewHeroName(''); })}>Create hero</GameButton>
            </div>
          )}
          {heroMessage && <p className="mt-2 text-[10px] text-mist">{heroMessage}</p>}
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel header={<><LuCalendarDays className="h-4 w-4 text-bronze" /><PanelLabel>Login calendar</PanelLabel><span className="ml-auto font-mono text-[10px] text-verdantBright">{state.retention.loginStreak} day streak</span></>}>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, index) => {
              const date = new Date(Date.now() - (6 - index) * 86_400_000);
              const key = date.toISOString().slice(0, 10);
              const active = Boolean(state.retention.loginDays[key]);
              return <div key={key} className={`rounded-sm border py-2 text-center ${active ? 'border-verdant/50 bg-verdant/10 text-verdantBright' : 'border-iron bg-charcoal text-stone'}`}><div className="text-[9px] uppercase">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div><div className="font-mono text-xs">{date.getDate()}</div></div>;
            })}
          </div>
          <p className="mt-2 text-[10px] text-stone">Longest streak: {state.retention.longestLoginStreak} days · rewards arrive in your mailbox.</p>
        </Panel>
        <Panel header={<><LuMail className="h-4 w-4 text-bronze" /><PanelLabel>Mailbox</PanelLabel><span className="ml-auto font-mono text-[10px] text-stone">{state.retention.mailbox.filter((mail) => !mail.claimed).length} unread rewards</span></>}>
          <div className="max-h-40 space-y-2 overflow-auto">
            {state.retention.mailbox.slice(0, 6).map((mail) => <div key={mail.id} className="flex items-center gap-2 border-b border-iron/50 pb-2"><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold text-bone">{mail.title}</div><div className="truncate text-[10px] text-stone">{mail.message}</div></div>{!mail.claimed && <GameButton variant="primary" onClick={() => claimMail(mail.id)}>Claim</GameButton>}</div>)}
            {state.retention.mailbox.length === 0 && <p className="text-[11px] text-stone">No messages yet.</p>}
          </div>
        </Panel>
      </div>
      {state.retention.offlineReport && state.retention.offlineReport.awayMs >= 60_000 && (
        <Panel header={<><LuClock className="h-4 w-4 text-bronze" /><PanelLabel>While you were away</PanelLabel></>}>
          <p className="text-xs text-mist">Away for {Math.floor(state.retention.offlineReport.awayMs / 3_600_000)}h {Math.floor((state.retention.offlineReport.awayMs % 3_600_000) / 60_000)}m. {state.retention.offlineReport.actionLabel ?? 'Your hero rested safely at camp.'}</p>
        </Panel>
      )}

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
                <span className="font-mono text-[11px] text-bronzeLight">Power {power}</span>
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
            const rarity = def ? forgedInventoryRarity(state, id, def.rarity) : 'common';
            const treat = RARITY_TREATMENTS[rarity];
            const Icon = bucketKind === 'equipment' && def ? (def.type === 'armor' ? ITEM_KIND_ICONS.armor : ITEM_KIND_ICONS.weapon) : ITEM_KIND_ICONS[bucketKind];
            const art = itemArt(id);
            const tip = `${itemName(id)} · ${rarity}${heal !== undefined ? ` · Heals ${heal} HP` : ''} · ${qty}x`;
            return (
              <div key={id} className="flex flex-col items-center gap-1">
                <Tooltip content={tip} side="top">
                  <ItemSlot rarity={rarity} size="md" qty={qty} aria-label={itemName(id)}>
                    {art ? (
                      <img src={art} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <Icon className="h-5 w-5" style={{ color: treat?.bright ?? '#55514b' }} />
                    )}
                  </ItemSlot>
                </Tooltip>
                <RarityLabel id={id} name={itemName(id)} rarity={rarity} />
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
  const { state, stats: baseStats, repairAll, equipItem, unequipItem } = useGame();
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

          const equippedRarity = (equipped.metadata?.forgedRarity as Rarity | undefined) ?? equippedDef?.rarity ?? 'common';
          const treat = RARITY_TREATMENTS[equippedRarity] ?? RARITY_TREATMENTS.common;
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
                <div className="text-[9px] uppercase tracking-wide" style={{ color: treat.bright }}>{equippedRarity}</div>
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

function ForgeInvestmentSection() {
  const { state, stats, forgeWeapon, awakenWeapon, rerollWeapon, rebirthHero, reforgeHero } = useGame();
  const weapon = state.equipment.weapon;
  const forge = Number(weapon?.metadata?.forgeLevel ?? 0);
  const awakening = Number(weapon?.metadata?.awakening ?? 0);
  const rerolls = Number(weapon?.metadata?.rerolls ?? 0);
  const nextForgeCost = forge < 10 ? FORGE_COSTS[forge] : null;
  const nextAwakenCost = awakening < 5 ? AWAKENING_COSTS[awakening] : null;
  const nextRebirthCost = state.investment.heroRebirth < 5 ? REBIRTH_COSTS[state.investment.heroRebirth] : null;
  const nextRebirthLevel = state.investment.heroRebirth < 5 ? REBIRTH_LEVELS[state.investment.heroRebirth] : null;
  const nextRerollCost = weaponRerollCost(state);
  const nextHeroReforgeCost = heroReforgeCost(state);
  const afford = (cost: number | null) => cost !== null && state.investment.bhc + 0.000001 >= cost;

  return <div className="max-w-4xl space-y-4">
    <SectionHeader title="Forge & Invest" eyebrow="The Ember Smithy" actions={<div className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 font-mono text-xs text-emberLight">{state.investment.bhc.toFixed(3)} BHC</div>} />
    <Panel bodyClassName="p-4"><div className="grid gap-3 sm:grid-cols-3"><StatRow label="Total burned" value={`${state.investment.burnedTotal.toFixed(3)} BHC`} /><StatRow label="Combat power" value={Math.round(stats.strength + stats.armor + stats.maxHealth / 10)} /><StatRow label="Investments" value={state.investment.history.length} /></div><p className="mt-3 text-[11px] text-mist">Normal battles never charge BHC. Every investment below permanently burns its displayed cost.</p></Panel>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel header={<><LuSwords className="h-4 w-4 text-bronze" /><PanelLabel>Weapon investment</PanelLabel></>}>
        {weapon ? <div className="space-y-4">
          <div><div className="text-sm font-semibold text-bone">{ITEM_BY_ID[weapon.itemId]?.name ?? weapon.itemId}</div><div className="text-[10px] text-stone">Forge +{forge}/10 · Awakening {awakening}/5 · {rerolls} rerolls</div></div>
          <div className="space-y-2">
            <div className="rounded-sm border border-iron bg-charcoal/60 p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-bone">Premium Forge +{Math.min(10, forge + 1)}</div><div className="text-[10px] text-mist">+4% weapon stats per level</div></div><GameButton variant="primary" disabled={!afford(nextForgeCost)} onClick={forgeWeapon}>{nextForgeCost === null ? 'Maxed' : `Burn ${nextForgeCost} BHC`}</GameButton></div></div>
            <div className="rounded-sm border border-iron bg-charcoal/60 p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-bone">Awakening tier {Math.min(5, awakening + 1)}</div><div className="text-[10px] text-mist">Requires Forge +{Math.min(10, (awakening + 1) * 2)} · +8% weapon stats</div></div><GameButton variant="secondary" disabled={!afford(nextAwakenCost) || forge < (awakening + 1) * 2} onClick={awakenWeapon}>{nextAwakenCost === null ? 'Maxed' : `Burn ${nextAwakenCost} BHC`}</GameButton></div></div>
            <div className="rounded-sm border border-iron bg-charcoal/60 p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-bone">Reroll weapon affix</div><div className="text-[10px] text-mist">Rarity-scaled cost · replaces the bonus stat</div></div><GameButton variant="secondary" disabled={!afford(nextRerollCost)} onClick={rerollWeapon}>{nextRerollCost === null ? 'Unavailable' : `Burn ${nextRerollCost} BHC`}</GameButton></div></div>
          </div>
        </div> : <EmptyState icon={<LuSwords className="h-7 w-7" />} title="No weapon equipped" hint="Equip a weapon before investing in it." />}
      </Panel>
      <Panel header={<><LuSparkles className="h-4 w-4 text-bronze" /><PanelLabel>Hero investment</PanelLabel></>}>
        <div className="space-y-3">
          <div className="rounded-sm border border-iron bg-charcoal/60 p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-semibold text-bone">Rebirth {state.investment.heroRebirth}/5</div><div className="text-[10px] text-mist">Permanent +5% base stats per tier · next requires level {nextRebirthLevel ?? '—'}</div></div><GameButton variant="primary" disabled={!afford(nextRebirthCost) || (nextRebirthLevel !== null && state.combatLevel < nextRebirthLevel)} onClick={rebirthHero}>{nextRebirthCost === null ? 'Maxed' : `Burn ${nextRebirthCost} BHC`}</GameButton></div></div>
          <div className="rounded-sm border border-iron bg-charcoal/60 p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-semibold text-bone">Hero reforge</div><div className="text-[10px] text-mist">Current: {state.investment.heroBonusStat ? `+${state.investment.heroBonusValue} ${state.investment.heroBonusStat}` : 'No bonus'} · {state.investment.heroReforge} reforges</div></div><GameButton variant="secondary" disabled={!afford(nextHeroReforgeCost)} onClick={reforgeHero}>Burn {nextHeroReforgeCost} BHC</GameButton></div></div>
        </div>
      </Panel>
    </div>
    <Panel header={<><LuHistory className="h-4 w-4 text-bronze" /><PanelLabel>Investment history</PanelLabel></>}><div className="space-y-2">{state.investment.history.slice(0, 12).map((entry) => <div key={entry.id} className="flex items-center justify-between border-b border-iron/50 pb-2 text-[11px]"><span className="text-mist">{entry.label}</span><span className="font-mono text-emberLight">-{entry.cost} BHC</span></div>)}{state.investment.history.length === 0 && <p className="text-[11px] text-stone">No investments yet. Win rewarded battles to earn BHC.</p>}</div></Panel>
  </div>;
}

// ── SECTION: QUESTS ─────────────────────────────────────────────

function QuestsSection() {
  const { state } = useGame();
  const quests = QUESTS.filter((quest) => quest.category === 'main').slice(0, 10);

  return (
    <div className="max-w-3xl space-y-4">
      <SectionHeader title="Quests" eyebrow="Journal" />

      {quests.length === 0 ? (
        <EmptyState icon={<LuScrollText className="h-7 w-7" />} title="No contracts " hint="Adventures will bring new contracts to the frontier." />
      ) : (
        quests.map((q) => {
          const progress = state.quest.active[q.id];
          const completed = Boolean(state.quest.completed[q.id]);
          const locked = !completed && !progress;
          const done = completed ? q.objectives.reduce((sum, o) => sum + o.required, 0) : Object.values(progress?.objectives ?? {}).reduce((sum, objective) => sum + objective.current, 0);
          const total = q.objectives.reduce((sum, o) => sum + o.required, 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={q.id} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-[15px] font-semibold text-bone">{q.name}</h3>
                <span className="rounded-sm border border-ember/40 bg-ember/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emberLight">
                  {completed ? 'completed' : locked ? 'locked' : 'active'}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-mist">{q.description}</p>

              <div className="mt-3 space-y-1.5">
                {q.objectives.map((o) => {
                  const objective = progress?.objectives[o.id];
                  return (
                  <div key={o.description} className="flex items-center gap-2 text-[11px] text-mist">
                    <span className={`h-1.5 w-1.5 rounded-sm border ${completed || objective?.completed ? 'border-verdant bg-verdant' : 'border-stone/60 bg-transparent'}`} />
                    <span className="flex-1">{o.description}</span>
                    <span className="font-mono text-stone">{completed ? o.required : objective?.current ?? 0}/{o.required}</span>
                  </div>
                )})}
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
  const { state, claimTask: claimTaskReward, rerollTask } = useGame();
  const current = getCurrentTasks(state.task, new Date());

  const group = (title: string, kind: 'daily' | 'weekly', assignments: TaskAssignment[]) => (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="section-label">{title}</h2>
        <span className="font-mono text-[10px] text-stone">
          {assignments.filter((a) => a.completed).length}/{assignments.length} complete
        </span>
      </div>
      {assignments.map((assignment, index) => {
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
                  {!assignment.completed && assignment.current === 0 && (
                    <GameButton variant="ghost" onClick={() => rerollTask(kind, index)}><LuRefreshCw className="h-3 w-3" /> Reroll</GameButton>
                  )}
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
      {group('Daily quests', 'daily', current.daily)}
      {group('Weekly contracts', 'weekly', current.weekly)}
    </div>
  );
}

function CollectionsSection() {
  const { state } = useGame();
  const collected = Object.values(state.collection.entries).filter((entry) => entry.collected).length;
  return <div className="max-w-4xl space-y-4">
    <SectionHeader title="Collections" eyebrow="Bestiary & Codex" actions={<span className="font-mono text-xs text-bronzeLight">{collected}/{COLLECTION_ENTRIES.length} collected</span>} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ALL_ENEMIES.slice(0, 24).map((enemy) => {
        const entry = state.bestiary.entries[enemy.id];
        const rep = state.retention.regionReputation[enemy.regionId] ?? 0;
        return <Panel key={enemy.id} bodyClassName="p-3"><div className="flex items-center gap-3"><div className="art-frame h-11 w-11 shrink-0">{entry?.discovered && enemyArt(enemy.id) ? <img src={enemyArt(enemy.id) ?? ''} alt="" className="h-9 w-9 object-contain" /> : <span className="text-lg text-stone">?</span>}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-bone">{entry?.discovered ? enemy.name : 'Undiscovered'}</div><div className="text-[10px] text-stone">Kills {entry?.killCount ?? 0} · Rep {rep}</div><div className="text-[9px] uppercase tracking-wider text-bronze">{entry?.completed ? 'Codex complete' : entry?.defeated ? `${entry.dropsDiscovered.length} drops found` : 'Not defeated'}</div></div></div></Panel>;
      })}
    </div>
  </div>;
}

function AchievementsSection() {
  const { state } = useGame();
  return <div className="max-w-4xl space-y-4">
    <SectionHeader title="Achievements" eyebrow="Legacy" actions={<span className="font-mono text-xs text-bronzeLight">{state.achievement.totalPoints} points · {state.achievement.totalCompleted}/{ACHIEVEMENTS.length}</span>} />
    <div className="grid gap-3 md:grid-cols-2">
      {ACHIEVEMENTS.map((achievement) => {
        const progress = state.achievement.progress[achievement.id];
        const hidden = achievement.hidden && !progress?.completed;
        const pct = Math.round((progress?.current ?? 0) * 100);
        return <Panel key={achievement.id} bodyClassName="p-4"><div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border ${progress?.completed ? 'border-verdant/50 bg-verdant/10 text-verdantBright' : 'border-iron bg-charcoal text-bronze'}`}><LuTrophy className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="text-xs font-semibold text-bone">{hidden ? 'Hidden achievement' : achievement.name}</h3><span className="font-mono text-[10px] text-bronze">+{achievement.reward.points}</span></div><p className="mt-0.5 text-[10px] text-mist">{hidden ? 'Continue exploring to reveal this honour.' : achievement.description}</p><Bar variant={progress?.completed ? 'resource' : 'xp'} pct={pct} height={4} className="mt-2" /></div></div></Panel>;
      })}
    </div>
  </div>;
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
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseReadiness>('checking');
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Audio volume': true,
    'Music volume': true,
    'Effects': true,
    'Reduced motion': true,
    'Notifications': true,
  });

  useEffect(() => {
    let active = true;
    checkSupabaseReadiness().then((status) => { if (active) setSupabaseStatus(status); });
    return () => { active = false; };
  }, []);

  const cloudStatus = {
    checking: ['Checking…', 'text-stone'],
    ready: ['Schema ready', 'text-verdantBright'],
    'schema-missing': ['Apply SQL migration', 'text-bronzeLight'],
    unconfigured: ['Not configured', 'text-stone'],
    unreachable: ['Connection unavailable', 'text-dangerBright'],
  }[supabaseStatus];

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
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <div>
              <div className="text-sm text-bone">Supabase cloud</div>
              <div className="text-[11px] text-mist">Secure account and save infrastructure</div>
            </div>
            <span className={`font-mono text-[11px] ${cloudStatus[1]}`}>{cloudStatus[0]}</span>
          </div>
          <div className="divider-row" />
          <Link
            href="/changelog"
            className="flex items-center justify-between gap-3 px-1 py-2 text-sm text-bone transition-colors hover:text-emberLight"
          >
            <span className="flex items-center gap-2"><LuHistory className="h-4 w-4 text-bronze" /> View changelog</span>
            <span className="font-mono text-[11px] text-stone">{APP_VERSION_LABEL}</span>
          </Link>
          <div className="divider-row" />
          <div className="flex items-center gap-2 px-1 pt-2 text-[11px] text-stone">
            <LuSlidersHorizontal className="h-3.5 w-3.5" /> Bladehound · dark fantasy idle RPG
            <span className="ml-auto font-mono">{APP_VERSION_LABEL}</span>
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
    case 'crafting': return <ForgeInvestmentSection />;
    case 'summoning': return <SummoningSection />;
    case 'tasks': return <TasksSection />;
    case 'collections': return <CollectionsSection />;
    case 'achievements': return <AchievementsSection />;
    case 'dungeons': return <DungeonsSection />;
    case 'shop': return <ShopSection />;
    case 'marketplace': return <MarketplaceSection />;
    case 'settings': return <SettingsSection />;
    default: return <PlaceholderSection id={section} />;
  }
}
