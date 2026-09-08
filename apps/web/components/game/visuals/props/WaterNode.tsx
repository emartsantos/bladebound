'use client';

import type { CSSProperties } from 'react';
import { CLR } from '../visual-palette';

/**
 * River surface node — the waterline under the angler's bobber (which
 * rests at rig (138, -34) → node-local (18, -42)). On bite
 * (activity-impact) ripples bloom; on catch (activity-recovery) the
 * ripples spread wide and droplets splash. A fish shadow drifts below.
 */
export function WaterNode() {
  const bobX = 18;
  return (
    <g data-rig="water" className="act-node">
      {/* water body */}
      <rect x="-52" y="-46" width="104" height="52" rx="4" fill="url(#vg-water)" stroke={CLR.slateDeep} strokeWidth="1" />
      {/* waterline */}
      <path d="M-52 -46 C -30 -50 -8 -42 16 -48 C 36 -52 46 -46 52 -44" fill="none" stroke={CLR.slate} strokeWidth="1.6" />
      <path d="M-52 -40 C -26 -44 -4 -38 20 -42" fill="none" stroke={CLR.slateDeep} strokeWidth="1" opacity="0.7" />
      {/* surface glints */}
      {[-34, -10, 30, 8].map((x, i) => (
        <rect key={i} x={x} y={-34 + i * 8} width="26" height="2" rx="1" fill={CLR.water} opacity="0.35" className="water-shine" style={{ animationDelay: `${-i * 1.1}s` }} />
      ))}

      {/* drift fish shadow */}
      <ellipse cx="34" cy="-10" rx="14" ry="4" fill="rgba(138,168,196,0.14)" className="water-shine" style={{ animationDuration: '9s' }} />

      {/* ripple rings — rest on the bobber's waterline */}
      <ellipse className="act-ripple" cx={bobX} cy="-44" rx="7" ry="2.6" fill="none" stroke={CLR.water} strokeWidth="1" opacity="0" style={{ transformOrigin: `${bobX}px -44px` } as CSSProperties} />
      <ellipse className="act-ripple" cx={bobX} cy="-44" rx="7" ry="2.6" fill="none" stroke={CLR.water} strokeWidth="1" opacity="0" style={{ transformOrigin: `${bobX}px -44px`, animationDelay: '0.14s' } as CSSProperties} />

      {/* splash droplets — pop up on catch */}
      {[
        [14, -48, -16], [22, -46, -14], [16, -40, -18], [20, -50, -12],
      ].map(([dx, dy, fy], i) => (
        <circle
          key={i}
          className="act-splash"
          cx={dx}
          cy={dy}
          r={1.8}
          fill={CLR.water}
          style={{ transformOrigin: `${dx}px ${dy}px`, '--fy': `${fy}px` } as CSSProperties}
        />
      ))}
    </g>
  );
}