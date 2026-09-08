'use client';

import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuSwords, LuLogIn, LuScrollText, LuUserPlus, LuChevronLeft } from 'react-icons/lu';
import { PLAYER_CLASSES, PLAYER_CLASS_BY_ID, DEFAULT_PLAYER_CLASS } from '@/lib/classes';
import type { PlayerClassId } from '@/lib/classes';

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

export default function HomePage() {
  const { state, login, register, loginAsGuest } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    characterClass: DEFAULT_PLAYER_CLASS as PlayerClassId,
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Redirect to /game when auth state changes (after login/register/guest)
  useEffect(() => {
    if (state.isAuthenticated || state.isGuest) {
      router.push('/game');
    }
  }, [state.isAuthenticated, state.isGuest, router]);

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

          <div className="panel p-6">
            {showAuth === null && (
              <div className="space-y-2.5">
                <button
                  onClick={() => { setShowAuth('login'); setAuthError(null); }}
                  className="btn btn-primary w-full"
                >
                  <LuLogIn className="h-3.5 w-3.5" /> Log In
                </button>
                <button
                  onClick={() => { setShowAuth('register'); setAuthError(null); }}
                  className="btn btn-secondary w-full"
                >
                  <LuUserPlus className="h-3.5 w-3.5" /> Register
                </button>
                <div className="divider my-3" />
                <button
                  onClick={() => { 
                    loginAsGuest(); 
                    router.push('/game');
                  }}
                  className="btn btn-ghost w-full"
                >
                  <LuScrollText className="h-3.5 w-3.5" /> Play as Guest
                </button>
              </div>
            )}

            {showAuth === 'login' && (
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-bone">Log In</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAuthError(null);
                    login(loginForm.username, loginForm.password).then((r) => { 
                      if (!r.success) setAuthError(r.error ?? 'Login failed'); 
                      else router.push('/game');
                    });
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="input w-full"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="input w-full"
                  />
                  {authError && <p className="text-xs text-danger">{authError}</p>}
                  <button type="submit" className="btn btn-primary w-full">
                    <LuLogIn className="h-3.5 w-3.5" /> Log In
                  </button>
                </form>
                <button
                  onClick={() => { setShowAuth(null); setAuthError(null); }}
                  className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-mist transition-colors hover:text-bone"
                >
                  <LuChevronLeft className="h-3 w-3" /> Back
                </button>
              </div>
            )}

            {showAuth === 'register' && (
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-bone">Register</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAuthError(null);
                    register(registerForm.username, registerForm.password, registerForm.characterClass).then((r) => { 
                      if (!r.success) setAuthError(r.error ?? 'Registration failed'); 
                      else router.push('/game');
                    });
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="input w-full"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="input w-full"
                  />
                  <div className="space-y-1.5">
                    <p className="text-xs tracking-wider text-stone">CHOOSE A CLASS</p>
                    {PLAYER_CLASSES.map((c) => {
                      const active = registerForm.characterClass === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, characterClass: c.id })}
                          className={
                            active
                              ? 'w-full border border-bronze bg-bronze/10 p-2.5 text-left'
                              : 'w-full border border-iron bg-charcoal/60 p-2.5 text-left transition-colors hover:border-stone'
                          }
                        >
                          <span className="block font-display text-sm font-semibold text-bone">{c.name}</span>
                          <span className="block text-xs text-mist">{c.title} · {c.attackStyle}</span>
                          <span className="block text-xs text-stone">{c.description}</span>
                        </button>
                      );
                    })}
                    <p className="text-[11px] text-stone">
                      Defaults to {PLAYER_CLASS_BY_ID[DEFAULT_PLAYER_CLASS].name} if you don&apos;t pick.
                    </p>
                  </div>
                  {authError && <p className="text-xs text-danger">{authError}</p>}
                  <button type="submit" className="btn btn-primary w-full">
                    <LuUserPlus className="h-3.5 w-3.5" /> Register
                  </button>
                </form>
                <button
                  onClick={() => { setShowAuth(null); setAuthError(null); }}
                  className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-mist transition-colors hover:text-bone"
                >
                  <LuChevronLeft className="h-3 w-3" /> Back
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-[11px] text-stone">
            Open-source artwork is credited in the{' '}
            <Link href="/credits" className="text-mist transition-colors hover:text-bone">
              art credits
            </Link>.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated / guest users are redirected to the game shell by the effect
  // above; this momentary frame avoids rendering a shell duplicate here.
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
