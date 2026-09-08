'use client';

export const CLR = {
  near: '#1f1b16',
  mid: '#171410',
  far: '#12100d',
  faint: '#100e0c',
  stroke: '#2e2a25',
  line: '#3a362f',
  bone: '#d8c9a8',
  boneDim: 'rgba(216,201,168,0.3)',
  bronze: '#b08754',
  ember: '#d4692f',
  emberHi: '#e08a44',
  verdant: '#87a76b',
  verdantDark: '#4a5a3c',
  water: '#8ea8c4',
  slate: '#3a4650',
  slateDeep: '#232c34',
  arcane: '#a8c9a0',
  arcaneDark: '#5c7a5a',
  blood: '#b0432f',
  bloodBright: '#c45a3a',
  steel: '#4a4845',
  steelDark: '#2c2a26',
  leather: '#3d2e1f',
  leatherDark: '#2a1f14',
  chain: '#3a3835',
  chainDark: '#242321',
  skin: '#a8957a',
};

export const MATERIAL_GRADIENTS = {
  steel: {
    base: '#3a3835',
    highlight: '#5a5855',
    edge: '#7a7875',
    dark: '#1a1918',
  },
  blackenedSteel: {
    base: '#1e1d1b',
    highlight: '#3a3835',
    edge: '#5a5855',
    dark: '#0f0e0d',
  },
  bronze: {
    base: '#b08754',
    highlight: '#c9a264',
    edge: '#e6dcc2',
    dark: '#7a5f3a',
  },
  leather: {
    base: '#3d2e1f',
    highlight: '#5a4a35',
    edge: '#7a6a55',
    dark: '#1f1710',
  },
  cloth: {
    base: '#2a2520',
    highlight: '#3a3530',
    edge: '#4a4540',
    dark: '#1a1510',
  },
  chainmail: {
    base: '#3a3835',
    highlight: '#5a5855',
    edge: '#7a7875',
    dark: '#1a1918',
  },
  skin: {
    base: '#a8957a',
    highlight: '#c8b59a',
    edge: '#e8d5ba',
    dark: '#7a6a5a',
  },
  fur: {
    base: '#3a3530',
    highlight: '#5a5550',
    edge: '#7a7570',
    dark: '#1a1510',
  },
  stone: {
    base: '#3a3a38',
    highlight: '#5a5a58',
    edge: '#7a7a78',
    dark: '#1a1a18',
  },
};

export const VIEWBOX = {
  character: { x: -80, y: -280, width: 160, height: 320 },
  enemy: { x: -80, y: -200, width: 160, height: 240 },
  activity: { x: -60, y: -230, width: 120, height: 240 },
  /** Full activity vignette — worker on the left, gathering/crafting node
   *  on the right, both in one frame so tool swings, node reactions and
   *  particles land in one shared coordinate space. */
  activityRig: { x: -200, y: -240, width: 400, height: 260 },
};

export const TRANSFORM_ORIGINS = {
  human: {
    head: { x: 0, y: -168 },
    neck: { x: 0, y: -150 },
    chest: { x: 0, y: -120 },
    torso: { x: 0, y: -80 },
    pelvis: { x: 0, y: -30 },
    leftShoulder: { x: -24, y: -140 },
    leftElbow: { x: -42, y: -90 },
    leftWrist: { x: -48, y: -40 },
    rightShoulder: { x: 24, y: -140 },
    rightElbow: { x: 42, y: -90 },
    rightWrist: { x: 48, y: -40 },
    leftHip: { x: -16, y: -30 },
    leftKnee: { x: -16, y: 30 },
    leftAnkle: { x: -16, y: 80 },
    rightHip: { x: 16, y: -30 },
    rightKnee: { x: 16, y: 30 },
    rightAnkle: { x: 16, y: 80 },
    weaponGrip: { x: 40, y: -40 },
  },
  wolf: {
    head: { x: 0, y: -60 },
    neck: { x: 0, y: -40 },
    chest: { x: 0, y: -10 },
    pelvis: { x: 0, y: 30 },
    leftShoulder: { x: -28, y: -20 },
    leftElbow: { x: -44, y: 10 },
    leftWrist: { x: -48, y: 30 },
    rightShoulder: { x: 28, y: -20 },
    rightElbow: { x: 44, y: 10 },
    rightWrist: { x: 48, y: 30 },
    leftHip: { x: -20, y: 30 },
    leftKnee: { x: -20, y: 70 },
    leftAnkle: { x: -20, y: 95 },
    rightHip: { x: 20, y: 30 },
    rightKnee: { x: 20, y: 70 },
    rightAnkle: { x: 20, y: 95 },
    tailBase: { x: 0, y: 40 },
  },
};

export type CharacterState =
  | 'idle'
  | 'prepare'
  | 'attack'
  | 'hit'
  | 'criticalHit'
  | 'defeated'
  | 'victory'
  | 'activity-idle'
  | 'activity-swing'
  | 'activity-impact'
  | 'activity-recovery';

export interface VisualProps {
  state: CharacterState;
  direction?: 'left' | 'right';
  weapon?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  className?: string;
  onAnimationComplete?: () => void;
}