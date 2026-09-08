'use client';

import { CLR } from './visual-palette';

/**
 * Shared SVG `<defs>` — gradients, filters and masks reused by every
 * character, enemy and effect in the visual layer. Rendered once per SVG
 * root that includes a character/scene (the nearest ancestor `<svg>`).
 */

export function VisualDefs() {
  return (
    <defs>
      <linearGradient id="vg-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a5855" />
        <stop offset="0.5" stopColor="#3a3835" />
        <stop offset="1" stopColor="#1a1918" />
      </linearGradient>
      <linearGradient id="vg-steel-dark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3a3835" />
        <stop offset="0.5" stopColor="#1e1d1b" />
        <stop offset="1" stopColor="#0f0e0d" />
      </linearGradient>
      <linearGradient id="vg-bronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d0ab6b" />
        <stop offset="0.5" stopColor="#b08754" />
        <stop offset="1" stopColor="#7a5f3a" />
      </linearGradient>
      <linearGradient id="vg-leather" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a4a35" />
        <stop offset="0.5" stopColor="#3d2e1f" />
        <stop offset="1" stopColor="#1f1710" />
      </linearGradient>
      <linearGradient id="vg-cloth" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3a3530" />
        <stop offset="0.5" stopColor="#2a2520" />
        <stop offset="1" stopColor="#1a1510" />
      </linearGradient>
      <linearGradient id="vg-chain" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a4845" />
        <stop offset="1" stopColor="#242321" />
      </linearGradient>
      <linearGradient id="vg-fur" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a5550" />
        <stop offset="0.5" stopColor="#3a3530" />
        <stop offset="1" stopColor="#1a1510" />
      </linearGradient>
      <linearGradient id="vg-stone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a5a58" />
        <stop offset="0.5" stopColor="#3a3a38" />
        <stop offset="1" stopColor="#1a1a18" />
      </linearGradient>
      <linearGradient id="vg-bone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d8c9a8" />
        <stop offset="1" stopColor="#8a857d" />
      </linearGradient>
      <linearGradient id="vg-blood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c45a3a" />
        <stop offset="1" stopColor="#6e1f14" />
      </linearGradient>
      <linearGradient id="vg-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c8b59a" />
        <stop offset="0.5" stopColor="#a8957a" />
        <stop offset="1" stopColor="#7a6a5a" />
      </linearGradient>
      <linearGradient id="vg-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2c3a46" />
        <stop offset="0.5" stopColor="#1c252c" />
        <stop offset="1" stopColor="#10161c" />
      </linearGradient>

      <radialGradient id="vg-ember-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="rgba(224,138,68,0.9)" />
        <stop offset="0.4" stopColor="rgba(212,105,47,0.35)" />
        <stop offset="1" stopColor="rgba(212,105,47,0)" />
      </radialGradient>

      <filter id="vg-trail-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
      <filter id="vg-spark-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="0.6" />
      </filter>
      <filter id="vg-blood-blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1" />
      </filter>
      <filter id="vg-dust-blur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

/**
 * Ground shadow — grounding ellipse that reacts slightly to jump/lunge.
 * Use inside a character `<g>` so it scales with the figure.
 */
export function GroundShadow({ rx = 34, ry = 9 }: { rx?: number; ry?: number }) {
  return (
    <ellipse
      cx="0"
      cy="4"
      rx={rx}
      ry={ry}
      fill="rgba(8,7,7,0.55)"
      className="ground-shadow"
      aria-hidden="true"
    />
  );
}