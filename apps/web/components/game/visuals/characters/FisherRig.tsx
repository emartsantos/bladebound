'use client';

import { GroundShadow } from '../VisualDefs';
import { CLR } from '../visual-palette';
import type { VisualProps } from '../visual-palette';

interface WorkerContext {
  direction?: 'left' | 'right';
}

/**
 * Seated river angler rig — a hunched, hooded silhouette resting on a
 * shore rock, rod held out over the water. Distinct from the standing
 * gathering rigs. The whole rod + line + bobber lives on the `.act-rod`
 * group (origin at the grip): it dips on bite (activity-impact) and
 * lifts on catch (activity-recovery).
 */
export function FisherRig({ direction = 'right' }: WorkerContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="fisher" className="act-worker">
      <GroundShadow rx={40} ry={7} />

      {/* shore rock */}
      <path
        d={`M${facing(-46)} -12 C ${facing(-40)} -34 ${facing(8)} -42 ${facing(34)} -22 C ${facing(52)} -8 ${facing(44)} 4 ${facing(30)} 2 L${facing(-44)} 2 Z`}
        fill={CLR.far}
        stroke={CLR.stroke}
        strokeWidth="1.5"
      />
      <path d={`M${facing(-34)} -18 L${facing(-2)} -30 M${facing(-16)} -12 L${facing(8)} -24`} stroke={CLR.line} strokeWidth="1" opacity="0.5" />

      {/* seated body — draped cloak covers torso + thighs */}
      <g className="act-body" style={{ transformOrigin: `${facing(0)}px -30px` }}>
        {/* hood */}
        <path
          d={`M${facing(-26)} -132 C ${facing(-30)} -162 ${facing(-4)} -176 ${facing(10)} -166 C ${facing(20)} -158 ${facing(24)} -146 ${facing(22)} -130 C ${facing(14)} -142 ${facing(-8)} -142 ${facing(-26)} -132 Z`}
          fill="url(#vg-cloth)"
          stroke={CLR.line}
          strokeWidth="1.4"
        />
        {/* hood opening + dim face */}
        <path d={`M${facing(-12)} -150 C ${facing(-6)} -160 ${facing(8)} -158 ${facing(12)} -146 C ${facing(6)} -150 ${facing(-2)} -150 ${facing(-12)} -150 Z`} fill={CLR.far} />
        <circle cx={facing(2)} cy="-146" r="1.6" fill={CLR.ember} opacity="0.5" />
        {/* drape over torso */}
        <path
          d={`M${facing(-26)} -130 C ${facing(-34)} -96 ${facing(-30)} -62 ${facing(-16)} -40 L${facing(10)} -40 C ${facing(22)} -56 ${facing(26)} -92 ${facing(22)} -128 Z`}
          fill="url(#vg-cloth)"
          stroke={CLR.line}
          strokeWidth="1.3"
        />
        <path d={`M${facing(-24)} -110 C ${facing(-8)} -96 ${facing(12)} -96 ${facing(20)} -110`} stroke={CLR.line} strokeWidth="0.9" opacity="0.6" />
        {/* hood hem */}
        <path d={`M${facing(-24)} -128 C ${facing(-8)} -138 ${facing(12)} -136 ${facing(20)} -126`} fill="none" stroke={CLR.chainDark} strokeWidth="2.4" />

        {/* raised knees under the drape */}
        <path d={`M${facing(4)} -40 L${facing(22)} -58 L${facing(30)} -40 Z`} fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />

        {/* rod arms reaching forward */}
        <g className="rig-arm" style={{ transformOrigin: `${facing(10)}px -100px` }}>
          <rect x={facing(4)} y="-112" width="12" height="34" rx="6" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          <g className="rig-forearm" style={{ transformOrigin: `${facing(12)}px -80px` }}>
            <rect x={facing(6)} y="-86" width="11" height="30" rx="5" fill="url(#vg-cloth)" stroke={CLR.line} strokeWidth="1.1" />
          </g>
        </g>
      </g>

      {/* rod + line + bobber */}
      <g className="act-tool act-rod" style={{ transformOrigin: `${facing(16)}px -96px` }}>
        {/* shaft (slight bend) */}
        <path
          d={`M${facing(16)} -96 C ${facing(70)} -112 ${facing(110)} -118 ${facing(150)} -122`}
          fill="none"
          stroke={CLR.leather}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d={`M${facing(16)} -96 C ${facing(70)} -110 ${facing(110)} -116 ${facing(148)} -120`} fill="none" stroke={CLR.line} strokeWidth="0.6" />
        {/* butt */}
        <path d={`M${facing(12)} -98 L${facing(4)} -102 C ${facing(2)} -100 ${facing(2)} -96 ${facing(4)} -94 Z`} fill={CLR.leatherDark} stroke={CLR.line} strokeWidth="0.7" />
        {/* line to bobber */}
        <path d={`M${facing(150)} -122 L${facing(138)} -36`} stroke={CLR.boneDim} strokeWidth="1" />
        {/* hand grip */}
        <circle cx={facing(18)} cy="-94" r="6.5" fill={CLR.skin} stroke={CLR.line} strokeWidth="1" />
        {/* bobber */}
        <g className="act-bob" style={{ transformOrigin: `${facing(138)}px -34px` }}>
          <ellipse cx={facing(138)} cy="-36" rx="3.4" ry="4.2" fill="url(#vg-ember-glow)" stroke={CLR.ember} strokeWidth="0.8" />
          <ellipse cx={facing(138)} cy="-40" rx="2.4" ry="2.6" fill={CLR.bone} opacity="0.9" />
        </g>
      </g>
    </g>
  );
}

export type FisherVisualProps = VisualProps & { facing?: 'left' | 'right' };