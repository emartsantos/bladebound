# MASTER DEVELOPMENT PROMPT — PREMIUM DARK FANTASY IDLE RPG

You are the lead architect, senior game systems engineer, senior full-stack engineer, senior React/Next.js engineer, UI/UX designer, database architect, QA engineer, and technical director for this project.

We are building a production-quality browser-based dark medieval fantasy idle RPG.

The game may take structural inspiration from sophisticated browser idle RPGs such as Runeswick, Melvor Idle, RuneScape-style progression systems, traditional dungeon RPGs, and modern RPG dashboards, but it MUST NOT copy their source code, exact UI, layout, artwork, names, text, icons, quest content, game balance, or proprietary mechanics.

Create an ORIGINAL game with its own visual language, information architecture, combat system, progression systems, economy, enemies, items, regions, lore, interfaces, and user experience.

This must NOT look like:

* a generic AI dashboard
* a SaaS admin template
* a Tailwind starter project
* a shadcn demo
* a generic card grid
* a mobile app stretched onto desktop
* a WordPress RPG template
* a CryptoBlades clone
* a Runeswick visual clone
* a collection of unrelated UI components

The finished product should feel like a professionally art-directed commercial RPG that has been deliberately designed.

---

# LONG-TERM PRODUCT STRATEGY

The project must support:

WEB

Next.js + React

and later:

MOBILE

React Native + Expo

Therefore:

DO NOT place core game calculations directly inside React components.

DO NOT make the web frontend responsible for authoritative game logic.

DO NOT create architecture that requires rewriting the entire game for React Native later.

Core game systems must be reusable.

Use a monorepo-friendly architecture.

Recommended conceptual structure:

apps/
web/
mobile/
api/

packages/
game-engine/
game-data/
api-client/
shared-types/
validation/
ui-tokens/
utilities/

The mobile application does NOT need to be created during the early phases.

However, every architectural decision must consider future React Native compatibility.

---

# RECOMMENDED STACK

WEB

Next.js
React
TypeScript
App Router

STYLING

Tailwind CSS

Use custom components and design tokens.

shadcn/ui may be used internally for accessibility primitives, dialogs, popovers, sheets, dropdowns, etc., but the final interface must NOT visually resemble default shadcn.

STATE

Zustand for client-side interactive game state where appropriate.

TanStack Query for server state.

BACKEND

Use a proper API/service architecture.

Prefer:

Next.js server functionality initially

or

a dedicated Node.js backend if separation becomes necessary.

DATABASE

PostgreSQL

ORM

Prisma

VALIDATION

Zod

AUTHENTICATION

Secure account authentication.

Guest play should also be supported.

CACHE / JOBS

Redis when actually necessary.

STORAGE

Object storage such as Cloudflare R2 for game assets when appropriate.

REALTIME

WebSockets only where needed.

Do not introduce infrastructure merely because it sounds sophisticated.

---

# CRITICAL ARCHITECTURE RULE

Separate:

GAME RULES

from

GAME PRESENTATION.

Example:

BAD:

Combat damage calculation inside:

CombatPanel.tsx

GOOD:

packages/game-engine/combat/calculateDamage.ts

Then:

CombatPanel.tsx

only renders the result/state.

Core systems must eventually be reusable by:

Next.js web app
React Native app
server simulations
automated tests
admin tools

---

# DEVELOPMENT POLICY

You MUST build this project sequentially.

Do NOT jump ahead.

Do NOT attempt to build the entire game at once.

Complete each phase properly before starting the next one.

At the end of every phase:

run the application

run linting

run TypeScript checks

run relevant tests

inspect browser console

inspect server logs

check responsive behavior

check accessibility basics

verify loading states

verify empty states

verify error states

remove temporary hacks

document what changed

Only proceed when the current phase is stable.

Never hide errors merely to make tests pass.

Never disable TypeScript strictness to silence problems.

Never use `any` unnecessarily.

Never leave large TODO placeholders pretending a feature is complete.

---

# PHASE 0 — PRODUCT FOUNDATION AND ARCHITECTURE

Before building screens, define the actual game.

Create project documentation covering:

game identity

game pillars

target audience

core progression loop

short-session loop

daily loop

long-term progression loop

combat philosophy

skill philosophy

loot philosophy

economy philosophy

difficulty philosophy

collection philosophy

retention systems

offline progression

character progression

equipment progression

regions

dungeons

bosses

quests

achievements

collections

tasks

NPC interactions

crafting

resource gathering

inventory

shops

currencies

future multiplayer possibilities

future mobile strategy

Do NOT make blockchain, NFT, crypto, wallet, or token systems part of the foundation unless explicitly requested later.

The game must be enjoyable independently of monetization.

Create architecture documentation showing:

frontend

backend

database

game engine

shared packages

API boundaries

save system

offline progression system

event system

content definitions

player state

server authority boundaries

future mobile app integration

Define game-domain entities before coding.

Examples:

Player

Character

Skill

SkillAction

Item

Equipment

InventoryItem

Enemy

CombatEncounter

Region

Dungeon

DungeonRun

Quest

QuestProgress

Achievement

CollectionEntry

Task

Shop

Currency

Buff

StatusEffect

Recipe

LootTable

Drop

SaveSnapshot

GameEvent

Do not over-normalize prematurely.

---

# PHASE 1 — VISUAL DIRECTION, UX ARCHITECTURE AND DESIGN SYSTEM

DO NOT begin by creating random React pages.

First establish the visual identity.

The game should have a premium dark medieval fantasy interface.

Visual influences may include:

aged forged steel

charcoal

blackened iron

dark leather

weathered parchment

subtle bronze

cold desaturated stone

smoky atmosphere

restrained ember highlights

engraved medieval geometry

However:

NO excessive gradients.

NO neon cyberpunk effects.

NO generic purple SaaS gradients.

NO glassmorphism everywhere.

NO excessive glowing borders.

NO giant rounded cards everywhere.

NO random particles covering readability.

NO fantasy ornamentation that makes information difficult to scan.

The interface should feel sophisticated, grounded, functional, atmospheric, and game-focused.

Create:

color tokens

surface tokens

border tokens

spacing system

typography hierarchy

icon treatment

shadow system

motion language

button hierarchy

input styles

tooltip styles

popover styles

modal styles

panel styles

table styles

inventory-slot styles

rarity treatment

combat-state treatment

progress bars

XP bars

health bars

resource counters

navigation states

notifications

toast system

loading states

skeleton states

empty states

disabled states

danger states

success states

Rarity must not depend only on colors.

Use combinations of:

border craftsmanship

engraving

material treatment

icon framing

micro-details

subtle animation

rather than huge colored glows.

---

# PHASE 1A — INFORMATION ARCHITECTURE

Design the complete desktop navigation before implementing individual game systems.

Recommended major sections:

Character

Adventure

World

Skills

Inventory

Equipment

Crafting

Dungeons

Quests

Tasks

Collections

Achievements

Shop

Settings

Do not copy Runeswick navigation exactly.

Create an original hierarchy optimized for our systems.

Desktop should prioritize information density.

Possible structure:

TOP BAR

Game logo

character level

gold

important resources

notifications

profile

settings

LEFT NAVIGATION

major game categories

CENTER WORKSPACE

active game system

RIGHT CONTEXT PANEL

current action

character summary

active buffs

queue

timers

relevant contextual information

Do NOT force every screen to use the exact same panel layout.

Design according to task.

---

# PHASE 1B — RESPONSIVE UX

Desktop is the primary experience.

Create purposeful responsive behavior.

Desktop:
full navigation
multi-panel game workspace
dense information

Tablet:
collapsible secondary panels
reduced simultaneous information

Mobile web:
bottom or drawer navigation
single task-focused view
contextual sheets

Do NOT simply shrink desktop.

React Native will later receive its own native layout.

---

# PHASE 1C — BUILD THE GAME SHELL

Only after the design direction is established, implement:

application shell

top navigation

side navigation

workspace

context panel

global command/menu behavior if appropriate

tooltips

dialogs

dropdowns

notifications

skeleton loading

responsive layout

Create mock game data ONLY for validating UI.

No actual game systems yet.

The shell must already look like a premium game before Phase 2 begins.

---

# PHASE 2 — SHARED GAME ENGINE FOUNDATION

Create:

packages/game-engine

packages/game-data

packages/shared-types

Core engine must be framework independent.

No React imports.

No Next.js imports.

No browser-only APIs.

Create deterministic utilities for:

XP calculation

level calculation

experience thresholds

random rolls

weighted loot selection

stat calculation

equipment modifiers

timing calculations

offline progression

resource rewards

combat formulas

cooldown calculations

duration modifiers

buff modifiers

Implement deterministic seeded randomness where tests require predictable outcomes.

Create tests for every foundational formula.

---

# PHASE 2A — GAME EVENT SYSTEM

Create an event-driven domain architecture.

Examples:

ACTION_STARTED

ACTION_COMPLETED

RESOURCE_GAINED

ITEM_GAINED

ITEM_REMOVED

XP_GAINED

LEVEL_UP

ENEMY_KILLED

PLAYER_DEFEATED

QUEST_PROGRESS

QUEST_COMPLETED

ACHIEVEMENT_UNLOCKED

DUNGEON_STARTED

DUNGEON_COMPLETED

EQUIPMENT_CHANGED

ITEM_CRAFTED

Do not tightly couple:

combat

quests

achievements

collections

tasks

For example:

enemy defeated

should emit:

ENEMY_KILLED

Then:

quest system

task system

achievement system

bestiary system

can respond independently.

---

# PHASE 3 — AUTHENTICATION AND CHARACTER SYSTEM

Implement:

registration

login

logout

secure sessions

guest mode

character creation

character selection

multiple character slots if appropriate

character deletion with confirmation

character rename rules

server save

guest local save

Guest progression should be stored locally.

Registered progression should be persisted server-side.

Design account migration capability so a guest can later create an account without losing progression.

Create character metadata:

name

createdAt

lastPlayedAt

playtime

combatLevel

totalLevel

region

avatar

optional class/archetype if used

---

# PHASE 4 — SAVE SYSTEM

Implement robust persistence before adding many game systems.

Create:

autosave

manual save

versioned save schema

migration system

last-save timestamp

server validation

save corruption detection

safe fallback

offline calculation timestamp

Import/export may be supported for guest mode if appropriate.

Never trust arbitrary client-provided progression.

The server must validate critical progression changes.

Design save versions:

v1

v2

v3

etc.

Provide migration functions between schema versions.

---

# PHASE 5 — CHARACTER PROGRESSION

Implement the first real progression loop.

Create:

XP

levels

character statistics

skill levels

total level

progress bars

level-up notification

unlock checks

Define consistent XP curves.

Do not balance through random guesses.

Create a central progression configuration.

Provide development tools for:

granting XP

setting level

resetting skill

simulating progression

---

# PHASE 6 — FIRST GATHERING SKILLS

Implement only several foundational skills first.

For example:

Mining

Woodcutting

Fishing

Each skill should support:

actions

level requirements

action duration

XP rewards

resource rewards

rare drops

tool requirements

tool bonuses

unlock progression

active action state

stop action

offline progress

action queue only if intentionally designed

Example loop:

Choose Mining

Select Copper Vein

Start mining

Timer runs

Receive ore

Receive XP

Automatically repeat

Unlock better veins

Do not implement 20 skills at once.

Perfect the system with 2–3 skills first.

---

# PHASE 7 — INVENTORY

Create a premium inventory interface.

Features:

grid/list views if useful

search

filters

categories

sorting

stackable items

non-stackable equipment

quantity display

item tooltips

rarity

item comparison

quick actions

item locking

favorite items if appropriate

sell protection

inventory capacity if part of design

Create item definitions in data packages rather than JSX.

Items should contain standardized metadata.

---

# PHASE 8 — EQUIPMENT AND PLAYER STATS

Implement equipment slots.

Examples:

weapon

offhand

helmet

chest

gloves

legs

boots

amulet

ring

cape or equivalent if appropriate

tool slots separately

Equipping an item recalculates derived stats.

Never permanently mutate base player stats because an item is equipped.

Calculate:

base stats

*

equipment modifiers

*

buffs

*

passives

=

derived stats.

Create detailed comparison UI:

equipped item

vs

selected item

show:

improvements

reductions

special bonuses

requirements

durability if used

---

# PHASE 9 — CRAFTING AND PRODUCTION

Now implement production.

Potential systems:

Smithing

Cooking

Fletching

Alchemy

Runecrafting

Crafting

Create recipes as data.

Each recipe defines:

requirements

ingredients

duration

output

XP

chance-based bonuses if applicable

unlock level

Create production queue behavior only if it improves gameplay.

Ensure recipes interact correctly with:

inventory

XP

quests

tasks

achievements

collections

---

# PHASE 10 — COMBAT SYSTEM

Build combat as its own game-engine module.

Do not build combat logic inside React.

Define:

health

attack

defense

accuracy

evasion

attack speed

critical chance

critical damage

damage ranges

resistances if used

status effects

healing

food

buffs

enemy abilities

player abilities

Combat should be deterministic enough to understand but variable enough to remain engaging.

Create a clear combat timeline.

Example:

combat begins

attack timer

hit calculation

damage calculation

enemy response

status-effect tick

death check

loot

XP

next enemy

Support:

manual fight

auto repeat

food

auto-eat if unlocked

retreat

combat log

enemy preview

estimated danger

death consequences

Do not add multiplayer PvP.

---

# PHASE 11 — ENEMIES AND BESTIARY

Create data-driven enemies.

Enemy definitions should include:

name

region

level

health

stats

attack style

abilities

loot table

XP reward

rarity

lore snippet

bestiary metadata

Create enemy categories:

normal

elite

rare

boss

Do not merely scale enemy HP endlessly.

Introduce mechanics and identities.

Create bestiary progression:

unknown enemy

discovered

defeated

kill count

drops discovered

completion status

---

# PHASE 12 — REGIONS AND WORLD PROGRESSION

Create an original fantasy world structure.

Each region should contain:

visual identity

recommended level

skills/resources

enemy pool

quests

NPCs if used

dungeon

boss

special rewards

unlock conditions

Example progression style:

starter frontier

dark woodland

ruined province

mountain stronghold

haunted marsh

forgotten citadel

volcanic wasteland

ancient endgame region

Names must be original.

Do not create generic "Forest 1 / Cave 2" progression.

---

# PHASE 13 — DUNGEONS

Implement dungeon runs.

Each dungeon may include:

entry requirements

keys

multiple encounters

elite encounters

boss

unique loot

first-clear reward

repeat rewards

difficulty modifiers later

Dungeon UI should show:

progress

current encounter

remaining encounters

boss preview

combat state

run rewards

run history

Do not make dungeons merely another enemy-selection screen.

---

# PHASE 14 — LOOT AND ITEMIZATION

Create a real itemization philosophy.

Rarities may include:

Common

Uncommon

Rare

Epic

Legendary

but rarity must mean more than color.

Higher rarity should involve:

better stat combinations

unique passives

distinct artwork

specialized builds

better craftsmanship

rare acquisition sources

Do not simply multiply stats by rarity.

Create:

equipment tiers

unique items

boss drops

craftable items

quest rewards

rare gathering drops

Build loot tables using centralized weighted definitions.

---

# PHASE 15 — QUEST SYSTEM

Implement structured quests.

Support objective types such as:

kill

collect

craft

gather

visit region

complete dungeon

equip item

reach skill level

interact with NPC

Create:

quest chains

requirements

progress tracking

rewards

quest journal

completed history

Do not create generic filler quests only.

Important quests should reveal world lore and unlock mechanics.

---

# PHASE 16 — TASKS AND DAILY SYSTEMS

Create optional repeatable content.

Potential:

daily tasks

weekly contracts

monster contracts

gathering orders

crafting orders

Do not use manipulative FOMO.

A missed day should not permanently disadvantage the player.

Provide meaningful but controlled rewards.

---

# PHASE 17 — ACHIEVEMENTS

Achievements should recognize:

progression

combat milestones

skill milestones

collections

rare events

boss kills

economic milestones

hidden challenges

Provide:

achievement categories

completion percentages

points if useful

cosmetic rewards

titles

Do not award an achievement every two minutes.

---

# PHASE 18 — COLLECTIONS

Create collection interfaces for:

items

enemies

bosses

dungeons

crafted items

rare drops

lore

titles

possibly equipment sets

Make collection completion visually satisfying.

Unknown content may appear as silhouettes or question marks where appropriate.

---

# PHASE 19 — SHOP AND ECONOMY

Create a controlled economy.

Define:

currency sources

currency sinks

shop prices

repair costs

crafting costs

upgrades

convenience purchases

special currencies if needed

Do not introduce currencies without a purpose.

Document every currency:

how earned

where spent

why it exists

inflation risk

economy sink

Create developer simulations to estimate:

gold generated per hour

gold consumed per hour

progression costs

shop affordability

---

# PHASE 20 — ITEM UPGRADES AND DURABILITY

Only add these systems if they improve the game.

Possible upgrade system:

+1

+2

+3

etc.

Costs must scale predictably.

Durability should:

create economic decisions

not become constant annoyance

be easy to understand

provide repair options

Broken equipment must never silently destroy itself unless intentionally designed and clearly communicated.

---

# PHASE 21 — MAGIC, ABILITIES AND STATUS EFFECTS

Create extensible effects.

Examples:

bleed

burn

poison

stun

slow

armor reduction

healing-over-time

damage-over-time

shield

accuracy buff

evasion buff

critical buff

Implement effects in the shared game engine.

Do not hardcode every effect separately inside combat UI.

---

# PHASE 22 — NPCS AND WORLD INTERACTION

Introduce important NPCs only after the core game works.

NPCs may provide:

quests

shops

crafting

dialogue

region lore

upgrades

contracts

NPC dialogue must be concise and atmospheric.

Avoid massive AI-generated exposition dumps.

---

# PHASE 23 — OFFLINE PROGRESSION

Implement carefully.

When a player leaves:

store:

active action

start timestamp

last validated state

When returning:

calculate elapsed time

determine valid completed actions

apply limits

calculate rewards

run progression events

display an offline summary

Example:

While you were away:

Mining XP +12,440

Iron Ore +384

Coal +41

Mining Level 31 → 33

Rare Drop: Ancient Fragment ×1

Prevent clock manipulation exploits.

Critical calculations should be validated server-side for registered accounts.

---

# PHASE 24 — PREMIUM DASHBOARD UX

Once the systems exist, redesign the dashboard around real gameplay.

Create contextual information.

Examples:

If mining:

show:

active resource

time per action

XP/hour estimate

resource/hour estimate

tool bonus

next unlock

If fighting:

show:

player HP

enemy HP

attack timers

buffs

food

loot

combat log

If crafting:

show:

recipe

ingredients

duration

queue

expected XP

remaining resources

Avoid generic cards showing meaningless statistics.

Every UI element must answer an actual player question.

---

# PHASE 25 — MOTION AND GAME FEEDBACK

Only after usability is stable, add premium polish.

Use subtle animation for:

XP gains

level ups

loot acquisition

equipment changes

damage

healing

boss appearance

rare drops

achievement unlocks

navigation transitions

Do not animate everything.

Avoid distracting continuous motion.

The game must remain usable for long sessions.

Respect reduced-motion preferences.

---

# PHASE 26 — AUDIO ARCHITECTURE

Prepare optional sound support.

Possible sounds:

navigation

loot

craft completion

combat hit

critical hit

level up

achievement

boss encounter

Do not autoplay loud audio.

Provide independent controls for:

master volume

music

effects

mute

---

# PHASE 27 — ADMIN / GAME MASTER TOOLS

Create a protected development/admin interface.

Never expose admin capabilities to normal users.

Features:

player lookup

player state viewer

grant/remove items

grant/remove currency

set skill XP

set level

unlock region

reset quest

grant dungeon key

simulate offline progress

inspect saves

inspect game events

inspect economy data

inspect combat calculations

spawn enemy

toggle god mode in local/dev environments

No production admin shortcut may depend only on a frontend flag such as:

localStorage.admin=true

Server authorization is mandatory.

---

# PHASE 28 — ANALYTICS AND BALANCING TOOLS

Create internal tools for analyzing:

time to level

XP/hour

currency/hour

drop rates

boss completion rates

death rates

item usage

skill popularity

region progression

quest completion

Create simulation scripts.

For example:

simulate 10,000 fights

calculate:

win rate

average fight duration

food consumed

gold earned

rare drops

Never manually balance everything solely by playing a few test fights.

---

# PHASE 29 — SECURITY

Audit:

authentication

authorization

save manipulation

API validation

rate limiting

admin access

item duplication

currency duplication

offline-time manipulation

replay attacks

request tampering

database constraints

Never trust the browser.

Critical inventory/currency/progression changes must be validated.

---

# PHASE 30 — PERFORMANCE

Profile before optimizing.

Check:

React renders

large inventories

large loot tables

combat timers

animation cost

database queries

API payloads

image loading

bundle size

dynamic imports

cache behavior

Do not update the entire React tree every combat tick.

Keep high-frequency timers isolated.

---

# PHASE 31 — ACCESSIBILITY

Ensure:

keyboard navigation

visible focus

semantic elements

tooltips accessible

color not sole rarity indicator

sufficient contrast

screen-reader labels

reduced-motion support

scalable text

accessible dialogs

Do not sacrifice accessibility for the fantasy aesthetic.

---

# PHASE 32 — RESPONSIVE WEB FINALIZATION

Audit:

1920 desktop

1440 desktop

1366 desktop

1024 tablet

768 tablet

mobile web widths

No clipping.

No unreadable tables.

No microscopic controls.

No horizontal scrolling unless intentional.

Desktop should remain the richest experience.

---

# PHASE 33 — MOBILE API READINESS

Before starting React Native:

audit every system.

Confirm the mobile app can obtain game state via APIs without needing DOM logic.

Create shared:

types

game formulas

validation

API client

domain constants

content definitions where appropriate

Do not share web-only UI components with React Native.

Share logic, not DOM.

---

# PHASE 34 — REACT NATIVE APPLICATION

Create:

apps/mobile

using:

React Native

Expo

TypeScript

The mobile interface should be redesigned for touch.

Do NOT render the website inside a WebView.

Do NOT replicate desktop panels one-for-one.

Create native navigation.

Recommended conceptual structure:

bottom tabs

Home

Adventure

Character

Inventory

More

Then nested screens.

Mobile gameplay should emphasize:

quick actions

large touch targets

swipe-safe interactions

bottom sheets

compact combat interface

offline summaries

notifications

native-safe-area behavior

Reuse:

game engine

types

API client

validation

content data

DO NOT duplicate formulas.

---

# PHASE 35 — MOBILE QUALITY

Implement:

secure authentication storage

network retry

offline-safe reads

loading states

push-notification architecture

background-state handling

deep linking if useful

tablet support

Android testing

iOS testing

performance profiling

Never assume behavior is identical across platforms.

---

# PHASE 36 — CONTENT EXPANSION

Only after all foundational systems are stable, expand:

regions

skills

enemies

bosses

items

equipment sets

quests

dungeons

crafting recipes

achievements

collections

NPCs

Do not expand content before systems are maintainable.

Create data authoring conventions.

Content must be easy to add without modifying application logic.

---

# PHASE 37 — FINAL ART DIRECTION PASS

Replace placeholders systematically.

Establish coherent artwork specifications for:

characters

enemies

items

weapons

armor

regions

bosses

skills

icons

background scenes

illustrations

All art must follow one art direction.

Avoid mixing:

photorealistic assets

cartoon icons

random AI art styles

stock illustrations

generic game icons

Every asset should belong to the same universe.

---

# PHASE 38 — FINAL UX AUDIT

Evaluate the game as a new player.

Test:

first 5 minutes

first 30 minutes

first hour

returning next day

first combat

first crafting action

first level up

first death

first boss

first dungeon

first rare drop

first equipment upgrade

The player should always understand:

what am I doing?

why am I doing it?

what will I receive?

what unlocks next?

what should I do next?

Do not rely on walls of tutorial text.

Teach through interface and progressive disclosure.

---

# PHASE 39 — QA

Perform full regression testing.

Test:

authentication

guest mode

saving

loading

offline progression

inventory

equipment

skills

crafting

combat

loot

regions

dungeons

quests

tasks

achievements

collections

shops

economy

upgrades

responsive layouts

browser refresh

multiple tabs

network failure

expired session

invalid API input

slow connections

empty inventories

large inventories

long offline duration

very high player levels

edge-case combat calculations

---

# PHASE 40 — PRODUCTION DEPLOYMENT

Configure:

production environment variables

database migrations

secure secrets

rate limits

logging

error monitoring

analytics

backups

asset storage

CDN

production caching

security headers

deployment pipeline

Do not deploy development shortcuts.

Do not expose source maps unnecessarily if sensitive.

Do not expose secrets to client bundles.

---

# PHASE 41 — POST-LAUNCH SYSTEM

Prepare:

bug reporting

player feedback

balance changes

content updates

database migrations

save migrations

patch notes

analytics dashboards

feature flags

live configuration where appropriate

Never make irreversible database changes without backups/migrations.

---

# REQUIRED DEVELOPMENT STYLE

Whenever implementing a phase:

FIRST:

inspect existing architecture

understand related systems

identify what can be reused

identify risks

THEN:

design the implementation

THEN:

write code

THEN:

test

THEN:

polish

Do not regenerate unrelated files.

Do not replace working architecture just because another approach is easier.

Do not add unnecessary libraries.

Do not create duplicate utilities.

Search the project before creating a new abstraction.

---

# UI QUALITY STANDARD

Before accepting any screen, ask:

Does this look like an actual game?

Would a senior game UI designer approve this?

Is the hierarchy immediately understandable?

Does every component have a reason to exist?

Does the interface communicate state clearly?

Would someone recognize this as our game's visual identity without the logo?

If not:

redesign it.

---

# ANTI-GENERIC DESIGN RULES

Never blindly use:

three-column feature cards

four identical stat cards

huge hero gradients

generic icon circles

random glass cards

massive border-radius values everywhere

purple-blue gradients

excessive backdrop blur

generic dashboard templates

placeholder AI copy

meaningless charts

unnecessary badges

repetitive cards

Every layout must be designed specifically for the game mechanic being displayed.

Mining should look like Mining.

Combat should look like Combat.

Inventory should behave like an RPG inventory.

Dungeons should feel like dungeon progression.

Equipment should resemble a character loadout.

Collections should feel like a codex.

Quests should feel like a journal.

---

# GAME DATA RULE

Avoid code such as:

if (item === "Iron Sword") ...

Instead use structured data:

items/

weapons.ts

armor.ts

materials.ts

food.ts

questItems.ts

Likewise:

enemies/

regions/

dungeons/

quests/

achievements/

recipes/

skills/

lootTables/

Game systems should consume structured data.

This allows hundreds of content entries without rewriting logic.

---

# TESTING REQUIREMENT

Critical game formulas require unit tests.

Examples:

XP thresholds

level calculations

combat damage

hit chance

critical damage

loot weighting

equipment stats

offline rewards

recipe consumption

inventory capacity

quest progression

achievement progression

currency calculations

Tests should include:

normal conditions

boundaries

minimum values

maximum expected values

invalid inputs

edge cases

---

# FINAL PRODUCT EXPECTATION

The final application must feel like a commercial dark-fantasy browser RPG rather than a web development demonstration.

The experience should combine:

deep idle progression

meaningful equipment

resource gathering

crafting

combat

bosses

dungeons

quests

collections

achievements

world progression

strong long-term progression

excellent information architecture

premium dark fantasy UI

fast responsive interactions

reliable persistence

future native mobile support

The architecture must support years of new content without becoming unmaintainable.

Do NOT attempt all phases in one response or one coding session.

Start with:

PHASE 0

and complete it properly.

At the end of Phase 0 provide:

completed work

architecture decisions

directory structure

important domain models

risks discovered

tests performed

remaining issues

recommended Phase 1 actions

Then STOP.

Wait for the explicit instruction:

CONTINUE PHASE 1

before proceeding.
