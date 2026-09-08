# PHASE_21_COMPLETION_REPORT — Magic, Abilities and Status Effects

## Objective
Per `MASTER_GAME_SPEC.md` (line 1680): create an **extensible effects system** supporting bleed, burn, poison, stun, slow, armor reduction, healing-over-time, damage-over-time, shield, accuracy/evasion/critical buffs — implemented in the shared game engine without hardcoding every effect in combat UI.

## Deliverables

### 1. Shared types — `shared-types/src/effects.ts`
- `EffectType` — 20 built-in effects: `bleed`, `burn`, `poison`, `regeneration`, `accuracy_buff`, `evasion_buff`, `critical_buff`, `damage_buff`, `defense_buff`, `speed_buff`, `slow`, `armor_reduction`, `accuracy_reduction`, `evasion_reduction`, `stun`, `root`, `silence`, `shield`, `barrier`, `resource_regen`, `resource_drain`
- `EffectCategory` — `damage_over_time`, `healing_over_time`, `buff`, `debuff`, `stun`, `shield`, `utility`
- `EffectStackingRule` — `replace`, `refresh`, `stack_add`, `stack_multiply`, `unique`
- `EffectDefinition` — complete effect metadata (name, description, category, stacking, maxStacks, tickInterval, resistible, tags, icon, color)
- `ActiveEffect` — runtime instance: id, definition snapshot, stacks, duration, tickCounter, intensity, source, sourceId, appliedAt, absorptionRemaining
- `EffectApplicationContext` / `EffectApplicationResult` — discriminated union for application outcomes (`ok` with effect, or `reason`: immune/resisted/chance_failed/max_stacks/invalid)
- `EffectTickResult` — per-round tick output (damage/healing, absorption, logs, expired, stacksChanged)
- `EffectStatModifiers` — combined flat/percent stat changes + control flags (`preventsAction`, `preventsAttack`, `preventsMovement`, `preventsAbilities`, `absorption`, `dotPerTick`, `hotPerTick`)
- `EffectResistanceProfile` — per-effect/category resistances (0–1) and immunities
- `CleanseOptions` — `all`, `debuffs_only`, `buffs_only`, `by_category`, `by_tag`, `by_type` with maxCount limit
- `EffectPreset` — data-driven baseIntensity/baseDuration/chance for abilities/items

### 2. Effect catalog — `game-data/src/effects.ts` (exported from index)
- `EFFECT_DEFINITIONS` — all 20 effects with full metadata (category, stacking rule, max stacks, resistibility, tags)
- `EFFECT_DEFINITION_BY_ID` — O(1) lookup
- `EFFECTS_BY_CATEGORY` — grouped by category
- `EFFECT_PRESETS` — 20 presets with baseIntensity/baseDuration/chance for direct use by abilities/items
- Every spec-listed effect is present: bleed, burn, poison, stun, slow, armor_reduction, regeneration, shield, accuracy_buff, evasion_buff, critical_buff

### 3. Effects engine — `game-engine/src/effects.ts` (pure, framework-independent)
- `applyEffect(effects, type, context, resistanceProfile)` — handles immunities, resistances (reduce chance/intensity/duration), application chance roll, stacking per rule (`replace`/`refresh`/`stack_add`/`stack_multiply`/`unique`), maxStacks cap
- `applyEffectFromPreset` — convenience for data-driven ability/item usage with preset defaults + overrides
- `tickEffects(effects, stats)` — decrements duration, processes DoT/HoT ticks at `tickInterval`, removes expired, returns `EffectTickResult` with log entries
- `computeEffectStatModifiers(effects)` — aggregates all active effects into flat/percent stat deltas and control flags (stun/root/silence prevent action/attack/movement/abilities)
- `applyShieldAbsorption(effects, damage, damageTags)` — processes shield/barrier in order (barrier first for magic), tracks absorptionRemaining, returns damageAfterShield + log
- `cleanseEffects(effects, options)` — flexible removal by type/category/tag/effect, returns removed effects + log
- Utility: `getEffect`, `getEffectsByCategory`, `hasEffect`, `getEffectStacks`, `getEffectDuration`, `removeEffect`, `extendEffect`, `setEffectIntensity`

### 4. Combat engine integration — `game-engine/src/combat.ts`
- `CombatParticipant` extended with `effects: ActiveEffect[]` and `resistanceProfile: EffectResistanceProfile`
- `executeCombatRound` now:
  - Ticks effects for both participants at round start
  - Applies `computeEffectStatModifiers` to combat stats before calculations
  - Checks `preventsAttack` (stun) before each attack
  - Uses `applyShieldAbsorption` on incoming damage with damage tags (melee/ranged/magic/spell)
  - `resolveAttack` returns `damageTags` for shield interaction
- `calculateHitChance` / `calculateCritChance` now read from effects (accuracy/evasion/crit buffs)
- `processEnemyAbilities` returns `AbilityEffectApplication[]` for new effects from abilities
- Legacy `buffs` array still present for backwards compatibility but unused by new logic

### 5. Tests — `packages/game-engine/tests/effects.test.ts` (31 tests)
- Application: new effect, additive stacking (bleed), refresh stacking (burn), maxStacks cap, immunity rejection, resistance reduction
- Preset application with defaults and overrides
- Tick processing: DoT damage, HoT healing, shield no-tick, expiry at duration 0
- Stat modifiers: buffs (accuracy, crit, damage), debuffs (slow, accuracy_reduction), control flags (stun/root/silence)
- Shield absorption: generic shield, barrier (magic-only), breaking on large hits
- Cleansing: all, debuffs_only, buffs_only, by_category, by_tag, by_type
- Utilities: hasEffect, getEffectStacks, removeEffect, extendEffect
- Catalog completeness: all spec types defined with required fields, presets have valid ranges

## Key design decisions
- **Zero hardcoding**: adding a new effect only requires an entry in `EFFECT_DEFINITIONS` — combat logic never contains effect-specific code
- **Stacking rules are data-driven**: each effect declares its own stacking behavior (`stack_add` for bleed/poison, `refresh` for burn/stun, `replace` for some debuffs)
- **Resistances are first-class**: per-effect and per-category resistance profiles reduce application chance, intensity, and duration
- **Shields/barriers are absorption-based**: they persist until depleted or expired, processed before armor reduction, with magic-only barrier support
- **Control effects use flags**: `preventsAction/Attack/Movement/Abilities` computed once per round from effects, not scattered `if` checks
- **Cleanse system is flexible**: supports targeted removal by category/tag/type for items like "cleanse all fire effects" or "remove one debuff"
- **Effects are framework-independent**: pure functions taking/returning plain objects, no side effects, deterministic given RNG seed

## Verification
- **Typecheck passes** across all workspaces
- **Full suite: 211 tests passing** (180 prior + 31 new effects tests) — 15 test files, all green
- No regressions in combat/itemization/equipment/economy/upgrade tests

## Next
Phase 22 — NPCs and World Interaction (spec line ~1710): introduce NPCs for quests, shops, crafting, dialogue, region lore, upgrades, contracts. NPC dialogue must be concise and atmospheric.