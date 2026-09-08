'use client';

import { useAuth } from '@/context/auth-context';
import { TopBar, LeftNav, Workspace, MobileBottomNav, NavProvider } from '@/components/shell';
import { NotificationProvider, NotificationToast } from '@/components/ui/notification';
import { GameProvider } from '@/lib/game-state';
import { ContextPanel } from '@/components/shell';
import { LuSwords } from 'react-icons/lu';

/**
 * Single layout for every /game/* route. The provider stack (Notification,
 * Game, Nav) lives here so switching sections — or using browser Back/Forward
 * and refresh — keeps the providers (and any ongoing action) mounted and
 * does not remount the shell per subsection.
 */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center animate-pulse rounded-sm border border-iron bg-charcoal text-bronze shadow-inset">
            <LuSwords className="h-4 w-4" />
          </div>
          <span className="text-xs tracking-[0.2em] text-stone">ENTERING THE FRONTIER…</span>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated && !state.isGuest) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-sm border border-iron bg-charcoal/80 text-bronze shadow-overlay">
              <LuSwords className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-[0.22em] text-bone">BLADEHOUND</h1>
            <div className="divider mx-auto mt-3 w-40" />
            <p className="mt-3 text-sm italic text-mist">Steel rings true beneath the embers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <GameProvider>
        <NavProvider>
          <TopBar />
          <LeftNav />
          <NotificationToast />
          <MobileBottomNav />
          <ContextPanel />
          <Workspace>{children}</Workspace>
        </NavProvider>
      </GameProvider>
    </NotificationProvider>
  );
}