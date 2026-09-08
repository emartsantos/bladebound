# Phase 5 — Character Progression (COMPLETED)

## Summary
Central XP curve system with level calculation, skill progression, stat computation, total level, unlock checks, and development tools for balancing. All pure functions, framework-independent.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/progression.ts` | Types: XP curves, level-up results, skill progression, stat computation, unlock conditions, dev tools, simulation |
| `packages/game-engine/src/progression.ts` | Engine: XP curve math, level calculation, level-up processing, skill XP, stat computation, total level, unlock checks, grantXp, setLevel, resetSkill, simulateProgression |
| `packages/game-engine/tests/progression.test.ts` | 43 tests across all progression systems |

## API

**XP Curve** (`xpRequiredForLevel`, `totalXpForLevel`, `levelFromXp`)
- Configurable curve with `base`, `growth`, optional `softCap`/`softCapGrowth`, `maxLevel`
- Default: base=100, growth=1.15, soft-cap at 70 with 1.25x growth, max level 99
- Quadratic growth below soft-cap, aggressive growth above

**Level-Up Processing** (`processXpGrant`)
- Handles multi-level bursts from large XP grants
- Caps at max level, returns detailed event list for UI
- Level-up events for banner notifications

**Skill Progression** (`processSkillXpGain`)
- Same curve mechanics as combat level, per-skill
- Events target specific skill ID for UI

**Stat Computation** (`computeProgressionStats`)
- Per-level stat growth table (HP, STR, AGI, INT, VIT, DMG, DEF)
- Skill-based bonuses: mining→STR/VIT, woodcutting→AGI/STR, smithing→STR/VIT, alchemy→INT, etc.
- Returns base + skill bonus + total for each stat

**Total Level** (`computeTotalLevel`)
- combatLevel + sum of all skill levels

**Unlock Checks** (`checkUnlocks`)
- 5 condition types: level, skill_level, total_level, quest_complete, region_discovered
- 5 comparison operators: gte, gt, lte, lt, eq
- Returns met/failed with actual values for UI error messages

**Dev Tools** (`grantXp`, `setLevel`, `resetSkill`, `simulateProgression`)
- `grantXp`: process XP and return new level/XP state
- `setLevel`: set to specific level (clamped to 1-maxLevel)
- `resetSkill`: reset any skill to level 1, 0 XP
- `simulateProgression`: run N iterations of XP grants for balancing, returns transitions

## Design Decisions

- **Central curve configuration**: one `XpCurveConfig` defines the entire progression curve. Easy to tune for balancing.
- **Soft-cap pattern**: below level 70 uses moderate 1.15x growth; above uses 1.25x for endgame stretch.
- **Multi-level bursts**: `processXpGrant` handles large XP grants correctly, generating one event per level gained.
- **Stat growth is deterministic**: level-based stats use a fixed formula per stat; skill bonuses use a multiplier table per skill.
- **Unlock checks are data-driven**: conditions are typed objects, not hardcoded if-statements. Easy to author for content.
- **Simulation is a dev tool**: `simulateProgression` is for balancing, not gameplay. Returns full transition history.
