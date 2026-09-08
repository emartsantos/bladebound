import { describe, it, expect } from 'vitest';
import {
  getSoundDefinition,
  getAllSoundKinds,
  getSoundsByTag,
  getSoundsByCategory,
  resolveVolume,
  resolvePlaybackIntent,
  createAudioState,
  setVolume,
  toggleMute,
  recordSoundEvent,
  wasRecentlyPlayed,
  setActiveMusic,
  markInitialized,
} from '../src/audio';
import type {
  SoundEventKind,
  AudioVolumeSettings,
  AudioPolicy,
} from '@premium-rpg/shared-types';
import { DEFAULT_VOLUME_SETTINGS } from '@premium-rpg/shared-types';

// ── REGISTRY ───────────────────────────────────────────────────

describe('audio registry', () => {
  it('has a definition for every sound event kind', () => {
    const kinds = getAllSoundKinds();
    expect(kinds.length).toBeGreaterThanOrEqual(30);
    for (const kind of kinds) {
      const def = getSoundDefinition(kind);
      expect(def.kind).toBe(kind);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.src.length).toBeGreaterThan(0);
      expect(['navigation', 'effects', 'music', 'ui']).toContain(def.category);
      expect(def.defaultVolume).toBeGreaterThanOrEqual(0);
      expect(def.defaultVolume).toBeLessThanOrEqual(1);
      expect(typeof def.polyphonic).toBe('boolean');
      expect(def.maxInstances).toBeGreaterThan(0);
      expect(typeof def.autoplay).toBe('boolean');
      expect(typeof def.priority).toBe('number');
      expect(Array.isArray(def.tags)).toBe(true);
    }
  });

  it('includes all spec-required sound kinds', () => {
    const required: SoundEventKind[] = [
      'nav_click', 'nav_transition', 'loot_acquire', 'loot_rare',
      'craft_complete', 'combat_hit', 'combat_crit', 'level_up',
      'skill_level_up', 'achievement_unlock', 'boss_appear', 'boss_defeat',
    ];
    const all = getAllSoundKinds();
    for (const kind of required) {
      expect(all).toContain(kind);
    }
  });

  it('no sound has autoplay enabled', () => {
    for (const kind of getAllSoundKinds()) {
      expect(getSoundDefinition(kind).autoplay).toBe(false);
    }
  });
});

// ── TAG / CATEGORY QUERIES ─────────────────────────────────────

describe('getSoundsByTag', () => {
  it('returns sounds matching tag', () => {
    const combat = getSoundsByTag('combat');
    expect(combat.length).toBeGreaterThan(0);
    for (const d of combat) {
      expect(d.tags).toContain('combat');
    }
  });

  it('returns empty for unknown tag', () => {
    expect(getSoundsByTag('nonexistent_tag')).toHaveLength(0);
  });
});

describe('getSoundsByCategory', () => {
  it('returns sounds by category', () => {
    const effects = getSoundsByCategory('effects');
    expect(effects.length).toBeGreaterThan(0);
    for (const d of effects) {
      expect(d.category).toBe('effects');
    }
  });

  it('returns ui sounds', () => {
    const ui = getSoundsByCategory('ui');
    expect(ui.length).toBeGreaterThan(0);
  });
});

// ── VOLUME RESOLUTION ──────────────────────────────────────────

describe('resolveVolume', () => {
  const fullSettings: AudioVolumeSettings = {
    master: 1, music: 1, effects: 1, ui: 1, muted: false,
  };

  it('returns correct volume for full settings', () => {
    const vol = resolveVolume('combat_hit', fullSettings);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThanOrEqual(1);
  });

  it('returns 0 when muted', () => {
    const muted = { ...fullSettings, muted: true };
    expect(resolveVolume('combat_hit', muted)).toBe(0);
  });

  it('scales by master volume', () => {
    const half = { ...fullSettings, master: 0.5 };
    const full = resolveVolume('combat_hit', fullSettings);
    const reduced = resolveVolume('combat_hit', half);
    expect(reduced).toBeCloseTo(full * 0.5, 5);
  });

  it('scales by category volume', () => {
    const halfEffects = { ...fullSettings, effects: 0.5 };
    const full = resolveVolume('combat_hit', fullSettings);
    const reduced = resolveVolume('combat_hit', halfEffects);
    expect(reduced).toBeCloseTo(full * 0.5, 5);
  });

  it('uses ui volume for ui category', () => {
    const halfUi = { ...fullSettings, ui: 0.5 };
    const full = resolveVolume('nav_click', fullSettings);
    const reduced = resolveVolume('nav_click', halfUi);
    expect(reduced).toBeCloseTo(full * 0.5, 5);
  });

  it('uses music volume for music category', () => {
    const halfMusic = { ...fullSettings, music: 0.5 };
    const full = resolveVolume('boss_appear', fullSettings);
    const reduced = resolveVolume('boss_appear', halfMusic);
    expect(reduced).toBeCloseTo(full * 0.5, 5);
  });
});

// ── POLICY ─────────────────────────────────────────────────────

describe('resolveVolume with policy', () => {
  const fullSettings: AudioVolumeSettings = {
    master: 1, music: 1, effects: 1, ui: 1, muted: false,
  };

  it('returns 0 for silent policy', () => {
    const policy: AudioPolicy = { kind: 'silent' };
    expect(resolveVolume('combat_hit', fullSettings, policy)).toBe(0);
  });

  it('returns 0 for suppressed events', () => {
    const policy: AudioPolicy = { kind: 'reduced', suppressEvents: ['combat_crit'] };
    expect(resolveVolume('combat_crit', fullSettings, policy)).toBe(0);
  });

  it('allows non-suppressed events in reduced mode', () => {
    const policy: AudioPolicy = { kind: 'reduced', suppressEvents: ['combat_crit'] };
    expect(resolveVolume('combat_hit', fullSettings, policy)).toBeGreaterThan(0);
  });

  it('applies reduced volume overrides', () => {
    const policy: AudioPolicy = { kind: 'reduced', reducedVolumes: { effects: 0.2 } };
    const full = resolveVolume('combat_hit', fullSettings);
    const reduced = resolveVolume('combat_hit', fullSettings, policy);
    expect(reduced).toBeLessThan(full);
  });
});

// ── PLAYBACK INTENT ────────────────────────────────────────────

describe('resolvePlaybackIntent', () => {
  const fullSettings: AudioVolumeSettings = {
    master: 1, music: 1, effects: 1, ui: 1, muted: false,
  };

  it('produces a valid intent for normal playback', () => {
    const intent = resolvePlaybackIntent('level_up', fullSettings);
    expect(intent.event).toBe('level_up');
    expect(intent.resolvedVolume).toBeGreaterThan(0);
    expect(intent.skip).toBe(false);
    expect(intent.skipReason).toBeUndefined();
    expect(intent.playbackRate).toBe(1);
  });

  it('sets skip=true when muted', () => {
    const muted = { ...fullSettings, muted: true };
    const intent = resolvePlaybackIntent('level_up', muted);
    expect(intent.skip).toBe(true);
    expect(intent.skipReason).toBe('muted');
  });

  it('sets skip=true for silent policy', () => {
    const policy: AudioPolicy = { kind: 'silent' };
    const intent = resolvePlaybackIntent('level_up', fullSettings, policy);
    expect(intent.skip).toBe(true);
    expect(intent.skipReason).toBe('silent_policy');
  });

  it('sets skip=true for suppressed events', () => {
    const policy: AudioPolicy = { kind: 'reduced', suppressEvents: ['boss_appear'] };
    const intent = resolvePlaybackIntent('boss_appear', fullSettings, policy);
    expect(intent.skip).toBe(true);
    expect(intent.skipReason).toBe('suppressed_by_policy');
  });

  it('respects custom playback rate', () => {
    const intent = resolvePlaybackIntent('combat_hit', fullSettings, undefined, 1.5);
    expect(intent.playbackRate).toBe(1.5);
  });
});

// ── AUDIO STATE ────────────────────────────────────────────────

describe('createAudioState', () => {
  it('creates state with default volume settings', () => {
    const state = createAudioState();
    expect(state.volume).toEqual(DEFAULT_VOLUME_SETTINGS);
    expect(state.recentEvents).toEqual([]);
    expect(state.activeMusic).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it('applies volume overrides', () => {
    const state = createAudioState({ master: 0.3 });
    expect(state.volume.master).toBe(0.3);
    expect(state.volume.effects).toBe(DEFAULT_VOLUME_SETTINGS.effects);
  });
});

describe('setVolume', () => {
  it('updates a numeric volume key', () => {
    const state = createAudioState();
    const updated = setVolume(state, 'master', 0.9);
    expect(updated.volume.master).toBe(0.9);
  });

  it('updates muted boolean', () => {
    const state = createAudioState();
    const updated = setVolume(state, 'muted', true);
    expect(updated.volume.muted).toBe(true);
  });
});

describe('toggleMute', () => {
  it('toggles mute on', () => {
    const state = createAudioState();
    expect(state.volume.muted).toBe(false);
    const toggled = toggleMute(state);
    expect(toggled.volume.muted).toBe(true);
  });

  it('toggles mute off', () => {
    const state = createAudioState({ muted: true });
    const toggled = toggleMute(state);
    expect(toggled.volume.muted).toBe(false);
  });
});

describe('recordSoundEvent', () => {
  it('records an event', () => {
    const state = createAudioState();
    const updated = recordSoundEvent(state, 'combat_hit');
    expect(updated.recentEvents).toHaveLength(1);
    expect(updated.recentEvents[0].kind).toBe('combat_hit');
  });

  it('caps recent events at maxRecent', () => {
    let state = createAudioState();
    for (let i = 0; i < 25; i++) {
      state = recordSoundEvent(state, 'combat_hit', 20);
    }
    expect(state.recentEvents.length).toBeLessThanOrEqual(20);
  });
});

describe('wasRecentlyPlayed', () => {
  it('returns false when no events', () => {
    const state = createAudioState();
    expect(wasRecentlyPlayed(state, 'combat_hit')).toBe(false);
  });

  it('returns true for recently played event', () => {
    const state = createAudioState();
    const updated = recordSoundEvent(state, 'combat_hit');
    expect(wasRecentlyPlayed(updated, 'combat_hit', 1000)).toBe(true);
  });

  it('returns false for different event kind', () => {
    const state = createAudioState();
    const updated = recordSoundEvent(state, 'combat_hit');
    expect(wasRecentlyPlayed(updated, 'level_up', 1000)).toBe(false);
  });
});

describe('setActiveMusic', () => {
  it('sets active music track', () => {
    const state = createAudioState();
    const updated = setActiveMusic(state, 'boss_theme');
    expect(updated.activeMusic).toBe('boss_theme');
  });

  it('clears active music track', () => {
    const state = createAudioState();
    const updated1 = setActiveMusic(state, 'boss_theme');
    const updated2 = setActiveMusic(updated1, null);
    expect(updated2.activeMusic).toBeNull();
  });
});

describe('markInitialized', () => {
  it('marks audio state as initialized', () => {
    const state = createAudioState();
    expect(state.initialized).toBe(false);
    const updated = markInitialized(state);
    expect(updated.initialized).toBe(true);
  });
});

// ── DATA INTEGRITY ─────────────────────────────────────────────

describe('audio data integrity', () => {
  it('all default volumes are between 0 and 1', () => {
    for (const kind of getAllSoundKinds()) {
      const def = getSoundDefinition(kind);
      expect(def.defaultVolume).toBeGreaterThanOrEqual(0);
      expect(def.defaultVolume).toBeLessThanOrEqual(1);
    }
  });

  it('all categories are valid', () => {
    const valid = ['navigation', 'effects', 'music', 'ui'];
    for (const kind of getAllSoundKinds()) {
      expect(valid).toContain(getSoundDefinition(kind).category);
    }
  });

  it('polyphonic sounds have maxInstances > 1', () => {
    for (const kind of getAllSoundKinds()) {
      const def = getSoundDefinition(kind);
      if (def.polyphonic) {
        expect(def.maxInstances).toBeGreaterThan(1);
      }
    }
  });

  it('non-polyphonic sounds have maxInstances = 1', () => {
    for (const kind of getAllSoundKinds()) {
      const def = getSoundDefinition(kind);
      if (!def.polyphonic) {
        expect(def.maxInstances).toBe(1);
      }
    }
  });
});
