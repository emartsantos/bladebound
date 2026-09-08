'use client';

// ────────────────────────────────────────────────────────────
// ACTIVITY SCENES
// Layered etched-dark-fantasy stages (background → midground →
// character/tool → enemy → effects → foreground). Pure
// presentation: scenes OBSERVE events, they never decide
// outcomes. Each scene mounts only while its activity is active
// (see ActivityHero). All motion: CSS transforms / opacity.
// ────────────────────────────────────────────────────────────

import type { CSSProperties, ReactElement } from 'react';
import type { EnemyDefinition } from '@premium-rpg/shared-types';
import type { ActivityId } from './activity-config';

export type SceneEventKind =
  | 'hit'
  | 'crit'
  | 'hurt'
  | 'defeat'
  | 'reward'
  | 'impact'
  | 'rare'
  | 'bite'
  | 'catch'
  | 'complete';

export interface SceneEvent {
  /** strictly increasing — used as a remount key so CSS re-runs */
  key: number;
  kind: SceneEventKind;
}

export interface SceneProps {
  uid: string;
  event: SceneEvent | null;
  enemy?: EnemyDefinition | null;
  medallion?: string | null;
}

const CLR = {
  near: '#1f1b16',
  mid: '#171410',
  far: '#12100d',
  faint: '#100e0c',
  stroke: '#2e2a25',
  line: '#3a362f',
  bone: '#d8c9a8',
  boneDim: 'rgba(216,201,168,0.3)',
  bronze: '#b08754',
  ember: '#d4692f',
  emberHi: '#e08a44',
  verdant: '#87a76b',
  verdantDark: '#4a5a3c',
  water: '#8ea8c4',
  slate: '#3a4650',
  slateDeep: '#232c34',
  arcane: '#a8c9a0',
  arcaneDark: '#5c7a5a',
};

function Stars({ uid }: { uid: string }) {
  const pos: [number, number][] = [
    [120, 70], [240, 128], [380, 56], [520, 112], [700, 48], [822, 132],
    [1180, 60], [1320, 132], [60, 150], [430, 152], [600, 164], [980, 152], [1240, 150],
  ];
  return (
    <g fill="#cdbfa4" aria-label="stars">
      {pos.map(([x, y], i) => (
        <circle key={`${uid}-s${i}`} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.1} opacity={0.28 + ((i * 7) % 5) * 0.1} />
      ))}
    </g>
  );
}

function SkyWarm({ uid, moonX = 1120, moonY = 96 }: { uid: string; moonX?: number; moonY?: number }) {
  const sky = `${uid}-sky`;
  const glow = `${uid}-mow`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1510" />
          <stop offset="0.55" stopColor="#141110" />
          <stop offset="1" stopColor="#100e0c" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(216,201,168,0.95)" />
          <stop offset="0.3" stopColor="rgba(216,201,168,0.22)" />
          <stop offset="1" stopColor="rgba(216,201,168,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${sky})`} />
      <g className="moon-glow">
        <circle cx={moonX} cy={moonY} r="150" fill={`url(#${glow})`} />
        <circle cx={moonX} cy={moonY} r="42" fill={CLR.bone} opacity="0.92" />
        <circle cx={moonX - 15} cy={moonY - 9} r="46" fill="rgba(230,220,194,0.13)" />
      </g>
      <Stars uid={uid} />
    </svg>
  );
}

function FogBands() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[16%] h-24">
      <div
        className="fog-band absolute bottom-0 h-full w-[130%] rounded-full bg-gradient-to-t from-transparent via-[rgba(120,110,95,0.10)] to-transparent"
        style={{ filter: 'blur(8px)' }}
      />
      <div
        className="fog-band absolute bottom-1 h-3/4 w-[120%] rounded-full bg-gradient-to-t from-transparent via-[rgba(120,110,95,0.08)] to-transparent"
        style={{ filter: 'blur(10px)', animationDelay: '-14s', animationDuration: '38s' }}
      />
    </div>
  );
}

/** Rising ember motes — ambient life, never loud. */
function EmberField({
  count = 7,
  color = CLR.emberHi,
  left = 4,
  right = 18,
  bottom = 22,
}: {
  count?: number;
  color?: string;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="ember-float absolute rounded-full"
          style={{
            left: `${left + ((i * 37) % (96 - left - right))}%`,
            bottom: `${bottom + ((i * 53) % 30)}%`,
            width: 3,
            height: 3,
            backgroundColor: color,
            opacity: 0.7,
            animationDelay: `${(i * 0.9) % 4}s`,
            animationDuration: `${6 + (i % 3)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Falling leaves — quiet woodland motion. */
function LeafField({ count = 5 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="leaf-float absolute"
          style={{
            left: `${30 + ((i * 43) % 55)}%`,
            top: `${12 + (i % 34)}%`,
            width: 7,
            height: 9,
            backgroundColor: CLR.verdantDark,
            border: `1px solid ${CLR.verdant}`,
            transform: `rotate(${i * 40}deg)`,
            opacity: 0.8,
            animationDelay: `${(i * 1.3) % 7}s`,
            animationDuration: `${8 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Dust / motes for mines and workshops. */
function DustField({ count = 6, left = 10, right = 10, bottom = 30 }: { count?: number; left?: number; right?: number; bottom?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="ember-float absolute rounded-full"
          style={{
            left: `${left + ((i * 47) % (96 - left - right))}%`,
            bottom: `${bottom + ((i * 41) % 34)}%`,
            width: 2,
            height: 2,
            backgroundColor: 'rgba(200,190,172,0.5)',
            animationDelay: `${(i * 1.1) % 5}s`,
            animationDuration: `${7 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** One-shot particle burst (chips / sparks / splashes). */
function FlyBurst({ particles, colors }: { particles: { fx: number; fy: number; size?: number; delay?: number }[]; colors: string[] }) {
  return (
    <>
      {particles.map((p, i) => (
        <span
          key={i}
          className="p-fly absolute rounded-[1px]"
          style={
            {
              left: '50%',
              top: '50%',
              width: p.size ?? 3,
              height: p.size ?? 3,
              backgroundColor: colors[i % colors.length],
              '--fx': `${p.fx}px`,
              '--fy': `${p.fy}px`,
              animationDelay: `${p.delay ?? 0}s`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

// ── FIGHTING ────────────────────────────────────────────────

function HunterFigure() {
  return (
    <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
      <g>
        <path
          d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z"
          fill={CLR.near}
          stroke={CLR.stroke}
          strokeWidth="2"
        />
        <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
        <path d="M-23 -168 C -23 -188 2 -192 2 -170" fill="none" stroke={CLR.bone} strokeWidth="1.2" opacity="0.4" />
        {/* scabbard line */}
        <path d="M10 -40 L 18 -6" stroke={CLR.line} strokeWidth="3" />
        {/* sword arm + blade */}
        <g transform="translate(4,-104) rotate(20)">
          <rect x="-3" y="6" width="6" height="84" rx="3" fill="#b9b3a5" stroke="#3c3a36" strokeWidth="1.5" />
          <path d="M-7 86 L 0 116 L 7 86 Z" fill="#8d8880" />
          <rect x="-5" y="2" width="10" height="13" fill="#3c3a36" />
        </g>
        <path d="M-14 -60 L 0 -40" stroke="#3a362f" strokeWidth="1.4" opacity="0.6" />
      </g>
    </svg>
  );
}

function BeastFigure() {
  return (
    <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
      <g>
        <path
          d="M-36 10 C -44 -34 -28 -86 0 -102 C 28 -86 44 -34 36 10 Z"
          fill={CLR.far}
          stroke={CLR.stroke}
          strokeWidth="2"
        />
        <path d="M-22 -56 L -48 -102 L -26 -84 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
        <path d="M22 -56 L 48 -102 L 26 -84 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
        <circle cx="-15" cy="-42" r="13" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
        <circle cx="15" cy="-42" r="13" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
        <circle cx="-9" cy="-68" r="3.5" fill={CLR.ember} />
        <circle cx="9" cy="-68" r="3.5" fill={CLR.ember} />
        <path d="M-7 -28 L 7 -28 L 5 -18 L 0 -12 L -5 -18 Z" fill={CLR.mid} stroke="#4a453e" strokeWidth="1" />
      </g>
    </svg>
  );
}

function RuinedKeep({ uid }: { uid: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* distant peaks */}
      <path d="M0 250 L120 168 L230 236 L320 178 L430 250 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M1020 268 L1140 176 L1300 258 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M120 168 L230 236 L320 178" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.7" />
      {/* ruined fortress silhouette */}
      <g fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2">
        <path d="M900 300 L900 200 L936 200 L936 220 L972 220 L972 190 L1008 190 L1008 222 L1044 222 L1044 200 C 1110 190 1180 200 1240 216 L1240 300 Z" />
        <path d="M972 190 L972 158 L1008 158 L1008 190" />
        <path d="M1114 224 L1114 160 L1140 160 L1140 224" />
        <path d="M1016 232 L1016 200 L1046 200 L1046 232 L1062 232 L1062 204 L1082 204 L1082 232 Z" />
      </g>
      <path d="M972 196 L1008 196 M1008 194 L1008 222 M1114 196 L1140 196" stroke={CLR.boneDim} strokeWidth="1.2" />
      {/* ember window spires */}
      {[918, 1024, 1108].map((x, i) => (
        <circle key={`${uid}-w${i}`} cx={x} cy={236} r="2.4" fill={CLR.ember} opacity="0.8" />
      ))}
    </svg>
  );
}

export function FightScene({ uid, event, medallion }: SceneProps) {
  const E = event;
  const heroFx = E && (E.kind === 'hit' || E.kind === 'crit') ? 'hero-strike' : E?.kind === 'hurt' ? 'hero-hurt' : '';
  const enemyFx = E && (E.kind === 'hit' || E.kind === 'crit') ? 'enemy-hit' : E?.kind === 'defeat' ? 'enemy-defeat' : '';
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      {/* background */}
      <div className="scene-layer scene-pllx">
        <SkyWarm uid={uid} />
        <RuinedKeep uid={uid} />
      </div>
      {/* midground */}
      <div className="scene-layer scene-pllx-mid">
        <FogBands />
        <svg className="absolute inset-x-0 bottom-0 h-[38%] w-full" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60 L60 34 L150 56 L300 30 L470 58 L640 36 L820 62 L980 40 L1160 58 L1300 38 L1440 56 L1440 160 L0 160 Z" fill={CLR.faint} />
          <path d="M0 60 L60 34 L150 56 L300 30 L470 58" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.55" />
        </svg>
      </div>
      {/* foreground — hero, enemy, effects */}
      <div className="scene-layer scene-pllx-near">
        <div className="idle-bob absolute bottom-[9%] left-[4%] w-[34vw] max-w-[230px] min-w-[150px]" style={{ transition: 'transform .4s' }}>
          <div className={heroFx} style={{ width: '100%' }}>
            <HunterFigure />
          </div>
        </div>
        <div className="absolute bottom-[9%] left-[52%] w-[28vw] max-w-[190px] min-w-[130px]" style={{ transition: 'transform .4s' }}>
          <div className={enemyFx} style={{ width: '100%' }}>
            <BeastFigure />
          </div>
        </div>

        {(E?.kind === 'hit' || E?.kind === 'crit') && (
          <span
            key={`ring-${E.key}`}
            className="fx-ring"
            style={{
              left: '44.5%',
              top: '46%',
              width: 150,
              height: 150,
              border: `2px solid ${E.kind === 'crit' ? 'rgba(224,138,68,0.95)' : 'rgba(212,105,47,0.6)'}`,
            }}
          />
        )}
        {E?.kind === 'crit' && (
          <span
            key={`flash-${E.key}`}
            className="fx-flash"
            style={{
              left: '35%',
              top: '34%',
              width: '42%',
              height: '46%',
              background: 'radial-gradient(circle, rgba(240,180,120,0.4) 0%, transparent 70%)',
            }}
          />
        )}
        {E?.kind === 'hurt' && (
          <span
            key={`hurt-${E.key}`}
            className="fx-flash"
            style={{
              left: '6%',
              top: '26%',
              width: '30%',
              height: '48%',
              background: 'radial-gradient(circle, rgba(156,61,48,0.4) 0%, transparent 70%)',
            }}
          />
        )}
        {(E?.kind === 'reward' || E?.kind === 'defeat') && (
          <div key={`gold-${E.key}`} className="absolute bottom-[14%] left-[12%]">
            <FlyBurst
              colors={[CLR.bone, CLR.bronze, CLR.emberHi]}
              particles={[
                { fx: 20, fy: -30 }, { fx: 34, fy: -16 }, { fx: 6, fy: -34 }, { fx: 42, fy: -4 },
                { fx: -8, fy: -26 }, { fx: -2, fy: -42 }, { fx: 26, fy: 4 }, { fx: 48, fy: -22 },
              ]}
            />
          </div>
        )}
        {medallion && (
          <img
            src={medallion}
            alt=""
            className="enemy-medallion absolute bottom-[12%] right-[5%] h-16 w-16 -rotate-6 rounded-sm opacity-90"
          />
        )}
      </div>
      <EmberField count={6} />
    </div>
  );
}

// ── MINING ──────────────────────────────────────────────────

const MINER_FX_FLY: { fx: number; fy: number; size?: number }[] = [
  { fx: 26, fy: -30, size: 3.4 }, { fx: 40, fy: -16, size: 2.6 }, { fx: 8, fy: -36, size: 3 },
  { fx: 44, fy: -2, size: 2.2 }, { fx: -10, fy: -24, size: 3 }, { fx: 2, fy: -44, size: 2.4 },
  { fx: 30, fy: 2, size: 2.6 }, { fx: 52, fy: -26, size: 2.2 },
];

function CavernBackdrop({ uid }: { uid: string }) {
  const grad = `${uid}-cave`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#100e0c" />
          <stop offset="1" stopColor="#0c0b0a" />
        </linearGradient>
        <radialGradient id={`${uid}-pit`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(212,105,47,0.28)" />
          <stop offset="1" stopColor="rgba(212,105,47,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${grad})`} />
      {/* distant shaft glow */}
      <circle cx="1080" cy="300" r="220" fill={`url(#${uid}-pit)`} className="flicker" />
      {/* jagged cave ceiling */}
      <path d="M0 0 L0 96 L90 60 L190 118 L300 64 L420 110 L560 70 L680 120 L820 74 L960 118 L1120 68 L1280 116 L1440 78 L1440 0 Z" fill={CLR.far} />
      <path d="M0 64 L80 44 L180 84 L300 46 L420 78 L560 50 L680 86 L840 54 L980 88 L1140 50 L1300 86 L1440 60" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.5" />
      {/* side stalactites */}
      <path d="M0 150 L64 200 L0 268 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M1440 120 L1368 176 L1440 226 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      {/* distant miner lamps */}
      {[160, 620, 1240].map((x, i) => (
        <circle key={`${uid}-l${i}`} cx={x} cy={150} r="2.4" fill={CLR.ember} opacity={0.5} className="flicker" />
      ))}
    </svg>
  );
}

function OreVein() {
  return (
    <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden="true">
      <g>
        {/* boulder facets */}
        <path d="M14 216 L20 84 L96 22 L176 64 L206 172 L190 214 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2" />
        <path d="M20 84 L96 22 L116 96 L40 118 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.4" />
        <path d="M96 22 L176 64 L132 118 L116 96 Z" fill="#1a140f" stroke={CLR.line} strokeWidth="1.4" />
        <path d="M176 64 L206 172 L150 140 L132 118 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.4" />
        {/* ore crystals */}
        {([
          [64, 84, 8, 34, CLR.ember], [92, 60, 7, 30, CLR.emberHi], [120, 128, 9, 38, CLR.ember],
          [150, 96, 6, 26, CLR.bronze], [172, 140, 8, 32, CLR.ember], [104, 156, 6, 26, CLR.emberHi],
        ] as [number, number, number, number, string][]).map(([cx, cy, w, h, c], i) => (
          <rect key={i} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} transform={`rotate(${(i % 2) * 18} ${cx} ${cy})`} fill={c} opacity={0.85} className="flicker" />
        ))}
      </g>
    </svg>
  );
}

export function MineScene({ uid, event }: SceneProps) {
  const E = event;
  const impact = E && (E.kind === 'impact' || E.kind === 'rare');
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      <div className="scene-layer scene-pllx">
        <CavernBackdrop uid={uid} />
      </div>
      <div className="scene-layer scene-pllx-mid">
        <DustField count={7} />
        {/* floor strata */}
        <svg className="absolute inset-x-0 bottom-0 h-[26%] w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 L180 26 L360 44 L560 24 L760 46 L980 30 L1180 44 L1440 26 L1440 110 L0 110 Z" fill={CLR.faint} />
          <path d="M0 52 L180 40 L360 56 L560 38 L760 58 L980 44 L1180 56 L1440 40" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.5" />
        </svg>
      </div>
      <div className="scene-layer scene-pllx-near">
        {/* lantern */}
        <div className="absolute right-[27%] top-[14%]">
          <span className="flicker block rounded-full" style={{ width: 26, height: 26, background: 'radial-gradient(circle, rgba(224,138,68,0.55), transparent 70%)' }} />
          <span className="absolute left-1/2 top-full h-4 w-px -translate-x-1/2 bg-[#2e2a25]" />
        </div>

        <div className="idle-bob absolute bottom-[7%] left-[6%] w-[30vw] max-w-[200px] min-w-[140px]">
          <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
            <path d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z" fill={CLR.near} stroke={CLR.stroke} strokeWidth="2" />
            <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
            <path d="M-23 -168 C -23 -188 2 -192 2 -170" fill="none" stroke={CLR.bone} strokeWidth="1.2" opacity="0.4" />
            <path d="M-16 -80 L -30 -96" stroke={CLR.line} strokeWidth="4" />
          </svg>
          <div className={`pointer-events-none ${impact ? 'pick-swing' : ''}`} style={{ position: 'absolute', left: '46%', top: '18%', width: 96, height: 80 }}>
            <svg viewBox="0 0 96 80" className="h-full w-full" aria-hidden="true">
              <path d="M34 20 L 62 66" stroke="#5c4a3a" strokeWidth="6" strokeLinecap="round" />
              <path d="M22 18 L 54 34 L 44 44 L 12 28 Z" fill="#8d8880" stroke={CLR.line} strokeWidth="1.5" />
              <path d="M62 66 L 88 52 L 78 44 L 54 56 Z" fill="#7a7467" stroke={CLR.line} strokeWidth="1.5" />
              <path d="M40 24 L 50 31" stroke={CLR.bone} strokeWidth="1.4" opacity="0.55" />
            </svg>
          </div>
        </div>

        <div className={`absolute bottom-[8%] right-[6%] ${impact ? 'rock-shiver' : ''}`} style={{ width: '26vw', maxWidth: 210, minWidth: 150 }}>
          <OreVein />
        </div>

        {impact && (
          <>
            <span key={`ring-${E.key}`} className="fx-ring" style={{ left: '56%', bottom: '30%', width: 120, height: 120, border: `2px solid ${E.kind === 'rare' ? 'rgba(230,200,150,0.9)' : 'rgba(212,105,47,0.55)'}` }} />
            <div key={`burst-${E.key}`} className="absolute bottom-[16%] left-[52%]">
              <FlyBurst
                colors={E.kind === 'rare' ? [CLR.bone, CLR.bronze, CLR.emberHi, '#ffe9c4'] : [CLR.line, '#6b6660', CLR.ember]}
                particles={E.kind === 'rare' ? [...MINER_FX_FLY, { fx: 64, fy: -44, size: 2.2 }] : MINER_FX_FLY}
              />
            </div>
            {E.kind === 'rare' && (
              <span key={`vein-${E.key}`} className="fx-flash" style={{ left: '62%', bottom: '18%', width: '16%', height: '26%', background: 'radial-gradient(circle, rgba(230,200,150,0.45), transparent 70%)' }} />
            )}
          </>
        )}
      </div>
      <EmberField count={5} />
    </div>
  );
}

// ── WOODCUTTING ─────────────────────────────────────────────

function ForestBackdrop({ uid }: { uid: string }) {
  const sky = `${uid}-forestsky`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16130f" />
          <stop offset="0.6" stopColor="#12100d" />
          <stop offset="1" stopColor="#0e0d0b" />
        </linearGradient>
        <radialGradient id={`${uid}-fmoon`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(216,201,168,0.85)" />
          <stop offset="0.35" stopColor="rgba(216,201,168,0.16)" />
          <stop offset="1" stopColor="rgba(216,201,168,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${sky})`} />
      <g className="moon-glow">
        <circle cx="980" cy="120" r="130" fill={`url(#${uid}-fmoon)`} />
        <circle cx="980" cy="120" r="38" fill={CLR.bone} opacity="0.82" />
      </g>
      <Stars uid={uid} />
      {/* far treeline */}
      <g fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5">
        <path d="M120 240 L150 168 L184 240 Z" />
        <path d="M320 240 L356 150 L396 240 Z" />
        <path d="M560 240 L600 162 L644 240 Z" />
        <path d="M800 240 L836 172 L876 240 Z" />
        <path d="M1060 240 L1100 148 L1144 240 Z" />
        <path d="M1320 240 L1356 178 L1400 240 Z" />
      </g>
      <path d="M150 168 L356 150 L600 162 L836 172 L1100 148" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.5" />
      {/* framing trunks */}
      <g fill={CLR.far} stroke={CLR.stroke} strokeWidth="2">
        <path d="M60 420 L60 40 L104 40 L104 420 Z" />
        <path d="M1338 420 L1338 70 L1384 70 L1384 420 Z" />
      </g>
      {/* hanging branch (sways) */}
      <g className="sway" style={{ transformOrigin: '120px 40px' }}>
        <path d="M40 60 C 120 96 170 88 210 70" fill="none" stroke={CLR.stroke} strokeWidth="5" />
        <path d="M130 80 C 140 100 158 108 170 106" fill="none" stroke={CLR.stroke} strokeWidth="3" />
      </g>
    </svg>
  );
}

function OakTree({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 240" className="h-full w-full" aria-hidden="true">
      <g>
        <path d="M86 240 L86 60 L134 60 L134 240 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2.5" />
        <path d="M96 220 L96 70 M110 220 L110 70 M124 190 L124 80" stroke={CLR.line} strokeWidth="1.6" opacity="0.6" />
        <path d="M86 96 L74 88 L78 108 L70 122 L88 116 L94 134 L100 116 L112 130 L108 106 L122 98 L108 90 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.5" />
        {/* axe notch */}
        <path d="M126 132 L152 122 L150 134 Z" fill="#0a0908" stroke={CLR.stroke} strokeWidth="1.5" />
        <path d="M126 132 L142 128" stroke={CLR.boneDim} strokeWidth="1.2" />
      </g>
      {[56, 128, 170].map((x, i) => (
        <circle key={`${uid}-o${i}`} cx={x} cy={64 + i * 18} r="3" fill={CLR.verdant} opacity="0.55" />
      ))}
    </svg>
  );
}

export function WoodcutScene({ uid, event }: SceneProps) {
  const E = event;
  const impact = E && (E.kind === 'impact' || E.kind === 'rare');
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      <div className="scene-layer scene-pllx">
        <ForestBackdrop uid={uid} />
      </div>
      <div className="scene-layer scene-pllx-mid">
        <FogBands />
        <svg className="absolute inset-x-0 bottom-0 h-[30%] w-full" viewBox="0 0 1440 126" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 L120 26 L300 44 L520 24 L760 46 L980 30 L1200 44 L1440 26 L1440 126 L0 126 Z" fill={CLR.faint} />
          <path d="M120 26 L520 24 L980 30" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.5" />
        </svg>
      </div>
      <div className="scene-layer scene-pllx-near">
        <div className="idle-bob absolute bottom-[7%] left-[7%] w-[30vw] max-w-[200px] min-w-[140px]">
          <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
            <path d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z" fill={CLR.near} stroke={CLR.stroke} strokeWidth="2" />
            <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
            <path d="M-23 -168 C -23 -188 2 -192 2 -170" fill="none" stroke={CLR.bone} strokeWidth="1.2" opacity="0.4" />
            <path d="M-18 -70 L -34 -84" stroke={CLR.line} strokeWidth="4" />
          </svg>
          <div className={`pointer-events-none ${impact ? 'axe-swing' : ''}`} style={{ position: 'absolute', left: '42%', top: '16%', width: 100, height: 90 }}>
            <svg viewBox="0 0 100 90" className="h-full w-full" aria-hidden="true">
              <path d="M28 10 L 66 70" stroke="#5c4a3a" strokeWidth="7" strokeLinecap="round" />
              <path d="M16 68 L 30 82 L 72 76 L 58 60 Z" fill="#7f7a6e" stroke={CLR.line} strokeWidth="1.5" />
              <path d="M30 82 L 38 70 L 28 64 Z" fill="#8f8a7e" />
              <path d="M34 60 L 48 72" stroke={CLR.bone} strokeWidth="1.4" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className={`absolute bottom-[7%] right-[5%] ${impact ? 'rock-shiver' : ''}`} style={{ width: '26vw', maxWidth: 190, minWidth: 140 }}>
          <OakTree uid={uid} />
        </div>

        {impact && (
          <>
            <span key={`ring-${E.key}`} className="fx-ring" style={{ left: '57%', bottom: '24%', width: 100, height: 100, border: `2px solid ${E.kind === 'rare' ? 'rgba(135,167,107,0.9)' : 'rgba(138,133,125,0.5)'}` }} />
            <div key={`chips-${E.key}`} className="absolute bottom-[14%] left-[54%]">
              <FlyBurst
                colors={E.kind === 'rare' ? [CLR.bone, CLR.verdant, '#e6dcc2'] : ['#4a453e', '#6b6660', CLR.verdantDark]}
                particles={[
                  { fx: 22, fy: -34 }, { fx: 38, fy: -18 }, { fx: 6, fy: -40 }, { fx: -12, fy: -26 },
                  { fx: -4, fy: -46 }, { fx: 30, fy: -4 }, { fx: 48, fy: -30 }, { fx: 14, fy: -22 },
                ]}
              />
            </div>
            {E.kind === 'rare' && (
              <span key={`leafv-${E.key}`} className="fx-flash" style={{ left: '60%', bottom: '26%', width: '12%', height: '22%', background: 'radial-gradient(circle, rgba(135,167,107,0.5), transparent 70%)' }} />
            )}
          </>
        )}
      </div>
      <LeafField count={5} />
    </div>
  );
}

// ── FISHING ─────────────────────────────────────────────────

function RiverBackdrop({ uid }: { uid: string }) {
  const sky = `${uid}-riversky`;
  const water = `${uid}-water`;
  const shore = `${uid}-shore`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#131619" />
          <stop offset="0.55" stopColor="#101213" />
          <stop offset="1" stopColor="#0e0e0d" />
        </linearGradient>
        <linearGradient id={water} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c252c" />
          <stop offset="1" stopColor="#10161c" />
        </linearGradient>
        <radialGradient id={`${uid}-rmoon`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(200,216,230,0.9)" />
          <stop offset="0.35" stopColor="rgba(150,175,200,0.18)" />
          <stop offset="1" stopColor="rgba(150,175,200,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${sky})`} />
      <g className="moon-glow">
        <circle cx="760" cy="112" r="120" fill={`url(#${uid}-rmoon)`} />
        <circle cx="760" cy="112" r="36" fill="#c9d4de" opacity="0.8" />
      </g>
      <Stars uid={uid} />
      {/* far hills */}
      <path d="M0 232 L140 168 L300 226 L520 158 L720 232 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M700 238 L900 170 L1100 236 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M140 168 L520 158 L720 232" fill="none" stroke={CLR.line} strokeWidth="1.2" opacity="0.6" />
      {/* water */}
      <rect x="0" y="282" width="1440" height="138" fill={`url(#${water})`} />
      <path d="M0 282 L120 272 L300 286 L520 268 L760 288 L1020 270 L1240 284 L1440 272" fill="none" stroke="#28333b" strokeWidth="2" />
      {/* moon reflection */}
      <g fill="#c9d4de" opacity="0.3">
        <rect x="748" y="300" width="24" height="6" rx="3" className="water-shine" />
        <rect x="752" y="314" width="16" height="5" rx="2.5" className="water-shine" style={{ animationDelay: '-1.6s' }} />
        <rect x="744" y="330" width="32" height="5" rx="2.5" className="water-shine" style={{ animationDelay: '-3.1s' }} />
      </g>
      {/* water glints */}
      {[220, 520, 960, 1220].map((x, i) => (
        <rect key={`${uid}-g${i}`} x={x} y={296 + i * 14} width="56" height="3" rx="1.5" fill="#3a4650" opacity="0.6" className="water-shine" style={{ animationDelay: `${-i * 1.3}s` }} />
      ))}
      {/* reeds */}
      <g stroke={CLR.far} strokeWidth="3">
        <path d="M1120 420 L1140 292 M1170 420 L1186 300 M1210 420 L1230 306" />
      </g>
      <circle cx="1140" cy="286" r="5" fill={CLR.far} />
      <circle cx="1186" cy="294" r="4.5" fill={CLR.far} />
      <circle cx="1230" cy="300" r="4" fill={CLR.far} />
      <g stroke={CLR.stroke} strokeWidth="2.5">
        <path d="M180 420 L186 330 M216 420 L224 336" />
      </g>
      <circle cx="186" cy="324" r="4" fill={CLR.stroke} />
    </svg>
  );
}

export function FishScene({ uid, event }: SceneProps) {
  const E = event;
  const bite = E?.kind === 'bite';
  const splash = E?.kind === 'catch' || E?.kind === 'rare';
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      <div className="scene-layer scene-pllx">
        <RiverBackdrop uid={uid} />
      </div>
      <div className="scene-layer scene-pllx-mid">
        <FogBands />
      </div>
      <div className="scene-layer scene-pllx-near">
        {/* angler on shore */}
        <div className="idle-bob absolute bottom-[12%] left-[8%] w-[26vw] max-w-[180px] min-w-[120px]">
          <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
            <path d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z" fill={CLR.near} stroke={CLR.stroke} strokeWidth="2" />
            <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
            <path d="M-23 -168 C -23 -188 2 -192 2 -170" fill="none" stroke={CLR.bone} strokeWidth="1.2" opacity="0.35" />
            {/* seated rock */}
            <path d="M-46 12 C -42 -6 -18 -14 2 -8 C 26 -4 44 2 46 16 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
            {/* arm reaching to rod */}
            <path d="M22 -96 L 60 -70" stroke={CLR.line} strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        {/* rod + line */}
        <svg className="absolute bottom-[20%] left-[13%] pointer-events-none" width="520" height="300" viewBox="0 0 520 300" fill="none" aria-hidden="true">
          <path d="M20 180 C 40 60 140 10 180 4" stroke="#5c4a3a" strokeWidth="4" />
          <path d="M180 4 L 300 240" stroke="rgba(216,201,168,0.55)" strokeWidth="1.2" />
        </svg>
        {/* bobber */}
        <div className={`absolute bottom-[38%] left-[44%] ${bite ? 'bob-bite' : 'bob-bob'}`} style={{ width: 14, height: 14 }}>
          <span className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, #e08a44 0%, #d4692f 45%, #8a3a18 100%)' }} />
          <span className="absolute -inset-2 rounded-full border border-[rgba(224,138,68,0.4)]" />
        </div>

        {(bite || splash) && (
          <span key={`ring-${E.key}`} className="ripple-ring" style={{ left: '44.5%', top: '56%', width: 160, height: 160 }} />
        )}
        {splash && (
          <>
            <span key={`ring2-${E.key}`} className="ripple-ring" style={{ left: '44.5%', top: '56%', width: 220, height: 220, animationDelay: '0.12s' }} />
            <div key={`splash-${E.key}`} className="absolute bottom-[40%] left-[42%]">
              <FlyBurst
                colors={E.kind === 'rare' ? [CLR.bone, CLR.water, '#cdbfa4'] : [CLR.water, '#7f8f9f', 'rgba(200,216,230,0.9)']}
                particles={[
                  { fx: -16, fy: -30 }, { fx: 0, fy: -44 }, { fx: 18, fy: -28 }, { fx: -8, fy: -50 },
                  { fx: 8, fy: -16 }, { fx: -24, fy: -18 }, { fx: 24, fy: -40 },
                ]}
              />
            </div>
          </>
        )}
      </div>
      {/* drifting mist over the water */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[20%] h-20">
        <div className="fog-band h-full w-[130%] rounded-full bg-[radial-gradient(closest-side,rgba(160,180,200,0.06),transparent)]" style={{ filter: 'blur(12px)' }} />
      </div>
    </div>
  );
}

// ── ALCHEMY ─────────────────────────────────────────────────

function LabBackdrop({ uid }: { uid: string }) {
  const sky = `${uid}-labsky`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12110e" />
          <stop offset="0.6" stopColor="#0f0e0c" />
          <stop offset="1" stopColor="#0c0b0a" />
        </linearGradient>
        <radialGradient id={`${uid}-lmoon`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(216,201,168,0.4)" />
          <stop offset="1" stopColor="rgba(216,201,168,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-flask`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(168,201,160,0.35)" />
          <stop offset="1" stopColor="rgba(168,201,160,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${sky})`} />
      <circle cx="1180" cy="90" r="120" fill={`url(#${uid}-lmoon)`} className="moon-glow" />
      {/* ceiling beams */}
      <path d="M0 0 L0 22 L1440 22 L1440 0 Z" fill={CLR.far} />
      <path d="M90 0 L170 46 L170 420 L90 420 Z" fill={CLR.far} />
      <path d="M1290 0 L1360 40 L1360 420 L1290 420 Z" fill={CLR.far} />
      {/* hanging herbs */}
      <g stroke={CLR.line} strokeWidth="2">
        <path d="M240 46 L238 120 M260 46 L262 132 M252 46 L254 96" />
      </g>
      {[92, 128, 96].map((_, i) => (
        <circle key={`${uid}-hb${i}`} cx={238 + i * 12 + (i % 2) * 2} cy={162 + i * 10} r="5" fill={CLR.verdantDark} opacity="0.7" />
      ))}
      {/* shelf with vials */}
      <path d="M870 300 L1320 300 L1320 318 L870 318 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2" />
      {[900, 980, 1100, 1200, 1280].map((x, i) => (
        <g key={`${uid}-v${i}`}>
          <path d={`M${x} 300 l10 -${40 + (i % 3) * 16} l10 ${40 + (i % 3) * 16} Z`} fill={CLR.far} stroke={CLR.line} strokeWidth="1.5" />
          <rect x={x + 8} y={300 - (48 + (i % 3) * 16)} width="4" height="8" fill={i % 2 ? CLR.arcaneDark : CLR.emberHi} opacity="0.7" />
        </g>
      ))}
      <path d="M960 318 L970 358 L984 358 L994 318 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.5" />
      <path d="M1210 318 L1218 352 L1230 352 L1238 318 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.5" />
    </svg>
  );
}

export function AlchemyScene({ uid, event }: SceneProps) {
  const E = event;
  const react = E && (E.kind === 'complete' || E.kind === 'rare');
  // glass positions for bubbles/fume overlays
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      <div className="scene-layer scene-pllx">
        <LabBackdrop uid={uid} />
      </div>
      <div className="scene-layer scene-pllx-mid">
        <DustField count={5} />
        {/* workbench */}
        <svg className="absolute inset-x-0 bottom-0 h-[26%] w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 L1440 26 L1440 110 L0 110 Z" fill={CLR.faint} opacity="0.9" />
          <path d="M0 40 L1440 26" stroke={CLR.line} strokeWidth="2" />
        </svg>
      </div>
      <div className="scene-layer scene-pllx-near">
        {/* alchemist behind bench */}
        <div className="idle-bob absolute bottom-[33%] left-[8%] w-[24vw] max-w-[170px] min-w-[120px] opacity-90">
          <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
            <path d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z" fill={CLR.near} stroke={CLR.stroke} strokeWidth="2" />
            <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
            {/* pronounced hood */}
            <path d="M-28 -168 C -30 -194 -8 -208 8 -198 C 20 -192 24 -184 24 -168 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.6" />
          </svg>
        </div>

        {/* round-bottom flask */}
        <svg className="absolute bottom-[26%] right-[24%] pointer-events-none" width="240" height="230" viewBox="0 0 240 230" fill="none" aria-hidden="true">
          <path d="M92 30 L92 96 L70 96 L42 178 C 34 198 52 212 74 206 C 88 202 152 202 166 206 C 188 212 206 198 198 178 L170 96 L148 96 L148 30 Z" fill="#141210" stroke={CLR.line} strokeWidth="2" />
          <path d="M70 96 L148 96" stroke="none" />
          {/* liquid */}
          <g className={react ? 'fx-flash' : ''}>
            <path d="M74 206 C 88 202 152 202 166 206 C 188 212 200 200 196 186 L180 128 L96 128 L78 186 C 74 198 64 208 74 206 Z" fill={CLR.arcaneDark} opacity="0.6" />
            <path d="M96 128 L180 128 L188 166 C 150 150 118 152 92 168 Z" fill="#7fa07a" opacity="0.4" />
          </g>
          <path d="M96 128 L180 128 L196 186" stroke={CLR.arcane} strokeWidth="1.4" opacity="0.5" />
          <circle cx="118" cy="196" r="3" fill={CLR.arcane} className="flicker" />
          <circle cx="136" cy="202" r="2.4" fill={CLR.arcane} className="flicker" style={{ animationDelay: '-1.2s' }} />
        </svg>
        {/* bubbles inside flask */}
        <div className="pointer-events-none absolute bottom-[28%] right-[27%] h-[120px] w-[110px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={`${uid}-b${i}`}
              className="bubble-rise absolute bottom-[10%]"
              style={{
                left: `${18 + i * 24}%`,
                width: 5 + (i % 2) * 4,
                height: 5 + (i % 2) * 4,
                borderRadius: 999,
                background: 'radial-gradient(circle, rgba(168,201,160,0.7), transparent 70%)',
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* flame + tripod on bench */}
        <div className="absolute bottom-[24%] right-[38%]">
          <span className="flicker block rounded-full" style={{ width: 18, height: 18, background: 'radial-gradient(circle, rgba(224,138,68,0.7), rgba(212,105,47,0.2) 60%, transparent 75%)' }} />
        </div>
        <svg className="absolute bottom-[24%] right-[35%] pointer-events-none" width="130" height="90" viewBox="0 0 130 90" fill="none" aria-hidden="true">
          <path d="M18 74 L114 74" stroke={CLR.far} strokeWidth="3" />
          <path d="M36 74 L47 20 L60 74 M70 74 L83 24 L94 74" stroke={CLR.far} strokeWidth="2.5" />
          <rect x="48" y="6" width="30" height="7" fill={CLR.far} />
        </svg>

        {/* fume from small vial */}
        <div className="absolute bottom-[27%] right-[41%] pointer-events-none">
          {[0, 1, 2].map((i) => (
            <span
              key={`${uid}-f${i}`}
              className="fume-rise absolute"
              style={{
                left: i * 12,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: 'radial-gradient(circle, rgba(168,201,160,0.4), transparent 70%)',
                filter: 'blur(3px)',
                animationDelay: `${i * 1.6}s`,
              }}
            />
          ))}
        </div>

        {/* mortar + open book, left of bench */}
        <svg className="absolute bottom-[25%] left-[26%] pointer-events-none" width="200" height="90" viewBox="0 0 200 90" fill="none" aria-hidden="true">
          <path d="M20 56 C 34 88 96 88 108 56 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="2" />
          <path d="M40 40 L 62 20 L 84 40 L 62 56 Z" fill={CLR.slateDeep} stroke={CLR.line} strokeWidth="2" />
        </svg>
        <svg className="absolute bottom-[25%] left-[14%] pointer-events-none" width="150" height="70" viewBox="0 0 150 70" fill="none" aria-hidden="true">
          <path d="M16 62 L16 26 C 16 14 38 12 54 18 C 70 24 80 22 96 16 C 112 10 134 14 134 28 L134 62 C 134 48 112 44 96 48 C 80 52 70 50 54 50 C 38 50 16 48 16 62 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1.6" />
          <path d="M134 28 C 134 14 112 10 96 16" stroke={CLR.line} strokeWidth="1.2" opacity="0.6" />
        </svg>

        {react && (
          <>
            <span key={`labglow-${E.key}`} className="fx-flash" style={{ left: '52%', bottom: '18%', width: '24%', height: '40%', background: 'radial-gradient(circle, rgba(168,201,160,0.4), transparent 70%)' }} />
            <div key={`fume-${E.key}`} className="absolute bottom-[20%] left-[55%]">
              <FlyBurst colors={[CLR.arcane, CLR.arcaneDark, CLR.boneDim]} particles={[
                { fx: 0, fy: -34 }, { fx: -8, fy: -26 }, { fx: 8, fy: -30 }, { fx: 0, fy: -22 },
              ]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── FORGE ───────────────────────────────────────────────────

const FORGE_SPARKS: { fx: number; fy: number; size?: number; delay?: number }[] = [
  { fx: -14, fy: -42, size: 3.2 }, { fx: 2, fy: -58, size: 2.6 }, { fx: 18, fy: -46, size: 3.4 },
  { fx: -6, fy: -66, size: 2.2 }, { fx: 10, fy: -36, size: 3 }, { fx: -24, fy: -50, size: 2.4 },
  { fx: 26, fy: -62, size: 2.6 }, { fx: -2, fy: -78, size: 2 },
];

function SmithyBackdrop({ uid }: { uid: string }) {
  const sky = `${uid}-smithysky`;
  const heat = `${uid}-heat`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f0e0c" />
          <stop offset="1" stopColor="#0b0a09" />
        </linearGradient>
        <radialGradient id={heat} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(212,105,47,0.4)" />
          <stop offset="0.5" stopColor="rgba(212,105,47,0.12)" />
          <stop offset="1" stopColor="rgba(212,105,47,0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="420" fill={`url(#${sky})`} />
      <circle cx="1120" cy="300" r="260" fill={`url(#${heat})`} className="forge-glow" style={{ mixBlendMode: 'screen' }} />
      {/* roof beams + hanging tools */}
      <path d="M0 0 L0 40 L1440 40 L1440 0 Z" fill={CLR.far} />
      <path d="M96 40 L196 196 L196 40 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      <path d="M1240 40 L1344 190 L1344 40 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
      {/* hanging tools */}
      <g stroke={CLR.stroke} strokeWidth="3">
        <path d="M380 40 L382 110" />
        <path d="M760 40 L758 92" />
      </g>
      <rect x="366" y="112" width="32" height="10" rx="2" fill={CLR.mid} stroke={CLR.stroke} />
      <rect x="752" y="94" width="12" height="36" rx="3" fill={CLR.mid} stroke={CLR.stroke} />
      {/* back wall brick band */}
      <path d="M0 300 L1440 300 L1440 420 L0 420 Z" fill={CLR.faint} opacity="0.7" />
      <path d="M0 308 L1440 308" stroke={CLR.stroke} strokeWidth="2" />
    </svg>
  );
}

function AnvilAndBlade({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 160" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-coals`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(224,138,68,0.35)" />
          <stop offset="1" stopColor="rgba(224,138,68,0)" />
        </radialGradient>
      </defs>
      <g>
        {/* anvil */}
        <rect x="30" y="120" width="160" height="18" rx="3" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2" />
        <path d="M70 120 L70 96 L150 96 L150 120 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2" />
        <path d="M96 96 L96 60 L124 60 L124 96 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="2" />
        <path d="M56 138 L56 154 L96 154 L96 138" fill={CLR.far} stroke={CLR.stroke} strokeWidth="1.5" />
        {/* cooling charcoal glow under */}
        <circle cx="110" cy="122" r="44" fill={`url(#${uid}-coals)`} className="flicker" />
        {/* weapon on the anvil */}
        <g transform="rotate(-6 110 80)">
          <rect x="70" y="70" width="7" height="104" rx="3" fill="#a9a295" stroke={CLR.line} strokeWidth="1.5" />
          <path d="M64 172 L73.5 200 L83 172 Z" fill="#7d786c" />
          <rect x="66" y="66" width="15" height="13" fill={CLR.line} />
        </g>
        <path d="M78 78 L146 78" stroke={CLR.bronze} strokeWidth="1.6" opacity="0.6" />
      </g>
    </svg>
  );
}

export function ForgeScene({ uid, event }: SceneProps) {
  const E = event;
  const strike = E && (E.kind === 'complete' || E.kind === 'rare' || E.kind === 'impact');
  return (
    <div className="scene-root" aria-hidden="true" data-event={E ? `${E.kind}:${E.key}` : undefined}>
      <div className="scene-layer scene-pllx">
        <SmithyBackdrop uid={uid} />
      </div>
      <div className="scene-layer scene-pllx-mid">
        {/* furnace glow on floor */}
        <div className="heat-shimmer absolute bottom-[18%] right-[4%] h-24 w-56 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(212,105,47,0.5), transparent 70%)', filter: 'blur(10px)' }} />
        {/* coal embers */}
        <EmberField count={6} left={66} right={4} bottom={20} color={CLR.ember} />
      </div>
      <div className="scene-layer scene-pllx-near">
        {/* smith */}
        <div className="idle-bob absolute bottom-[8%] left-[7%] w-[30vw] max-w-[200px] min-w-[140px]">
          <svg viewBox="-60 -230 120 240" className="h-full w-full" aria-hidden="true">
            <path d="M0 -150 C -24 -112 -40 -60 -40 -14 C -40 10 -26 16 0 16 C 26 16 40 10 40 -14 C 40 -60 24 -112 0 -150 Z" fill={CLR.near} stroke={CLR.stroke} strokeWidth="2" />
            <circle cx="0" cy="-168" r="24" fill={CLR.near} stroke={CLR.line} strokeWidth="2" />
            <path d="M-23 -168 C -23 -188 2 -192 2 -170" fill="none" stroke={CLR.bone} strokeWidth="1.2" opacity="0.4" />
            <path d="M-18 -70 L -34 -84" stroke={CLR.line} strokeWidth="4" />
          </svg>
          <div className={`pointer-events-none ${strike ? 'hammer-swing' : ''}`} style={{ position: 'absolute', left: '40%', top: '12%', width: 90, height: 80 }}>
            <svg viewBox="0 0 90 80" className="h-full w-full" aria-hidden="true">
              <path d="M40 8 L 30 60" stroke="#5c4a3a" strokeWidth="7" strokeLinecap="round" />
              <rect x="22" y="6" width="34" height="16" rx="2" fill="#a29b8d" stroke={CLR.line} strokeWidth="1.5" />
              <rect x="26" y="2" width="4" height="24" fill="#8d8880" />
            </svg>
          </div>
        </div>

        {/* anvil + blade center */}
        <div className={`absolute bottom-[7%] left-[42%] w-[22vw] max-w-[210px] min-w-[150px] ${strike ? 'rock-shiver' : ''}`}>
          <AnvilAndBlade uid={uid} />
        </div>

        {/* forge mouth (furnace) right */}
        <div className="absolute bottom-[8%] right-[3%] w-[24vw] max-w-[200px] min-w-[150px]">
          <svg viewBox="0 0 200 170" className="h-full w-full" aria-hidden="true">
            <path d="M18 170 L18 96 L54 96 L54 118 L146 118 L146 96 L182 96 L182 170 Z" fill={CLR.far} stroke={CLR.stroke} strokeWidth="2.5" />
            <path d="M54 118 L146 118 L146 96 L54 96 Z" fill="#160d09" />
            <g className="flicker">
              <rect x="60" y="100" width="80" height="16" rx="8" fill="#e08a44" opacity="0.9" />
              <rect x="70" y="104" width="60" height="8" rx="4" fill="#ffc27a" opacity="0.8" />
            </g>
            <path d="M60 96 C 80 70 120 70 140 96" fill="none" stroke={CLR.stroke} strokeWidth="2" />
          </svg>
        </div>

        {strike && (
          <>
            <div key={`sparks-${E.key}`} className="absolute bottom-[24%] left-[47%]">
              <FlyBurst colors={[CLR.emberHi, CLR.bone, '#ffb347', CLR.ember]} particles={FORGE_SPARKS} />
            </div>
            {E.kind === 'rare' && (
              <span key={`blade-${E.key}`} className="fx-flash" style={{ left: '40%', bottom: '10%', width: '26%', height: '36%', background: 'radial-gradient(circle, rgba(201,162,100,0.4), transparent 70%)' }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── DISPATCH ────────────────────────────────────────────────

export const ACTIVITY_SCENES: Record<ActivityId, (props: SceneProps) => ReactElement> = {
  fighting: FightScene,
  mining: MineScene,
  woodcutting: WoodcutScene,
  fishing: FishScene,
  alchemy: AlchemyScene,
  forge: ForgeScene,
};