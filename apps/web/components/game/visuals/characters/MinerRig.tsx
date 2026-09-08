'use client';

import { GroundShadow } from '../VisualDefs';
import { CLR } from '../visual-palette';
import type { VisualProps } from '../visual-palette';

interface WorkerContext {
  direction?: 'left' | 'right';
}

/**
 * Stocky mine-worker rig. Distinct silhouette: deep turtle-neck coif,
 * domed iron cap with a dim lamp, broad leather apron, heavy boots.
 * The double-pointed pick is gripped two-handed and swings on the
 * `.act-pick` group (origin at the grip). Runs in an ActivityRig frame —
 * pelvis near (0,-6), +x is forward.
 */
export function MinerRig({ direction = 'right' }: WorkerContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="miner" className="act-worker">
      <GroundShadow rx={30} ry={7} />

      {/* rear leg */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(-22)}px -20px` }}>
        <rect x={facing(-28)} y="-52" width="14" height="46" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(-22)}px -6px` }}>
          <path d={`M${facing(-29)} -8 L${facing(-18)} -8 L${facing(-13)} -1 L${facing(-29)} -1 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* front leg */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(16)}px -20px` }}>
        <rect x={facing(10)} y="-52" width="15" height="48" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(18)}px -6px` }}>
          <path d={`M${facing(9)} -8 L${facing(22)} -8 L${facing(27)} -1 L${facing(9)} -1 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* upper body (leans on strike via data-state CSS) */}
      <g className="act-body" style={{ transformOrigin: `${facing(0)}px -14px` }}>
        {/* coif + shoulders */}
        <path d={`M${facing(-30)} -114 C ${facing(-16)} -130 ${facing(16)} -130 ${facing(30)} -114 L${facing(22)} -52 L${facing(-22)} -52 Z`} fill="url(#vg-chain)" stroke={CLR.line} strokeWidth="1.2" />
        {/* apron */}
        <path d={`M${facing(-26)} -116 L${facing(-14)} -52 L${facing(14)} -52 L${facing(26)} -116 Z`} fill="url(#vg-leather)" stroke={CLR.line} strokeWidth="1.3" />
        <path d={`M${facing(-14)} -116 L${facing(-6)} -52 M${facing(14)} -116 L${facing(6)} -52`} stroke={CLR.line} strokeWidth="0.8" opacity="0.5" />
        <path d={`M${facing(-20)} -92 L${facing(20)} -92 M${facing(-18)} -76 L${facing(18)} -76`} stroke={CLR.line} strokeWidth="1" opacity="0.45" />
        {/* apron bib strap */}
        <path d={`M${facing(-26)} -116 L${facing(-34)} -128 M${facing(26)} -116 L${facing(34)} -128`} stroke={CLR.leatherDark} strokeWidth="3" />
        {/* belt */}
        <rect x={facing(-24)} y="-54" width="48" height="7" rx="2" fill={CLR.leatherDark} stroke={CLR.bronze} strokeWidth="1" />
        <rect x={facing(-2)} y="-56" width="5" height="11" rx="1" fill={CLR.bronze} />

        {/* head */}
        <g className="act-head" style={{ transformOrigin: `${facing(0)}px -120px` }}>
          {/* neck */}
          <rect x={facing(-12)} y="-128" width="24" height="18" rx="4" fill={CLR.chainDark} />
          {/* face shadow */}
          <path d={`M${facing(-16)} -136 C ${facing(-8)} -152 ${facing(8)} -152 ${facing(16)} -136 Z`} fill="url(#vg-skin)" stroke={CLR.line} strokeWidth="1" />
          {/* iron cap */}
          <path d={`M${facing(-18)} -146 C ${facing(-12)} -166 ${facing(12)} -166 ${facing(16)} -146 Z`} fill="url(#vg-steel-dark)" stroke={CLR.line} strokeWidth="1.3" />
          {/* cap brim */}
          <path d={`M${facing(-19)} -150 L${facing(18)} -150 L${facing(17)} -146 L${facing(-18)} -146 Z`} fill={CLR.chainDark} stroke={CLR.line} strokeWidth="1" />
          {/* lamp */}
          <circle cx={facing(4)} cy="-140" r="2.2" fill={CLR.ember} className="flicker" />
          {/* brow shadow */}
          <path d={`M${facing(-6)} -140 L${facing(12)} -140 L${facing(6)} -132 L${facing(-12)} -136 Z`} fill={CLR.mid} />
        </g>

        {/* rear arm — grips handle from behind */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(-30)}px -118px` }}>
          <rect x={facing(-38)} y="-126" width="13" height="42" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(-32)}px -84px` }}>
            <rect x={facing(-38)} y="-88" width="11" height="30" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
            <circle cx={facing(-28)} cy="-60" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          </g>
        </g>

        {/* front arm — grips handle ahead */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(30)}px -116px` }}>
          <rect x={facing(28)} y="-124" width="13" height="40" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(30)}px -84px` }}>
            <rect x={facing(26)} y="-88" width="12" height="32" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
            <circle cx={facing(26)} cy="-58" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* pickaxe — swings around the forward grip */}
      <g className="act-tool act-pick" style={{ transformOrigin: `${facing(22)}px -64px` }}>
        {/* handle */}
        <rect x={facing(20)} y="-158" width="4" height="92" rx="2" fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="0.9" />
        <rect x={facing(17)} y="-70" width="8" height="12" rx="2" fill={CLR.leather} stroke={CLR.line} strokeWidth="0.8" />
        {/* double head */}
        <path
          d={`M${facing(2)} -160 C ${facing(-2)} -176 ${facing(10)} -188 ${facing(21)} -184 C ${facing(32)} -188 ${facing(44)} -176 ${facing(40)} -160 L${facing(33)} -150 C ${facing(30)} -160 ${facing(24)} -164 ${facing(21)} -162 C ${facing(18)} -164 ${facing(12)} -160 ${facing(9)} -150 Z`}
          fill="url(#vg-steel-dark)"
          stroke={CLR.line}
          strokeWidth="1.2"
        />
        {/* head ridge */}
        <path d={`M${facing(6)} -158 C ${facing(12)} -166 ${facing(30)} -166 ${facing(36)} -158`} fill="none" stroke={CLR.boneDim} strokeWidth="1" />
        {/* ore braced near the strike point */}
        <circle cx={facing(31)} cy="-166" r="2" fill={CLR.ember} opacity="0.85" />
      </g>
    </g>
  );
}

export type MinerVisualProps = VisualProps & { facing?: 'left' | 'right' };