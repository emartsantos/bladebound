# Phase 26 — Audio Architecture (COMPLETED)

## Summary
Pure-function audio system that resolves WHAT should play (event registry, volume scaling, policy enforcement, playback intents). The UI layer (Web Audio / Howler) receives PlaybackIntents and handles actual audio playback. No browser APIs, no autoplay, no loud audio by default.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/audio.ts` | Types: sound categories, event kinds, definitions, volume settings, playback intent, audio policy |
| `packages/game-engine/src/audio.ts` | Engine: 34-event registry, volume resolution, policy enforcement, playback intent, state management |
| `packages/game-engine/tests/audio.test.ts` | 40 tests across registry, volume, policy, intent, state |

## API

**Registry** (`getSoundDefinition`, `getAllSoundKinds`, `getSoundsByTag`, `getSoundsByCategory`)
- 34 sound events across 4 categories: `navigation`, `effects`, `music`, `ui`
- Queryable by tag (`combat`, `loot`, `progression`, `ui`, etc.) or category
- Every definition has: kind, label, category, defaultVolume, src key, polyphonic flag, maxInstances, autoplay (all false), priority, tags

**Volume Resolution** (`resolveVolume`)
- Applies: global mute → policy checks → category volume → master × category × default
- Policy modes: `normal` (full), `reduced` (lower volumes + event suppression), `silent` (everything off)
- Category mapping: `effects` → effects channel, `music` → music channel, `ui`/`navigation` → ui channel

**Playback Intents** (`resolvePlaybackIntent`)
- Returns: event, resolved volume, playback rate, skip flag, skip reason
- UI layer receives intents and decides how to play (Howler, Web Audio, etc.)
- Skip reasons: `muted`, `silent_policy`, `suppressed_by_policy`, `volume_too_low`

**State Management** (`createAudioState`, `setVolume`, `toggleMute`, `recordSoundEvent`, `wasRecentlyPlayed`, `setActiveMusic`, `markInitialized`)
- Immutable state updates
- Event recording with configurable cooldown for dedup
- Active music track tracking

**Sound Events** (34 total):
- UI: nav_click, nav_transition, menu_open, menu_close, button_click, button_hover, error, notification
- Combat: combat_hit, combat_miss, combat_crit, combat_death_enemy, combat_death_player, damage_number, heal, buff_apply, buff_expire
- Progression: level_up, skill_level_up, achievement_unlock, quest_complete, region_discover
- Economy: loot_acquire, loot_rare, gold_gain, gold_spend
- Crafting: craft_complete, craft_start
- Items: item_equip, item_unequip
- Boss: boss_appear, boss_defeat
- Dungeon: dungeon_enter, dungeon_complete

## Design Decents

- **No autoplay**: all 34 events have `autoplay: false`. The spec explicitly says "Do not autoplay loud audio."
- **Engine resolves, UI plays**: the engine computes `PlaybackIntent` objects. The UI layer uses Howler/Web Audio to actually play sounds. No browser APIs in engine.
- **4 volume channels**: master (scales all), music, effects, ui. Independent controls as required.
- **Priority-based ducking**: higher priority sounds (boss_appear=6, level_up=5) duck lower priority ones (button_hover=0).
- **Polyphonic control**: combat_hit is polyphonic (max 4 simultaneous), level_up is not (max 1). Prevents audio clutter.
- **Policy-driven**: reduced/silent modes for accessibility. Events can be individually suppressed.
- **Dedup via cooldown**: `wasRecentlyPlayed` prevents rapid-fire identical sounds (e.g., damage_number spam).
