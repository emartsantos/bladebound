'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated && !state.isGuest) {
      router.replace('/');
    }
  }, [router, state.isAuthenticated, state.isGuest, state.loading]);

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
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-sm border border-iron bg-charcoal text-bronze shadow-inset">
            <LuSwords className="h-4 w-4" />
          </div>
          <span className="text-xs tracking-[0.2em] text-stone">RETURNING TO LOGIN…</span>
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
