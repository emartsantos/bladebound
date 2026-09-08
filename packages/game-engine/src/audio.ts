// ─── AUDIO ARCHITECTURE ENGINE ──────────────────────────────────
// Phase 26: Sound event registry, volume management, playback
// intent resolution, and audio state management.
//
// Pure functions, no Web Audio / Howler / browser APIs.
// The UI layer consumes PlaybackIntents to actually play sounds.

import type {
  SoundEventKind,
  SoundEventDefinition,
  AudioVolumeSettings,
  AudioState,
  AudioPolicy,
  PlaybackIntent,
} from '@premium-rpg/shared-types';

import { DEFAULT_VOLUME_SETTINGS } from '@premium-rpg/shared-types';

// ─── SOUND EVENT REGISTRY ───────────────────────────────────────
// Every SoundEventKind maps to exactly one definition.
// src values are placeholder keys — the UI resolves them to actual files.

const SOUND_REGISTRY: Record<SoundEventKind, SoundEventDefinition> = {
  nav_click: {
    kind: 'nav_click', label: 'Navigation click', category: 'ui',
    defaultVolume: 0.4, src: 'sfx/ui/nav_click', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['ui', 'navigation'],
  },
  nav_transition: {
    kind: 'nav_transition', label: 'Section transition', category: 'ui',
    defaultVolume: 0.3, src: 'sfx/ui/nav_transition', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['ui', 'navigation'],
  },
  loot_acquire: {
    kind: 'loot_acquire', label: 'Item acquired', category: 'effects',
    defaultVolume: 0.5, src: 'sfx/combat/loot', polyphonic: true, maxInstances: 3,
    autoplay: false, priority: 2, tags: ['loot', 'item'],
  },
  loot_rare: {
    kind: 'loot_rare', label: 'Rare item drop', category: 'effects',
    defaultVolume: 0.7, src: 'sfx/combat/loot_rare', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 5, tags: ['loot', 'rare', 'epic'],
  },
  craft_complete: {
    kind: 'craft_complete', label: 'Crafting complete', category: 'effects',
    defaultVolume: 0.5, src: 'sfx/crafting/complete', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 2, tags: ['crafting'],
  },
  craft_start: {
    kind: 'craft_start', label: 'Crafting start', category: 'effects',
    defaultVolume: 0.3, src: 'sfx/crafting/start', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['crafting'],
  },
  combat_hit: {
    kind: 'combat_hit', label: 'Combat hit', category: 'effects',
    defaultVolume: 0.5, src: 'sfx/combat/hit', polyphonic: true, maxInstances: 4,
    autoplay: false, priority: 3, tags: ['combat'],
  },
  combat_miss: {
    kind: 'combat_miss', label: 'Combat miss', category: 'effects',
    defaultVolume: 0.25, src: 'sfx/combat/miss', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 1, tags: ['combat'],
  },
  combat_crit: {
    kind: 'combat_crit', label: 'Critical hit', category: 'effects',
    defaultVolume: 0.7, src: 'sfx/combat/crit', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 4, tags: ['combat', 'critical'],
  },
  combat_death_enemy: {
    kind: 'combat_death_enemy', label: 'Enemy defeated', category: 'effects',
    defaultVolume: 0.5, src: 'sfx/combat/enemy_death', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 3, tags: ['combat', 'death'],
  },
  combat_death_player: {
    kind: 'combat_death_player', label: 'Player defeated', category: 'effects',
    defaultVolume: 0.6, src: 'sfx/combat/player_death', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 5, tags: ['combat', 'death', 'danger'],
  },
  level_up: {
    kind: 'level_up', label: 'Level up', category: 'effects',
    defaultVolume: 0.8, src: 'sfx/progression/level_up', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 5, tags: ['progression', 'level'],
  },
  skill_level_up: {
    kind: 'skill_level_up', label: 'Skill level up', category: 'effects',
    defaultVolume: 0.6, src: 'sfx/progression/skill_up', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 4, tags: ['progression', 'skill'],
  },
  achievement_unlock: {
    kind: 'achievement_unlock', label: 'Achievement unlocked', category: 'effects',
    defaultVolume: 0.7, src: 'sfx/ui/achievement', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 5, tags: ['achievement'],
  },
  boss_appear: {
    kind: 'boss_appear', label: 'Boss encounter', category: 'music',
    defaultVolume: 0.8, src: 'sfx/music/boss_theme', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 6, tags: ['boss', 'combat', 'music'],
  },
  boss_defeat: {
    kind: 'boss_defeat', label: 'Boss defeated', category: 'effects',
    defaultVolume: 0.8, src: 'sfx/combat/boss_defeat', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 6, tags: ['boss', 'combat', 'victory'],
  },
  menu_open: {
    kind: 'menu_open', label: 'Menu open', category: 'ui',
    defaultVolume: 0.3, src: 'sfx/ui/menu_open', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['ui', 'menu'],
  },
  menu_close: {
    kind: 'menu_close', label: 'Menu close', category: 'ui',
    defaultVolume: 0.25, src: 'sfx/ui/menu_close', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['ui', 'menu'],
  },
  button_click: {
    kind: 'button_click', label: 'Button click', category: 'ui',
    defaultVolume: 0.3, src: 'sfx/ui/click', polyphonic: true, maxInstances: 3,
    autoplay: false, priority: 1, tags: ['ui'],
  },
  button_hover: {
    kind: 'button_hover', label: 'Button hover', category: 'ui',
    defaultVolume: 0.15, src: 'sfx/ui/hover', polyphonic: true, maxInstances: 3,
    autoplay: false, priority: 0, tags: ['ui'],
  },
  error: {
    kind: 'error', label: 'Error sound', category: 'ui',
    defaultVolume: 0.5, src: 'sfx/ui/error', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 4, tags: ['ui', 'error', 'danger'],
  },
  notification: {
    kind: 'notification', label: 'Notification', category: 'ui',
    defaultVolume: 0.4, src: 'sfx/ui/notification', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 3, tags: ['ui', 'notification'],
  },
  quest_complete: {
    kind: 'quest_complete', label: 'Quest complete', category: 'effects',
    defaultVolume: 0.6, src: 'sfx/progression/quest_complete', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 4, tags: ['quest', 'progression'],
  },
  region_discover: {
    kind: 'region_discover', label: 'Region discovered', category: 'effects',
    defaultVolume: 0.6, src: 'sfx/world/region_discover', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 4, tags: ['world', 'discovery'],
  },
  item_equip: {
    kind: 'item_equip', label: 'Item equipped', category: 'effects',
    defaultVolume: 0.35, src: 'sfx/inventory/equip', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 2, tags: ['item', 'equip'],
  },
  item_unequip: {
    kind: 'item_unequip', label: 'Item unequipped', category: 'effects',
    defaultVolume: 0.3, src: 'sfx/inventory/unequip', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 1, tags: ['item', 'unequip'],
  },
  gold_gain: {
    kind: 'gold_gain', label: 'Gold gained', category: 'effects',
    defaultVolume: 0.35, src: 'sfx/economy/gold_gain', polyphonic: true, maxInstances: 3,
    autoplay: false, priority: 2, tags: ['economy', 'gold'],
  },
  gold_spend: {
    kind: 'gold_spend', label: 'Gold spent', category: 'effects',
    defaultVolume: 0.3, src: 'sfx/economy/gold_spend', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 2, tags: ['economy', 'gold'],
  },
  heal: {
    kind: 'heal', label: 'Healing effect', category: 'effects',
    defaultVolume: 0.4, src: 'sfx/combat/heal', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 3, tags: ['combat', 'heal'],
  },
  buff_apply: {
    kind: 'buff_apply', label: 'Buff applied', category: 'effects',
    defaultVolume: 0.35, src: 'sfx/combat/buff', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 2, tags: ['combat', 'buff'],
  },
  buff_expire: {
    kind: 'buff_expire', label: 'Buff expired', category: 'effects',
    defaultVolume: 0.2, src: 'sfx/combat/buff_expire', polyphonic: true, maxInstances: 2,
    autoplay: false, priority: 1, tags: ['combat', 'buff'],
  },
  damage_number: {
    kind: 'damage_number', label: 'Damage number', category: 'effects',
    defaultVolume: 0.2, src: 'sfx/combat/damage_tick', polyphonic: true, maxInstances: 5,
    autoplay: false, priority: 1, tags: ['combat', 'damage'],
  },
  dungeon_enter: {
    kind: 'dungeon_enter', label: 'Enter dungeon', category: 'effects',
    defaultVolume: 0.5, src: 'sfx/dungeon/enter', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 3, tags: ['dungeon'],
  },
  dungeon_complete: {
    kind: 'dungeon_complete', label: 'Dungeon complete', category: 'effects',
    defaultVolume: 0.7, src: 'sfx/dungeon/complete', polyphonic: false, maxInstances: 1,
    autoplay: false, priority: 5, tags: ['dungeon', 'victory'],
  },
};

// ─── CATEGORY VOLUME MAPPING ────────────────────────────────────

function categoryVolumeKey(category: SoundEventDefinition['category']): 'master' | 'music' | 'effects' | 'ui' {
  switch (category) {
    case 'music': return 'music';
    case 'effects': return 'effects';
    case 'ui':
    case 'navigation': return 'ui';
    default: return 'effects';
  }
}

// ─── PUBLIC API ─────────────────────────────────────────────────

/** Get the raw definition for a sound event kind. */
export function getSoundDefinition(kind: SoundEventKind): SoundEventDefinition {
  return SOUND_REGISTRY[kind];
}

/** Get all registered sound event kinds. */
export function getAllSoundKinds(): SoundEventKind[] {
  return Object.keys(SOUND_REGISTRY) as SoundEventKind[];
}

/** Get sound definitions filtered by tag. */
export function getSoundsByTag(tag: string): SoundEventDefinition[] {
  return Object.values(SOUND_REGISTRY).filter((d) => d.tags.includes(tag));
}

/** Get sound definitions filtered by category. */
export function getSoundsByCategory(category: SoundEventDefinition['category']): SoundEventDefinition[] {
  return Object.values(SOUND_REGISTRY).filter((d) => d.category === category);
}

/**
 * Resolve the effective volume for a sound event, applying master,
 * category, event default, and policy overrides.
 */
export function resolveVolume(
  kind: SoundEventKind,
  settings: AudioVolumeSettings,
  policy?: AudioPolicy,
): number {
  const def = SOUND_REGISTRY[kind];

  // Global mute
  if (settings.muted) return 0;

  // Policy: silent mode
  if (policy?.kind === 'silent') return 0;

  // Policy: suppress specific events
  if (policy?.suppressEvents?.includes(kind)) return 0;

  // Policy: reduced volumes override
  let effectiveSettings = settings;
  if (policy?.kind === 'reduced' && policy.reducedVolumes) {
    effectiveSettings = { ...settings, ...policy.reducedVolumes };
  }

  // Category volume
  const catKey = categoryVolumeKey(def.category);
  const catVolume = effectiveSettings[catKey];

  // Master * category * default
  const resolved = effectiveSettings.master * catVolume * def.defaultVolume;

  return Math.max(0, Math.min(1, resolved));
}

/**
 * Resolve a full playback intent for a sound event.
 * This is what the UI layer receives to actually play a sound.
 */
export function resolvePlaybackIntent(
  kind: SoundEventKind,
  settings: AudioVolumeSettings,
  policy?: AudioPolicy,
  playbackRate = 1,
): PlaybackIntent {
  const volume = resolveVolume(kind, settings, policy);
  const skip = volume <= 0.01;

  return {
    event: kind,
    resolvedVolume: volume,
    playbackRate,
    skip,
    skipReason: skip
      ? settings.muted
        ? 'muted'
        : policy?.kind === 'silent'
          ? 'silent_policy'
          : policy?.suppressEvents?.includes(kind)
            ? 'suppressed_by_policy'
            : 'volume_too_low'
      : undefined,
  };
}

/**
 * Create a fresh audio state with default settings.
 */
export function createAudioState(
  volumeOverrides?: Partial<AudioVolumeSettings>,
): AudioState {
  return {
    volume: { ...DEFAULT_VOLUME_SETTINGS, ...volumeOverrides },
    recentEvents: [],
    activeMusic: null,
    initialized: false,
  };
}

/**
 * Update volume settings in audio state.
 */
export function setVolume(
  state: AudioState,
  key: keyof AudioVolumeSettings,
  value: number | boolean,
): AudioState {
  return {
    ...state,
    volume: { ...state.volume, [key]: value },
  };
}

/**
 * Toggle mute state.
 */
export function toggleMute(state: AudioState): AudioState {
  return {
    ...state,
    volume: { ...state.volume, muted: !state.volume.muted },
  };
}

/**
 * Record that a sound event was played (for dedup / cooldown).
 */
export function recordSoundEvent(
  state: AudioState,
  kind: SoundEventKind,
  maxRecent = 20,
): AudioState {
  const now = Date.now();
  const recentEvents = [
    ...state.recentEvents,
    { kind, timestamp: now },
  ].slice(-maxRecent);
  return { ...state, recentEvents };
}

/**
 * Check if a sound event was recently played (for dedup).
 * Returns true if the same event was played within `cooldownMs`.
 */
export function wasRecentlyPlayed(
  state: AudioState,
  kind: SoundEventKind,
  cooldownMs = 100,
): boolean {
  const now = Date.now();
  return state.recentEvents.some(
    (e) => e.kind === kind && now - e.timestamp < cooldownMs,
  );
}

/**
 * Set the active music track.
 */
export function setActiveMusic(
  state: AudioState,
  track: string | null,
): AudioState {
  return { ...state, activeMusic: track };
}

/**
 * Mark audio system as initialized.
 */
export function markInitialized(state: AudioState): AudioState {
  return { ...state, initialized: true };
}
