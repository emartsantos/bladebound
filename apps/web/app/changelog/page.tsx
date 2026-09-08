'use client';

import { useState } from 'react';
import { LuBookOpen, LuPackage, LuBug, LuZap, LuArrowRight, LuArrowLeft, LuSun, LuMoon, LuGithub, LuExternalLink } from 'react-icons/lu';
import { SectionHeader, Panel, PanelLabel, GameButton } from '@/components/game/primitives';
import { usePlayer } from '@/lib/use-player';
import { useAuth } from '@/context/auth-context';
import { TopBar, LeftNav, Workspace, MobileBottomNav, NavProvider } from '@/components/shell';
import { NotificationProvider } from '@/components/ui/notification';
import { GameProvider } from '@/lib/game-state';
import { APP_VERSION_LABEL } from '@/lib/version';

type VersionType = 'major' | 'minor' | 'patch' | 'hotfix';

interface ChangelogEntry {
  version: string;
  type: VersionType;
  date: string;
  changes: Array<{
    category: 'Added' | 'Fixed' | 'Changed' | 'Removed' | 'Security';
    description: string;
  }>;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v0.1.6',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Fixed', description: 'Zero gold, empty inventory, and zero-XP saves no longer restore starter values' },
      { category: 'Added', description: 'Versioned game-save schema with automatic backward-compatible migration' },
      { category: 'Added', description: 'Append-only transaction ledger for gold, items, combat XP, and skill XP' },
      { category: 'Added', description: 'Supabase PostgreSQL schema with account ownership and row-level security policies' },
    ],
  },
  {
    version: 'v0.1.5',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Changelog access from the account menu, desktop sidebar, and Settings page' },
      { category: 'Changed', description: 'Version history is now a discoverable in-game page' },
    ],
  },
  {
    version: 'v0.1.4',
    type: 'hotfix',
    date: '2026-09-08',
    changes: [
      { category: 'Fixed', description: 'Character progression no longer resets when a new website update is deployed' },
      { category: 'Changed', description: 'Registered saves now use a stable account key and automatically migrate existing character saves' },
      { category: 'Changed', description: 'Progress is flushed when leaving or updating the page and kept in a separate recovery copy' },
    ],
  },
  {
    version: 'v0.1.3',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'FIFO trade-skill queue with up to 10 pending jobs' },
      { category: 'Added', description: 'Configurable trade-skill repetitions from 1× to 1,000× per job' },
      { category: 'Added', description: 'Persistent daily and weekly task progress with claimable rewards' },
      { category: 'Changed', description: 'Activity sidebar now shows the same persisted daily quests as the Tasks page' },
      { category: 'Fixed', description: 'Trade-skill progress timing and duration labels in the Activities workspace' },
      { category: 'Fixed', description: 'Header trade-skill progress bar and countdown now update smoothly in real time' },
      { category: 'Fixed', description: 'Logout now returns the player to the login page' },
    ],
  },
  {
    version: 'v0.1.2',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Equipment equip/unequip system for all slots (weapon, offhand, helmet, chest, gloves, legs, boots, amulet, ring, cape)' },
      { category: 'Added', description: 'Equipment Section UI with slot-by-slot management and drag-to-equip from inventory' },
      { category: 'Added', description: 'Version changelog page with full history' },
      { category: 'Fixed', description: 'TypeScript compilation errors in equipment system' },
      { category: 'Fixed', description: 'ActionLogEntry skill type inference for equip/unequip actions' },
    ],
  },
  {
    version: 'v0.1.1',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: '/game route as main entry point after authentication' },
      { category: 'Fixed', description: 'Fast Refresh full reload issue on page changes' },
      { category: 'Fixed', description: 'Route 404 for /game endpoint' },
      { category: 'Changed', description: 'Root / now redirects to /game after auth' },
    ],
  },
  {
    version: 'v0.1.0',
    type: 'minor',
    date: '2026-09-07',
    changes: [
      { category: 'Added', description: 'Complete SVG visual system for characters and enemies (Warrior, Wild Wolf)' },
      { category: 'Added', description: 'Activity Hub with Fighting, Mining, Woodcutting, Fishing, Alchemy, Forge' },
      { category: 'Added', description: 'Cinematic scene system with layered parallax and events' },
      { category: 'Added', description: 'Shared effect components: WeaponTrail, ImpactSpark, BloodHit, ArmorSpark, DustBurst' },
      { category: 'Added', description: 'Guest play, login, and registration flows' },
      { category: 'Added', description: 'Character creation and guest session support' },
      { category: 'Added', description: 'Dark fantasy etching aesthetic with consistent color palette' },
    ],
  },
];

const TYPE_COLORS: Record<VersionType, string> = {
  major: 'text-verdantBright',
  minor: 'text-bronzeLight',
  patch: 'text-emberLight',
  hotfix: 'text-dangerBright',
};

const TYPE_LABELS: Record<VersionType, string> = {
  major: 'MAJOR',
  minor: 'MINOR',
  patch: 'PATCH',
  hotfix: 'HOTFIX',
};

const CATEGORY_COLORS = {
  Added: 'text-verdantBright',
  Fixed: 'text-emberLight',
  Changed: 'text-bronzeLight',
  Removed: 'text-stone',
  Security: 'text-dangerBright',
};

function ChangelogPage() {
  const { state } = useAuth();
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center animate-pulse rounded-sm border border-iron bg-charcoal text-bronze shadow-inset">
            <LuPackage className="h-4 w-4" />
          </div>
          <span className="text-xs tracking-[0.2em] text-stone">LOADING CHANGELOG…</span>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated && !state.isGuest) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold tracking-[0.22em] text-bone mb-4">Changelog</h1>
          <p className="text-stone mb-6">Log in to view the version history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <SectionHeader
        title="Changelog"
        eyebrow="Version History"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/emartsantos/bladebound"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-mist hover:text-bone transition-colors"
            >
              <LuGithub className="h-3 w-3" />
              View on GitHub
              <LuExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        }
      />

      <div className="space-y-4">
        {CHANGELOG.map((entry) => {
          const isExpanded = expandedVersion === entry.version;
          return (
            <Panel key={entry.version} className="overflow-hidden">
              <button
                onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                className="w-full flex items-center justify-between gap-4 p-4 hover:bg-charcoal/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-sm border ${TYPE_COLORS[entry.type]} bg-black/30`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  <div>
                    <span className="font-display text-lg font-semibold text-bone">{entry.version}</span>
                    <span className="ml-2 text-xs text-mist">{entry.date}</span>
                  </div>
                </div>
                <LuArrowRight
                  className={`h-4 w-4 text-mist transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-iron/30 p-4 space-y-3">
                  {entry.changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-sm bg-charcoal/30">
                      <span className={`font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-sm ${CATEGORY_COLORS[change.category]}`}>
                        {change.category}
                      </span>
                      <span className="text-sm text-bone flex-1">{change.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <div className="panel p-4 text-center">
        <p className="text-xs text-stone">Bladehound {APP_VERSION_LABEL} — Steel rings true beneath the embers.</p>
      </div>
    </div>
  );
}

function ChangelogShell() {
  return (
    <>
      <TopBar />
      <LeftNav />
      <Workspace>
        <ChangelogPage />
      </Workspace>
    </>
  );
}

export default function ChangelogRoute() {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center animate-pulse rounded-sm border border-iron bg-charcoal text-bronze shadow-inset">
            <LuPackage className="h-4 w-4" />
          </div>
          <span className="text-xs tracking-[0.2em] text-stone">LOADING…</span>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <GameProvider>
        <NavProvider>
          <ChangelogShell />
        </NavProvider>
      </GameProvider>
    </NotificationProvider>
  );
}
