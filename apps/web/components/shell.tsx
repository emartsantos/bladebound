'use client';

import { useState, useCallback, ReactNode, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SECTION_META,
  PRIMARY_SECTIONS,
  PROGRESSION_SECTIONS,
  CONTENT_SECTIONS,
  SYSTEM_SECTIONS,
  type SectionId,
} from '@premium-rpg/ui-tokens';
import type { IconType } from 'react-icons';
import {
  LuUser, LuSwords, LuMap, LuLayers, LuBackpack, LuSword, LuHammer, LuFlame,
  LuScrollText, LuClipboardList, LuBookMarked, LuTrophy, LuShoppingBag, LuSettings,
  LuBell, LuChevronLeft, LuMenu, LuX, LuCoins, LuHeart, LuCrown, LuChevronDown,
  LuLogOut, LuGauge, LuCompass, LuFlameKindling,
  LuHistory, LuStore, LuSparkles,
} from 'react-icons/lu';
import { Tooltip } from '@/components/ui/tooltip';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/context/auth-context';
import { usePlayer } from '@/lib/use-player';
import { useGame } from '@/lib/game-state';
import { SKILL_ORDER, skillLabel } from '@/lib/skills-meta';
import { SkillIcon } from '@/components/game/icons';
import { CurrentAction } from '@/components/CurrentAction';
import { APP_VERSION_LABEL } from '@/lib/version';

// ── NAV DEFINITION ──────────────────────────────────────────────

interface NavEntry {
  id: SectionId;
  icon: IconType;
  description: string;
}

const NAV_ICONS: Record<SectionId, IconType> = {
  activities: LuFlameKindling,
  character: LuUser,
  adventure: LuSwords,
  world: LuMap,
  skills: LuLayers,
  inventory: LuBackpack,
  equipment: LuSword,
  crafting: LuHammer,
  summoning: LuSparkles,
  dungeons: LuFlame,
  quests: LuScrollText,
  tasks: LuClipboardList,
  collections: LuBookMarked,
  achievements: LuTrophy,
  shop: LuShoppingBag,
  marketplace: LuStore,
  settings: LuSettings,
};

const NAV_ENTRIES: Record<SectionId, NavEntry> = {
  activities: { id: 'activities', icon: LuFlameKindling, description: 'The Hunt — live activity scene and ventures' },
  character: { id: 'character', icon: LuUser, description: 'Character sheet and stats' },
  adventure: { id: 'adventure', icon: LuSwords, description: 'Region battles, creatures and rewards' },
  world: { id: 'world', icon: LuMap, description: 'Region map and progression' },
  skills: { id: 'skills', icon: LuLayers, description: 'Skill development' },
  inventory: { id: 'inventory', icon: LuBackpack, description: 'Items and materials' },
  equipment: { id: 'equipment', icon: LuSword, description: 'Character loadout' },
  crafting: { id: 'crafting', icon: LuHammer, description: 'Production and recipes' },
  summoning: { id: 'summoning', icon: LuSparkles, description: 'Summon and command collectible Heroes' },
  dungeons: { id: 'dungeons', icon: LuFlame, description: 'Dungeon runs' },
  quests: { id: 'quests', icon: LuScrollText, description: 'Quest journal' },
  tasks: { id: 'tasks', icon: LuClipboardList, description: 'Daily and weekly objectives' },
  collections: { id: 'collections', icon: LuBookMarked, description: 'Codex and completions' },
  achievements: { id: 'achievements', icon: LuTrophy, description: 'Milestones and rewards' },
  shop: { id: 'shop', icon: LuShoppingBag, description: 'Store and economy' },
  marketplace: { id: 'marketplace', icon: LuStore, description: 'Trade heroes and weapons for BHC' },
  settings: { id: 'settings', icon: LuSettings, description: 'Preferences and account' },
};

const NAV_GROUPS: { label: string; sections: readonly SectionId[] }[] = [
  { label: 'Adventuring', sections: PRIMARY_SECTIONS },
  { label: 'Progression', sections: PROGRESSION_SECTIONS },
  { label: 'Content', sections: CONTENT_SECTIONS },
  { label: 'System', sections: SYSTEM_SECTIONS },
];

const MOBILE_TABS: SectionId[] = ['activities', 'adventure', 'character', 'inventory', 'skills'];

// ── NAVIGATION CONTEXT ──────────────────────────────────────────

interface NavContextValue {
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  navCollapsed: boolean;
  setNavCollapsed: (v: boolean) => void;
  contextPanelOpen: boolean;
  setContextPanelOpen: (v: boolean) => void;
}

const NavContext = createContext<NavContextValue>({
  activeSection: 'adventure',
  setActiveSection: () => {},
  navCollapsed: false,
  setNavCollapsed: () => {},
  contextPanelOpen: true,
  setContextPanelOpen: () => {},
});

export function useNav() {
  return useContext(NavContext);
}

// Game sections are URL addressable: activeSection is derived from the path so
// direct links, refresh and browser Back/Forward all keep the correct section.

const VALID_SECTION_IDS = new Set<string>(Object.keys(SECTION_META));

export function sectionFromPathname(pathname: string): SectionId {
  const match = pathname.match(/^\/game\/([a-z]+)/);
  const id = match?.[1] ?? 'activities';
  return VALID_SECTION_IDS.has(id) ? (id as SectionId) : 'activities';
}

export function sectionHref(id: SectionId): string {
  return id === 'activities' ? '/game' : `/game/${id}`;
}

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = sectionFromPathname(pathname ?? '');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const setActiveSection = useCallback(
    (id: SectionId) => {
      router.push(sectionHref(id));
    },
    [router],
  );

  return (
    <NavContext.Provider value={{ activeSection, setActiveSection, navCollapsed, setNavCollapsed, contextPanelOpen, setContextPanelOpen }}>
      {children}
    </NavContext.Provider>
  );
};

// ── SHARED PIECES ───────────────────────────────────────────────

function NavRow({
  entry,
  active,
  onClick,
  labelOverride,
}: {
  entry: NavEntry;
  active: boolean;
  onClick: () => void;
  labelOverride?: string;
}) {
  const label = labelOverride ?? SECTION_META[entry.id].label;
  return (
    <Tooltip content={entry.description} side="right">
      <button
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`group flex w-full items-center gap-3 border-l-2 py-[7px] pl-3 pr-3 text-[13px] transition-colors ${
          active
            ? 'border-ember bg-ember/10 text-parchment'
            : 'border-transparent text-mist hover:border-iron hover:bg-iron/30 hover:text-bone'
        }`}
      >
        <entry.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-emberLight' : 'text-stone group-hover:text-bronze'}`} />
        <span className="truncate">{label}</span>
      </button>
    </Tooltip>
  );
}

function ResourceChip({ icon, tone, value }: { icon: ReactNode; tone?: string; value: ReactNode }) {
  return (
    <Tooltip content={value as string}>
      <div className="flex items-center gap-1.5 rounded-sm border border-iron/70 bg-charcoal/80 px-2 py-1">
        <span className={`text-[11px] ${tone ?? 'text-mist'}`}>{icon}</span>
        <span className="text-xs font-semibold text-bone tabular-nums">{value}</span>
      </div>
    </Tooltip>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-iron bg-charcoal text-bronze shadow-inset">
        <LuSwords className="h-4 w-4" />
      </span>
      <span className="hidden font-display text-[15px] font-semibold tracking-[0.2em] text-bone sm:block">
        BLADEHOUND
      </span>
      <span className="hidden text-[10px] font-mono text-stone md:inline">{APP_VERSION_LABEL}</span>
    </Link>
  );
}

// ── TOP BAR ─────────────────────────────────────────────────────

export function TopBar() {
  const { activeSection, setActiveSection } = useNav();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const { player } = usePlayer();
  const { state, maxHealth } = useGame();

  const profileItems = [
    { label: 'Settings', value: 'settings', icon: <LuSettings className="h-3.5 w-3.5" /> },
    { label: 'Changelog', value: 'changelog', icon: <LuHistory className="h-3.5 w-3.5" /> },
    { label: 'Logout', value: 'logout', icon: <LuLogOut className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-topbar h-14 border-b border-iron bg-charcoal/95 shadow-[0_1px_0_rgba(0,0,0,0.5)] backdrop-blur">
      <div className="flex h-full items-center justify-between gap-3 px-3 md:px-5">
        <Wordmark />

        {/* DESKTOP: current action + primary quick-nav */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-4 xl:flex">
          <CurrentAction />
          {PRIMARY_SECTIONS.map((id) => {
            const Icon = NAV_ICONS[id];
            const active = activeSection === id;
            return (
              <Tooltip key={id} content={NAV_ENTRIES[id].description} side="bottom">
                <button
                  onClick={() => setActiveSection(id)}
                  className={`flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-xs transition-colors ${
                    active ? 'bg-ember/15 text-emberLight' : 'text-mist hover:bg-iron/30 hover:text-bone'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {SECTION_META[id].label}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* RIGHT: resources + account + menu */}
        <div className="flex items-center gap-2">
          <ResourceChip icon={<LuCrown className="h-3.5 w-3.5" />} value={`Lv ${state.combatLevel}`} />
          <div className="hidden sm:block">
            <ResourceChip icon={<LuCoins className="h-3.5 w-3.5 text-bronze" />} tone="text-bronze" value={state.gold.toLocaleString()} />
          </div>
          <div className="hidden md:block">
            <ResourceChip icon={<LuHeart className="h-3.5 w-3.5 text-danger" />} tone="text-dangerBright" value={`${state.combat.playerHp}/${maxHealth}`} />
          </div>

          <button
            aria-label="notifications"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron/70 bg-charcoal/80 text-mist transition-colors hover:border-iron hover:text-bone"
          >
            <LuBell className="h-4 w-4" />
          </button>

          <Dropdown
            trigger={
              <button className="flex items-center gap-2 rounded-sm border border-iron/70 bg-charcoal/80 py-1 pl-1 pr-2 transition-colors hover:border-iron">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-iron/60 text-[11px] font-semibold text-bronze">
                  {player.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate text-xs text-bone lg:inline">{player.name}</span>
                <LuChevronDown className="h-3 w-3 text-stone" />
              </button>
            }
            items={profileItems}
            onSelect={(v) => {
              if (v === 'settings') setActiveSection('settings');
              if (v === 'changelog') router.push('/changelog');
              if (v === 'logout') {
                logout();
                router.replace('/');
              }
            }}
            align="right"
          />

          <button
            aria-label="toggle menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron/70 bg-charcoal/80 text-mist transition-colors hover:text-bone xl:hidden"
          >
            {mobileMenuOpen ? <LuX className="h-4 w-4" /> : <LuMenu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fade-in absolute left-0 right-0 top-full z-dropdown border-b border-iron bg-charcoal shadow-overlay xl:hidden">
          <div className="max-h-[70vh] overflow-y-auto px-2 py-3 md:px-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="section-label px-3 pb-1 pt-1 first:pt-0">{group.label}</div>
                <div className="space-y-0.5">
                  {group.sections.map((id) => {
                    const Icon = NAV_ICONS[id];
                    return (
                      <button
                        key={id}
                        onClick={() => { setActiveSection(id); setMobileMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                          activeSection === id ? 'bg-ember/10 text-parchment' : 'text-mist hover:bg-iron/30 hover:text-bone'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-stone" />
                        {SECTION_META[id].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// ── LEFT NAV ────────────────────────────────────────────────────

function SkillNavGroup() {
  const { state, skillView, setSelectedSkill } = useGame();
  const { activeSection, setActiveSection } = useNav();

  return (
    <div className="mt-1">
      <div className="section-label px-4 pb-1">Trade Skills</div>
      <div className="space-y-0.5">
        {SKILL_ORDER.map((skill) => {
          const view = skillView(skill);
          const selected = state.selectedSkill === skill && activeSection === 'skills';
          return (
            <Tooltip key={skill} content={skillLabel(skill)} side="right">
              <button
                onClick={() => { setSelectedSkill(skill); setActiveSection('skills'); }}
                className={`flex w-full items-center gap-3 border-l-2 py-[6px] pl-3 pr-3 transition-colors ${
                  selected ? 'border-ember bg-ember/10' : 'border-transparent hover:bg-iron/30 hover:text-bone'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-iron/70 bg-charcoal text-bronze">
                  <SkillIcon id={skill} className="h-3.5 w-3.5" />
                </span>
                <span className={`flex-1 text-left text-[13px] ${selected ? 'text-parchment' : 'text-mist'}`}>{skillLabel(skill)}</span>
                <span className="text-[10px] font-mono text-stone">{view.level}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export function LeftNav() {
  const { activeSection, setActiveSection, navCollapsed, setNavCollapsed } = useNav();

  if (navCollapsed) {
    // Compact icon rail
    return (
      <nav className="fixed bottom-0 left-0 top-14 z-sidebar flex w-14 flex-col items-center border-r border-iron bg-charcoal py-2">
        {Object.values(NAV_ENTRIES).map((entry) => {
          const active = activeSection === entry.id;
          return (
            <Tooltip key={entry.id} content={SECTION_META[entry.id].label} side="right">
              <button
                onClick={() => setActiveSection(entry.id)}
                aria-current={active ? 'page' : undefined}
                className={`mb-1 flex h-9 w-9 items-center justify-center rounded-sm transition-colors ${
                  active ? 'bg-ember/15 text-emberLight' : 'text-mist hover:bg-iron/30 hover:text-bone'
                }`}
              >
                <entry.icon className="h-4 w-4" />
              </button>
            </Tooltip>
          );
        })}
        <div className="mt-auto">
          <button
            aria-label="expand navigation"
            onClick={() => setNavCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-stone transition-colors hover:bg-iron/30 hover:text-bone"
          >
            <LuChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* DESKTOP NAV */}
      <nav className="fixed bottom-0 left-0 top-14 z-sidebar hidden w-60 flex-col border-r border-iron bg-charcoal lg:flex">
        <div className="flex items-center justify-between border-b border-iron/70 px-4 py-2.5">
          <span className="section-label">Monastery</span>
          <div className="flex items-center gap-1">
            <Tooltip content="To the hunt" side="bottom">
              <button
                onClick={() => setActiveSection('activities')}
                aria-label="go to the hunt"
                className="flex h-6 w-6 items-center justify-center rounded-sm text-stone transition-colors hover:bg-iron/30 hover:text-bone"
              >
                <LuFlameKindling className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <button
              onClick={() => setNavCollapsed(true)}
              aria-label="collapse navigation"
              className="flex h-6 w-6 items-center justify-center rounded-sm text-stone transition-colors hover:bg-iron/30 hover:text-bone"
            >
              <LuChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="section-label px-3 pb-1">{group.label}</div>
              <div className="space-y-0.5">
                {group.sections.map((id) => (
                  <NavRow key={id} entry={NAV_ENTRIES[id]} active={activeSection === id} onClick={() => setActiveSection(id)} />
                ))}
              </div>
            </div>
          ))}
          <SkillNavGroup />
        </div>

        <div className="border-t border-iron/70 px-4 py-2.5">
          <Link
            href="/changelog"
            className="mb-2 flex items-center gap-2 text-[11px] text-mist transition-colors hover:text-bone"
          >
            <LuHistory className="h-3.5 w-3.5 text-bronze" />
            Changelog
            <span className="ml-auto font-mono text-[10px] text-stone">{APP_VERSION_LABEL}</span>
          </Link>
          <p className="text-[10px] leading-relaxed text-stone">
            The embers burn low. Steel still rings true.
          </p>
        </div>
      </nav>

      {/* TABLET: icon rail */}
      <nav className="fixed bottom-0 left-0 top-14 z-sidebar hidden w-14 flex-col items-center overflow-y-auto border-r border-iron bg-charcoal py-2 md:flex lg:hidden">
        {Object.values(NAV_ENTRIES).map((entry) => (
          <Tooltip key={entry.id} content={SECTION_META[entry.id].label} side="right">
            <button
              onClick={() => setActiveSection(entry.id)}
              aria-current={activeSection === entry.id ? 'page' : undefined}
              className={`mb-1 flex h-9 w-9 items-center justify-center rounded-sm transition-colors ${
                activeSection === entry.id ? 'bg-ember/15 text-emberLight' : 'text-mist hover:bg-iron/30 hover:text-bone'
              }`}
            >
              <entry.icon className="h-4 w-4" />
            </button>
          </Tooltip>
        ))}
      </nav>
    </>
  );
}

// ── MOBILE BOTTOM NAV ───────────────────────────────────────────

export function MobileBottomNav() {
  const { activeSection, setActiveSection } = useNav();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-sidebar border-t border-iron bg-charcoal/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {MOBILE_TABS.map((id) => {
          const Icon = NAV_ICONS[id];
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                active ? 'text-emberLight' : 'text-mist hover:text-bone'
              }`}
            >
              <span className={`h-0.5 w-8 rounded-full ${active ? 'bg-ember' : 'bg-transparent'}`} />
              <Icon className="h-[18px] w-[18px]" />
              <span className="tracking-wide">{SECTION_META[id].label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── CONTEXT PANEL ───────────────────────────────────────────────

export function ContextPanel() {
  const { activeSection, contextPanelOpen, setContextPanelOpen } = useNav();
  const { player, baseStats } = usePlayer();

  if (!contextPanelOpen) return null;

  return (
    <aside className="fixed bottom-0 right-0 top-14 z-sidebar hidden w-72 overflow-y-auto border-l border-iron bg-charcoal md:block">
      <div className="flex items-center justify-between border-b border-iron/70 px-4 py-3">
        <span className="section-label">Context</span>
        <button onClick={() => setContextPanelOpen(false)} aria-label="close context panel" className="text-stone hover:text-bone">
          <LuX className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display text-sm font-semibold text-bone">{SECTION_META[activeSection].label}</h3>
        <p className="mt-1 text-xs text-mist">{NAV_ENTRIES[activeSection].description}</p>

        <div className="mt-4 space-y-3">
          <div className="panel-inset p-3">
            <div className="section-label mb-1.5">Character</div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron bg-charcoal text-sm font-semibold text-bronze">
                {player.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-bone">{player.name}</div>
                <div className="text-xs text-mist">Level {player.combatLevel}</div>
              </div>
            </div>
          </div>

          <div className="panel-inset p-3">
            <div className="section-label mb-1.5">Active Buffs</div>
            <div className="flex items-center gap-1.5 text-xs text-mist">
              <LuCompass className="h-3.5 w-3.5 text-stone" /> No active buffs
            </div>
          </div>

          <div className="panel-inset p-3">
            <div className="section-label mb-2">Quick Stats</div>
            {[
              ['STR', baseStats.strength], ['AGI', baseStats.agility], ['INT', baseStats.intelligence],
              ['VIT', baseStats.vitality], ['ARM', baseStats.armor], ['HP', baseStats.maxHealth],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span className="stat-label">{k}</span>
                <span className={k === 'HP' ? 'text-xs font-semibold text-danger' : 'text-xs font-semibold text-bone'}>{v}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mist">
              <LuGauge className="h-3.5 w-3.5 text-stone" /> Crit {baseStats.critChance}%
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── WORKSPACE ───────────────────────────────────────────────────

export function Workspace({ children }: { children?: ReactNode }) {
  return (
    <main className="min-h-screen flex-1 overflow-y-auto p-4 pb-20 pt-16 md:ml-14 md:p-6 md:pb-8 lg:ml-60 lg:p-8 lg:pt-16">
      {children}
    </main>
  );
}
