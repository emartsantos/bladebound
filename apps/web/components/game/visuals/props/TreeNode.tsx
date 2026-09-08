'use client';

import type { CSSProperties } from 'react';
import { CLR } from '../visual-palette';

/**
 * Felled timber node — a thick trunk with a deepening axe trench where
 * the woodcutter strikes. On activity-impact the trunk shivers and wood
 * chips burst from the gash (`.act-spark`).
 */
export function TreeNode() {
  return (
    <g data-rig="tree" className="act-node">
      <ellipse cx="0" cy="8" rx="30" ry="6" fill="rgba(8,7,7,0.5)" />

      <g className="act-node-body" style={{ transformOrigin: '0px 12px' }}>
        {/* root flare */}
        <path d="M-22 6 C -18 -6 -14 -14 -10 -18 L 12 -18 C 16 -12 20 -2 22 6 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="1.6" />
        {/* trunk */}
        <path d="M-14 -72 L-13 -18 C -9 -6 8 -6 12 -18 L 14 -72 C 6 -80 -6 -80 -14 -72 Z" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.4" />
        {/* bark ridges */}
        <path d="M-10 -64 C -6 -58 -6 -50 -9 -44 M 8 -66 C 10 -58 8 -48 9 -42 M -8 -30 C -4 -26 2 -24 6 -28" stroke={CLR.line} strokeWidth="1" opacity="0.85" />
        <path d="M-6 -60 L-2 -54 M 4 -52 L8 -58" stroke={CLR.line} strokeWidth="0.8" opacity="0.5" />
        {/* moss */}
        <path d="M-14 -72 C -12 -76 4 -78 12 -70 L 10 -72 C 0 -76 -8 -76 -14 -72 Z" fill={CLR.verdantDark} />
        {/* axe trench */}
        <path d="M-8 -34 L 2 -48 L 8 -34 C 2 -28 -4 -28 -8 -34 Z" fill={CLR.faint} stroke={CLR.stroke} strokeWidth="1.4" />
        <path d="M-6 -30 L 0 -36" stroke={CLR.boneDim} strokeWidth="1" opacity="0.6" />
      </g>

      {/* wood chips — visible only during impact */}
      {[
        [0, -36, -16], [-4, -28, -22], [6, -32, -28], [-2, -22, -12], [4, -42, -20],
      ].map(([dx, dy, fx], i) => (
        <rect
          key={i}
          className="act-spark"
          x={dx - 1.5}
          y={dy - 1.5}
          width={3 + (i % 2)}
          height={3 + (i % 3)}
          rx={0.5}
          fill={i % 2 ? CLR.verdantDark : CLR.boneDim}
          style={{ transformOrigin: `${dx}px ${dy}px`, '--fx': `${fx}px` } as CSSProperties}
        />
      ))}
    </g>
  );
}