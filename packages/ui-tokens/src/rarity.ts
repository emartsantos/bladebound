import { PALETTE } from './palette';

export interface RarityTreatment {
  label: string;
  /** Primary display color */
  color: string;
  /** Brightened display color for icons/accents */
  bright: string;
  /** Border craft style: borderColor + borderStyle + inner engraving */
  border: string;
  /** Inner engraved line (double-border micro-detail) */
  engraving: string;
  /** Material treatment keyword for chromatic micro-detail */
  material: string;
  /** Icon framing treatment */
  frame: string;
  /** Subtle animation key */
  animation: 'static' | 'sheen' | 'pulse';
  /** Shadow/glow string (subtle, not gross glow) */
  glow: string;
  /** Panel stain (background tint for the slot/panel) */
  stain: string;
}

export const RARITY_TREATMENTS: Record<string, RarityTreatment> = {
  common: {
    label: 'Common',
    color: PALETTE.stone,
    bright: PALETTE.coldStone,
    border: PALETTE.steel,
    engraving: 'rgba(138, 133, 125, 0.14)',
    material: 'iron',
    frame: 'single',
    animation: 'static',
    glow: 'none',
    stain: 'rgba(42, 40, 37, 0.35)',
  },
  uncommon: {
    label: 'Uncommon',
    color: PALETTE.coldStone,
    bright: PALETTE.steelBlue,
    border: PALETTE.steelBlue,
    engraving: 'rgba(101, 117, 138, 0.28)',
    material: 'quenched steel',
    frame: 'notched',
    animation: 'static',
    glow: 'none',
    stain: 'rgba(101, 117, 138, 0.08)',
  },
  rare: {
    label: 'Rare',
    color: PALETTE.bronze,
    bright: PALETTE.bronzeLight,
    border: PALETTE.bronze,
    engraving: 'rgba(176, 135, 84, 0.4)',
    material: 'bronze',
    frame: 'notched',
    animation: 'static',
    glow: '0 0 0 1px rgba(176, 135, 84, 0.35), 0 2px 8px rgba(0, 0, 0, 0.45)',
    stain: 'rgba(176, 135, 84, 0.08)',
  },
  epic: {
    label: 'Epic',
    color: PALETTE.amber,
    bright: '#d9ad62',
    border: '#c2994f',
    engraving: 'rgba(194, 153, 79, 0.5)',
    material: 'gilded steel',
    frame: 'double',
    animation: 'sheen',
    glow: '0 0 0 1px rgba(194, 153, 79, 0.4), 0 2px 10px rgba(194, 153, 79, 0.18)',
    stain: 'rgba(194, 153, 79, 0.09)',
  },
  legendary: {
    label: 'Legendary',
    color: PALETTE.emberLight,
    bright: PALETTE.ember,
    border: PALETTE.ember,
    engraving: 'rgba(212, 105, 47, 0.55)',
    material: 'ember-forged',
    frame: 'double',
    animation: 'pulse',
    glow: '0 0 0 1px rgba(212, 105, 47, 0.5), 0 2px 14px rgba(212, 105, 47, 0.22)',
    stain: 'rgba(212, 105, 47, 0.1)',
  },
} as const;

export type RarityId = keyof typeof RARITY_TREATMENTS;

export const ORDERED_RARITIES: readonly RarityId[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];