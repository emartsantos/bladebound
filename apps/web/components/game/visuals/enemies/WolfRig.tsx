'use client';

import { CLR } from '../visual-palette';
import type { VisualProps } from '../visual-palette';

interface WolfContext {
  direction?: 'left' | 'right';
}

/**
 * Rig group for Bladehound Wild Wolf — mid-sized forest predator.
 * Anatomically: lean musculature, low stance, long muzzle,
 * large paws, weathered fur outline. Separate head/jaws/ears/tail
 * for subtle motion (breathing, head turn, tail swish, lunge).
 * Do NOT make it look like a dog, cartoon wolf, werewolf or giant beast.
 */
export function WolfRig({ direction = 'right' }: WolfContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="wolf" className="character">
      {/* tail — subtle base motion */}
      <g className="rig-tail" style={{ transformOrigin: `${facing(0)}px 48px` }}>
        <path
          d={`M${facing(-18)} 48 L${facing(-6)} 64 L${facing(8)} 56 Z`}
          fill="url(#vg-fur-dark)"
          stroke="#3a3530"
          strokeWidth="1"
        />
        <g className="rig-tip" style={{ transformOrigin: `${facing(0)}px 52px` }}>
          <path d="M0 8 L4 0 L8 8 Z" fill="url(#vg-fur)" />
        </g>
      </g>

      {/* rear leg (left leg = weight leg) */}
      <g className="rig-rear-leg" style={{ transformOrigin: `${facing(-20)}px -10px` }}>
        <rect x={facing(-24)} y="-40" width="18" height="48" rx="6" fill="url(#vg-fur-dark)" stroke="#3a3530" strokeWidth="1.2" />
        <ellipse cx={facing(-22)} cy="-10" rx="6" ry="4" fill="url(#vg-fur)" />
        <g className="rig-lower-leg" style={{ transformOrigin: `${facing(-20)}px 8px` }}>
          <rect x={facing(-22)} y="8" width="14" height="46" rx="6" fill="url(#vg-steel-dark)" stroke="#3a3530" strokeWidth="1.2" />
          <g className="rig-paw" style={{ transformOrigin: `${facing(-20)}px 50px` }}>
            <path d={`M${facing(-20)} 50 L${facing(-8)} 62 L${facing(8)} 58 L${facing(-8)} 50 Z`} fill="#3a3530" stroke="#3a3530" strokeWidth="1" />
            <ellipse cx={facing(-10)} cy="52" rx="8" ry="4" fill="rgba(0,0,0,0.2)" />
          </g>
        </g>
      </g>

      {/* body — lean, muscular, medium-length */}
      <g className="rig-body seg-idle-breath">
        <g className="rib-cage">
          <path d={`M${facing(-24)} -38 L${facing(-14)} -90 L${facing(14)} -90 L${facing(24)} -38 Z`} fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1.2" />
        </g>
        <g className="sway">
          <path d={`M${facing(-22)} -36 C ${facing(-12)} -54 ${facing(8)} -52 ${facing(22)} -34 Z`} fill="url(#vg-fur)" stroke={CLR.line} strokeWidth="1" />
          <path d={`M${facing(-16)} -30 C ${facing(-6)} -46 ${facing(6)} -46 ${facing(14)} -30 Z`} fill="url(#vg-fur)" stroke={CLR.line} strokeWidth="1" />
        </g>
        <g className="shoulders">
          <path d={`M${facing(-20)} -34 L${facing(-24)} -48 L${facing(-16)} -58 L${facing(12)} -52 L${facing(16)} -48 L${facing(20)} -34 Z`} fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1.2" />
        </g>
        {/* fur texture ridge */}
        <path d={`M${facing(-24)} -38 L${facing(-12)} -62 L${facing(12)} -62 L${facing(24)} -38 Z`} fill="url(#vg-fur)" opacity="0.7" />
      </g>

      {/* front leg (right leg) */}
      <g className="rig-front-leg" style={{ transformOrigin: `${facing(20)}px -10px` }}>
        <rect x={facing(-24)} y="-40" width="18" height="48" rx="6" fill="url(#vg-fur-dark)" stroke="#3a3530" strokeWidth="1.2" />
        <ellipse cx={facing(-22)} cy="-10" rx="6" ry="4" fill="url(#vg-fur)" />
        <g className="rig-lower-leg" style={{ transformOrigin: `${facing(20)}px 8px` }}>
          <rect x={facing(-22)} y="8" width="14" height="46" rx="6" fill="url(#vg-steel-dark)" stroke="#3a3530" strokeWidth="1.2" />
          <g className="rig-paw" style={{ transformOrigin: `${facing(-20)}px 50px` }}>
            <path d={`M${facing(-20)} 50 L${facing(-8)} 62 L${facing(8)} 58 L${facing(-8)} 50 Z`} fill="#3a3530" stroke="#3a3530" strokeWidth="1" />
            <ellipse cx={facing(-10)} cy="52" rx="8" ry="4" fill="rgba(0,0,0,0.2)" />
          </g>
        </g>
      </g>

      {/* neck + head */}
      <g className="rig-neck-head" style={{ transformOrigin: `${facing(0)}px -100px` }}>
        {/* neck muscle ridge */}
        <path d={`M${facing(-10)} -70 L${facing(-6)} -90 L${facing(6)} -90 L${facing(10)} -70 Z`} fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1" />
        {/* jaw hinge */}
        <rect x={facing(-12)} y="-98" width="24" height="16" rx="4" fill="url(#vg-leather)" stroke={CLR.line} strokeWidth="1" />
        {/* snout / muzzle */}
        <ellipse cx={facing(2)} cy="-100" rx="10" ry="8" fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1.5" />
        {/* nose}}
        <circle cx={facing(4)} cy="-104" r="2.8" fill="#3a3530" />
        {/* eye — amber predator gaze */}
        <circle cx={facing(6)} cy="-94" r="2.4" fill="#d4692f" />
        {/* ear left */}
        <path d={`M${facing(-8)} -90 L${facing(-2)} -110 L${facing(0)} -90 Z`} fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1" />
        {/* ear right */}
        <path d={`M${facing(8)} -90 L${facing(2)} -110 L${facing(4)} -90 Z`} fill="url(#vg-fur)" stroke="#3a3530" strokeWidth="1" />
        {/* fur texture on forehead */}
        <path d={`M${facing(-12)} -90 L${facing(-4)} -104 L${facing(4)} -104 L${facing(12)} -90 Z`} fill="url(#vg-fur)" opacity="0.6" />
      </g>

      {/* subtle shoulder blade / scapula markers */}
      <circle cx={facing(-14)} cy="-50" r="1.8" fill="#3a3530" opacity="0.4" />
      <circle cx={facing(14)} cy="-50" r="1.8" fill="#3a3530" opacity="0.4" />
    </g>
  );
}

export type WolfVisualProps = VisualProps & { facing?: 'left' | 'right' };