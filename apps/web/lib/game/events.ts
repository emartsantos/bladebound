export type EventKind = 'world_boss' | 'crafting' | 'gathering' | 'summoning';

export interface GameEventDefinition {
  id: string;
  name: string;
  kind: EventKind;
  startsAt: number;
  endsAt: number;
  description: string;
  cadence: string;
  rewardSummary: string;
  playable: boolean;
  rewards?: { bhc: number; items: Array<{ itemId: string; quantity: number }>; firstVictoryItemId?: string };
}

export interface EventParticipation {
  attemptsByDay: Record<string, boolean>;
  victories: number;
  featuredRewardClaimed: boolean;
  history: Array<{ day: string; victory: boolean; createdAt: number }>;
}

export interface EventFrameworkState {
  participation: Record<string, EventParticipation>;
}

const utc = (month: number, day: number) => Date.UTC(2026, month - 1, day);

export const GAME_EVENTS: GameEventDefinition[] = [
  {
    id: 'ember-colossus-2026', name: 'The Ember Colossus', kind: 'world_boss',
    startsAt: utc(9, 9), endsAt: utc(9, 16), cadence: 'One free attempt per UTC day', playable: true,
    description: 'Break the walking furnace before its core consumes the Frontier.',
    rewardSummary: '0.25 BHC · 10 Coal · 5 Iron Ore · Epic Greatsword on first victory',
    rewards: { bhc: 0.25, items: [{ itemId: 'coal', quantity: 10 }, { itemId: 'iron_ore', quantity: 5 }], firstVictoryItemId: 'ember_colossus_greatsword' },
  },
  {
    id: 'forgefire-festival-2026', name: 'Forgefire Festival', kind: 'crafting',
    startsAt: utc(9, 23), endsAt: utc(9, 30), cadence: 'Seven-day crafting celebration', playable: false,
    description: 'Complete smithing objectives while the master forges burn white-hot.',
    rewardSummary: 'Forge Cores · boosted rarity odds · hammer cosmetic',
  },
  {
    id: 'goblin-gold-rush-2026', name: 'Goblin Gold Rush', kind: 'gathering',
    startsAt: utc(10, 7), endsAt: utc(10, 14), cadence: 'Seven-day regional hunt', playable: false,
    description: 'Treasure goblins spill into every unlocked region.',
    rewardSummary: 'Gold caches · rare materials · marketplace vouchers',
  },
  {
    id: 'frostbound-hunt-2026', name: 'Frostbound Hunt', kind: 'world_boss',
    startsAt: utc(10, 21), endsAt: utc(10, 28), cadence: 'One free attempt per UTC day', playable: false,
    description: 'A frost wyrm descends from the northern peaks.',
    rewardSummary: 'Epic frost armor · BHC · Mithril',
  },
];

export const EVENT_BY_ID = Object.fromEntries(GAME_EVENTS.map((event) => [event.id, event])) as Record<string, GameEventDefinition>;
export const EMBER_EVENT_ID = 'ember-colossus-2026';

export function eventDay(now = Date.now()): string { return new Date(now).toISOString().slice(0, 10); }
export function eventStatus(event: GameEventDefinition, now = Date.now()): 'upcoming' | 'active' | 'expired' {
  return now < event.startsAt ? 'upcoming' : now < event.endsAt ? 'active' : 'expired';
}
export function activeEvents(now = Date.now()): GameEventDefinition[] { return GAME_EVENTS.filter((event) => eventStatus(event, now) === 'active'); }
export function upcomingEvents(now = Date.now()): GameEventDefinition[] { return GAME_EVENTS.filter((event) => eventStatus(event, now) === 'upcoming'); }
export function expiredEvents(now = Date.now()): GameEventDefinition[] { return GAME_EVENTS.filter((event) => eventStatus(event, now) === 'expired'); }
export function emptyParticipation(): EventParticipation {
  return { attemptsByDay: {}, victories: 0, featuredRewardClaimed: false, history: [] };
}
