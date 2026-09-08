# Phase 41 — Post-Launch System

## Spec Reference (MASTER_GAME_SPEC.md:2519-2570)

> **Perform full regression testing.**

> **Test:**
> - authentication
> - guest mode
> - saving
> - loading
> - offline progression
> - inventory
> - equipment
> - skills
> - crafting
> - combat
> - loot
> - regions
> - dungeons
> - quests
> - tasks
> - achievements
> - collections
> - shops
> - economy
> - upgrades
> - responsive layouts
> - browser refresh
> - multiple tabs
> - network failure
> - expired session
> - invalid API input
> - slow connections

> ---

> # PHASE 41 — POST‑LAUNCH SYSTEM

> Monitor and maintain the game after launch.

> **Systems to monitor:**

> - **Daily active users (DAU)**
> - **Retention curves** (day 1, day 3, day 7)
> - **Crash reports** (Sentry / Expo Crashlytics)
> - **Error logs** (server-side, client-side)
> - **Cheating / exploit detection**
> - **Balance patches** (weekly/bi‑weekly)
> - **Content updates** (new regions, items, events)
> - **API versioning** (ensure backwards compatibility)
> - **Feature flags** (toggle unfinished features without redeploy)

> **Post‑launch responsibilities:**

> - **Community management** — respond to player feedback, moderate forums
> - **Live‑ops events** — limited‑time events, holiday themes, bonus rewards
> - **Bug triage** — prioritize and fix reported issues in sprint cycles
> - **Balance adjustments** — adjust damage, gold rewards, XP rates based on player data
> - **Security patches** — address any exploited vulnerabilities promptly

> **Do not ship unfinished systems.**
> 
> **Feature flags** must be used to hide incomplete systems from players until they are ready.

> ---

# Post-Launch System Specification

## 1. Telemetry & Analytics

| Metric | Collection Method | Frequency |
|---|---|---|
| **DAU / MAU** | Expo analytics / server‑side event ping | Daily |
| **Session length** | Client‑side `Date.now()` timing | Per session |
| **Feature usage** | Count button taps, screen visits | Per interaction |
| **Crash reports** | Expo Crashlytics / Sentry SDK | Immediate |
| **In‑app purchases** (if applicable) | Server‑side receipt verification | Per transaction |

## 2. Balance Patches

| Patch Type | Trigger | Process |
|---|---|---|
| **Weekly balance patch** | Every Monday | Designer reviews telemetry, proposes changes, PM approves |
| **Hotfix** | Critical bug or exploit | Immediate; deploy via Expo Updater |
| **Content update** | Every 2–4 weeks | New region, item, or event; tested on staging branch |

## 2. Feature Flags

| Flag | Target Feature | State | Removal Date |
|---|---|---|---|
| `flag_combat_tutorial` | Combat tutorial flow | `false` (disabled) | Q3 2025 |
| `flag_crafting_ui` | Crafting UI | `false` (disabled) | Q4 2025 |
| `flag_dungeon_runner` | Dungeon runner mode | `false` (disabled) | TBD |

## 3. Community Management

| Channel | Purpose | Frequency |
|---|---|---|
| **Discord / Forum** | Player discussion, bug reports | Daily moderation |
| **Twitter / X** | Announcements, events | 3× per week |
| **In‑game feedback** | Survey after session length (5 min, 30 min, 1 hr) | Prompted per session |
| **Bug bounty** | Reward for reported exploits | Ongoing |

## 4. Live‑Ops Events

| Event Type | Duration | Rewards |
|---|---|---|
| **Holiday event** | 7 days | Themed items, bonus gold |
| **Weekly challenge** | 7 days | XP boost, rare crafting material |
| **Quarterly content update** | 14 days | New region, boss, quest line |

## 5. API Versioning

| Version | Endpoint Changes | Migration Plan |
|---|---|---|
| `v1` (current) | All existing endpoints | No breaking changes; deprecate after 12 months |
| `v2` | Planned | New endpoints only; `v1` remains live until `v2` adoption > 20% of clients |

## 6. Post‑Launch Checklist

| Item | Status | Notes |
|---|---|---|
| **Telemetry pipeline** | ❌ Not set up | No Sentry/Expo Crashlytics configured |
| **Balance dashboard** | ❌ Not set up | No weekly review process |
| **Feature flag system** | ❌ Not set up | No flag management tooling |
| **Community moderation** | ❌ Not set up | No Discord/forum team assigned |
| **Live‑Ops calendar** | ❌ Not set up | No events scheduled |
| **API versioning docs** | ❌ Not written | No v2 plan documented |

## Connection to Other Phases

| Phase | Relation |
|---|---|
| **Phase 39 (QA)** | Post‑launch monitoring extends the regression test coverage beyond the initial QA window. |
| **Phase 38 (UX Audit)** | Live‑ops events must respect the UX guidelines (no tutorial text walls, progressive disclosure). |
| **Phase 34 (React Native)** | Feature flags and telemetry must be integrated without breaking the existing `apps/mobile` build. |
| **Phase 36 (Content Expansion)** | New content (regions, items, quests) is the primary driver of live‑ops events and balance patches. |

---
*This specification is drafted for future implementation. No post‑launch systems are active in this workspace.*