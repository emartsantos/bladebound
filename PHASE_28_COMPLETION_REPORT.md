# Phase 28 — Analytics and Balancing Tools (COMPLETED)

## Summary
Internal simulation framework for fight, progression, and loot simulations with seeded RNG for reproducibility. Balancing reports with automatic warnings for out-of-range metrics. Never balance solely by manual play-testing.

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared-types/src/analytics.ts` | Types: metrics (progression, combat, loot, economy, skills, regions, quests, items), simulation configs/results, balancing reports |
| `packages/game-engine/src/analytics.ts` | Engine: seeded RNG, fight simulation, progression simulation, loot simulation, balancing report generation |
| `packages/game-engine/tests/analytics.test.ts` | 32 tests: RNG, fight sim, progression sim, loot sim, balancing reports |

## API

**Seeded RNG** (`createRng`)
- Deterministic PRNG from seed for reproducible simulations

**Fight Simulation** (`simulateFights`)
- Simulates N fights with player/enemy levels, optional food, custom stats
- Returns: win rate, rounds stats, gold/xp earned, rare drops, fight logs
- Supports custom seeds for deterministic output

**Progression Simulation** (`simulateProgressionAnalytics`)
- Simulates N players gaining XP over time
- Returns: avg final level, level distribution, time-to-level curves, level-ups/hour, XP/hour

**Loot Simulation** (`simulateLootDrop`)
- Simulates N loot rolls against a drop table
- Returns: drops by item/rarity, rate deviations from expected weights

**Balancing Report** (`generateBalancingReport`)
- Combines progression, combat, loot results into a unified report
- Automatic warnings for: win rate <40% or >95%, low gold sink ratio, excessive rare drops

## Design Decisions

- **Seeded RNG**: all simulations use deterministic RNG so results are reproducible for comparison
- **Configurable parameters**: fight/progression/loot configs allow tuning sample size, levels, seeds
- **Warning system**: `BalancingWarning` flags metrics outside acceptable ranges with severity levels
- **Fight sim is simplified**: uses stat-based damage model, not full combat engine (that's Phase 10)
- **Naming avoids collisions**: `simulateProgressionAnalytics`, `simulateLootDrop` to avoid export conflicts with progression.ts
