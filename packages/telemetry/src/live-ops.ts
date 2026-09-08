export interface LiveOpsEvent {
  id: string;
  name: string;
  startsAt: number;
  endsAt: number;
  enabled?: boolean;
  multipliers?: Record<string, number>;
  itemRotations?: Array<{ itemId: string; quantity?: number }>;
  unlockRegions?: string[];
}

export function isEventActive(event: LiveOpsEvent, now: number): boolean {
  if (event.enabled === false) return false;
  return now >= event.startsAt && now <= event.endsAt;
}

export function getActiveEvents(events: LiveOpsEvent[], now: number): LiveOpsEvent[] {
  return events
    .filter((event) => isEventActive(event, now))
    .sort((a, b) => a.startsAt - b.startsAt);
}

export function getActiveMultipliers(events: LiveOpsEvent[], now: number): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const event of getActiveEvents(events, now)) {
    for (const [key, factor] of Object.entries(event.multipliers ?? {})) {
      merged[key] = Math.max(merged[key] ?? 1, factor);
    }
  }
  return merged;
}

export function applyMultipliers(
  base: Record<string, number>,
  events: LiveOpsEvent[],
  now: number,
): Record<string, number> {
  const factors = getActiveMultipliers(events, now);
  const out: Record<string, number> = { ...base };
  for (const [key, factor] of Object.entries(factors)) {
    out[key] = (out[key] ?? 0) * factor;
  }
  return out;
}

export function getRotatedItems(events: LiveOpsEvent[], now: number): Array<{ itemId: string; quantity?: number }> {
  const items: Array<{ itemId: string; quantity?: number }> = [];
  for (const event of getActiveEvents(events, now)) {
    items.push(...(event.itemRotations ?? []));
  }
  return items;
}

export function getUnlockedRegions(events: LiveOpsEvent[], now: number): string[] {
  const regions = new Set<string>();
  for (const event of getActiveEvents(events, now)) {
    for (const region of event.unlockRegions ?? []) {
      regions.add(region);
    }
  }
  return [...regions];
}