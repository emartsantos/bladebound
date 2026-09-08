'use client';

import { ACTIVITIES, type ActivityId } from './activity-config';

/**
 * Activity selector rail beneath the cinematic hero. The active
 * activity gets a stronger metallic border, restrained warm
 * illumination and a thin inset highlight. Inactive rows stay dim.
 */
export function ActivitySelector({
  value,
  onChange,
}: {
  value: ActivityId;
  onChange: (id: ActivityId) => void;
}) {
  return (
    <nav aria-label="Activities" className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6">
      {ACTIVITIES.map((a) => {
        const selected = a.id === value;
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-pressed={selected}
            className={`group relative flex flex-col items-start gap-1 overflow-hidden rounded-md border px-3 py-2.5 text-left transition-colors duration-150 ${
              selected
                ? 'border-bronze/70 bg-gradient-to-b from-raised to-charcoal shadow-[inset_0_1px_0_rgba(216,201,168,0.08),inset_0_0_0_1px_rgba(176,135,84,0.12)]'
                : 'border-iron/70 bg-charcoal/60 text-mist hover:border-steel hover:bg-raised/70 hover:text-bone'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${
                selected ? 'border-ember/50 bg-ember/15 text-emberLight' : 'border-iron/70 bg-charcoal text-stone group-hover:text-bronze'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className={`text-xs font-semibold tracking-wide ${selected ? 'text-parchment' : 'text-mist'}`}>{a.name}</span>
            <span className="hidden text-[10px] text-stone md:block">{a.tagline}</span>
            {selected && <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-ember/0 via-ember/60 to-ember/0" />}
          </button>
        );
      })}
    </nav>
  );
}