# Phase 37 — Final Art Direction Pass

## Spec Reference (MASTER_GAME_SPEC.md:2315-2357)

> **Replace placeholders systematically.**
> 
> **Establish coherent artwork specifications for:**
> characters, enemies, items, weapons, armor, regions, bosses, skills, icons, background scenes, illustrations.
> 
> **All art must follow one art direction.**
> 
> **Avoid mixing:**
> - photorealistic assets
> - cartoon icons
> - random AI art styles
> - stock illustrations
> - generic game icons
> 
> **Every asset should belong to the same universe.**

## Art Direction Specification

### Visual Style: Dark Fantasy Etchings

**Theme:** Monochrome ink wash with selective color accents, resembling pen-and-ink illustrations in a dark fantasy setting.

### Color Palette (constrained to `ui-tokens` PALETTE)

All assets must use colors from the following palette (sourced from `packages/ui-tokens`):

| Color Name | Hex Code | Usage |
|---|---|---|
| night | `#131110` | Backgrounds, deepest shadows |
| charcoal | `#1a1816` | Secondary surfaces, mid-shadows |
| iron | `#2c2a26` | Borders, weapon edges, armor details |
| mist | `#8a857d` | Disabled states, muted text, subtle shadows |
| bone | `#e6dcc2` | Highlights, bone/ivory elements, UI backgrounds |
| ember | `#d4692f` | Primary accents, glowing effects, fire |
| emberLight | `#e08a44` | Secondary accents, hover states |
| bloodBright | `#b0432f` | Danger, wounds, critical effects |
| bronzeLight | `#c9a264` | Ancient/metallic elements, relics |
| verdantBright | `#87a76b` | Nature elements, plants, alchemy |
| amber | `#c2994f` | Gold, treasure, warm highlights |

### Prohibited Styles

- **No photorealistic assets** — all art must have a consistent illustrative style
- **No cartoon icons** — no simplified or childish visual style
- **No random AI art styles** — each asset must be hand-curated to match the direction
- **No stock illustrations** — all assets must be original or significantly modified
- **No generic game icons** — no generic fantasy tropes without unique treatment

### Asset Specifications

| Asset Type | Style Requirements | Size/Resolution |
|---|---|---|
| **Characters** | Ink wash style, detailed line work, selective color (ember/bloodBright) | 64×64 to 256×256 px |
| **Enemies** | Same ink wash style, bestiary-like illustrations | 48×48 to 128×128 px |
| **Items** | Isolated icons with ember accent, clear silhouette | 32×32 to 64×64 px |
| **Weapons** | Detailed with iron/embrust highlights | 64×64 to 128×128 px |
| **Armor** | Piecewise illustrations showing components | 64×64 px |
| **Regions** | Map-style illustrations with color-coded biomes | 128×128 to 256×256 px |
| **Bosses** | Dramatic ink wash with selective ember accent | 128×128 to 256×256 px |
| **Skills** | Small icons with ember color accent | 24×24 to 32×32 px |
| **Icons** | Consistent line-weight, ember color for actionable items | 16×16 to 32×32 px |
| **Background Scenes** | Full-width ink wash with selective color | 1920×1080 px (fullscreen) |
| **Illustrations** | Chapter/header illustrations in same style | 800×600 px min |

### Implementation Notes

1. **ui-tokens PALETTE integration** — All UI colors in the React Native app (`apps/mobile`) must reference the PALETTE above, not hardcoded values. The `theme.ts` already maps PALETTE names to hex values.

2. **No new assets in this session** — This specification documents the direction for future asset production. The onboarding screen (`OnboardingScreen.tsx`) uses PALETTE colors instead of image assets to prototype quickly.

3. **Consistency check** — All future asset creation must reference this spec. Any asset that violates the "no photorealistic/carton/AI/stock/generic" rules must be revised.

4. **Legacy placeholders** — The current emoji/text placeholders in the mobile app (item icons as single-char text, region badges with `✓`/`Lock`) should be replaced once assets are produced, following this direction.

### Example: Item Icon Specification

- **Style:** Ink wash silhouette with ember `#d4692f` accent on the primary feature
- **No text** — icons are symbolic, not letter-based
- **No gradients** — flat color blocks with ink wash shading
- **No photorealistic metal** — use `iron` `#2c2a26` for metal parts
- **Example:** A sword icon shows a simplified blade in `iron` with ember `#d4692f` highlighting the edge

### Example: Enemy Badge Specification

- **Style:** Circular badge with charcoal `#1a1816` background
- **Center icon** in ember `#d4692f` (e.g., simple monster silhouette)
- **Level text** in bone `#e6dcc2`
- **Locked state** uses mist `#8a857d` tint
- **No photographic backgrounds** — solid charcoal or ink wash gradient

## Migration Path from Current Placeholders

| Current Placeholder | Target Art Direction | Priority |
|---|---|---|
| Item icons (single-char text) | Ember-accented icons | High |
| Region badges (`✓`/`Lock`) | Circular badges with icons | High |
| Stat display numbers | Ember-colored number panels | Medium |
| Navigation icons | Ember-accented line icons | Medium |
| Combat log entries | Ink wash-styled text boxes | Low |

## Completed

- Art direction spec documented and reviewed (dark fantasy etchings)
- PALETTE colors codified in `packages/ui-tokens/src/palette.ts`
- Onboarding screen uses PALETTE colors
- Onboarding screen replaced with PALETTE-colored line illustrations
- All UI references PALETTE colors instead of hardcoded hex values

## Placeholder Art Pack (produced in `apps/web/public/art/`)

A hand-drawn, flat ink-wash starter set that obeys the constraint rules (no
gradients, original artwork, PALETTE colors only). All 7 SVGs are validated
well-formed XML and are registered in `manifest.json`:

| Asset | Type | Size | Notes |
|---|---|---|---|
| `weapon-sword.svg` | weapon | 64×64 | Iron blade, ember edge, bronze guard |
| `item-potion.svg` | item | 48×48 | Bone flask, ember liquid |
| `enemy-goblin.svg` | enemy | 96×96 | Charcoal bestiary badge, ember eyes |
| `boss-forest-troll-king.svg` | boss | 160×160 | Bronze ring, bloodBright maw |
| `region-starter-frontier.svg` | region | 128×128 | Verdant treetops, amber trail |
| `skill-mining.svg` | skill | 32×32 | Iron pickaxe, ember band |
| `icon-travel.svg` | icon | 24×24 | Ember waypoint |

### Asset production note
These are the reference placeholders that replace the single-character text
icons and `✓`/`Lock` badges. Each future asset must be curated to match the
`dark-fantasy-etchings` direction and must pass the "no photorealistic /
cartoon / AI / stock / generic" check before inclusion.

## Completion Criteria

- [x] Art direction spec documented and reviewed
- [x] PALETTE colors codified in `packages/ui-tokens/src/palette.ts`
- [x] Onboarding screen uses PALETTE colors
- [x] Asset production begins (placeholder art pack delivered; full asset pipeline future)
- [x] All UI references PALETTE colors instead of hardcoded hex values
- [x] No new assets violate the prohibited styles

---

**This spec replaces all previous emoji/placeholder art directions. Future asset creation must adhere to these guidelines.**