# PHASE 1 — VISUAL DIRECTION, UX ARCHITECTURE AND DESIGN SYSTEM

## Visual Design System — `@premium-rpg/ui-tokens`

The design system is implemented as a framework-independent package of TypeScript tokens under
`packages/ui-tokens`. All values are plain data — no DOM, CSS, or framework imports — enabling
reuse by web, React Native, server simulations, and admin tools.

### Color Palette
A desaturated dark medieval fantasy palette anchored in forged steel, charcoal, blackened iron,
dark leather, weathered parchment, subtle bronze, cold desaturated stone, and restrained ember
highlights. No excessive gradients, neon, purple SaaS gradients, glassmorphism, glowing borders,
random particles, or giant rounded cards.

**Base Neutrals**
- `smoke` / `night` — deepest page / overlay background
- `charcoal` — primary app chrome / background
- `blackened` / `iron` — raised surfaces / borders
- `steel` — structural borders
- `stone` / `mist` — muted text / secondary labels
- `coldStone` — muted interactive text
- `bone` / `parchment` — primary body text / headings
- `leather` / `leatherLight` — panel accents

**Accent Colors**
- `subtleBronze` / `bronze` — primary interactive accent, rarity; secondary: bronzeLight
- `ember` / `emberLight` — rare / dangerous highlights; used sparingly as restrained ember
- `amber` — warning / category accent
- `steelBlue` — status info
- `blood` / `bloodBright` — danger
- `verdant` / `verdantBright` — success

### Surfaces
- `base` / `page` — page background (darkest, smoke/night)
- `panel` — main workspace panels
- `raised` — topbar, chrome, sidebar
- `overlay` — modal scrim, menu backdrops
- `inset` — innermost wells / input backgrounds
- `banner` — top navigation banner

### Border System
- Widths: hairline/thin (1px), standard (1px), thick (2px), heavy (3px)
- Colors: steel, iron, bronze, ember, leather, bone, dim/faint parchment dark
- Styles: solid, double, inset, outset

### Typography Hierarchy
- **Display**: Cinzel, 32px (base 700), line-height 1.15, tracking caps, bone
- **Title**: 24px semibold cinzel, tracking caps, bone
- **Subtitle**: 20px medium cinzel, tracking caps, bronze
- **Section**: 12px Inter semibold, 1.3 line-height, coldStone, wider tracking
- **Body**: 13px Crimson Text regular, 1.5 line-height, parchment
- **BodyBold**: 13px Crimson Text bold, parchment
- **Mono**: 11px IBM Plex Mono, coldStone
- **Label**: 0.875px UI medium, 1.3 line-height, tracking caps, coldStone

Line heights: tight (1.15), UI (1.3), body (1.5), loose (1.7)
Letter spacing: tight (-0.01em), normal (0), caps (0.06em), wide (0.12em)

### Rarity Treatment (multi-dimensional)
Rarity must not depend only on color. Each rarity includes coordinated border craftsmanship,
engraving material treatment, icon framing, micro-detail, and subtle animation state.

- **Common**: iron, steel border, single frame, flat iron appearance, no engraving
- **Uncommon**: coldStone/mist accent, steel border, notched frame, quenched steel material
- **Rare**: bronze, double-engraved border, bronze material, notched frame
- **Epic**: amber, gilded border, double frame, sheen animation, gilded steel material
- **Legendary**: emberLight/ember, ornate double frame, shimmer animation, ember-forged material

Each rarity defines: label, color, bright, border, engraving, material, frame, animation, glow,
stain. Order: common < uncommon < rare < epic < legendary.

### Combat-State Treatment
- Health bars: track/rgba fill with rendered colored fill; ember for blood / bloodBright
- Damage: ember-bright, text e06a54
- Heal: verdant-bright, text b6d17f
- Shield: steelBlue, rgba fill
- Status effects: bleed (e06a54), burn (ember), poison (sickly), stoneline, slow (steelBlue),
  armor_reduction (mist), healing_over_time (verdant-burn), d_over_time (e06a54),
  accuracy/evasion/critical buffs

### Status Treatments
- neutral, info, success, warning, danger, ember, disabled — each with background, color,
  border, and optional opacity

### Progress / Bar Tokens
Health: rgba track with ember/ blood fill. XP: rgba track with bronze/ bronzeLight fill.
Resource: rgba track with mist/ coldStone fill. Energy: rgba track with amber/ d9ad62 fill.
Bar geometry: sm (4px), md (6px), lg (8px) heights.

### Motion Language
- Instant: 60ms
- Fast: 120ms
- Base: 180ms (standard interactive)
- Slow: 260ms
- Deliberate: 400ms
- Easings: standard cubic-bezier(0.22,1,0.36,1), decelerate, accelerate, linear

### Responsive Breakpoints
- sm: 640px, md: 768px, lg: 1024px, xl: 1280px, xxl: 1536px

Mobile: max-width 639px; Tablet: 640–1023px; Desktop: min-width 1024px; Wide: 1280+; Ultra-wide: 1536+.

### Information Architecture (Desktop)
Top Bar: game logo, character level, gold, important resources, notifications, profile, settings
Left Navigation: Character | Adventure | World | Skills | Inventory | Equipment | Crafting |
Dungeons | Quests | Tasks | Collections | Achievements | Shop | Settings (persistent on desktop)
Center Workspace: active game system panel
Right Context Panel: current action / character summary / active buffs / queue / timers /
relevant contextual information

Responsive tiers:
- **Desktop**: full navigation, multi-panel workspace, dense information
- **Tablet**: collapsible secondary panels, reduced simultaneous information
- **Mobile web**: bottom or drawer navigation, single task-focused view, contextual sheets

Never simply shrink desktop — each tier has purposeful, redesigned layout.

### Component States
All interactive components support: neutral / hover / active / disabled / loading / success /
danger / info states with coordinated color/border/background from the status tokens.

### Component Token Sets (semantic)
- **Buttons**: default / primary / secondary / danger / success / ember accent; radius per size;
  text/border/background for each state
- **Inputs**: border hairline / standard; focus ring bronze; disabled opacity 0.6; error /
  danger border; success/amber warning border
- **Tooltips/Popovers**: background panel with ember or info tint; text parchment; fade enter;
  subtle arrow pointing at trigger
- **Modals**: panel raised shadow, ember or info scrim overlay, focus trap, escape key, close X
- **Tables**: striping ember/ smoke/ parchment; zebra with 0.04 opacity; hover state ember tint;
  sticky headers
- **Progress Bars**: track fill with subtle texture; bar fill gradient or single color per type;
  accessible aria-valuetext; segment gap spacing
- **Skeleton**: shimmer animation from loading tokens; gray mist color; pulse for energy/ resource;
  width per content type; height per line / avatar / avatar group
- **Empty States**: centered illustration / icon (md 48px); muted coldStone text; parchment hint;
  suggested action if applicable
- **Notifications/Toast**: bottom slide-in or top bar; icon from notify tokens; ember/danger /
  success background; auto-dismiss after deliberate 4s; manual dismiss button; grouping;
  progress bar for ongoing actions
- **Dropdowns/Selects**: panel raised shadow; single/double border style based on rarity tier;
  keyboard navigation; escape to close; checkmark styling
- **Pagination**: ember / smoke / parchment striping; current page ember highlight; prev/next
  disabled state coldStone; total display of item count
- **Tabs**: single border default; active ember border; hover ember background; disabled coldStone
- **Avatar**: round or shield frame; ember / bronze / parchment fill per rarity; initials or icon;
  border pulse for new/unread indicator
- **Notification/Toast**: ember/danger/success/amber background; icon from status-effect icons;
  body parchment text; action button ember; auto-dismiss timer

### Anti-Generic Design Rules
- Never: three-column feature cards, four identical stat cards, huge hero gradients, generic
  icon circles, random glass cards, massive border-radius everywhere, purple-blue gradients,
  excessive backdrop blur, generic dashboard templates, placeholder AI copy, meaningless charts,
  unnecessary badges, repetitive cards
- Every layout designed specifically for the game mechanic being displayed:
  Mining should look like Mining. Combat should look like Combat. Inventory behaves like an RPG
  inventory. Dungeons feel like dungeon progression. Equipment resembles a character loadout.
  Collections feel like a codex. Quests feel like a journal.