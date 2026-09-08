'use client';

import type { CSSProperties } from 'react';
import { CLR } from '../visual-palette';

/**
 * Ore vein node — faceted boulder studded with ember crystals. Lives on
 * the right of an ActivityRig frame. On activity-impact the whole mass
 * shivers and chips burst from the strike point (`.act-spark`).
 */
export function OreNode() {
  return (
    <g data-rig="ore" className="act-node">
      <ellipse cx="0" cy="6" rx="44" ry="7" fill="rgba(8,7,7,0.5)" />

      <g className="act-node-body" style={{ transformOrigin: '0px 10px' }}>
        {/* mass */}
        <path d="M-44 -6 C -48 -40 -20 -74 4 -78 C 30 -74 48 -40 44 -6 C 34 2 -30 2 -44 -6 Z" fill="url(#vg-stone)" stroke={CLR.line} strokeWidth="1.4" />
        {/* facets */}
        <path d="M-42 -10 C -30 -44 -6 -64 4 -76 C 4 -40 -2 -20 -40 -4 Z" fill={CLR.faint} stroke={CLR.line} strokeWidth="1" />
        <path d="M4 -76 C 26 -68 40 -40 42 -10 L 6 -40 Z" fill={CLR.mid} stroke={CLR.line} strokeWidth="1" />
        <path d="M-10 -20 C 0 -30 14 -26 20 -18 L 6 4 L -22 2 Z" fill={CLR.far} stroke={CLR.line} strokeWidth="1" />
        {/* cracks */}
        <path d="M-6 -44 L 4 -30 M 12 -58 L 22 -44 M -24 -30 L -14 -22" stroke={CLR.stroke} strokeWidth="0.8" opacity="0.8" />
        {/* crystal cluster */}
        {([
          [-14, -52, 7, 26, -14], [4, -64, 8, 30, 8], [18, -38, 6, 22, -22],
          [-30, -24, 6, 20, 12], [12, -8, 5, 16, -8],
        ] as [number, number, number, number, number][]).map(([cx, cy, w, h, r], i) => (
          <rect
            key={i}
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={1.5}
            transform={`rotate(${r} ${cx} ${cy})`}
            fill={i % 3 === 0 ? CLR.emberHi : i % 3 === 1 ? CLR.ember : CLR.bronze}
            opacity="0.85"
            className="flicker"
          />
        ))}
        {/* strike scar */}
        <path d="M-4 -28 L 8 -44 M 8 -44 L 14 -30" stroke={CLR.stroke} strokeWidth="2" opacity="0.85" />
      </g>

      {/* strike sparks — visible only during impact */}
      {[
        [0, -34, -14], [-4, -26, -20], [6, -32, -26], [2, -20, -10], [-2, -40, -18],
      ].map(([dx, dy, fx], i) => (
        <circle
          key={i}
          className="act-spark"
          cx={dx}
          cy={dy}
          r={1.6}
          fill={CLR.emberHi}
          style={{ transformOrigin: `${dx}px ${dy}px`, '--fx': `${fx}px` } as CSSProperties}
        />
      ))}
    </g>
  );
}