// ─── AUDIO ARCHITECTURE TYPES ───────────────────────────────────
// Phase 26: Sound categories, event definitions, volume policy,
// and playback intent. The engine resolves WHAT should play;
// the UI layer (Web Audio / Howler) resolves HOW to play it.
// No browser APIs, no autoplay, no loud audio by default.

// ─── SOUND CATEGORIES ───────────────────────────────────────────

export type SoundCategory = 'navigation' | 'effects' | 'music' | 'ui';

// ─── SOUND EVENT KINDS ──────────────────────────────────────────

export type SoundEventKind =
  | 'nav_click'
  | 'nav_transition'
  | 'loot_acquire'
  | 'loot_rare'
  | 'craft_complete'
  | 'craft_start'
  | 'combat_hit'
  | 'combat_miss'
  | 'combat_crit'
  | 'combat_death_enemy'
  | 'combat_death_player'
  | 'level_up'
  | 'skill_level_up'
  | 'achievement_unlock'
  | 'boss_appear'
  | 'boss_defeat'
  | 'menu_open'
  | 'menu_close'
  | 'button_click'
  | 'button_hover'
  | 'error'
  | 'notification'
  | 'quest_complete'
  | 'region_discover'
  | 'item_equip'
  | 'item_unequip'
  | 'gold_gain'
  | 'gold_spend'
  | 'heal'
  | 'buff_apply'
  | 'buff_expire'
  | 'damage_number'
  | 'dungeon_enter'
  | 'dungeon_complete';

// ─── SOUND EVENT DEFINITION ─────────────────────────────────────

export interface SoundEventDefinition {
  /** Unique event kind. */
  kind: SoundEventKind;
  /** Human-readable label. */
  label: string;
  /** Which volume channel controls this sound. */
  category: SoundCategory;
  /** Default volume 0-1 (scaled by category volume). */
  defaultVolume: number;
  /** File path or key (resolved by UI layer). */
  src: string;
  /** Whether this sound can overlap with itself. */
  polyphonic: boolean;
  /** Max simultaneous instances (1 = mono, >1 = polyphonic). */
  maxInstances: number;
  /** Whether this sound should be allowed to autoplay. */
  autoplay: boolean;
  /** Priority: higher priority sounds duck lower ones. */
  priority: number;
  /** Optional: tags for filtering (e.g., 'combat', 'ui'). */
  tags: string[];
}

// ─── VOLUME SETTINGS ────────────────────────────────────────────

export interface AudioVolumeSettings {
  /** Master volume 0-1. Scales all categories. */
  master: number;
  /** Music volume 0-1. Scales music category. */
  music: number;
  /** Effects volume 0-1. Scales effects category. */
  effects: number;
  /** UI sounds volume 0-1. Scales navigation/ui category. */
  ui: number;
  /** Global mute toggle. */
  muted: boolean;
}

export const DEFAULT_VOLUME_SETTINGS: AudioVolumeSettings = {
  master: 0.7,
  music: 0.5,
  effects: 0.6,
  ui: 0.5,
  muted: false,
};

// ─── PLAYBACK INTENT ────────────────────────────────────────────
// What the engine tells the UI layer to do.

export interface PlaybackIntent {
  /** The sound event to play. */
  event: SoundEventKind;
  /** Resolved volume 0-1 (after master + category scaling). */
  resolvedVolume: number;
  /** Playback rate (1 = normal). */
  playbackRate: number;
  /** Whether this intent should be skipped (muted / volume 0). */
  skip: boolean;
  /** Reason for skip (for debugging). */
  skipReason?: string;
}

// ─── AUDIO STATE ────────────────────────────────────────────────

export interface AudioState {
  /** Current volume settings. */
  volume: AudioVolumeSettings;
  /** Recently played events (for dedup). */
  recentEvents: Array<{ kind: SoundEventKind; timestamp: number }>;
  /** Active music track (if any). */
  activeMusic: string | null;
  /** Whether audio system is initialized. */
  initialized: boolean;
}

// ─── AUDIO POLICY ───────────────────────────────────────────────
// Controls audio behavior (reduced audio, no music, etc.)

export type AudioPolicyKind = 'normal' | 'reduced' | 'silent';

export interface AudioPolicy {
  kind: AudioPolicyKind;
  /** Override volumes for reduced mode. */
  reducedVolumes?: Partial<AudioVolumeSettings>;
  /** Specific events to suppress in reduced mode. */
  suppressEvents?: SoundEventKind[];
}
