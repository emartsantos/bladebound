# PHASE 0 — PRODUCT FOUNDATION AND ARCHITECTURE

## Game Identity
- **Title**: Premium Dark Fantasy Idle RPG
- **Genre**: Dark medieval fantasy idle RPG with progression systems, combat, crafting, and world exploration
- **Visual Language**: Premium dark medieval fantasy — forged steel, charcoal, blackened iron, dark leather, weathered parchment, subtle bronze, cold desaturated stone, smoky atmosphere, restrained ember highlights, engraved medieval geometry
- **Target Audience**: Players who enjoy deep idle progression, equipment collection, and strategic combat — accessible for short sessions but with long-term depth
- **Monetization**: Not a foundation requirement; game must be enjoyable independently

## Core Pillars
1. **Progression** — XP/level systems, skill development, equipment upgrades, region unlocking
2. **Combat** — Deterministic but variable combat with status effects, abilities, and loot
3. **Collection** — Items, enemies, bosses, dungeons, achievements, collections
4. **Economy** — Resources, currencies, crafting costs, shop systems
5. **World** — Regions with identity, enemy pools, quests, dungeons, bosses

## Core Progression Loops

### Short Session Loop (5-15 minutes)
- Choose available action (gather, craft, fight)
- Execute action with timer
- Receive resources/XP
- Make immediate decisions (equip, consume, continue)

### Daily Loop
- Complete repeatable tasks/contracts
- Log in for daily bonuses
- Manage accumulated resources
- Plan next session

### Long-Term Loop (hours/days)
- Level up and unlock new content
- Acquire better equipment
- Access new regions and dungeons
- Complete collections and achievements

## Combat Philosophy
- Deterministic enough to understand, variable enough to remain engaging
- Clear timeline: attack → hit calculation → damage → enemy response → status effects → death check → loot/XP
- Support manual fight, auto-repeat, food consumption, retreat
- Status effects: bleed, burn, poison, stun, slow, armor reduction, healing-over-time, damage-over-time, shield, accuracy/evasion/critical buffs

## Skill Philosophy
- Foundational skills first: Mining, Woodcutting, Fishing
- Each skill: actions, level requirements, action duration, XP/Resource rewards, rare drops, tool requirements/bonuses, unlock progression
- Offline progress calculation on session load

## Loot Philosophy
- Rarities: Common, Uncommon, Rare, Epic, Legendary
- Rarity means more than color: better stat combos, unique passives, distinct artwork, specialized builds, better craftsmanship, rare acquisition sources
- Centralized weighted loot tables

## Economy Philosophy
- Defined currency sources and sinks
- Every currency: how earned, where spent, why it exists
- Track: gold generated/hour, gold consumed/hour, progression costs, shop affordability
- Inflation risk monitored, economy sinks maintained

## Difficulty Philosophy
- Enemy levels scale with region recommended levels
- Mechanics and identities introduced rather than endless HP scaling
- Dungeons and bosses have unique mechanics

## Collection Philosophy
- Collections for: items, enemies, bosses, dungeons, crafted items, rare drops, lore, titles, equipment sets
- Unknown content appears as silhouettes or question marks
- Completion visually satisfying

## Retention Systems
- Offline progression with clock-manipulation prevention
- Guest progression stored locally, registered progression server-side
- Design account migration so guests can create accounts without losing progression

## Offline Progression
- Store: active action, start timestamp, last validated state
- On return: calculate elapsed time, determine valid completed actions, apply limits, calculate rewards, run progression events, display offline summary
- Prevent clock manipulation exploits
- Server-validated calculations for registered accounts

## Character Progression
- XP curves: consistent, centrally configured
- Levels, character statistics, skill levels, total level
- Progress bars, level-up notifications, unlock checks
- Development tools: grant XP, set level, reset skill, simulate progression

## Regions and World Progression
- Original fantasy world with visual identity per region
- Recommended level, skills/resources, enemy pool, quests, NPCs, dungeon, boss, special rewards, unlock conditions
- Original names — no generic "Forest 1 / Cave 2"
- Progression starter frontier → dark woodland → ruined province → mountain stronghold → haunted marsh → forgotten citadel → volcanic wasteland → ancient endgame region

## Dungeons
- Entry requirements, keys, multiple encounters, elite encounters, boss, unique loot, first-clear reward, repeat rewards
- UI shows: progress, current encounter, remaining encounters, boss preview, combat state, run rewards, run history
- Not merely enemy-selection screen

## Quest System
- Objective types: kill, collect, craft, gather, visit region, complete dungeon, equip item, reach skill level, interact with NPC
- Quest chains, requirements, progress tracking, rewards, quest journal, completed history
- Important quests reveal world lore and unlock mechanics

## Achievement System
- Recognize: progression, combat milestones, skill milestones, collections, rare events, boss kills, economic milestones, hidden challenges
- Categories, completion percentages, points, cosmetic rewards, titles
- Not awarded every two minutes

## Shop and Economy
- Currency sources, currency sinks, shop prices, repair costs, crafting costs, upgrades, convenience purchases
- Document every currency: how earned, where spent, why it exists, inflation risk, economy sink
- Developer simulations: gold/hour, progression costs, shop affordability

## Item Upgrades and Durability
- Upgrade system: +1, +2, +3, etc. with costs scaling predictably
- Durability: creates economic decisions, not constant annoyance, easy to understand, provides repair options
- Broken equipment never silently destroys itself

## Magic, Abilities and Status Effects
- Extensible effects: bleed, burn, poison, stun, slow, armor reduction, healing-over-time, damage-over-time, shield, accuracy buff, evasion buff, critical buff
- Implemented in shared game engine, not hardcoded in combat UI

## NPC and World Interaction
- Quests, shops, crafting, dialogue, region lore, upgrades, contracts
- Concise and atmospheric dialogue
- Avoid massive AI-generated exposition dumps

## Anti-Generic Design Rules
- Never: three-column feature cards, four identical stat cards, huge hero gradients, generic icon circles, random glass cards, massive border-radius everywhere, purple-blue gradients, excessive backdrop blur, generic dashboard templates, placeholder AI copy, meaningless charts, unnecessary badges, repetitive cards
- Every layout designed specifically for the game mechanic being displayed

## Game Data Rule
- Avoid code such as `if (item === "Iron Sword") ...`
- Use structured data: items/weapons.ts, items/armor.ts, materials.ts, food.ts, questItems.ts
- Same pattern for: enemies/, regions/, dungeons/, quests/, achievements/, recipes/, skills/, lootTables/
- Game systems consume structured data — allows hundreds of entries without rewriting logic

## Testing Requirements
- Critical game formulas require unit tests
- Test conditions: normal, boundaries, minimum values, maximum expected values, invalid inputs, edge cases
- Specific formulas tested: XP thresholds, level calculations, combat damage, hit chance, critical damage, loot weighting, equipment stats, offline rewards, recipe consumption, inventory capacity, quest progression, achievement progression, currency calculations

## Phase 0 Deliverables Output
- ✓ Product foundation documentation (this file)
- ✓ Architecture documentation with directory structure
- ✓ Game-domain entities defined
- ✓ Test structure established
- ✓ Package configuration ready
- ✓ Directory structure created

## Risks Identified
- Monorepo configuration complexity
- Balancing XP curves and resource economy
- Offline progression exploit prevention
- Maintaining framework-agnostic game engine
- Visual identity consistency across 41 phases

## Recommended Phase 1 Actions
- Establish visual design system (color tokens, surface tokens, border tokens, spacing, typography, icons, shadows, motion, buttons, inputs, tooltips, popovers, modals, panels, tables, inventory slots, rarity treatment, combat-state treatment, progress bars, XP bars, health bars, resource counters, navigation states, notifications, toast system, loading states, skeleton states, empty states, disabled states, danger states, success states)
- Design desktop navigation hierarchy (Character, Adventure, World, Skills, Inventory, Equipment, Crafting, Dungeons, Quests, Tasks, Collections, Achievements, Shop, Settings)
- Build game shell (top navigation, side navigation, workspace, context panel, tooltips, dialogs, dropdowns, notifications, skeleton loading, responsive layout)
- Create packages/game-engine foundation (XP calculation, level calculation, experience thresholds, random rolls, weighted loot selection, stat calculation, equipment modifiers, timing calculations, offline progression, resource rewards, combat formulas, cooldown calculations, duration modifiers, buff modifiers, deterministic seeded randomness)