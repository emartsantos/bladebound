# PHASE 1A — INFORMATION ARCHITECTURE

## Desktop Navigation Hierarchy

### Top Bar (persistent across all sections)
- **Left**: Game logo
- **Center**: Character level + current region badge
- **Right**: Gold resource + important resources (iron/wood/food counts) + notifications bell + profile avatar + settings gear

### Left Navigation (persistent on desktop; collapsible on tablet)
Major sections in original hierarchy optimized for our systems:

1. **Character** — character sheet, equipped items, skill overview, active buffs/debuffs
2. **Adventure** — quick actions (gather, craft, fight), active quests, current task, recent combat
3. **World** — region map with enemy pools, explored territories, region progression, unlock conditions
4. **Skills** — all skills with levels/progress; Mining, Woodcutting, Fishing first; smelting, smithing, cooking, fletching, alchemy, runecrafting
5. **Inventory** — grid view, search, filters (type/rarity/equippable), sorting (name/rarity/level/value), stackable/non-stackable, quantity display, tooltips, item locking, favorite items, sell protection
6. **Equipment** — loadout slots (weapon/offhand/helmet/chest/gloves/legs/boots/amulet/ring/cape); equipping recalculates derived stats; comparison view (equipped vs selected); requirements; durability; special bonuses
7. **Crafting** — production queue, recipes as data; each recipe: requirements, ingredients, duration, output, XP, chance-based bonuses, unlock level; interact with inventory, XP, quests, tasks, achievements, collections
8. **Dungeons** — entry requirements, keys, multiple encounters, elite encounters, boss, unique loot, first-clear reward, repeat rewards; UI shows progress, current encounter, remaining encounters, boss preview, combat state, run rewards, run history
9. **Quests** — quest chains, requirements, progress tracking, rewards; quest journal, completed history; objective types: kill, collect, craft, gather, visit region, complete dungeon, equip item, reach skill level, interact with NPC; important quests reveal world lore and unlock mechanics
10. **Tasks** — daily tasks, weekly contracts, monster contracts, gathering orders, crafting orders; controlled rewards; no manipulative FOMO; missed day should not permanently disadvantage
11. **Collections** — items, enemies, bosses, dungeons, crafted items, rare drops, lore, titles, equipment sets; unknown content as silhouettes/question marks; completion visually satisfying
12. **Achievements** — categories: progression, combat milestones, skill milestones, collections, rare events, boss kills, economic milestones, hidden challenges; completion percentages; points if useful; cosmetic rewards; titles; not awarded every two minutes
13. **Shop** — currency sources, currency sinks, shop prices, repair costs, crafting costs, upgrades, convenience purchases, special currencies if needed; every currency documented: how earned, where spent, why it exists, inflation risk, economy sink
14. **Settings** — account management, audio/video, controls, accessibility (reduced-motion), language, logout, guest mode management

### Right Context Panel (visible on desktop; hidden on tablet/mobile)
Task-dependent panel showing:
- **Current action** — active gather/craft/fight timer, progress, time per action, XP/hour estimate, resource/hour estimate, tool bonus, next unlock
- **Character summary** — combatLevel, totalLevel, playtime, region
- **Active buffs** — list with durations, tick rates
- **Queue** — pending actions, next in queue
- **Timers** — cooldowns, crafting durations, action timers
- **Relevant contextual information** — region-specific tips, skill level requirements, nearby resources

### Section Layout Structure

#### Character Section
- Sheet overview with character portrait, class/archetype if used
- Base stats + equipment-derived stats comparison
- Skill levels progress bars
- Equipment grid with current/alternate set comparison

#### Adventure Section
- Quick-access action buttons (primary actions: gather/craft/fight)
- Active quest progress tracker
- Current task with timer
- Recent combat log mini-view

#### World Section
- Region map overview with explored/fog-of-war
- Recommended level vs current level indicator
- Resource nodes visible on map
- Unlock conditions for next regions

#### Skills Section
- Skill list with level, XP bar, progress to next level
- Action buttons per skill (start gather/continue)
- Tool requirements and bonuses displayed
- Offline progress summary on hover

#### Inventory Section
- Grid/list toggle view
- Search field with type-ahead
- Filters: equipped only, rarity, type (weapon/armor/material/food/tool/quest/currency)
- Sorting options: name, rarity, level, value, weight
- Quantity display for stackable items
- Non-stackable equipment with quantity 1, durability indicator
- Item tooltips with full metadata
- Item locking (prevent accidental sell)
- Favorite heart icon
- Sell protection toggle

#### Equipment Section
- Visual loadout slots arrangement
- Each slot shows: currently equipped item icon + name
- Hover: comparison vs selected item showing improvements/reductions/special bonuses
- Click: open item selection panel
- Requirements displayed per slot
- Durability indicator per slot
- Set bonuses if multiple pieces from same set equipped

#### Crafting Section
- Production queue with active/cancel buttons
- Recipe grid: each recipe shows input ingredients + output + duration + XP reward
- Queue position, remaining time, pause/resume
- Material requirements vs owned count
- XP gain preview
- Quick actions: start all, pause, cancel all

#### Dungeons Section
- Run history with clear entries (date, result, loot, duration)
- Active run card showing: current encounter, remaining encounters, boss preview, combat state
- Entry requirements displayed (recommended level, keys needed)
- Elite encounter flags and unique mechanics icons
- First-clear reward display
- Repeat reward note

#### Quests Section
- Quest journal with expandable entries
- Progress bars per quest objective
- Completed history with date/reward
- Chain quest indicators
- Important quest lore snippets visible

#### Tasks Section
- Daily tasks with day counter
- Weekly contracts with progress
- Monster contract tracker
- Gathering order list
- Crafting order queue

#### Collections Section
- Grid of collected entries
- Silhouette/question mark for unknown entries
- Completion percentage badge
- Filter by category (items/enemies/bosses/dungeons/crafted/rare drops/lore/titles/equipment sets)
- Completion visual satisfaction: full set reveals golden frame / title unlock

#### Achievements Section
- Achievement grid with category badges
- Gold/silver/bronze tier medals for completion
- Points display if applicable
- Cosmetic reward thumbnails
- Title unlock indicators
- Category breakdown: progression, combat, skills, collections, rare events, boss kills, economic, hidden

#### Shop Section
- Currency display at top: gold + special currencies
- Category tabs: general, upgrades, convenience, special
- Price display: gold cost with reduced cost for owned items
- Repair costs displayed per equipment slot
- Crafting cost display per recipe
- Upgrade cost progression

#### Settings Section
- Categorized panels: Account, Audio/Visual, Controls, Gameplay, Social
- Reduced-motion toggle with explanation of supported animations
- Accessibility color contrast explanation
- Logout button with guest progression migration info

### Mobile Web Navigation
- Bottom tab bar: Adventure | Character | Inventory | Skills | More
- "More" section contains: World | Dungeons | Quests | Tasks | Collections | Achievements | Shop | Settings
- Drawer/slide-out left panel for main sections on tablet
- Single task-focused view per screen — no multi-panel dense layout
- Contextual sheets slide up from bottom for settings/context
- Top bar: smaller height (48px), profile/guest indicator, search

### Responsive Behavior

| Tier | Primary Navigation | Secondary Panels | Information Density |
|------|-------------------|------------------|---------------------|
| Desktop | Left nav persistent | All panels visible | Dense, full information |
| Tablet | Left nav collapsible (hamburger) | Secondary panels collapse into drawer | Reduced simultaneous info |
| Mobile web | Bottom tabs + drawer | Single panel; contextual sheets | One task at a time |

Desktop remains the richest experience. Never simply shrink desktop layout for smaller screens —
each tier has purposeful, redesigned layout.

### Section Order (by priority)

1. Character (always first — player identity)
2. Adventure (primary action hub)
3. World (progression map)
4. Skills (foundational progression)
5. Inventory (resource management)
6. Equipment (character power)
7. Crafting (production system)
8. Dungeons (challenge content)
9. Quests (narrative/content)
10. Tasks (repeatable content)
11. Collections (completion Codex)
12. Achievements (milestones)
13. Shop (economy)
14. Settings (configuration)

This hierarchy is original and optimized for our dark medieval fantasy idle RPG — not a copy of
Runeswick or any other game's navigation.