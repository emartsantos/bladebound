export const SECTION_ID = [
  'activities',
  'character',
  'adventure',
  'world',
  'skills',
  'inventory',
  'equipment',
  'crafting',
  'summoning',
  'dungeons',
  'quests',
  'tasks',
  'collections',
  'achievements',
  'shop',
  'marketplace',
  'settings',
] as const;

export type SectionId = (typeof SECTION_ID)[number];

export const MOBILE_TAB: Record<string, SectionId[]> = {
  primary: ['adventure', 'character', 'inventory'],
  overflow: ['skills', 'equipment'],
};

export const SECTION_META: Record<SectionId, { label: string }> = {
  activities: { label: 'The Hunt' },
  character: { label: 'Character' },
  adventure: { label: 'Adventure' },
  world: { label: 'World' },
  skills: { label: 'Skills' },
  inventory: { label: 'Inventory' },
  equipment: { label: 'Equipment' },
  crafting: { label: 'Crafting' },
  summoning: { label: 'Heroes' },
  dungeons: { label: 'Dungeons' },
  quests: { label: 'Quests' },
  tasks: { label: 'Tasks' },
  collections: { label: 'Collections' },
  achievements: { label: 'Achievements' },
  shop: { label: 'Shop' },
  marketplace: { label: 'Marketplace' },
  settings: { label: 'Settings' },
};

export const PRIMARY_SECTIONS: readonly SectionId[] = [
  'activities',
  'character',
  'adventure',
  'world',
];

export const PROGRESSION_SECTIONS: readonly SectionId[] = [
  'skills',
  'inventory',
  'equipment',
  'crafting',
  'summoning',
];

export const CONTENT_SECTIONS: readonly SectionId[] = [
  'dungeons',
  'quests',
  'tasks',
  'collections',
  'achievements',
];

export const SYSTEM_SECTIONS: readonly SectionId[] = ['shop', 'marketplace', 'settings'];
