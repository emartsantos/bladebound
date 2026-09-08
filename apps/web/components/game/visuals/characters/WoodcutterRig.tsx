'use client';

import { GroundShadow } from '../VisualDefs';
import { CLR } from '../visual-palette';
import type { VisualProps } from '../visual-palette';

interface WorkerContext {
  direction?: 'left' | 'right';
}

/**
 * Lean frontier woodcutter rig. Tall, narrow tunic silhouette with an
 * arming cap, rope belt and worn boots. Felling axe carried two-handed,
 * raised high on the `.act-axe` group (origin at the forward grip) and
 * driven down onto the trunk on activity-impact.
 */
export function WoodcutterRig({ direction = 'right' }: WorkerContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="woodcutter" className="act-worker">
      <GroundShadow rx={28} ry={7} />

      {/* rear leg — wide stance */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(-24)}px -22px` }}>
        <rect x={facing(-30)} y="-58" width="13" height="52" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(-24)}px -6px` }}>
          <path d={`M${facing(-31)} -10 L${facing(-19)} -10 L${facing(-14)} -2 L${facing(-31)} -2 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* front leg */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(22)}px -22px` }}>
        <rect x={facing(14)} y="-58" width="14" height="52" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
        <g className="rig-boot" style={{ transformOrigin: `${facing(22)}px -6px` }}>
          <path d={`M${facing(13)} -10 L${facing(25)} -10 L${facing(31)} -2 L${facing(13)} -2 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="1" />
        </g>
      </g>

      {/* upper body */}
      <g className="act-body" style={{ transformOrigin: `${facing(0)}px -16px` }}>
        {/* tunic */}
        <path d={`M${facing(-22)} -150 L${facing(-16)} -60 L${facing(16)} -60 L${facing(22)} -150 C ${facing(10)} -160 ${facing(-10)} -160 ${facing(-22)} -150 Z`} fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.3" />
        <path d={`M${facing(-18)} -140 L${facing(-12)} -64 M${facing(18)} -140 L${facing(12)} -64`} stroke={CLR.line} strokeWidth="0.8" opacity="0.5" />
        {/* rope belt + buckle */}
        <rect x={facing(-18)} y="-66" width="36" height="6" rx="2" fill={CLR.leather} stroke={CLR.line} strokeWidth="1" />
        <rect x={facing(0)} y="-69" width="7" height="12" rx="1" fill={CLR.bone} opacity="0.85" />
        {/* shoulders */}
        <path d={`M${facing(-24)} -148 C ${facing(-10)} -162 ${facing(10)} -162 ${facing(24)} -148 Z`} fill={CLR.chainDark} stroke={CLR.line} strokeWidth="1.2" />

        {/* head */}
        <g className="act-head" style={{ transformOrigin: `${facing(0)}px -160px` }}>
          <rect x={facing(-11)} y="-158" width="22" height="16" rx="4" fill={CLR.chainDark} />
          {/* face */}
          <path d={`M${facing(-14)} -168 C ${facing(-6)} -182 ${facing(6)} -182 ${facing(14)} -168 Z`} fill="url(#vg-skin)" stroke={CLR.line} strokeWidth="1" />
          {/* arming cap */}
          <path d={`M${facing(-15)} -176 C ${facing(-9)} -192 ${facing(9)} -192 ${facing(15)} -176 Z`} fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.2" />
          <path d={`M${facing(-14)} -176 L${facing(14)} -176`} stroke={CLR.leather} strokeWidth="2.5" />
          {/* eye shadow */}
          <path d={`M${facing(-4)} -172 L${facing(10)} -172 L${facing(4)} -166 L${facing(-8)} -168 Z`} fill={CLR.mid} />
        </g>

        {/* rear arm */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(-28)}px -140px` }}>
          <rect x={facing(-36)} y="-152" width="13" height="46" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(-30)}px -106px` }}>
            <rect x={facing(-36)} y="-112" width="11" height="34" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
            <circle cx={facing(-28)} cy="-80" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          </g>
        </g>

        {/* front arm */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(28)}px -142px` }}>
          <rect x={facing(24)} y="-152" width="13" height="46" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(28)}px -106px` }}>
            <rect x={facing(22)} y="-112" width="12" height="36" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
            <circle cx={facing(22)} cy="-78" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* felling axe */}
      <g className="act-tool act-axe" style={{ transformOrigin: `${facing(20)}px -84px` }}>
        {/* handle */}
        <rect x={facing(18)} y="-184" width="4" height="104" rx="2" fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="0.9" />
        <rect x={facing(14)} y="-92" width="10" height="13" rx="2" fill={CLR.leather} stroke={CLR.line} strokeWidth="0.8" />
        <circle cx={facing(20)} cy="-72" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
        {/* axe blade — broad, curved */}
        <path
          d={`M${facing(14)} -184 C ${facing(2)} -176 ${facing(-4)} -162 ${facing(-2)} -148 C ${facing(10)} -156 ${facing(22)} -158 ${facing(32)} -152 L${facing(30)} -168 C ${facing(26)} -178 ${facing(22)} -184 ${facing(14)} -184 Z`}
          fill="url(#vg-steel)"
          stroke={CLR.line}
          strokeWidth="1.2"
        />
        <path d={`M${facing(2)} -150 C ${facing(12)} -156 ${facing(24)} -156 ${facing(32)} -150`} fill="none" stroke={CLR.boneDim} strokeWidth="1" opacity="0.7" />
      </g>
    </g>
  );
}

export type WoodcutterVisualProps = VisualProps & { facing?: 'left' | 'right' };