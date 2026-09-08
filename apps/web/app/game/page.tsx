'use client';

import { useAuth } from '@/context/auth-context';
import { TopBar, LeftNav, Workspace, MobileBottomNav, NavProvider, useNav } from '@/components/shell';
import { SectionContent } from '@/components/section-content';
import { NotificationProvider, NotificationToast } from '@/components/ui/notification';
import { GameProvider } from '@/lib/game-state';
import { useEffect, useState } from 'react';
import { LuSwords } from 'react-icons/lu';

function GameShell() {
  const { activeSection } = useNav();

  return (
    <>
      <TopBar />
      <LeftNav />
      <NotificationToast />
      <MobileBottomNav />
      <Workspace>
        <SectionContent section={activeSection} />
      </Workspace>
    </>
  );
}

function Wordmark({ tagline }: { tagline: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-sm border border-iron bg-charcoal/80 text-bronze shadow-overlay">
        <LuSwords className="h-7 w-7" />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-[0.22em] text-bone">BLADEHOUND</h1>
      <div className="divider mx-auto mt-3 w-40" />
      <p className="mt-3 text-sm italic text-mist">{tagline}</p>
    </div>
  );
}

export default function GamePage() {
  const { state } = useAuth();
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    if (state.isAuthenticated || state.isGuest) setShowAuth(null);
  }, [state.isAuthenticated, state.isGuest]);

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
          <Wordmark tagline="Steel rings true beneath the embers." />
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <GameProvider>
        <NavProvider>
          <GameShell />
        </NavProvider>
      </GameProvider>
    </NotificationProvider>
  );
}