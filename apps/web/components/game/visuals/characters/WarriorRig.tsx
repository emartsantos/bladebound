'use client';

import { GroundShadow } from '../VisualDefs';
import type { VisualProps } from '../visual-palette';

interface WarriorContext {
  direction?: 'left' | 'right';
}

/**
 * Rig group for a Bladehound Warrior — blackened-steel plate over leather
 * and chainmail, longsword in the guard hand. Components are separated so
 * CSS transforms at the correct joints drive idle, attack, hit and defeat.
 * Origin: pelvis at (0,0); +y is up. Facing +x by default (mirror via CSS).
 */
export function WarriorRig({ direction = 'right' }: WarriorContext) {
  const facing = (x: number) => (direction === 'left' ? -x : x);

  return (
    <g data-rig="warrior" className="character">
      <GroundShadow />

      {/* rear cape */}
      <g className="seg-idle-rotate seg-idle-sway" style={{ transformOrigin: '0px 0px' }}>
        <path
          d="M8 4 C 34 10 60 18 52 6 C 46 -6 30 -20 18 -6 Z"
          fill="url(#vg-cloth)"
          stroke="#4a4540"
          strokeWidth="1"
          opacity="0.9"
          aria-label="cape"
        />
      </g>

      {/* rear leg (weight leg) */}
      <g className="rig-leg" style={{ transformOrigin: `${facing(-20)}px -10px` }}>
        <rect x={facing(-24)} y="-40" width="16" height="44" rx="6" fill="url(#vg-cloth)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
        <circle cx={facing(-23)} cy="-2" r="8" fill="url(#vg-chain)" />
        <g className="rig-lower-leg" style={{ transformOrigin: `${facing(-20)}px 4px` }}>
          <rect x={facing(-22)} y="4" width="14" height="40" rx="6" fill="url(#vg-steel-dark)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
          <g className="rig-foot" style={{ transformOrigin: `${facing(-20)}px 44px` }}>
            <path d={`M${facing(-20)} 44 L${facing(-6)} 56 L${facing(2)} 50 L${facing(-18)} 40 Z`} fill={CLR_LEGACY.line} stroke={CLR_LEGACY.line} strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* torso */}
      <g className="rig-torso seg-idle-breathe" style={{ transformOrigin: '0px -10px' }}>
        {/* chainmail coif over shoulders */}
        <path d={`M${facing(-26)} -44 C ${facing(-14)} -58 ${facing(10)} -60 ${facing(26)} -46 Z`} fill="url(#vg-chain)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
        {/* torso armor */}
        <path d={`M${facing(-24)} -44 L${facing(-18)} -96 C ${facing(-2)} -112 ${facing(16)} -104 ${facing(22)} -46 Z`} fill="url(#vg-steel-dark)" stroke={CLR_LEGACY.line} strokeWidth="1.4" />
        <path d={`M${facing(-18)} -96 C ${facing(-2)} -112 ${facing(16)} -104`} stroke={CLR_LEGACY.boneDim} strokeWidth="1.2" />
        <path d={`M${facing(-16)} -88 L${facing(14)} -88`} stroke={CLR_LEGACY.line} strokeWidth="1" opacity="0.5" />
        {/* belt */}
        <rect x={facing(-22)} y="-46" width="44" height="8" rx="2" fill={CLR_LEGACY.leather} stroke={CLR_LEGACY.bronze} strokeWidth="1" />
        <rect x={facing(-2)} y="-48" width="5" height="12" rx="1" fill={CLR_LEGACY.bronze} />

        {/* head group */}
        <g className="rig-head seg-idle-nod" style={{ transformOrigin: `${facing(0)}px -96px` }}>
          {/* helmet */}
          <path d={`M${facing(-18)} -116 C ${facing(-8)} -136 ${facing(10)} -134 ${facing(16)} -118 Z`} fill="url(#vg-steel-dark)" stroke={CLR_LEGACY.line} strokeWidth="1.4" />
          <path d={`M${facing(-14)} -128 C ${facing(0)} -132 ${facing(12)} -128`} stroke={CLR_LEGACY.boneDim} strokeWidth="1.2" />
          <path d={`M${facing(-16)} -116 L${facing(-10)} -132 M${facing(12)} -120 L${facing(8)} -132`} stroke={CLR_LEGACY.line} strokeWidth="1" opacity="0.5" />
          {/* visor shadow */}
          <path d={`M${facing(-6)} -120 L${facing(10)} -120 L${facing(4)} -108 L${facing(-12)} -112 Z`} fill={CLR_LEGACY.far} stroke={CLR_LEGACY.line} strokeWidth="1" />
          {/* ember eye */}
          <circle cx={facing(2)} cy="-116" r="1.8" fill={CLR_LEGACY.ember} />
          {/* neck */}
          <rect x={facing(-9)} y="-100" width="18" height="14" rx="3" fill={CLR_LEGACY.chainDark} />
        </g>
      </g>

      {/* rear arm (shield side, resting) */}
      <g className="rig-rear-arm" style={{ transformOrigin: `${facing(-26)}px -96px` }}>
        <rect x={facing(-44)} y="-96" width="18" height="40" rx="8" fill="url(#vg-leather)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
        <g className="rig-rear-forearm" style={{ transformOrigin: `${facing(-42)}px -56px` }}>
          <rect x={facing(-48)} y="-58" width="14" height="30" rx="7" fill="url(#vg-leather)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
          <circle cx={facing(-45)} cy="-30" r="7" fill={CLR_LEGACY.skin} stroke={CLR_LEGACY.line} strokeWidth="1" />
        </g>
      </g>

      {/* front arm (guard hand) */}
      <g className="rig-front-arm seg-idle-armsway" style={{ transformOrigin: `${facing(26)}px -94px` }}>
        <g>
          <rect x={facing(40)} y="-94" width="17" height="40" rx="8" fill="url(#vg-leather)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
          <circle cx={facing(46)} cy="-56" r="9" fill="url(#vg-steel-dark)" stroke={CLR_LEGACY.line} strokeWidth="1" />
        </g>
        <g className="rig-front-forearm" style={{ transformOrigin: `${facing(44)}px -54px` }}>
          <rect x={facing(40)} y="-56" width="15" height="32" rx="7" fill="url(#vg-steel-dark)" stroke={CLR_LEGACY.line} strokeWidth="1.2" />
          <g className="rig-weapon" style={{ transformOrigin: `${facing(48)}px -26px` }}>
            <g className="rig-hand" style={{ transformOrigin: `${facing(46)}px -24px` }}>
              <circle cx={facing(48)} cy="-24" r="7" fill={CLR_LEGACY.skin} stroke={CLR_LEGACY.line} strokeWidth="1" />
              <path d={`M${facing(24)} -26 L${facing(28)} -24 L${facing(26)} -16 Z`} fill={CLR_LEGACY.skin} stroke={CLR_LEGACY.line} strokeWidth="0.8" />

              {/* LONGSWORD */}
              <g className="sword" style={{ transformOrigin: `${facing(48)}px -26px` }}>
                {/* grip */}
                <rect x={facing(44)} y="-26" width="7" height="18" rx="3" fill={CLR_LEGACY.leatherDark} />
                {/* crossguard */}
                <rect x={facing(38)} y="-44" width="13" height="5" rx="1.5" fill={CLR_LEGACY.bronze} stroke={CLR_LEGACY.bronze} strokeWidth="0.8" />
                <rect x={facing(42)} y="-22" width="9" height="4" rx="1.5" fill={CLR_LEGACY.bronze} />
                {/* pommel */}
                <circle cx={facing(47.5)} cy="-6" r="2.6" fill={CLR_LEGACY.bronze} />
                {/* blade */}
                <path d={`M${facing(45)} -46 L${facing(50)} -44 L${facing(50)} -118 L${facing(45)} -122 L${facing(42)} -114 Z`} fill="url(#vg-steel)" stroke={CLR_LEGACY.line} strokeWidth="1" />
                <path d={`M${facing(49)} -50 L${facing(49)} -112`} stroke={CLR_LEGACY.boneDim} strokeWidth="0.8" opacity="0.6" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

const CLR_LEGACY = {
  near: '#1f1b16',
  mid: '#171410',
  far: '#12100d',
  faint: '#100e0c',
  stroke: '#2e2a25',
  line: '#3a362f',
  bone: '#d8c9a8',
  boneDim: 'rgba(216,201,168,0.35)',
  bronze: '#b08754',
  ember: '#d4692f',
  emberHi: '#e08a44',
  verdant: '#87a76b',
  verdantDark: '#4a5a3c',
  chain: '#3a3835',
  chainDark: '#242321',
  leather: '#3d2e1f',
  leatherDark: '#2a1f14',
  skin: '#a8957a',
};

export type WarriorVisualProps = VisualProps & { facing?: 'left' | 'right' };