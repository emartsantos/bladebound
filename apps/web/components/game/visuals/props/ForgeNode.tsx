'use client';

import type { CSSProperties } from 'react';
import { CLR } from '../visual-palette';

/**
 * Forge node — anvil with a glowing ingot, plus the furnace mouth on the
 * right. On activity-impact the anvil mass shivers, sparks fly off the
 * ingot (`.act-spark`) and the furnace flares (`.act-flare`).
 */
export function ForgeNode() {
  return (
    <g data-rig="forge" className="act-node">
      <ellipse cx="-20" cy="8" rx="44" ry="7" fill="rgba(8,7,7,0.55)" />

      <g className="act-node-body" style={{ transformOrigin: '-16px 10px' }}>
        {/* stump base */}
        <rect x="-44" y="-8" width="50" height="12" rx="2" fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1.4" />
        {/* anvil body */}
        <path d="M-38 -8 L-32 -36 L-6 -36 L-4 -8 Z" fill="url(#vg-steel-dark)" stroke={CLR.line} strokeWidth="1.4" />
        {/* horn (left curve) */}
        <path d="M-32 -36 C -44 -40 -50 -30 -48 -20 C -46 -28 -38 -30 -32 -30 Z" fill="url(#vg-steel-dark)" stroke={CLR.line} strokeWidth="1.2" />
        {/* top plate */}
        <rect x="-40" y="-42" width="40" height="7" rx="1.5" fill="url(#vg-steel)" stroke={CLR.line} strokeWidth="1.4" />
        <path d="M-38 -40 L-2 -40 M-38 -36 L-2 -36" stroke={CLR.line} strokeWidth="0.8" opacity="0.6" />
        {/* lower waist */}
        <rect x="-18" y="-36" width="6" height="28" fill="url(#vg-steel-dark)" stroke={CLR.line} strokeWidth="1" />

        {/* glowing ingot on the anvil */}
        <g className="flicker">
          <path d="M-30 -48 L-6 -48 L-4 -42 L-32 -42 Z" fill={CLR.emberHi} stroke={CLR.ember} strokeWidth="1" />
          <path d="M-18 -48 L-18 -42" stroke={CLR.boneDim} strokeWidth="1" opacity="0.7" />
        </g>
      </g>

      {/* strike sparks — off the ingot */}
      {[
        [-16, -44, -18], [-24, -46, -24], [-8, -42, -14], [-20, -50, -28], [-12, -38, -10],
      ].map(([dx, dy, fx], i) => (
        <circle
          key={i}
          className="act-spark"
          cx={dx}
          cy={dy}
          r={1.8}
          fill={i % 2 ? CLR.emberHi : CLR.bone}
          style={{ transformOrigin: `${dx}px ${dy}px`, '--fx': `${fx}px` } as CSSProperties}
        />
      ))}

      {/* furnace mouth */}
      <g className="act-forge">
        <path d="M10 2 C 12 -30 44 -30 46 -2 L 46 8 L 10 8 Z" fill={CLR.mid} stroke={CLR.stroke} strokeWidth="1.5" />
        {/* arch inner */}
        <path d="M16 4 C 18 -20 40 -20 42 2 Z" fill={CLR.far} />
        <g className="flicker">
          <ellipse cx="29" cy="-6" rx="10" ry="7" fill={CLR.ember} opacity="0.9" />
          <ellipse cx="27" cy="-6" rx="6" ry="4" fill="#ffc27a" opacity="0.85" />
        </g>
        {/* brick lines */}
        <path d="M14 2 L44 2 M12 6 L46 6" stroke={CLR.stroke} strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* furnace flare on strike */}
      <ellipse
        className="act-flare"
        cx="30"
        cy="-10"
        rx="18"
        ry="16"
        fill="url(#vg-ember-glow)"
        opacity="0"
        style={{ transformOrigin: '30px -10px' }}
        aria-hidden="true"
      />
    </g>
  );
}