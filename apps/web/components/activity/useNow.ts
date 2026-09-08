'use client';

import { useEffect, useState } from 'react';

/**
 * Re-renders on a gentle interval (~100ms) so progress bars,
 * timers and round clocks stay smooth without a heavy loop.
 * Not used for any game logic — presentation only.
 */
export function useNow(intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(iv);
  }, [intervalMs]);
  return now;
}

export function useNowMs(intervalMs = 100): number {
  return useNow(intervalMs);
}