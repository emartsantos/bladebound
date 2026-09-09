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
    version: 'v0.8.0', type: 'minor', date: '2026-09-09',
    changes: [
      { category: 'Added', description: 'Reusable data-driven event catalog with centralized UTC schedules, cadence, descriptions, and reward previews' },
      { category: 'Added', description: 'Event Calendar with active, upcoming, and expired classifications plus live countdowns' },
      { category: 'Added', description: 'Upcoming event list for Forgefire Festival, Goblin Gold Rush, and Frostbound Hunt' },
      { category: 'Added', description: 'Persistent per-event attempts, victories, featured reward claims, and participation history' },
      { category: 'Added', description: 'Expired-event archive preserves schedules, rewards, results, and player participation' },
      { category: 'Changed', description: 'Ember Colossus migrated onto the reusable framework while retaining backward compatibility with existing saves' },
      { category: 'Changed', description: 'Global Event Live indicator now reads from the active event catalog instead of hard-coded Ember dates' },
      { category: 'Changed', description: 'Save schema upgraded to v10 with automatic legacy Ember participation migration' },
    ],
  },
  {
    version: 'v0.7.1', type: 'patch', date: '2026-09-09',
    changes: [
      { category: 'Added', description: 'Persistent animated Event Live indicator in the game header while the Ember Colossus event is active' },
      { category: 'Added', description: 'Header event indicator shows days and hours remaining plus whether today’s free attempt is ready or used' },
      { category: 'Added', description: 'Clicking the live-event indicator opens Adventure and takes players directly toward the event encounter' },
    ],
  },
  {
    version: 'v0.7.0', type: 'minor', date: '2026-09-09',
    changes: [
      { category: 'Added', description: 'Seven-day Ember Colossus limited boss event running September 9–16 UTC with one free attempt per account each day' },
      { category: 'Added', description: 'Victories award 0.25 BHC, 10 Coal, and 5 Iron Ore; the first victory grants the exclusive Epic Ember Colossus Greatsword' },
      { category: 'Added', description: 'Persistent event attempt history, victory count, reward claim state, countdown, and dedicated Adventure event panel' },
      { category: 'Changed', description: 'Save schema upgraded to v9 with backward-compatible event initialization' },
    ],
  },
  {
    version: 'v0.6.1',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Fixed', description: 'Bronze and iron shields and helmets forged at the smithy are now registered equipment and can be equipped' },
      { category: 'Fixed', description: 'Crafting validates recipe level and awards XP using the recipe’s authoritative skill, including queued jobs' },
      { category: 'Added', description: 'Forged equipment now rolls a persistent Common–Legendary quality, with better upgrade odds at higher Smithing levels' },
      { category: 'Added', description: 'Forged quality grants 5% Uncommon, 12% Rare, 22% Epic, or 35% Legendary equipment-stat bonuses' },
      { category: 'Changed', description: 'Inventory, equipment, and craft-result messages now display forged rarity; the best available quality is equipped first' },
      { category: 'Changed', description: 'Save schema upgraded to v8 while preserving all existing characters and inventory' },
    ],
  },
  {
    version: 'v0.6.0',
    type: 'major',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Summon and collect 125 Heroes across Warrior, Assassin, Ranger, Mage, and Knight classes with five rarities and variations' },
      { category: 'Added', description: 'Published 55/27/12/5/1 rarity odds, Rare+ 10-pity, Epic+ 50-pity, and Legendary 100-pity' },
      { category: 'Added', description: 'Duplicate Heroes grant rarity-scaled Essence without creating extra reward-battle capacity' },
      { category: 'Added', description: 'Summoned Hero roster, immutable summon history, finite reward pool, and one battle per Hero every 24 hours with a five-battle daily account cap' },
      { category: 'Changed', description: 'Each 1.00 BHC summon settles as 0.50 burned, 0.40 to the Battle Reward Pool, and 0.10 to Treasury' },
      { category: 'Fixed', description: 'Trade action repetitions and queued jobs now catch up from persisted elapsed time after the tab or browser has been closed' },
      { category: 'Security', description: 'Server-generated recorded rolls, idempotent settlement, immutable ledgers, RLS, capped archetype supply, and server-only pool mutations' },
      { category: 'Changed', description: 'Save schema upgraded to v7 with backward-compatible Summoning initialization' },
    ],
  },
  {
    version: 'v0.5.0',
    type: 'major',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Hero and weapon marketplace with search, asset filters, pagination, active listings, and transaction history' },
      { category: 'Added', description: 'Server-configured 0.075 BHC listing fee burned only after successful validation and never refunded after listing' },
      { category: 'Added', description: 'Escrow-style asset locks, unequipped-weapon validation, and Hero locks that preserve progression and battle cooldowns' },
      { category: 'Added', description: 'Atomic, idempotent marketplace RPCs for listing, cancellation, purchase settlement, and ownership transfer' },
      { category: 'Security', description: 'Server-stored prices, row locks, RLS, and mutation-only RPCs prevent self-buy, double-sale, duplicate burns, and browser ownership edits' },
      { category: 'Changed', description: 'Marketplace sale payments transfer BHC from buyer to seller without reducing supply; only the listing fee is burned' },
      { category: 'Changed', description: 'Save schema upgraded to v6 with backward-compatible marketplace initialization' },
    ],
  },
  {
    version: 'v0.4.0',
    type: 'major',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Capped BHC battle rewards scaled by hero level, enemy category, weapon rarity, Forge, and Awakening' },
      { category: 'Added', description: 'Premium Forge progression from +1 to +10 with visible costs and +4% weapon stats per level' },
      { category: 'Added', description: 'Weapon Awakening I–V with Forge prerequisites and +8% weapon stats per tier' },
      { category: 'Added', description: 'Rarity-priced weapon affix rerolls, Hero Rebirth I–V, and Hero Reforge bonuses' },
      { category: 'Added', description: 'BHC balance, total burned amount, affordability states, and per-hero investment history' },
      { category: 'Security', description: 'Supabase BHC balances and investment ledgers are owner-readable but cannot be minted or edited by browser clients' },
      { category: 'Fixed', description: 'Per-character local saves now resume cloud synchronization after the v0.2 hero-key migration' },
      { category: 'Changed', description: 'Save schema upgraded to v5 with backward-compatible investment initialization' },
    ],
  },
  {
    version: 'v0.3.0',
    type: 'major',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Live main-story quest chains with prerequisites, objective tracking, unlocks, and rewards' },
      { category: 'Added', description: 'Achievement progression, points, titles, cosmetics, and milestone notices' },
      { category: 'Added', description: 'Bestiary discovery, enemy kill records, drop discoveries, and collection completion' },
      { category: 'Added', description: 'Region reputation earned through victories and exploration' },
      { category: 'Added', description: 'Seven-day login calendar, streak rewards, offline return report, and reward mailbox' },
      { category: 'Added', description: 'One free daily and weekly task reroll before objective progress begins' },
      { category: 'Changed', description: 'Collections and Achievements are now functional sections instead of placeholders' },
      { category: 'Changed', description: 'Save schema upgraded to v4 with backward-compatible progression initialization' },
    ],
  },
  {
    version: 'v0.2.0',
    type: 'major',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'One rewarded battle per hero every 24 hours with a live availability countdown' },
      { category: 'Added', description: 'Persisted battle history with outcome, opponent, XP, gold, and loot details' },
      { category: 'Added', description: 'Class-specific stat growth and a level 100 combat cap' },
      { category: 'Added', description: 'Equipped item stats now contribute directly to combat and character power' },
      { category: 'Fixed', description: 'Battle attempt IDs prevent duplicate rewards after reloads or repeated resolution' },
      { category: 'Changed', description: 'Auto-fight was retired from open-world rewarded battles to enforce the daily hero rule' },
      { category: 'Changed', description: 'Save schema upgraded to v3 with backward-compatible migration' },
    ],
  },
  {
    version: 'v0.1.8',
    type: 'minor',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Persistent Supabase email/password authentication for registered players' },
      { category: 'Added', description: 'Local-first cloud save upload and cloud restore after login' },
      { category: 'Added', description: 'Automatic access-token refresh and secure logout' },
      { category: 'Changed', description: 'Existing username-based browser saves migrate automatically on first Supabase login' },
      { category: 'Changed', description: 'Registration and login now use an email address' },
      { category: 'Changed', description: 'Guest play remains available as a device-local mode' },
    ],
  },
  {
    version: 'v0.1.7',
    type: 'patch',
    date: '2026-09-08',
    changes: [
      { category: 'Added', description: 'Live Supabase project configuration in the GitHub Pages build' },
      { category: 'Added', description: 'Supabase schema-readiness status in Settings' },
      { category: 'Security', description: 'Browser integration uses only the public publishable key; privileged keys remain server-only' },
    ],
  },
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
