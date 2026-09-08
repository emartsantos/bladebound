'use client';

import { GroundShadow } from '../VisualDefs';
import { CLR } from '../visual-palette';
import type { VisualProps } from '../visual-palette';

interface WorkerContext {
  direction?: 'left' | 'right';
}

/**
 * Anvil smith rig. Brawler build with a heavy leather apron, forearm
 * bracers and hammer in the raised lead arm. The lead arm shares the
 * `.act-hammer` group (origin at the shoulder) so the whole arm + hammer
 * wheel down onto the anvil on activity-impact, while the off-hand rests
 * on the hip.
 */
export function SmithRig({ direction = 'right' }: WorkerContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="smith" className="act-worker">
      <GroundShadow rx={30} ry={7} />

      {/* rear leg */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(-22)}px -20px` }}>
        <rect x={facing(-28)} y="-54" width="14" height="48" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(-22)}px -6px` }}>
          <path d={`M${facing(-29)} -10 L${facing(-18)} -10 L${facing(-13)} -2 L${facing(-29)} -2 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* front leg */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(18)}px -20px` }}>
        <rect x={facing(12)} y="-54" width="15" height="48" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(18)}px -6px` }}>
          <path d={`M${facing(11)} -10 L${facing(23)} -10 L${facing(29)} -2 L${facing(11)} -2 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* upper body */}
      <g className="act-body" style={{ transformOrigin: `${facing(0)}px -14px` }}>
        {/* tunic sleeves under apron */}
        <path d={`M${facing(-26)} -118 C ${facing(-12)} -132 ${facing(14)} -132 ${facing(28)} -118 L${facing(20)} -52 L${facing(-20)} -52 Z`} fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.2" />
        {/* apron */}
        <path d={`M${facing(-23)} -120 L${facing(-12)} -54 L${facing(14)} -54 L${facing(25)} -120 C ${facing(12)} -130 ${facing(-12)} -130 ${facing(-23)} -120 Z`} fill="url(#vg-leather)" stroke={CLR.line} strokeWidth="1.3" />
        <path d={`M${facing(-18)} -104 L${facing(-6)} -58 M${facing(20)} -104 L${facing(8)} -58`} stroke={CLR.line} strokeWidth="0.8" opacity="0.5" />
        {/* chest strap */}
        <path d={`M${facing(-23)} -120 L${facing(-30)} -132 M${facing(25)} -120 L${facing(32)} -132`} stroke={CLR.leatherDark} strokeWidth="3" />
        {/* belt */}
        <rect x={facing(-22)} y="-56" width="46" height="7" rx="2" fill={CLR.leatherDark} stroke={CLR.bronze} strokeWidth="1" />
        <rect x={facing(-2)} y="-58" width="5" height="11" rx="1" fill={CLR.bronze} />

        {/* head */}
        <g className="act-head" style={{ transformOrigin: `${facing(0)}px -124px` }}>
          <rect x={facing(-11)} y="-134" width="22" height="16" rx="4" fill={CLR.chainDark} />
          {/* face */}
          <path d={`M${facing(-14)} -146 C ${facing(-6)} -162 ${facing(6)} -162 ${facing(14)} -146 Z`} fill="url(#vg-skin)" stroke={CLR.line} strokeWidth="1" />
          {/* beard */}
          <path d={`M${facing(-11)} -150 C ${facing(-8)} -160 ${facing(10)} -160 ${facing(12)} -150 L${facing(8)} -146 C ${facing(4)} -152 ${facing(-4)} -152 ${facing(-8)} -146 Z`} fill={CLR.chainDark} stroke={CLR.line} strokeWidth="0.8" />
          {/* hair + sweat glint */}
          <path d={`M${facing(-15)} -152 C ${facing(-8)} -168 ${facing(8)} -168 ${facing(15)} -152 Z`} fill={CLR.chainDark} stroke={CLR.line} strokeWidth="1.1" />
          <path d={`M${facing(4)} -160 L${facing(10)} -156`} stroke={CLR.boneDim} strokeWidth="1" />
        </g>

        {/* off-hand on hip */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(-28)}px -116px` }}>
          <rect x={facing(-36)} y="-122" width="13" height="40" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(-30)}px -84px` }}>
            <rect x={facing(-36)} y="-86" width="11" height="30" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
            <circle cx={facing(-30)} cy="-58" r="6" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* lead arm + hammer — wheels down at the shoulder */}
      <g className="act-tool act-hammer" style={{ transformOrigin: `${facing(22)}px -126px` }}>
        {/* upper arm */}
        <rect x={facing(18)} y="-162" width="13" height="38" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        {/* forearm raised */}
        <g className="rig-forearm" style={{ transformOrigin: `${facing(24)}px -126px` }}>
          <rect x={facing(20)} y="-182" width="12" height="36" rx="6" fill={CLR.leather} stroke={CLR.line} strokeWidth="1.1" />
          <rect x={facing(20)} y="-182" width="12" height="14" rx="3" fill={CLR.leatherDark} />
          {/* fist */}
          <circle cx={facing(27)} cy="-188" r="7" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          {/* hammer handle */}
          <rect x={facing(25)} y="-226" width="4" height="42" rx="2" fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="0.9" />
          {/* hammer head */}
          <rect x={facing(17)} y="-232" width="22" height="13" rx="2.5" fill="url(#vg-steel-dark)" stroke={CLR.line} strokeWidth="1.1" />
          <path d={`M${facing(19)} -232 L${facing(19)} -220 M${facing(26)} -232 L${facing(26)} -220 M${facing(33)} -232 L${facing(33)} -220`} stroke={CLR.boneDim} strokeWidth="0.8" opacity="0.5" />
        </g>
      </g>
    </g>
  );
}

export type SmithVisualProps = VisualProps & { facing?: 'left' | 'right' };