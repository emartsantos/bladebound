'use client';

import { VisualDefs } from './VisualDefs';
import type { VisualProps } from './visual-palette';
import { WarriorRig } from './characters/WarriorRig';
import { WolfRig } from './enemies/WolfRig';

export type CharacterKind = 'warrior' | 'wolf';

interface CharacterVisualProps extends VisualProps {
  character: CharacterKind;
  facing?: 'left' | 'right';
}

const RIGS: Record<CharacterKind, (ctx: { direction?: 'left' | 'right' }) => React.ReactElement> = {
  warrior: (ctx) => <WarriorRig direction={ctx.direction} />,
  wolf: (ctx) => <WolfRig direction={ctx.direction} />,
};

/**
 * State-driven character/enemy visual. Everything animates via CSS
 * (segments/rig-*, driven by `data-state` on the root group) — this
 * component never computes game outcomes.
 */
export function CharacterVisual({
  character,
  state,
  direction = 'right',
  facing,
  weapon,
  rarity,
  className,
}: CharacterVisualProps) {
  const resolvedDirection = facing ?? direction;
  const Rig = RIGS[character];
  const mirrored = character === 'warrior' ? resolvedDirection === 'left' : resolvedDirection === 'right';

  return (
    <svg
      className={className}
      viewBox="-80 -280 160 320"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <VisualDefs />
      <g
        data-state={state}
        data-character={character}
        className={`visual-root visual-root--${character}`}
      >
        <g className={mirrored ? 'visual-mirror' : ''}>
          {Rig({ direction: resolvedDirection })}
        </g>
      </g>
    </svg>
  );
}