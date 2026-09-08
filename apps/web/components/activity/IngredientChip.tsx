'use client';

import { LuCornerDownRight } from 'react-icons/lu';
import type { ActionIngredient } from '@/lib/skills-meta';
import { ACTIVITY_BY_ID, producingActivityFor, type ActivityId } from './activity-config';

/**
 * Ingredient badge for a craft recipe. Shows the required amount against what
 * the satchel holds (have/need). When the item is produced by an activity in
 * the hub, the badge is a button that jumps the player to that Trade skill.
 */
export function IngredientChip({
  ing,
  have,
  onNavigate,
}: {
  ing: ActionIngredient;
  have: number;
  onNavigate?: (id: ActivityId) => void;
}) {
  const short = have < ing.quantity;
  const source = producingActivityFor(ing.itemId);
  const clickable = Boolean(source && onNavigate);

  const body = (
    <>
      {ing.name}
      <span className={`ml-auto font-mono tabular-nums ${short ? 'text-dangerBright' : 'text-stone/80'}`}>
        {have}/{ing.quantity}
      </span>
      {clickable && <LuCornerDownRight className="h-3 w-3 shrink-0 opacity-70" />}
    </>
  );

  const cls = `inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] transition-colors ${
    short
      ? 'border-danger/40 bg-charcoal text-dangerBright'
      : 'border-iron/50 bg-charcoal text-stone'
  } ${clickable ? 'cursor-pointer hover:border-bronze/50 hover:text-bone' : ''}`;

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onNavigate?.(source!)}
        aria-label={`Get ${ing.name} from ${ACTIVITY_BY_ID[source!].name}`}
        className={cls}
      >
        {body}
      </button>
    );
  }
  return <span className={cls}>{body}</span>;
}