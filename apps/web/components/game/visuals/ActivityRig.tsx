'use client';

import { VisualDefs } from './VisualDefs';
import { VIEWBOX, type CharacterState, type VisualProps } from './visual-palette';
import { MinerRig } from './characters/MinerRig';
import { WoodcutterRig } from './characters/WoodcutterRig';
import { FisherRig } from './characters/FisherRig';
import { SmithRig } from './characters/SmithRig';
import { OreNode } from './props/OreNode';
import { TreeNode } from './props/TreeNode';
import { WaterNode } from './props/WaterNode';
import { ForgeNode } from './props/ForgeNode';

export type ActivityKind = 'mining' | 'woodcutting' | 'fishing' | 'forge';

const WORKERS: Record<ActivityKind, (ctx: { direction?: 'left' | 'right' }) => React.ReactElement> = {
  mining: ({ direction }) => <MinerRig direction={direction} />,
  woodcutting: ({ direction }) => <WoodcutterRig direction={direction} />,
  fishing: ({ direction }) => <FisherRig direction={direction} />,
  forge: ({ direction }) => <SmithRig direction={direction} />,
};

const NODES: Record<ActivityKind, () => React.ReactElement> = {
  mining: () => <OreNode />,
  woodcutting: () => <TreeNode />,
  fishing: () => <WaterNode />,
  forge: () => <ForgeNode />,
};

/**
 * Map a scene event kind to an activity rig state. Pure presentation —
 * never influences the game.
 *
 *  mining / woodcutting / forge:   impact & rare → strike, complete → recover
 *  fishing:                        bite → strike (dip), catch/rare → recover (reel / splash)
 */
export function activityStateFor(kind: string | null | undefined, activity: ActivityKind): CharacterState {
  if (!kind) return 'activity-idle';
  if (!(activity in WORKERS)) return 'activity-idle';
  if (activity === 'fishing') {
    if (kind === 'bite') return 'activity-impact';
    if (kind === 'catch' || kind === 'rare' || kind === 'complete') return 'activity-recovery';
    return 'activity-idle';
  }
  if (kind === 'impact' || kind === 'rare') return 'activity-impact';
  if (kind === 'complete') return 'activity-recovery';
  return 'activity-idle';
}

interface ActivityRigProps extends VisualProps {
  activity: ActivityKind;
  /** remount key — pass the scene event key so animations replay per pulse */
  eventKey?: string | number;
  facing?: 'left' | 'right';
}

/**
 * A full activity vignette: a labouring worker on the left, the gathering
 * / crafting node it works on the right, all in one SVG. State is exposed
 * as `data-state` on the group; CSS at the correct transform origins drives
 * the tool swing, body lean, node shiver and particles.
 */
export function ActivityRig({
  activity,
  state,
  direction = 'right',
  facing,
  className,
  eventKey,
}: ActivityRigProps) {
  const resolvedDirection = facing ?? direction;
  const Worker = WORKERS[activity];
  const Node = NODES[activity];
  const animKey = eventKey ?? state;

  return (
    <svg
      className={className}
      viewBox={`${VIEWBOX.activityRig.x} ${VIEWBOX.activityRig.y} ${VIEWBOX.activityRig.width} ${VIEWBOX.activityRig.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <VisualDefs />
      <g className="visual-activity">
        <g key={animKey} data-activity={activity} data-state={state}>
          <g className="act-worker-wrap" transform="translate(-108 0)">
            {Worker({ direction: resolvedDirection })}
          </g>
          <g className="act-node-wrap" transform="translate(120 8)">
            {Node()}
          </g>
        </g>
      </g>
    </svg>
  );
}