import type { EnemyDefinition } from '@premium-rpg/shared-types';

// ============================================================
// STARTER FRONTIER — level 1-5
// ============================================================

export const GOBLIN: EnemyDefinition = {
  id: 'goblin',
  name: 'Goblin',
  regionId: 'starter-frontier',
  level: 1,
  maxHealth: 25,
  stats: {
    strength: 3, agility: 4, intelligence: 1, vitality: 3,
    accuracy: 30, evasion: 25, critChance: 3, critDamage: 1.5,
    attackSpeed: 1.0, armor: 1, maxHealth: 25, damage: 3, defense: 1,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [],
  lootTableId: 'goblin',
  xpReward: 15,
  goldReward: 8,
  loreSnippet: 'Small, greedy creatures that infest caves and forest clearings.',
  bestiaryMetadata: {
    title: 'Common Pest',
    description: 'A small green-skinned creature with a greedy gleam in its eye. Weak alone, dangerous in numbers.',
    difficulty: 'easy',
    recommendedLevel: 1,
    family: 'goblin',
  },
};

export const GOBLIN_CHAMPION: EnemyDefinition = {
  id: 'goblin_champion',
  name: 'Goblin Champion',
  regionId: 'starter-frontier',
  level: 3,
  maxHealth: 45,
  stats: {
    strength: 6, agility: 5, intelligence: 2, vitality: 5,
    accuracy: 40, evasion: 30, critChance: 8, critDamage: 1.8,
    attackSpeed: 1.2, armor: 2, maxHealth: 45, damage: 6, defense: 2,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'brute-force', name: 'Brute Force', type: 'damage', description: '+50% damage, -20% accuracy', cooldown: 8, intensity: 1.5, chance: 0.3 },
    { id: 'goblin-yell', name: 'Goblin Yell', type: 'debuff', description: 'Reduces your accuracy by 15%', cooldown: 14, intensity: 0.85, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'goblin',
  xpReward: 35,
  goldReward: 15,
  loreSnippet: 'A larger goblin with better armor and a bigger weapon, leading a tribe of smaller goblins.',
  bestiaryMetadata: {
    title: 'Pack Leader',
    description: 'A goblin who has survived countless skirmishes, its muscles hardened by years of battle.',
    difficulty: 'normal',
    recommendedLevel: 3,
    family: 'goblin',
  },
};

export const SKELETON: EnemyDefinition = {
  id: 'skeleton',
  name: 'Skeleton',
  regionId: 'starter-frontier',
  level: 2,
  maxHealth: 20,
  stats: {
    strength: 2, agility: 5, intelligence: 1, vitality: 2,
    accuracy: 35, evasion: 35, critChance: 5, critDamage: 1.5,
    attackSpeed: 1.1, armor: 5, maxHealth: 20, damage: 2, defense: 5,
  },
  attackStyle: 'ranged',
  category: 'normal',
  abilities: [
    { id: 'bone-shot', name: 'Bone Shot', type: 'damage', description: 'Ranged attack with 40% armor penetration', cooldown: 6, intensity: 1.3, chance: 0.25 },
  ],
  lootTableId: 'skeleton',
  xpReward: 18,
  goldReward: 10,
  loreSnippet: 'Animated bones of ancient warriors, guarding tombs and forgotten places.',
  bestiaryMetadata: {
    title: 'Restless Bones',
    description: 'Long-dead warriors reanimated by dark magic, their bones creaking as they march.',
    difficulty: 'easy',
    recommendedLevel: 2,
    family: 'undead',
  },
};

export const SKELETON_ARCHER: EnemyDefinition = {
  id: 'skeleton_archer',
  name: 'Skeleton Archer',
  regionId: 'starter-frontier',
  level: 4,
  maxHealth: 35,
  stats: {
    strength: 3, agility: 7, intelligence: 2, vitality: 3,
    accuracy: 45, evasion: 40, critChance: 10, critDamage: 2.0,
    attackSpeed: 1.3, armor: 3, maxHealth: 35, damage: 7, defense: 3,
  },
  attackStyle: 'ranged',
  category: 'elite',
  abilities: [
    { id: 'volley', name: 'Volley', type: 'damage', description: '3 simultaneous arrow attacks', cooldown: 10, intensity: 1.8, chance: 0.2 },
    { id: 'pinning-shot', name: 'Pinning Shot', type: 'debuff', description: 'Stops you from moving for 1 turn', cooldown: 16, intensity: 1.0, duration: 1, chance: 0.15 },
  ],
  lootTableId: 'skeleton',
  xpReward: 45,
  goldReward: 22,
  loreSnippet: 'More deadly skeletons armed with longbows, found in ancient battlefields.',
  bestiaryMetadata: {
    title: 'Undead Marksman',
    description: 'A skeleton that retained its skills from life, now firing at the living without rest.',
    difficulty: 'normal',
    recommendedLevel: 4,
    family: 'undead',
  },
};

export const WOLF: EnemyDefinition = {
  id: 'wolf',
  name: 'Wolf',
  regionId: 'starter-frontier',
  level: 1,
  maxHealth: 18,
  stats: {
    strength: 3, agility: 6, intelligence: 1, vitality: 3,
    accuracy: 30, evasion: 30, critChance: 4, critDamage: 1.5,
    attackSpeed: 1.4, armor: 0, maxHealth: 18, damage: 3, defense: 0,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [],
  lootTableId: 'wolf',
  xpReward: 12,
  goldReward: 5,
  loreSnippet: 'Hungry wolves that prowl the forest edges, hunting in packs.',
  bestiaryMetadata: {
    title: 'Forest Predator',
    description: 'A lean, sharp-toothed wolf that hunts in coordinated packs.',
    difficulty: 'easy',
    recommendedLevel: 1,
    family: 'beast',
  },
};

export const ALPHA_WOLF: EnemyDefinition = {
  id: 'alpha_wolf',
  name: 'Alpha Wolf',
  regionId: 'starter-frontier',
  level: 5,
  maxHealth: 50,
  stats: {
    strength: 8, agility: 9, intelligence: 1, vitality: 6,
    accuracy: 40, evasion: 35, critChance: 12, critDamage: 2.2,
    attackSpeed: 1.5, armor: 1, maxHealth: 50, damage: 8, defense: 1,
  },
  attackStyle: 'melee',
  category: 'rare',
  abilities: [
    { id: 'pack-hunt', name: 'Pack Hunt', type: 'buff', description: '+30% damage when ally is nearby', cooldown: 12, intensity: 1.3, chance: 0.15 },
    { id: 'vicious-lunge', name: 'Vicious Lunge', type: 'damage', description: 'Leaps with devastating force', cooldown: 9, intensity: 1.6, chance: 0.25 },
  ],
  lootTableId: 'wolf',
  xpReward: 60,
  goldReward: 30,
  loreSnippet: 'The leader of a wolf pack, larger and more cunning than ordinary wolves.',
  bestiaryMetadata: {
    title: 'Pack Alpha',
    description: 'The dominant wolf, its silver fur marked with old battle scars.',
    difficulty: 'normal',
    recommendedLevel: 5,
    family: 'beast',
  },
};

export const FOREST_BOAR: EnemyDefinition = {
  id: 'forest_boar',
  name: 'Forest Boar',
  regionId: 'starter-frontier',
  level: 2,
  maxHealth: 40,
  stats: {
    strength: 5, agility: 3, intelligence: 1, vitality: 6,
    accuracy: 25, evasion: 15, critChance: 3, critDamage: 1.5,
    attackSpeed: 0.9, armor: 3, maxHealth: 40, damage: 5, defense: 3,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'charge', name: 'Charge', type: 'damage', description: 'Charges forward dealing heavy damage', cooldown: 7, intensity: 1.4, chance: 0.3 },
  ],
  lootTableId: 'forest',
  xpReward: 20,
  goldReward: 10,
  loreSnippet: 'A thick-hided boar with tusks that can gore through leather armor.',
  bestiaryMetadata: {
    title: 'Thick-Hided Bruiser',
    description: 'A surly boar that charges anyone who disturbs its territory.',
    difficulty: 'easy',
    recommendedLevel: 2,
    family: 'beast',
  },
};

export const BUSH_RAT: EnemyDefinition = {
  id: 'bush_rat',
  name: 'Bush Rat',
  regionId: 'starter-frontier',
  level: 1,
  maxHealth: 10,
  stats: {
    strength: 1, agility: 4, intelligence: 1, vitality: 2,
    accuracy: 20, evasion: 25, critChance: 2, critDamage: 1.5,
    attackSpeed: 1.2, armor: 0, maxHealth: 10, damage: 1, defense: 0,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [],
  lootTableId: 'forest',
  xpReward: 5,
  goldReward: 2,
  loreSnippet: 'A scrappy forest rat, the first foe many adventurers face.',
  bestiaryMetadata: {
    title: 'First Blood',
    description: 'A common rat that scuttles through the underbrush, squeaking defiance.',
    difficulty: 'easy',
    recommendedLevel: 1,
    family: 'beast',
  },
};

export const ROOK: EnemyDefinition = {
  id: 'rook',
  name: 'Rook',
  regionId: 'starter-frontier',
  level: 1,
  maxHealth: 15,
  stats: {
    strength: 2, agility: 3, intelligence: 1, vitality: 2,
    accuracy: 25, evasion: 30, critChance: 2, critDamage: 1.5,
    attackSpeed: 1.1, armor: 0, maxHealth: 15, damage: 2, defense: 0,
  },
  attackStyle: 'ranged',
  category: 'normal',
  abilities: [],
  lootTableId: 'forest',
  xpReward: 8,
  goldReward: 3,
  loreSnippet: 'A black-plumed bird with a piercing caw, pecking at exposed flesh.',
  bestiaryMetadata: {
    title: 'Black-Plumed Omen',
    description: 'An unnaturally intelligent rook that guards the forest borders.',
    difficulty: 'easy',
    recommendedLevel: 1,
    family: 'beast',
  },
};

export const FOREST_TROLL_KING: EnemyDefinition = {
  id: 'forest_troll_king',
  name: 'Forest Troll King',
  regionId: 'starter-frontier',
  level: 6,
  maxHealth: 120,
  stats: {
    strength: 12, agility: 6, intelligence: 3, vitality: 12,
    accuracy: 45, evasion: 20, critChance: 8, critDamage: 2.0,
    attackSpeed: 1.0, armor: 8, maxHealth: 120, damage: 12, defense: 6,
  },
  attackStyle: 'melee',
  category: 'boss',
  abilities: [
    { id: 'troll-smash', name: 'Troll Smash', type: 'damage', description: 'Massive club swing with 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'troll-roar', name: 'Troll Roar', type: 'debuff', description: 'Lowers your defense by 25% for 3 turns', cooldown: 12, intensity: 0.75, duration: 3, chance: 0.25 },
    { id: 'troll-regeneration', name: 'Troll Regeneration', type: 'heal', description: 'Heals for 10% of max health', cooldown: 10, intensity: 0.1, duration: 2, chance: 0.2 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 150,
  goldReward: 100,
  loreSnippet: 'The mutated king of the frontier trolls, its flesh constantly regrowing.',
  bestiaryMetadata: {
    title: 'King of the Frontier',
    description: 'A hulking troll king whose very touch mends its wounds, terror of the starter lands.',
    difficulty: 'hard',
    recommendedLevel: 6,
    family: 'troll',
  },
};

// ============================================================
// DARKWOOD FOREST — level 8-16
// ============================================================

export const DARKWOOD_SPIDER: EnemyDefinition = {
  id: 'darkwood_spider',
  name: 'Darkwood Spider',
  regionId: 'darkwood-forest',
  level: 8,
  maxHealth: 45,
  stats: {
    strength: 5, agility: 10, intelligence: 2, vitality: 4,
    accuracy: 40, evasion: 45, critChance: 10, critDamage: 2.0,
    attackSpeed: 1.5, armor: 2, maxHealth: 45, damage: 8, defense: 2,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'venom-bite', name: 'Venom Bite', type: 'dot', description: 'Injects venom dealing damage over time', cooldown: 5, intensity: 0.3, duration: 4, chance: 0.35 },
    { id: 'web-trap', name: 'Web Trap', type: 'stun', description: 'Traps you in webbing for 1 turn', cooldown: 12, intensity: 1.0, duration: 1, chance: 0.2 },
  ],
  lootTableId: 'forest',
  xpReward: 55,
  goldReward: 20,
  loreSnippet: 'A spider as large as a hound, weaving dark webbing between shadowed trees.',
  bestiaryMetadata: {
    title: 'Silk of Shadow',
    description: 'A venomous spider that lurks in the canopy, its silk glinting in the dark.',
    difficulty: 'normal',
    recommendedLevel: 8,
    family: 'arachnid',
  },
};

export const CAVE_BAT: EnemyDefinition = {
  id: 'cave_bat',
  name: 'Cave Bat',
  regionId: 'darkwood-forest',
  level: 8,
  maxHealth: 30,
  stats: {
    strength: 3, agility: 12, intelligence: 1, vitality: 3,
    accuracy: 45, evasion: 55, critChance: 8, critDamage: 2.0,
    attackSpeed: 1.8, armor: 0, maxHealth: 30, damage: 5, defense: 0,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'sonic-screech', name: 'Sonic Screech', type: 'debuff', description: 'Disorients, reducing accuracy', cooldown: 8, intensity: 0.8, duration: 2, chance: 0.3 },
  ],
  lootTableId: 'forest',
  xpReward: 40,
  goldReward: 15,
  loreSnippet: 'A swarm of bats that use echolocation to evade strikes, their wings beating in the darkness.',
  bestiaryMetadata: {
    title: 'Echo of the Dark',
    description: 'A swift bat that darts through the shadows, evading most blows.',
    difficulty: 'normal',
    recommendedLevel: 8,
    family: 'beast',
  },
};

export const ZOMBIE: EnemyDefinition = {
  id: 'zombie',
  name: 'Zombie',
  regionId: 'darkwood-forest',
  level: 9,
  maxHealth: 60,
  stats: {
    strength: 7, agility: 2, intelligence: 1, vitality: 8,
    accuracy: 30, evasion: 10, critChance: 2, critDamage: 1.5,
    attackSpeed: 0.8, armor: 4, maxHealth: 60, damage: 7, defense: 3,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'disease-claw', name: 'Disease Claw', type: 'dot', description: 'Inflicts a rotting disease dealing damage over time', cooldown: 7, intensity: 0.35, duration: 3, chance: 0.3 },
  ],
  lootTableId: 'forest',
  xpReward: 60,
  goldReward: 18,
  loreSnippet: 'Shambling corpses animated by malevolent spirit, their limbs reaching mechanically.',
  bestiaryMetadata: {
    title: 'Shambling Rot',
    description: 'A rotting husk driven by dark energies, slow but relentless.',
    difficulty: 'normal',
    recommendedLevel: 9,
    family: 'undead',
  },
};

export const GHOUL: EnemyDefinition = {
  id: 'ghoul',
  name: 'Ghoul',
  regionId: 'darkwood-forest',
  level: 11,
  maxHealth: 55,
  stats: {
    strength: 8, agility: 8, intelligence: 2, vitality: 6,
    accuracy: 40, evasion: 30, critChance: 10, critDamage: 2.0,
    attackSpeed: 1.4, armor: 3, maxHealth: 55, damage: 9, defense: 3,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'flesh-tear', name: 'Flesh Tear', type: 'dot', description: 'Tears flesh causing bleeding', cooldown: 6, intensity: 0.4, duration: 3, chance: 0.35 },
    { id: 'frenzy', name: 'Frenzy', type: 'buff', description: 'Increases damage by 30%', cooldown: 14, intensity: 1.3, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'forest',
  xpReward: 70,
  goldReward: 25,
  loreSnippet: 'Emaciated undead that hunger ceaselessly for living flesh.',
  bestiaryMetadata: {
    title: 'Unending Hunger',
    description: 'A gaunt undead whose appetite for flesh is never satisfied, its speed deceptive.',
    difficulty: 'normal',
    recommendedLevel: 11,
    family: 'undead',
  },
};

export const WEREWOLF: EnemyDefinition = {
  id: 'werewolf',
  name: 'Werewolf',
  regionId: 'darkwood-forest',
  level: 13,
  maxHealth: 70,
  stats: {
    strength: 11, agility: 10, intelligence: 2, vitality: 8,
    accuracy: 45, evasion: 35, critChance: 15, critDamage: 2.2,
    attackSpeed: 1.5, armor: 2, maxHealth: 70, damage: 11, defense: 2,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'moon-call', name: 'Moon Call', type: 'buff', description: '+40% damage and accuracy', cooldown: 16, intensity: 1.4, chance: 0.2 },
    { id: 'razor-claws', name: 'Razor Claws', type: 'damage', description: 'Tears with both claws for 150% damage', cooldown: 8, intensity: 1.5, chance: 0.3 },
    { id: 'lycan-bite', name: 'Lycan Bite', type: 'dot', description: 'Infects with a curse dealing damage over time', cooldown: 10, intensity: 0.5, duration: 4, chance: 0.25 },
  ],
  lootTableId: 'forest',
  xpReward: 95,
  goldReward: 35,
  loreSnippet: 'A human cursed to become a beast under the moon, its transformation granting savage power.',
  bestiaryMetadata: {
    title: 'Cursed Moonkin',
    description: 'A powerful lycanthrope that hunts with feral cunning under the full moon.',
    difficulty: 'hard',
    recommendedLevel: 13,
    family: 'lycanthrope',
  },
};

export const SHADE: EnemyDefinition = {
  id: 'shade',
  name: 'Shade',
  regionId: 'darkwood-forest',
  level: 14,
  maxHealth: 45,
  stats: {
    strength: 5, agility: 11, intelligence: 8, vitality: 4,
    accuracy: 50, evasion: 55, critChance: 12, critDamage: 2.5,
    attackSpeed: 1.6, armor: 0, maxHealth: 45, damage: 9, defense: 0,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'shadow-lance', name: 'Shadow Lance', type: 'damage', description: 'Piercing darkness dealing 160% damage', cooldown: 7, intensity: 1.6, chance: 0.3 },
    { id: 'drain-soul', name: 'Drain Soul', type: 'heal', description: 'Heals for 12% of max health and damages you', cooldown: 11, intensity: 0.12, chance: 0.25 },
    { id: 'blind', name: 'Blind', type: 'debuff', description: 'Reduces accuracy by 30% for 2 turns', cooldown: 13, intensity: 0.7, duration: 2, chance: 0.2 },
    { id: 'umbral-form', name: 'Umbral Form', type: 'buff', description: '+30% evasion for 3 turns', cooldown: 15, intensity: 1.3, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'forest',
  xpReward: 110,
  goldReward: 40,
  loreSnippet: 'Amorphous darkness with a cold touch, draining life force from the living.',
  bestiaryMetadata: {
    title: 'Living Shadow',
    description: 'A formless entity of shadow that whispers secrets and drains vitality.',
    difficulty: 'deadly',
    recommendedLevel: 14,
    family: 'spectral',
  },
};

export const ELDER_DRYAD: EnemyDefinition = {
  id: 'elder_dryad',
  name: 'Elder Dryad',
  regionId: 'darkwood-forest',
  level: 12,
  maxHealth: 65,
  stats: {
    strength: 6, agility: 7, intelligence: 9, vitality: 7,
    accuracy: 40, evasion: 40, critChance: 10, critDamage: 2.0,
    attackSpeed: 1.2, armor: 4, maxHealth: 65, damage: 8, defense: 4,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'vine-whip', name: 'Vine Whip', type: 'damage', description: 'Lashes with enchanted vines for 140% damage', cooldown: 7, intensity: 1.4, chance: 0.3 },
    { id: 'entangling-roots', name: 'Entangling Roots', type: 'stun', description: 'Roots bind you, stunning for 1 turn', cooldown: 12, intensity: 1.0, duration: 1, chance: 0.2 },
    { id: 'nature-renewal', name: 'Nature Renewal', type: 'heal', description: 'Heals for 15% of max health', cooldown: 13, intensity: 0.15, chance: 0.2 },
  ],
  lootTableId: 'forest',
  xpReward: 90,
  goldReward: 32,
  loreSnippet: 'An ancient tree spirit whose roots have grown through centuries of the darkwood.',
  bestiaryMetadata: {
    title: 'Ancient Guardian',
    description: 'A sentient tree spirit bound to the darkwood, its magic as old as the forest itself.',
    difficulty: 'hard',
    recommendedLevel: 12,
    family: 'fey',
  },
};

export const NIGHT_STALKER: EnemyDefinition = {
  id: 'night_stalker',
  name: 'Night Stalker',
  regionId: 'darkwood-forest',
  level: 15,
  maxHealth: 80,
  stats: {
    strength: 12, agility: 12, intelligence: 5, vitality: 8,
    accuracy: 50, evasion: 45, critChance: 18, critDamage: 2.5,
    attackSpeed: 1.6, armor: 4, maxHealth: 80, damage: 12, defense: 4,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'ambush', name: 'Ambush', type: 'damage', description: 'Surprise attack with 170% damage', cooldown: 8, intensity: 1.7, chance: 0.3 },
    { id: 'paralyze', name: 'Paralyze', type: 'stun', description: 'Paralyzes you for 2 turns', cooldown: 14, intensity: 1.0, duration: 2, chance: 0.15 },
    { id: 'maul', name: 'Maul', type: 'dot', description: 'Tears you apart causing severe bleeding', cooldown: 9, intensity: 0.5, duration: 4, chance: 0.25 },
  ],
  lootTableId: 'forest',
  xpReward: 120,
  goldReward: 45,
  loreSnippet: 'A predator that attacks only at night, its eyes gleaming in the darkness.',
  bestiaryMetadata: {
    title: 'Terror of the Night',
    description: 'A lethal ambush predator that hunts in perfect darkness, feared by all forest dwellers.',
    difficulty: 'deadly',
    recommendedLevel: 15,
    family: 'beast',
  },
};

export const COUNT_VLAD: EnemyDefinition = {
  id: 'count_vlad',
  name: 'Count Vlad',
  regionId: 'darkwood-forest',
  level: 16,
  maxHealth: 150,
  stats: {
    strength: 9, agility: 12, intelligence: 12, vitality: 12,
    accuracy: 55, evasion: 40, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.5, armor: 10, maxHealth: 150, damage: 14, defense: 8,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'blood-lance', name: 'Blood Lance', type: 'damage', description: 'Lance of blood dealing 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'life-drain', name: 'Life Drain', type: 'heal', description: 'Drains 15% of max health, healing himself', cooldown: 9, intensity: 0.15, chance: 0.25 },
    { id: 'bite', name: 'Bite', type: 'dot', description: 'Vampiric bite causing blood loss', cooldown: 8, intensity: 0.6, duration: 5, chance: 0.3 },
    { id: 'shadow-calling', name: 'Shadow Calling', type: 'buff', description: '+40% power for 3 turns', cooldown: 15, intensity: 1.4, duration: 3, chance: 0.15 },
    { id: 'mesmerize', name: 'Mesmerize', type: 'stun', description: 'Hypnotic gaze stuns for 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.15 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 200,
  goldReward: 130,
  loreSnippet: 'An ancient vampire lord who has ruled the darkwood for centuries, draining the life of all who enter.',
  bestiaryMetadata: {
    title: 'Darkwood Vampire Lord',
    description: 'A powerful vampire whose thirst has kept the darkwood shrouded in eternal night.',
    difficulty: 'deadly',
    recommendedLevel: 16,
    family: 'vampire',
  },
};

// ============================================================
// RUINED PROVINCE — level 18-32
// ============================================================

export const SKELETON_KNIGHT: EnemyDefinition = {
  id: 'skeleton_knight',
  name: 'Skeleton Knight',
  regionId: 'ruined-province',
  level: 18,
  maxHealth: 80,
  stats: {
    strength: 12, agility: 8, intelligence: 2, vitality: 10,
    accuracy: 50, evasion: 30, critChance: 8, critDamage: 2.0,
    attackSpeed: 1.1, armor: 12, maxHealth: 80, damage: 13, defense: 10,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'shield-bash', name: 'Shield Bash', type: 'stun', description: 'Bashes with shield, stunning for 1 turn', cooldown: 10, intensity: 1.0, duration: 1, chance: 0.25 },
    { id: 'knight-strike', name: 'Knight Strike', type: 'damage', description: 'Powerful sword strike with 150% damage', cooldown: 7, intensity: 1.5, chance: 0.3 },
  ],
  lootTableId: 'ruins',
  xpReward: 130,
  goldReward: 50,
  loreSnippet: 'The armored bones of a fallen knight, still bound to protect the ruined province.',
  bestiaryMetadata: {
    title: 'Oathbound Bones',
    description: 'An undead knight that still honors a vow from centuries past, its armor rusted but functional.',
    difficulty: 'normal',
    recommendedLevel: 18,
    family: 'undead',
  },
};

export const GRAVE_GUARDIAN: EnemyDefinition = {
  id: 'grave_guardian',
  name: 'Grave Guardian',
  regionId: 'ruined-province',
  level: 20,
  maxHealth: 90,
  stats: {
    strength: 13, agility: 6, intelligence: 3, vitality: 12,
    accuracy: 45, evasion: 20, critChance: 6, critDamage: 1.8,
    attackSpeed: 0.9, armor: 15, maxHealth: 90, damage: 13, defense: 12,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'heavy-crush', name: 'Heavy Crush', type: 'damage', description: 'Crushing blow with 160% damage', cooldown: 8, intensity: 1.6, chance: 0.3 },
    { id: 'tomb-guard', name: 'Tomb Guard', type: 'buff', description: '+30% armor for 3 turns', cooldown: 14, intensity: 1.3, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'ruins',
  xpReward: 145,
  goldReward: 55,
  loreSnippet: 'A massive stone-bound guardian that stands watch over ancient graves.',
  bestiaryMetadata: {
    title: 'Warden of the Tombs',
    description: 'A ponderous guardian animated to defend the crypts, its body as hard as the stone it guards.',
    difficulty: 'normal',
    recommendedLevel: 20,
    family: 'construct',
  },
};

export const WRAITH: EnemyDefinition = {
  id: 'wraith',
  name: 'Wraith',
  regionId: 'ruined-province',
  level: 22,
  maxHealth: 70,
  stats: {
    strength: 8, agility: 13, intelligence: 10, vitality: 6,
    accuracy: 55, evasion: 55, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.5, armor: 0, maxHealth: 70, damage: 12, defense: 0,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'spectral-bolt', name: 'Spectral Bolt', type: 'damage', description: 'Bolts of spectral energy for 150% damage', cooldown: 6, intensity: 1.5, chance: 0.35 },
    { id: 'life-burn', name: 'Life Burn', type: 'dot', description: 'Burns life force dealing damage over time', cooldown: 9, intensity: 0.5, duration: 4, chance: 0.3 },
    { id: 'wail', name: 'Wail', type: 'debuff', description: 'Eerie wail reduces accuracy by 25%', cooldown: 12, intensity: 0.75, duration: 3, chance: 0.25 },
    { id: 'reform', name: 'Reform', type: 'heal', description: 'Reforms its spectral body, healing', cooldown: 14, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'ruins',
  xpReward: 165,
  goldReward: 60,
  loreSnippet: 'A tortured spirit of a dark mage, bound to the ruins by its own rituals.',
  bestiaryMetadata: {
    title: 'Tormented Spirit',
    description: 'The furious remnant of a powerful mage who sacrificed everything for forbidden power.',
    difficulty: 'hard',
    recommendedLevel: 22,
    family: 'spectral',
  },
};

export const CORRUPTED_MAGE: EnemyDefinition = {
  id: 'corrupted_mage',
  name: 'Corrupted Mage',
  regionId: 'ruined-province',
  level: 24,
  maxHealth: 75,
  stats: {
    strength: 5, agility: 9, intelligence: 14, vitality: 7,
    accuracy: 50, evasion: 35, critChance: 12, critDamage: 2.5,
    attackSpeed: 1.3, armor: 5, maxHealth: 75, damage: 14, defense: 5,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'void-bolt', name: 'Void Bolt', type: 'damage', description: 'A bolt of void energy for 160% damage', cooldown: 6, intensity: 1.6, chance: 0.35 },
    { id: 'curse-of-weakness', name: 'Curse of Weakness', type: 'debuff', description: 'Reduces your strength permanently', cooldown: 11, intensity: 0.7, duration: 3, chance: 0.25 },
    { id: 'mana-shield', name: 'Mana Shield', type: 'buff', description: 'Absorbs 30% of damage for 3 turns', cooldown: 13, intensity: 0.7, duration: 3, chance: 0.2 },
    { id: 'arcane-surge', name: 'Arcane Surge', type: 'damage', description: 'Surge of power dealing 175% damage', cooldown: 9, intensity: 1.75, chance: 0.25 },
  ],
  lootTableId: 'ruins',
  xpReward: 180,
  goldReward: 70,
  loreSnippet: 'A once-noble mage twisted by forbidden knowledge, its mind now consumed by dark power.',
  bestiaryMetadata: {
    title: 'Twisted Arcanist',
    description: 'A powerful sorcerer whose pursuit of power corrupted both body and soul.',
    difficulty: 'hard',
    recommendedLevel: 24,
    family: 'mage',
  },
};

export const STONE_GOLEM: EnemyDefinition = {
  id: 'stone_golem',
  name: 'Stone Golem',
  regionId: 'ruined-province',
  level: 26,
  maxHealth: 110,
  stats: {
    strength: 15, agility: 4, intelligence: 1, vitality: 14,
    accuracy: 40, evasion: 10, critChance: 4, critDamage: 1.8,
    attackSpeed: 0.8, armor: 18, maxHealth: 110, damage: 15, defense: 14,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'stone-fist', name: 'Stone Fist', type: 'damage', description: 'Massive fist slam with 170% damage', cooldown: 7, intensity: 1.7, chance: 0.35 },
    { id: 'earthquake', name: 'Earthquake', type: 'stun', description: 'Shakes the ground, stunning for 1 turn', cooldown: 13, intensity: 1.0, duration: 1, chance: 0.2 },
    { id: 'shell-armor', name: 'Shell Armor', type: 'buff', description: '+40% armor for 3 turns', cooldown: 15, intensity: 1.4, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'ruins',
  xpReward: 190,
  goldReward: 75,
  loreSnippet: 'A towering construct of ancient stone, animated to defend the ruined province.',
  bestiaryMetadata: {
    title: 'Living Ruin',
    description: 'An ancient golem whose stone body is chiseled from the very ruins it guards.',
    difficulty: 'normal',
    recommendedLevel: 26,
    family: 'construct',
  },
};

export const SOUL_REAPER: EnemyDefinition = {
  id: 'soul_reaper',
  name: 'Soul Reaper',
  regionId: 'ruined-province',
  level: 28,
  maxHealth: 95,
  stats: {
    strength: 9, agility: 14, intelligence: 12, vitality: 9,
    accuracy: 55, evasion: 45, critChance: 18, critDamage: 2.8,
    attackSpeed: 1.5, armor: 6, maxHealth: 95, damage: 15, defense: 6,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'scythe-sweep', name: 'Scythe Sweep', type: 'damage', description: 'Sweeps with spectral scythe for 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'soul-drain', name: 'Soul Drain', type: 'heal', description: 'Drains soul energy, healing 20%', cooldown: 10, intensity: 0.2, chance: 0.25 },
    { id: 'enfeebling-cry', name: 'Enfeebling Cry', type: 'debuff', description: 'Weakens you, reducing all stats', cooldown: 12, intensity: 0.7, duration: 3, chance: 0.25 },
    { id: 'reap', name: 'Reap', type: 'dot', description: 'Consumes the soul dealing massive damage over time', cooldown: 14, intensity: 0.7, duration: 4, chance: 0.2 },
  ],
  lootTableId: 'ruins',
  xpReward: 210,
  goldReward: 85,
  loreSnippet: 'A dark reaper collecting souls for an ancient master, its scythe gleaming with stolen life energy.',
  bestiaryMetadata: {
    title: 'Collector of Souls',
    description: 'An emissary of death whose scythe separates soul from body, harvesting the light within.',
    difficulty: 'deadly',
    recommendedLevel: 28,
    family: 'spectral',
  },
};

export const ANCIENT_LICH: EnemyDefinition = {
  id: 'ancient_lich',
  name: 'Ancient Lich',
  regionId: 'ruined-province',
  level: 30,
  maxHealth: 160,
  stats: {
    strength: 8, agility: 10, intelligence: 18, vitality: 13,
    accuracy: 60, evasion: 35, critChance: 15, critDamage: 3.0,
    attackSpeed: 1.3, armor: 12, maxHealth: 160, damage: 18, defense: 10,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'lich-fire', name: 'Lich Fire', type: 'dot', description: 'Green fire burning life force over time', cooldown: 7, intensity: 0.6, duration: 5, chance: 0.3 },
    { id: 'cold-touch', name: 'Cold Touch', type: 'stun', description: 'Touch of cold freezes you for 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'death-bolt', name: 'Death Bolt', type: 'damage', description: 'Bolt of pure death energy for 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'drain-life', name: 'Drain Life', type: 'heal', description: 'Absorbs life force, healing 25%', cooldown: 9, intensity: 0.25, chance: 0.25 },
    { id: 'pact-with-dark', name: 'Pact with Dark', type: 'buff', description: '+50% power for 3 turns', cooldown: 15, intensity: 1.5, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'ruins',
  xpReward: 240,
  goldReward: 100,
  loreSnippet: 'An undying necromancer who achieved lichdom millennia ago, its power rivaling that of gods.',
  bestiaryMetadata: {
    title: 'Millennium Lich',
    description: 'An ancient lich whose intellect and magical power have grown over countless centuries.',
    difficulty: 'deadly',
    recommendedLevel: 30,
    family: 'lich',
  },
};

export const UNDEAD_DRAGON: EnemyDefinition = {
  id: 'undead_dragon',
  name: 'Undead Dragon',
  regionId: 'ruined-province',
  level: 32,
  maxHealth: 220,
  stats: {
    strength: 20, agility: 12, intelligence: 15, vitality: 16,
    accuracy: 60, evasion: 30, critChance: 15, critDamage: 3.0,
    attackSpeed: 1.3, armor: 18, maxHealth: 220, damage: 22, defense: 15,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'decay-breath', name: 'Decay Breath', type: 'dot', description: 'Breath of decay dealing damage over time', cooldown: 6, intensity: 0.8, duration: 5, chance: 0.3 },
    { id: 'bone-crush', name: 'Bone Crush', type: 'damage', description: 'Massive claw attack with 190% damage', cooldown: 7, intensity: 1.9, chance: 0.35 },
    { id: 'grave-frost', name: 'Grave Frost', type: 'stun', description: 'Freezing breath stuns for 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'undead-aura', name: 'Undead Aura', type: 'buff', description: '+40% damage for 3 turns', cooldown: 14, intensity: 1.4, duration: 3, chance: 0.15 },
    { id: 'soul-eating', name: 'Soul Eating', type: 'heal', description: 'Feasts on souls, healing 20%', cooldown: 10, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'ruins',
  xpReward: 300,
  goldReward: 140,
  loreSnippet: 'A once-mighty dragon resurrected by the lich, its bones reanimated with necrotic power.',
  bestiaryMetadata: {
    title: 'Fallen Wyrm',
    description: 'The terrifying reanimated form of an ancient dragon, its breath now carries decay instead of fire.',
    difficulty: 'deadly',
    recommendedLevel: 32,
    family: 'dragon',
  },
};

// ============================================================
// MOUNTAIN STRONGHOLD — level 34-50
// ============================================================

export const ICE_ELEMENTAL: EnemyDefinition = {
  id: 'ice_elemental',
  name: 'Ice Elemental',
  regionId: 'mountain-stronghold',
  level: 34,
  maxHealth: 90,
  stats: {
    strength: 10, agility: 8, intelligence: 12, vitality: 10,
    accuracy: 50, evasion: 35, critChance: 12, critDamage: 2.5,
    attackSpeed: 1.2, armor: 10, maxHealth: 90, damage: 16, defense: 10,
  },
  attackStyle: 'magic',
  category: 'normal',
  abilities: [
    { id: 'frost-bolt', name: 'Frost Bolt', type: 'damage', description: 'Bolt of ice for 160% damage', cooldown: 6, intensity: 1.6, chance: 0.35 },
    { id: 'freeze', name: 'Freeze', type: 'stun', description: 'Encases you in ice for 1 turn', cooldown: 11, intensity: 1.0, duration: 1, chance: 0.25 },
  ],
  lootTableId: 'mountain',
  xpReward: 250,
  goldReward: 90,
  loreSnippet: 'A living manifestation of winter, its icy body crackling with cold energy.',
  bestiaryMetadata: {
    title: 'Crystallized Winter',
    description: 'A sentient being of pure ice, as beautiful as it is deadly.',
    difficulty: 'normal',
    recommendedLevel: 34,
    family: 'elemental',
  },
};

export const MOUNTAIN_TROLL: EnemyDefinition = {
  id: 'mountain_troll',
  name: 'Mountain Troll',
  regionId: 'mountain-stronghold',
  level: 36,
  maxHealth: 130,
  stats: {
    strength: 18, agility: 7, intelligence: 2, vitality: 16,
    accuracy: 45, evasion: 20, critChance: 6, critDamage: 2.0,
    attackSpeed: 1.0, armor: 14, maxHealth: 130, damage: 18, defense: 12,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'massive-swing', name: 'Massive Swing', type: 'damage', description: 'Huge swing with 170% damage', cooldown: 7, intensity: 1.7, chance: 0.35 },
    { id: 'regeneration', name: 'Regeneration', type: 'heal', description: 'Regenerates, healing over time', cooldown: 12, intensity: 0.1, duration: 3, chance: 0.25 },
  ],
  lootTableId: 'mountain',
  xpReward: 270,
  goldReward: 95,
  loreSnippet: 'A hulking troll that lives in the frozen peaks, its thick hide impervious to cold.',
  bestiaryMetadata: {
    title: 'Stone-Skinned Titan',
    description: 'A massive mountain troll whose regenerating flesh makes it a relentless foe.',
    difficulty: 'normal',
    recommendedLevel: 36,
    family: 'troll',
  },
};

export const FROST_DRAKE: EnemyDefinition = {
  id: 'frost_drake',
  name: 'Frost Drake',
  regionId: 'mountain-stronghold',
  level: 38,
  maxHealth: 120,
  stats: {
    strength: 16, agility: 13, intelligence: 10, vitality: 12,
    accuracy: 55, evasion: 40, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.3, armor: 12, maxHealth: 120, damage: 18, defense: 10,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'ice-breath', name: 'Ice Breath', type: 'damage', description: 'Cone of ice for 170% damage', cooldown: 6, intensity: 1.7, chance: 0.35 },
    { id: 'glacial-spike', name: 'Glacial Spike', type: 'damage', description: 'Impales with ice spike for 140% damage', cooldown: 8, intensity: 1.4, chance: 0.3 },
    { id: 'snow-storm', name: 'Snow Storm', type: 'debuff', description: 'Blizzard reduces accuracy by 30%', cooldown: 12, intensity: 0.7, duration: 3, chance: 0.25 },
    { id: 'drake-armor', name: 'Drake Armor', type: 'buff', description: '+35% armor for 3 turns', cooldown: 14, intensity: 1.35, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'mountain',
  xpReward: 300,
  goldReward: 105,
  loreSnippet: 'A lesser dragon adapted to the frozen peaks, its breath could freeze a river solid.',
  bestiaryMetadata: {
    title: 'Frozen Sky Terror',
    description: 'A savage frost drake that rules the upper reaches of the mountain stronghold.',
    difficulty: 'hard',
    recommendedLevel: 38,
    family: 'dragon',
  },
};

export const GIANT_WARRIOR: EnemyDefinition = {
  id: 'giant_warrior',
  name: 'Giant Warrior',
  regionId: 'mountain-stronghold',
  level: 40,
  maxHealth: 160,
  stats: {
    strength: 22, agility: 9, intelligence: 3, vitality: 18,
    accuracy: 50, evasion: 25, critChance: 8, critDamage: 2.2,
    attackSpeed: 1.1, armor: 18, maxHealth: 160, damage: 20, defense: 14,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'giant-stomp', name: 'Giant Stomp', type: 'stun', description: 'Stomps the ground, stunning for 1 turn', cooldown: 11, intensity: 1.0, duration: 1, chance: 0.25 },
    { id: 'crushing-blow', name: 'Crushing Blow', type: 'damage', description: 'Overhead smash with 180% damage', cooldown: 7, intensity: 1.8, chance: 0.35 },
    { id: 'battle-fury', name: 'Battle Fury', type: 'buff', description: '+35% damage for 3 turns', cooldown: 13, intensity: 1.35, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'mountain',
  xpReward: 320,
  goldReward: 115,
  loreSnippet: 'A mountain giant wielding a massive club, its strength measured in whole boulders.',
  bestiaryMetadata: {
    title: 'Mountain Giant',
    description: 'A colossal warrior whose every blow can shatter stone and steel alike.',
    difficulty: 'normal',
    recommendedLevel: 40,
    family: 'giant',
  },
};

export const RUNITE_ELEMENTAL: EnemyDefinition = {
  id: 'runite_elemental',
  name: 'Runite Elemental',
  regionId: 'mountain-stronghold',
  level: 42,
  maxHealth: 140,
  stats: {
    strength: 14, agility: 11, intelligence: 14, vitality: 13,
    accuracy: 55, evasion: 35, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.2, armor: 15, maxHealth: 140, damage: 20, defense: 13,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'runic-bolt', name: 'Runic Bolt', type: 'damage', description: 'Bolt of pure rune magic for 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'elemental-shock', name: 'Elemental Shock', type: 'stun', description: 'Shock stuns for 1 turn', cooldown: 11, intensity: 1.0, duration: 1, chance: 0.25 },
    { id: 'rune-armor', name: 'Rune Armor', type: 'buff', description: '+40% armor for 3 turns', cooldown: 14, intensity: 1.4, duration: 3, chance: 0.2 },
    { id: 'arcane-overload', name: 'Arcane Overload', type: 'damage', description: 'Overloads with energy for 190% damage', cooldown: 9, intensity: 1.9, chance: 0.25 },
  ],
  lootTableId: 'mountain',
  xpReward: 340,
  goldReward: 125,
  loreSnippet: 'A being of pure runic energy, formed from the mountain\'s rich ores.',
  bestiaryMetadata: {
    title: 'Incarnate Rune',
    description: 'A sentient magical construct born from the concentrated rune magic of the mountain.',
    difficulty: 'hard',
    recommendedLevel: 42,
    family: 'elemental',
  },
};

export const WYVERN: EnemyDefinition = {
  id: 'wyvern',
  name: 'Wyvern',
  regionId: 'mountain-stronghold',
  level: 44,
  maxHealth: 160,
  stats: {
    strength: 20, agility: 16, intelligence: 8, vitality: 14,
    accuracy: 55, evasion: 45, critChance: 18, critDamage: 2.8,
    attackSpeed: 1.4, armor: 14, maxHealth: 160, damage: 22, defense: 12,
  },
  attackStyle: 'melee',
  category: 'rare',
  abilities: [
    { id: 'wyvern-bite', name: 'Wyvern Bite', type: 'damage', description: 'Venomous bite for 150% damage', cooldown: 6, intensity: 1.5, chance: 0.35 },
    { id: 'tail-sweep', name: 'Tail Sweep', type: 'damage', description: 'Sweeps you with its tail for 160% damage', cooldown: 8, intensity: 1.6, chance: 0.3 },
    { id: 'venom', name: 'Venom', type: 'dot', description: 'Injects powerful venom dealing damage over time', cooldown: 10, intensity: 0.6, duration: 4, chance: 0.25 },
    { id: 'dive-bomb', name: 'Dive Bomb', type: 'stun', description: 'Dives from above, stunning for 1 turn', cooldown: 13, intensity: 1.0, duration: 1, chance: 0.2 },
    { id: 'wyvern-roar', name: 'Wyvern Roar', type: 'buff', description: 'Roars ferociously, +40% damage for 3 turns', cooldown: 15, intensity: 1.4, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'mountain',
  xpReward: 360,
  goldReward: 140,
  loreSnippet: 'A venomous wyvern that nests in the highest peaks, its scales harder than runite.',
  bestiaryMetadata: {
    title: 'Venom of the Summit',
    description: 'A vicious wyvern revered as a symbol of the mountain\'s deadliest predators.',
    difficulty: 'deadly',
    recommendedLevel: 44,
    family: 'dragon',
  },
};

export const MOUNTAIN_KING: EnemyDefinition = {
  id: 'mountain_king',
  name: 'Mountain King',
  regionId: 'mountain-stronghold',
  level: 46,
  maxHealth: 180,
  stats: {
    strength: 24, agility: 10, intelligence: 5, vitality: 20,
    accuracy: 52, evasion: 25, critChance: 10, critDamage: 2.2,
    attackSpeed: 1.0, armor: 20, maxHealth: 180, damage: 24, defense: 16,
  },
  attackStyle: 'melee',
  category: 'rare',
  abilities: [
    { id: 'mountain-crush', name: 'Mountain Crush', type: 'damage', description: 'Crushing blow with 200% damage', cooldown: 7, intensity: 2.0, chance: 0.35 },
    { id: 'king-roar', name: 'King Roar', type: 'debuff', description: 'Intimidating roar reduces accuracy by 30%', cooldown: 12, intensity: 0.7, duration: 3, chance: 0.25 },
    { id: 'earth-shaker', name: 'Earth Shaker', type: 'stun', description: 'Shakes the earth, stunning for 2 turns', cooldown: 14, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'renewed-strength', name: 'Renewed Strength', type: 'heal', description: 'Regenerates, healing over time', cooldown: 13, intensity: 0.1, duration: 4, chance: 0.2 },
  ],
  lootTableId: 'mountain',
  xpReward: 380,
  goldReward: 150,
  loreSnippet: 'The undisputed ruler of the mountain giants, its rule has lasted generations.',
  bestiaryMetadata: {
    title: 'Sovereign of Stone',
    description: 'The king of the mountain giants, whose strength has never met its match.',
    difficulty: 'deadly',
    recommendedLevel: 46,
    family: 'giant',
  },
};

export const FROST_GIANT_KING: EnemyDefinition = {
  id: 'frost_giant_king',
  name: 'Frost Giant King',
  regionId: 'mountain-stronghold',
  level: 50,
  maxHealth: 250,
  stats: {
    strength: 28, agility: 12, intelligence: 8, vitality: 22,
    accuracy: 60, evasion: 30, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.1, armor: 22, maxHealth: 250, damage: 28, defense: 18,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'glacial-hammer', name: 'Glacial Hammer', type: 'damage', description: 'Hammerwrought of ice for 210% damage', cooldown: 6, intensity: 2.1, chance: 0.35 },
    { id: 'frozen-solid', name: 'Frozen Solid', type: 'stun', description: 'Freezes you solid for 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'ice-storm', name: 'Ice Storm', type: 'dot', description: 'Blizzard dealing damage over time', cooldown: 9, intensity: 0.7, duration: 5, chance: 0.3 },
    { id: 'frost-giant-armor', name: 'Frost Giant Armor', type: 'buff', description: '+40% armor for 3 turns', cooldown: 14, intensity: 1.4, duration: 3, chance: 0.15 },
    { id: 'winters-wrath', name: 'Winter\'s Wrath', type: 'heal', description: 'Absorbs the cold, healing 15%', cooldown: 11, intensity: 0.15, chance: 0.2 },
  ],
  lootTableId: 'mountain',
  xpReward: 450,
  goldReward: 180,
  loreSnippet: 'The eternal king of the frozen peaks, whose crown is carved from the mountain\'s purest ice.',
  bestiaryMetadata: {
    title: 'Eternal King of Frost',
    description: 'The final boss of the mountain stronghold, a frost giant whose power has endured for millennia.',
    difficulty: 'deadly',
    recommendedLevel: 50,
    family: 'giant',
  },
};

// ============================================================
// HAUNTED MARSH — level 55-65
// ============================================================

export const BOG_HORROR: EnemyDefinition = {
  id: 'bog_horror',
  name: 'Bog Horror',
  regionId: 'haunted-marsh',
  level: 55,
  maxHealth: 180,
  stats: {
    strength: 18, agility: 10, intelligence: 14, vitality: 16,
    accuracy: 55, evasion: 30, critChance: 10, critDamage: 2.2,
    attackSpeed: 1.1, armor: 14, maxHealth: 180, damage: 20, defense: 12,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'slime-blast', name: 'Slime Blast', type: 'dot', description: 'Coats you in acid dealing damage over time', cooldown: 7, intensity: 0.5, duration: 4, chance: 0.35 },
    { id: 'root-grab', name: 'Root Grab', type: 'stun', description: 'Tentacles hold you for 1 turn', cooldown: 10, intensity: 1.0, duration: 1, chance: 0.25 },
  ],
  lootTableId: 'marsh',
  xpReward: 420,
  goldReward: 160,
  loreSnippet: 'A shambling mass of decayed vegetation and cursed mud, oozing with toxic sludge.',
  bestiaryMetadata: {
    title: 'Toxic Abomination',
    description: 'A reanimated horror of rotting marshland, its touch corrodes metal and flesh alike.',
    difficulty: 'normal',
    recommendedLevel: 55,
    family: 'aberration',
  },
};

export const MARSH_WRAITH: EnemyDefinition = {
  id: 'marsh_wraith',
  name: 'Marsh Wraith',
  regionId: 'haunted-marsh',
  level: 58,
  maxHealth: 160,
  stats: {
    strength: 10, agility: 18, intelligence: 20, vitality: 12,
    accuracy: 60, evasion: 55, critChance: 18, critDamage: 2.8,
    attackSpeed: 1.4, armor: 4, maxHealth: 160, damage: 22, defense: 4,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'spectral-lance', name: 'Spectral Lance', type: 'damage', description: 'Piercing lance of ghostly energy', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'soul-drain', name: 'Soul Drain', type: 'heal', description: 'Drains life force, healing 18%', cooldown: 10, intensity: 0.18, chance: 0.25 },
    { id: 'wail-of-doom', name: 'Wail of Doom', type: 'debuff', description: 'Lowers all stats by 20% for 3 turns', cooldown: 14, intensity: 0.8, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'marsh',
  xpReward: 480,
  goldReward: 180,
  loreSnippet: 'The tortured spirit of a lost traveler, forever trapped between life and death.',
  bestiaryMetadata: {
    title: 'Lost Soul',
    description: 'A wailing specter whose touch drains both vitality and will to fight.',
    difficulty: 'hard',
    recommendedLevel: 58,
    family: 'spectral',
  },
};

export const SWAMP_TROLL: EnemyDefinition = {
  id: 'swamp_troll',
  name: 'Swamp Troll',
  regionId: 'haunted-marsh',
  level: 56,
  maxHealth: 220,
  stats: {
    strength: 24, agility: 8, intelligence: 2, vitality: 22,
    accuracy: 48, evasion: 20, critChance: 6, critDamage: 2.0,
    attackSpeed: 1.0, armor: 16, maxHealth: 220, damage: 24, defense: 14,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'mud-slam', name: 'Mud Slam', type: 'damage', description: 'Massive slam dealing 170% damage', cooldown: 7, intensity: 1.7, chance: 0.35 },
    { id: 'regeneration', name: 'Regeneration', type: 'heal', description: 'Regenerates 15% of max health', cooldown: 12, intensity: 0.15, duration: 3, chance: 0.25 },
    { id: 'swamp-bellow', name: 'Swamp Bellow', type: 'debuff', description: 'Reduces your accuracy by 25%', cooldown: 14, intensity: 0.75, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'marsh',
  xpReward: 440,
  goldReward: 170,
  loreSnippet: 'A massive troll caked in swamp mud, its flesh constantly regenerating from the marsh magic.',
  bestiaryMetadata: {
    title: 'Marsh Colossus',
    description: 'A hulking troll whose regenerative power makes it nearly impossible to bring down.',
    difficulty: 'normal',
    recommendedLevel: 56,
    family: 'troll',
  },
};

export const SPECTRAL_KNIGHT: EnemyDefinition = {
  id: 'spectral_knight',
  name: 'Spectral Knight',
  regionId: 'haunted-marsh',
  level: 60,
  maxHealth: 170,
  stats: {
    strength: 20, agility: 15, intelligence: 10, vitality: 16,
    accuracy: 58, evasion: 40, critChance: 15, critDamage: 2.5,
    attackSpeed: 1.3, armor: 12, maxHealth: 170, damage: 22, defense: 10,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'ghostly-strike', name: 'Ghostly Strike', type: 'damage', description: 'Phase-through attack ignoring 40% armor', cooldown: 6, intensity: 1.6, chance: 0.35 },
    { id: 'shield-phantom', name: 'Shield Phantom', type: 'buff', description: '+40% armor for 3 turns', cooldown: 13, intensity: 1.4, duration: 3, chance: 0.2 },
    { id: 'life-steal', name: 'Life Steal', type: 'heal', description: 'Drains 15% of damage dealt', cooldown: 9, intensity: 0.15, chance: 0.3 },
  ],
  lootTableId: 'marsh',
  xpReward: 500,
  goldReward: 190,
  loreSnippet: 'The ghost of a knight who fell defending the marsh, bound to serve eternally.',
  bestiaryMetadata: {
    title: 'Eternal Sentinel',
    description: 'A spectral warrior that fights with both ethereal blade and spectral shield.',
    difficulty: 'hard',
    recommendedLevel: 60,
    family: 'spectral',
  },
};

export const PLAGUE_RAT: EnemyDefinition = {
  id: 'plague_rat',
  name: 'Plague Rat',
  regionId: 'haunted-marsh',
  level: 55,
  maxHealth: 120,
  stats: {
    strength: 14, agility: 16, intelligence: 1, vitality: 12,
    accuracy: 50, evasion: 50, critChance: 10, critDamage: 2.0,
    attackSpeed: 1.6, armor: 4, maxHealth: 120, damage: 16, defense: 4,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'plague-bite', name: 'Plague Bite', type: 'dot', description: 'Infects with plague dealing damage over time', cooldown: 5, intensity: 0.6, duration: 5, chance: 0.4 },
  ],
  lootTableId: 'marsh',
  xpReward: 380,
  goldReward: 140,
  loreSnippet: 'A disease-ridden rodent the size of a dog, spreading sickness with every bite.',
  bestiaryMetadata: {
    title: 'Carrier of Pests',
    description: 'A vermin that carries every known disease, its bite alone can fell a warrior.',
    difficulty: 'normal',
    recommendedLevel: 55,
    family: 'beast',
  },
};

export const FLOOD_LICH: EnemyDefinition = {
  id: 'flood_lich',
  name: 'Flood Lich',
  regionId: 'haunted-marsh',
  level: 63,
  maxHealth: 200,
  stats: {
    strength: 8, agility: 14, intelligence: 24, vitality: 14,
    accuracy: 62, evasion: 38, critChance: 16, critDamage: 3.0,
    attackSpeed: 1.3, armor: 8, maxHealth: 200, damage: 26, defense: 6,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'tidal-blast', name: 'Tidal Blast', type: 'damage', description: 'Wave of dark water for 190% damage', cooldown: 6, intensity: 1.9, chance: 0.35 },
    { id: 'water-prison', name: 'Water Prison', type: 'stun', description: 'Encases you in water, stunning 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'drain-vitality', name: 'Drain Vitality', type: 'heal', description: 'Drains 22% of max health', cooldown: 9, intensity: 0.22, chance: 0.25 },
    { id: 'marsh-curse', name: 'Marsh Curse', type: 'dot', description: 'Curse dealing damage over time', cooldown: 8, intensity: 0.7, duration: 5, chance: 0.3 },
    { id: 'undying-tide', name: 'Undying Tide', type: 'buff', description: '+50% magic power for 3 turns', cooldown: 16, intensity: 1.5, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'marsh',
  xpReward: 560,
  goldReward: 220,
  loreSnippet: 'An ancient lich whose power floods the marsh with dark magic and undead water.',
  bestiaryMetadata: {
    title: 'Lich of the Deep',
    description: 'A powerful lich whose domain is the flooded ruins of an ancient city.',
    difficulty: 'deadly',
    recommendedLevel: 63,
    family: 'lich',
  },
};

export const MARSH_SERPENT: EnemyDefinition = {
  id: 'marsh_serpent',
  name: 'Marsh Serpent',
  regionId: 'haunted-marsh',
  level: 60,
  maxHealth: 190,
  stats: {
    strength: 22, agility: 20, intelligence: 8, vitality: 18,
    accuracy: 58, evasion: 50, critChance: 16, critDamage: 2.6,
    attackSpeed: 1.5, armor: 8, maxHealth: 190, damage: 24, defense: 6,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'constrict', name: 'Constrict', type: 'damage', description: 'Crushing coils dealing 170% damage', cooldown: 6, intensity: 1.7, chance: 0.35 },
    { id: 'venom-spray', name: 'Venom Spray', type: 'dot', description: 'Sprays venom dealing damage over time', cooldown: 8, intensity: 0.6, duration: 4, chance: 0.3 },
    { id: 'swallow', name: 'Swallow', type: 'stun', description: 'Attempts to swallow you whole, stunning 1 turn', cooldown: 14, intensity: 1.0, duration: 1, chance: 0.15 },
  ],
  lootTableId: 'marsh',
  xpReward: 520,
  goldReward: 200,
  loreSnippet: 'A colossal serpent that lurks in the deepest waters of the marsh.',
  bestiaryMetadata: {
    title: 'Abyssal Serpent',
    description: 'A monstrous snake that constricts its prey before swallowing them whole.',
    difficulty: 'hard',
    recommendedLevel: 60,
    family: 'beast',
  },
};

export const TYRANT_OF_THE_DEEP: EnemyDefinition = {
  id: 'tyrant_of_the_deep',
  name: 'Tyrant of the Deep',
  regionId: 'haunted-marsh',
  level: 65,
  maxHealth: 280,
  stats: {
    strength: 26, agility: 18, intelligence: 22, vitality: 24,
    accuracy: 65, evasion: 35, critChance: 15, critDamage: 2.8,
    attackSpeed: 1.3, armor: 16, maxHealth: 280, damage: 28, defense: 14,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'deep-crush', name: 'Deep Crush', type: 'damage', description: 'Abyssal pressure for 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'drown', name: 'Drown', type: 'stun', description: 'Pulls you under, stunning 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'tide-surge', name: 'Tide Surge', type: 'dot', description: 'Dark tide dealing damage over time', cooldown: 8, intensity: 0.8, duration: 5, chance: 0.3 },
    { id: 'ancient-ward', name: 'Ancient Ward', type: 'buff', description: '+50% armor and magic resist for 3 turns', cooldown: 14, intensity: 1.5, duration: 3, chance: 0.15 },
    { id: 'feast-of-depths', name: 'Feast of Depths', type: 'heal', description: 'Feeds on life force, healing 20%', cooldown: 10, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 700,
  goldReward: 300,
  loreSnippet: 'The ancient ruler of the flooded depths, its power has drowned entire kingdoms.',
  bestiaryMetadata: {
    title: 'Abyssal Sovereign',
    description: 'The lord of the deep waters, a being of immense power whose domain has no end.',
    difficulty: 'deadly',
    recommendedLevel: 65,
    family: 'leviathan',
  },
};

// ============================================================
// FORGOTTEN CITADEL — level 70-80
// ============================================================

export const CITADEL_GUARDIAN: EnemyDefinition = {
  id: 'citadel_guardian',
  name: 'Citadel Guardian',
  regionId: 'forgotten-citadel',
  level: 70,
  maxHealth: 230,
  stats: {
    strength: 26, agility: 12, intelligence: 6, vitality: 24,
    accuracy: 55, evasion: 25, critChance: 8, critDamage: 2.0,
    attackSpeed: 1.0, armor: 22, maxHealth: 230, damage: 26, defense: 18,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'citadel-strike', name: 'Citadel Strike', type: 'damage', description: 'Heavy blow dealing 180% damage', cooldown: 7, intensity: 1.8, chance: 0.35 },
    { id: 'fortress-stance', name: 'Fortress Stance', type: 'buff', description: '+50% armor for 3 turns', cooldown: 13, intensity: 1.5, duration: 3, chance: 0.2 },
    { id: 'war-cry', name: 'War Cry', type: 'debuff', description: 'Reduces your defense by 30%', cooldown: 15, intensity: 0.7, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'citadel',
  xpReward: 620,
  goldReward: 240,
  loreSnippet: 'An ancient construct that still guards the forgotten halls of the citadel.',
  bestiaryMetadata: {
    title: 'Eternal Warden',
    description: 'A tireless guardian forged to protect the citadel from all intruders.',
    difficulty: 'normal',
    recommendedLevel: 70,
    family: 'construct',
  },
};

export const WAILING_HERALD: EnemyDefinition = {
  id: 'wailing_herald',
  name: 'Wailing Herald',
  regionId: 'forgotten-citadel',
  level: 72,
  maxHealth: 180,
  stats: {
    strength: 10, agility: 20, intelligence: 22, vitality: 14,
    accuracy: 62, evasion: 50, critChance: 18, critDamage: 3.0,
    attackSpeed: 1.5, armor: 6, maxHealth: 180, damage: 24, defense: 4,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'herald-bolt', name: 'Herald Bolt', type: 'damage', description: 'Bolt of psychic energy for 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'mind-shatter', name: 'Mind Shatter', type: 'stun', description: 'Shatters your mind, stunning 1 turn', cooldown: 11, intensity: 1.0, duration: 1, chance: 0.25 },
    { id: 'terrify', name: 'Terrify', type: 'debuff', description: 'Reduces all stats by 25% for 3 turns', cooldown: 14, intensity: 0.75, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'citadel',
  xpReward: 660,
  goldReward: 250,
  loreSnippet: 'A screaming spirit that heralds the doom of all who enter the citadel.',
  bestiaryMetadata: {
    title: 'Doom Crier',
    description: 'A wailing specter whose screams can paralyze even the bravest warrior.',
    difficulty: 'hard',
    recommendedLevel: 72,
    family: 'spectral',
  },
};

export const OBSIDIAN_GOLEM: EnemyDefinition = {
  id: 'obsidian_golem',
  name: 'Obsidian Golem',
  regionId: 'forgotten-citadel',
  level: 74,
  maxHealth: 280,
  stats: {
    strength: 30, agility: 6, intelligence: 2, vitality: 28,
    accuracy: 50, evasion: 10, critChance: 5, critDamage: 2.0,
    attackSpeed: 0.9, armor: 28, maxHealth: 280, damage: 30, defense: 22,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'obsidian-fist', name: 'Obsidian Fist', type: 'damage', description: 'Shatters with volcanic glass for 190% damage', cooldown: 7, intensity: 1.9, chance: 0.35 },
    { id: 'volcanic-armor', name: 'Volcanic Armor', type: 'buff', description: '+60% armor for 3 turns', cooldown: 15, intensity: 1.6, duration: 3, chance: 0.2 },
    { id: 'quake', name: 'Quake', type: 'stun', description: 'Shakes the ground, stunning 1 turn', cooldown: 12, intensity: 1.0, duration: 1, chance: 0.2 },
  ],
  lootTableId: 'citadel',
  xpReward: 700,
  goldReward: 260,
  loreSnippet: 'A towering golem of volcanic glass, its surface shimmering with inner fire.',
  bestiaryMetadata: {
    title: 'Living Obsidian',
    description: 'A construct of rare volcanic glass, nearly impervious to physical attacks.',
    difficulty: 'normal',
    recommendedLevel: 74,
    family: 'construct',
  },
};

export const FALLEN_PALLY: EnemyDefinition = {
  id: 'fallen_pally',
  name: 'Fallen Paladin',
  regionId: 'forgotten-citadel',
  level: 76,
  maxHealth: 220,
  stats: {
    strength: 24, agility: 16, intelligence: 18, vitality: 20,
    accuracy: 60, evasion: 35, critChance: 14, critDamage: 2.5,
    attackSpeed: 1.3, armor: 18, maxHealth: 220, damage: 26, defense: 16,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'corrupted-smite', name: 'Corrupted Smite', type: 'damage', description: 'Dark smite dealing 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'holy-shield', name: 'Holy Shield', type: 'buff', description: 'Absorbs damage equal to 25% max health', cooldown: 14, intensity: 0.25, duration: 3, chance: 0.2 },
    { id: 'repentance', name: 'Repentance', type: 'debuff', description: 'Reduces your strength and accuracy', cooldown: 12, intensity: 0.75, duration: 3, chance: 0.25 },
    { id: 'lay-on-hands', name: 'Lay on Hands', type: 'heal', description: 'Heals for 20% of max health', cooldown: 15, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'citadel',
  xpReward: 740,
  goldReward: 280,
  loreSnippet: 'A paladin who fell to corruption, its holy light now twisted into shadow.',
  bestiaryMetadata: {
    title: 'Corrupted Champion',
    description: 'A once-noble paladin whose faith has been perverted by the citadel\'s dark influence.',
    difficulty: 'hard',
    recommendedLevel: 76,
    family: 'undead',
  },
};

export const VOID_STALKER: EnemyDefinition = {
  id: 'void_stalker',
  name: 'Void Stalker',
  regionId: 'forgotten-citadel',
  level: 78,
  maxHealth: 200,
  stats: {
    strength: 16, agility: 24, intelligence: 20, vitality: 16,
    accuracy: 65, evasion: 60, critChance: 20, critDamage: 3.0,
    attackSpeed: 1.6, armor: 8, maxHealth: 200, damage: 28, defense: 6,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'void-slash', name: 'Void Slash', type: 'damage', description: 'Rending void energy for 190% damage', cooldown: 6, intensity: 1.9, chance: 0.35 },
    { id: 'phase-strike', name: 'Phase Strike', type: 'damage', description: 'Strikes from another dimension', cooldown: 8, intensity: 2.0, chance: 0.3 },
    { id: 'dimensional-rift', name: 'Dimensional Rift', type: 'stun', description: 'Opens a rift that stuns for 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'void-armor', name: 'Void Armor', type: 'buff', description: '+50% evasion for 3 turns', cooldown: 15, intensity: 1.5, duration: 3, chance: 0.15 },
    { id: 'nullify', name: 'Nullify', type: 'debuff', description: 'Removes all your buffs', cooldown: 14, intensity: 1.0, duration: 1, chance: 0.15 },
  ],
  lootTableId: 'citadel',
  xpReward: 780,
  goldReward: 300,
  loreSnippet: 'A creature from the void between worlds, hunting those who trespass in the citadel.',
  bestiaryMetadata: {
    title: 'Between Worlds',
    description: 'An entity that exists in the spaces between dimensions, striking from impossible angles.',
    difficulty: 'deadly',
    recommendedLevel: 78,
    family: 'void',
  },
};

export const HOLLOW_KING: EnemyDefinition = {
  id: 'hollow_king',
  name: 'Hollow King',
  regionId: 'forgotten-citadel',
  level: 80,
  maxHealth: 320,
  stats: {
    strength: 28, agility: 18, intelligence: 26, vitality: 26,
    accuracy: 68, evasion: 35, critChance: 15, critDamage: 3.0,
    attackSpeed: 1.3, armor: 18, maxHealth: 320, damage: 30, defense: 16,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'royal-decree', name: 'Royal Decree', type: 'damage', description: 'Commanding strike dealing 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'throne-of-bones', name: 'Throne of Bones', type: 'buff', description: '+50% all stats for 3 turns', cooldown: 15, intensity: 1.5, duration: 3, chance: 0.15 },
    { id: 'crown-of-fear', name: 'Crown of Fear', type: 'debuff', description: 'Terror reduces your stats by 30%', cooldown: 13, intensity: 0.7, duration: 3, chance: 0.2 },
    { id: 'undying-majesty', name: 'Undying Majesty', type: 'heal', description: 'Regenerates 20% of max health', cooldown: 11, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'citadel',
  xpReward: 820,
  goldReward: 320,
  loreSnippet: 'The ancient king who built the citadel, now a hollow shell of his former power.',
  bestiaryMetadata: {
    title: 'Fallen Sovereign',
    description: 'The undead king whose ambition built a kingdom, now ruling over nothing but ruin.',
    difficulty: 'deadly',
    recommendedLevel: 80,
    family: 'undead',
  },
};

export const ARCH_DEMON: EnemyDefinition = {
  id: 'arch_demon',
  name: 'Arch Demon',
  regionId: 'forgotten-citadel',
  level: 82,
  maxHealth: 350,
  stats: {
    strength: 32, agility: 22, intelligence: 28, vitality: 30,
    accuracy: 70, evasion: 35, critChance: 18, critDamage: 3.2,
    attackSpeed: 1.4, armor: 22, maxHealth: 350, damage: 34, defense: 18,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'hellfire', name: 'Hellfire', type: 'dot', description: 'Burns with hellfire dealing damage over time', cooldown: 6, intensity: 0.8, duration: 5, chance: 0.35 },
    { id: 'demon-slam', name: 'Demon Slam', type: 'damage', description: 'Overwhelming strike for 210% damage', cooldown: 7, intensity: 2.1, chance: 0.35 },
    { id: 'soul-cage', name: 'Soul Cage', type: 'stun', description: 'Cages your soul, stunning 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'dark-corruption', name: 'Dark Corruption', type: 'debuff', description: 'Corrupts your equipment, reducing stats', cooldown: 15, intensity: 0.6, duration: 4, chance: 0.2 },
    { id: 'demonic-heal', name: 'Demonic Heal', type: 'heal', description: 'Feeds on souls, healing 25%', cooldown: 11, intensity: 0.25, chance: 0.2 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 900,
  goldReward: 400,
  loreSnippet: 'The arch demon that conquered the citadel, its power rivaling the gods themselves.',
  bestiaryMetadata: {
    title: 'Conqueror of Citadel',
    description: 'The supreme demon lord whose power has corrupted the entire citadel.',
    difficulty: 'deadly',
    recommendedLevel: 82,
    family: 'demon',
  },
};

// ============================================================
// VOLCANIC WASTELAND — level 85-93
// ============================================================

export const MAGMA_DRAKE: EnemyDefinition = {
  id: 'magma_drake',
  name: 'Magma Drake',
  regionId: 'volcanic-wasteland',
  level: 85,
  maxHealth: 260,
  stats: {
    strength: 28, agility: 20, intelligence: 16, vitality: 24,
    accuracy: 62, evasion: 35, critChance: 14, critDamage: 2.5,
    attackSpeed: 1.3, armor: 16, maxHealth: 260, damage: 30, defense: 14,
  },
  attackStyle: 'magic',
  category: 'normal',
  abilities: [
    { id: 'magma-breath', name: 'Magma Breath', type: 'dot', description: 'Breathes molten rock dealing damage over time', cooldown: 6, intensity: 0.7, duration: 5, chance: 0.35 },
    { id: 'tail-lash', name: 'Tail Lash', type: 'damage', description: 'Whips with fiery tail for 170% damage', cooldown: 7, intensity: 1.7, chance: 0.3 },
  ],
  lootTableId: 'volcanic',
  xpReward: 850,
  goldReward: 320,
  loreSnippet: 'A drake that swims through molten rock, its scales glowing with inner heat.',
  bestiaryMetadata: {
    title: 'Living Lava',
    description: 'A drake born in the heart of the volcano, its breath melts stone.',
    difficulty: 'normal',
    recommendedLevel: 85,
    family: 'dragon',
  },
};

export const INFERNAL_ELEMENTAL: EnemyDefinition = {
  id: 'infernal_elemental',
  name: 'Infernal Elemental',
  regionId: 'volcanic-wasteland',
  level: 87,
  maxHealth: 240,
  stats: {
    strength: 18, agility: 16, intelligence: 28, vitality: 20,
    accuracy: 65, evasion: 35, critChance: 16, critDamage: 2.8,
    attackSpeed: 1.4, armor: 12, maxHealth: 240, damage: 32, defense: 10,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'fire-nova', name: 'Fire Nova', type: 'damage', description: 'Explosion of fire dealing 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'molten-shield', name: 'Molten Shield', type: 'buff', description: '+50% armor for 3 turns', cooldown: 14, intensity: 1.5, duration: 3, chance: 0.2 },
    { id: 'ignite', name: 'Ignite', type: 'dot', description: 'Covers you in flames dealing damage over time', cooldown: 8, intensity: 0.7, duration: 5, chance: 0.3 },
    { id: 'flame-absorb', name: 'Flame Absorb', type: 'heal', description: 'Absorbs fire, healing 20%', cooldown: 12, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'volcanic',
  xpReward: 900,
  goldReward: 340,
  loreSnippet: 'A living manifestation of volcanic fury, its body is pure fire and rage.',
  bestiaryMetadata: {
    title: 'Born of Fire',
    description: 'An elemental that embodies the destructive power of the earth\'s core.',
    difficulty: 'hard',
    recommendedLevel: 87,
    family: 'elemental',
  },
};

export const FIRE_GIANT: EnemyDefinition = {
  id: 'fire_giant',
  name: 'Fire Giant',
  regionId: 'volcanic-wasteland',
  level: 88,
  maxHealth: 300,
  stats: {
    strength: 34, agility: 12, intelligence: 4, vitality: 30,
    accuracy: 55, evasion: 18, critChance: 8, critDamage: 2.2,
    attackSpeed: 1.1, armor: 22, maxHealth: 300, damage: 34, defense: 18,
  },
  attackStyle: 'melee',
  category: 'normal',
  abilities: [
    { id: 'fire-fist', name: 'Fire Fist', type: 'damage', description: 'Burning fist dealing 190% damage', cooldown: 7, intensity: 1.9, chance: 0.35 },
    { id: 'magma-throw', name: 'Magma Throw', type: 'damage', description: 'Hurls molten rock dealing 160% damage', cooldown: 9, intensity: 1.6, chance: 0.3 },
    { id: 'giants-resilience', name: 'Giant\'s Resilience', type: 'heal', description: 'Regenerates 18% of max health', cooldown: 13, intensity: 0.18, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'volcanic',
  xpReward: 920,
  goldReward: 350,
  loreSnippet: 'A massive giant born from volcanic fire, its每一 strike showers sparks.',
  bestiaryMetadata: {
    title: 'Volcanic Titan',
    description: 'A fire giant whose strength can reshape the volcanic landscape.',
    difficulty: 'normal',
    recommendedLevel: 88,
    family: 'giant',
  },
};

export const ASH_WRAITH: EnemyDefinition = {
  id: 'ash_wraith',
  name: 'Ash Wraith',
  regionId: 'volcanic-wasteland',
  level: 90,
  maxHealth: 220,
  stats: {
    strength: 14, agility: 22, intelligence: 26, vitality: 18,
    accuracy: 68, evasion: 55, critChance: 20, critDamage: 3.2,
    attackSpeed: 1.5, armor: 6, maxHealth: 220, damage: 30, defense: 4,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'ash-blast', name: 'Ash Blast', type: 'damage', description: 'Eruption of volcanic ash for 190% damage', cooldown: 6, intensity: 1.9, chance: 0.35 },
    { id: 'suffocate', name: 'Suffocate', type: 'stun', description: 'Chokes you with ash, stunning 1 turn', cooldown: 11, intensity: 1.0, duration: 1, chance: 0.25 },
    { id: 'ash-drain', name: 'Ash Drain', type: 'heal', description: 'Drains life force, healing 20%', cooldown: 10, intensity: 0.2, chance: 0.25 },
    { id: 'ember-cloak', name: 'Ember Cloak', type: 'buff', description: '+50% evasion for 3 turns', cooldown: 14, intensity: 1.5, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'volcanic',
  xpReward: 960,
  goldReward: 370,
  loreSnippet: 'The spirit of a pyromancer consumed by their own flames, now a being of pure ash.',
  bestiaryMetadata: {
    title: 'Ashen Revenant',
    description: 'A wraith of volcanic ash, its touch burns with the heat of the earth\'s core.',
    difficulty: 'hard',
    recommendedLevel: 90,
    family: 'spectral',
  },
};

export const PYRO_LORD: EnemyDefinition = {
  id: 'pyro_lord',
  name: 'Pyro Lord',
  regionId: 'volcanic-wasteland',
  level: 91,
  maxHealth: 270,
  stats: {
    strength: 22, agility: 18, intelligence: 30, vitality: 22,
    accuracy: 68, evasion: 40, critChance: 18, critDamage: 3.0,
    attackSpeed: 1.4, armor: 14, maxHealth: 270, damage: 34, defense: 12,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'pyroclasm', name: 'Pyroclasm', type: 'damage', description: 'Explosive fireball for 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'flame-eruption', name: 'Flame Eruption', type: 'dot', description: 'Volcanic eruption dealing damage over time', cooldown: 8, intensity: 0.8, duration: 5, chance: 0.3 },
    { id: 'fire-shield', name: 'Fire Shield', type: 'buff', description: '+60% armor and reflects damage', cooldown: 14, intensity: 1.6, duration: 3, chance: 0.2 },
    { id: 'pyro-heal', name: 'Pyro Heal', type: 'heal', description: 'Absorbs fire, healing 25%', cooldown: 11, intensity: 0.25, chance: 0.2 },
    { id: 'inferno', name: 'Inferno', type: 'stun', description: 'Engulfs the area in flame, stunning 1 turn', cooldown: 13, intensity: 1.0, duration: 1, chance: 0.15 },
  ],
  lootTableId: 'volcanic',
  xpReward: 1000,
  goldReward: 400,
  loreSnippet: 'A sorcerer who mastered fire to the point of becoming one with it.',
  bestiaryMetadata: {
    title: 'Lord of Flames',
    description: 'The supreme fire mage whose power commands the very volcanoes.',
    difficulty: 'deadly',
    recommendedLevel: 91,
    family: 'mage',
  },
};

export const EMBER_SERPENT: EnemyDefinition = {
  id: 'ember_serpent',
  name: 'Ember Serpent',
  regionId: 'volcanic-wasteland',
  level: 90,
  maxHealth: 250,
  stats: {
    strength: 26, agility: 24, intelligence: 12, vitality: 22,
    accuracy: 64, evasion: 50, critChance: 18, critDamage: 2.8,
    attackSpeed: 1.6, armor: 10, maxHealth: 250, damage: 30, defense: 8,
  },
  attackStyle: 'melee',
  category: 'elite',
  abilities: [
    { id: 'ember-fang', name: 'Ember Fang', type: 'damage', description: 'Burning bite dealing 180% damage', cooldown: 6, intensity: 1.8, chance: 0.35 },
    { id: 'lava-spray', name: 'Lava Spray', type: 'dot', description: 'Sprays lava dealing damage over time', cooldown: 8, intensity: 0.7, duration: 4, chance: 0.3 },
    { id: 'coil-crush', name: 'Coil Crush', type: 'stun', description: 'Crushes you with fiery coils, stunning 1 turn', cooldown: 12, intensity: 1.0, duration: 1, chance: 0.2 },
    { id: 'ember-regeneration', name: 'Ember Regeneration', type: 'heal', description: 'Regenerates 20% of max health', cooldown: 13, intensity: 0.2, chance: 0.2 },
  ],
  lootTableId: 'volcanic',
  xpReward: 950,
  goldReward: 380,
  loreSnippet: 'A serpent that swims through lava, its scales forged in the heart of the earth.',
  bestiaryMetadata: {
    title: 'Lava Wyrm',
    description: 'A colossal snake that rules the volcanic rivers, its bite burns through any armor.',
    difficulty: 'hard',
    recommendedLevel: 90,
    family: 'dragon',
  },
};

export const MAGMA_TYRANT: EnemyDefinition = {
  id: 'magma_tyrant',
  name: 'Magma Tyrant',
  regionId: 'volcanic-wasteland',
  level: 93,
  maxHealth: 400,
  stats: {
    strength: 36, agility: 20, intelligence: 28, vitality: 34,
    accuracy: 72, evasion: 30, critChance: 16, critDamage: 3.2,
    attackSpeed: 1.3, armor: 24, maxHealth: 400, damage: 38, defense: 20,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'eruption', name: 'Eruption', type: 'damage', description: 'Volcanic eruption for 220% damage', cooldown: 6, intensity: 2.2, chance: 0.35 },
    { id: 'magma-prison', name: 'Magma Prison', type: 'stun', description: 'Encases you in magma, stunning 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'pyroclastic-flow', name: 'Pyroclastic Flow', type: 'dot', description: 'Deadly flow dealing damage over time', cooldown: 8, intensity: 0.9, duration: 5, chance: 0.3 },
    { id: 'volcanic-fury', name: 'Volcanic Fury', type: 'buff', description: '+60% damage for 3 turns', cooldown: 15, intensity: 1.6, duration: 3, chance: 0.15 },
    { id: 'heart-of-fire', name: 'Heart of Fire', type: 'heal', description: 'Draws power from the volcano, healing 25%', cooldown: 11, intensity: 0.25, chance: 0.2 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 1100,
  goldReward: 500,
  loreSnippet: 'The living will of the volcano, its rage has reshaped entire continents.',
  bestiaryMetadata: {
    title: 'Avatar of the Volcano',
    description: 'The supreme ruler of the volcanic wasteland, a being of unimaginable destructive power.',
    difficulty: 'deadly',
    recommendedLevel: 93,
    family: 'elemental',
  },
};

// ============================================================
// THE ETERNAL ABYSS — level 95-99
// ============================================================

export const ABYSSAL_WALKER: EnemyDefinition = {
  id: 'abyssal_walker',
  name: 'Abyssal Walker',
  regionId: 'ancient-endgame',
  level: 95,
  maxHealth: 300,
  stats: {
    strength: 28, agility: 24, intelligence: 28, vitality: 26,
    accuracy: 72, evasion: 48, critChance: 18, critDamage: 3.0,
    attackSpeed: 1.4, armor: 14, maxHealth: 300, damage: 34, defense: 12,
  },
  attackStyle: 'magic',
  category: 'normal',
  abilities: [
    { id: 'void-bolt', name: 'Void Bolt', type: 'damage', description: 'Rending void energy for 190% damage', cooldown: 6, intensity: 1.9, chance: 0.35 },
    { id: 'dimension-tear', name: 'Dimension Tear', type: 'dot', description: 'Tears reality dealing damage over time', cooldown: 8, intensity: 0.8, duration: 5, chance: 0.3 },
    { id: 'phase-shift', name: 'Phase Shift', type: 'buff', description: '+60% evasion for 3 turns', cooldown: 14, intensity: 1.6, duration: 3, chance: 0.2 },
  ],
  lootTableId: 'abyss',
  xpReward: 1100,
  goldReward: 420,
  loreSnippet: 'A being from the deepest void, walking between dimensions with ease.',
  bestiaryMetadata: {
    title: 'Void Wanderer',
    description: 'An entity that traverses the spaces between worlds, its very presence warps reality.',
    difficulty: 'normal',
    recommendedLevel: 95,
    family: 'void',
  },
};

export const TIME_REAVER: EnemyDefinition = {
  id: 'time_reaver',
  name: 'Time Reaver',
  regionId: 'ancient-endgame',
  level: 96,
  maxHealth: 280,
  stats: {
    strength: 20, agility: 28, intelligence: 30, vitality: 22,
    accuracy: 75, evasion: 55, critChance: 22, critDamage: 3.5,
    attackSpeed: 1.6, armor: 10, maxHealth: 280, damage: 36, defense: 8,
  },
  attackStyle: 'magic',
  category: 'elite',
  abilities: [
    { id: 'temporal-strike', name: 'Temporal Strike', type: 'damage', description: 'Attacks across time for 200% damage', cooldown: 6, intensity: 2.0, chance: 0.35 },
    { id: 'time-lock', name: 'Time Lock', type: 'stun', description: 'Freezes you in time for 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'chrono-drain', name: 'Chrono Drain', type: 'heal', description: 'Drains your time, healing 22%', cooldown: 10, intensity: 0.22, chance: 0.25 },
    { id: 'temporal-echo', name: 'Temporal Echo', type: 'buff', description: 'Attacks twice for 3 turns', cooldown: 16, intensity: 2.0, duration: 3, chance: 0.15 },
    { id: 'age', name: 'Age', type: 'debuff', description: 'Ages you rapidly, reducing all stats', cooldown: 14, intensity: 0.65, duration: 4, chance: 0.2 },
  ],
  lootTableId: 'abyss',
  xpReward: 1200,
  goldReward: 460,
  loreSnippet: 'A temporal entity that steals moments from its victims, aging them in seconds.',
  bestiaryMetadata: {
    title: 'Chronal Devourer',
    description: 'An entity that exists outside of time, feeding on the temporal energy of mortals.',
    difficulty: 'deadly',
    recommendedLevel: 96,
    family: 'temporal',
  },
};

export const VOID_LORD: EnemyDefinition = {
  id: 'void_lord',
  name: 'Void Lord',
  regionId: 'ancient-endgame',
  level: 97,
  maxHealth: 340,
  stats: {
    strength: 30, agility: 22, intelligence: 34, vitality: 28,
    accuracy: 75, evasion: 45, critChance: 18, critDamage: 3.2,
    attackSpeed: 1.4, armor: 16, maxHealth: 340, damage: 38, defense: 14,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'void-decree', name: 'Void Decree', type: 'damage', description: 'Commanding void energy for 210% damage', cooldown: 6, intensity: 2.1, chance: 0.35 },
    { id: 'void-prison', name: 'Void Prison', type: 'stun', description: 'Imprisons you in the void, stunning 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'void-drain', name: 'Void Drain', type: 'heal', description: 'Drains your essence, healing 25%', cooldown: 10, intensity: 0.25, chance: 0.25 },
    { id: 'null-field', name: 'Null Field', type: 'debuff', description: 'Creates a field that nullifies all buffs', cooldown: 15, intensity: 1.0, duration: 3, chance: 0.2 },
    { id: 'void-shield', name: 'Void Shield', type: 'buff', description: '+70% armor for 3 turns', cooldown: 14, intensity: 1.7, duration: 3, chance: 0.15 },
  ],
  lootTableId: 'abyss',
  xpReward: 1300,
  goldReward: 500,
  loreSnippet: 'The supreme ruler of the void, its power can unmake reality itself.',
  bestiaryMetadata: {
    title: 'Void Sovereign',
    description: 'The lord of the abyss, a being whose power approaches that of the gods.',
    difficulty: 'deadly',
    recommendedLevel: 97,
    family: 'void',
  },
};

export const ELDER_DRAGON: EnemyDefinition = {
  id: 'elder_dragon',
  name: 'Elder Dragon',
  regionId: 'ancient-endgame',
  level: 98,
  maxHealth: 400,
  stats: {
    strength: 38, agility: 26, intelligence: 30, vitality: 36,
    accuracy: 75, evasion: 40, critChance: 18, critDamage: 3.5,
    attackSpeed: 1.3, armor: 22, maxHealth: 400, damage: 40, defense: 20,
  },
  attackStyle: 'magic',
  category: 'rare',
  abilities: [
    { id: 'elder-breath', name: 'Elder Breath', type: 'dot', description: 'Reality-warping breath dealing damage over time', cooldown: 6, intensity: 0.9, duration: 5, chance: 0.35 },
    { id: 'dragon-strike', name: 'Dragon Strike', type: 'damage', description: 'Devastating claw attack for 220% damage', cooldown: 7, intensity: 2.2, chance: 0.35 },
    { id: 'time-freeze', name: 'Time Freeze', type: 'stun', description: 'Freezes time, stunning for 2 turns', cooldown: 13, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'ancient-wisdom', name: 'Ancient Wisdom', type: 'buff', description: '+60% all stats for 3 turns', cooldown: 16, intensity: 1.6, duration: 3, chance: 0.15 },
    { id: 'dragon-heal', name: 'Dragon Heal', type: 'heal', description: 'Channels ancient power, healing 30%', cooldown: 11, intensity: 0.3, chance: 0.2 },
  ],
  lootTableId: 'abyss',
  xpReward: 1400,
  goldReward: 550,
  loreSnippet: 'The oldest dragon in existence, its power has warped reality around it.',
  bestiaryMetadata: {
    title: 'The Primordial Wyrm',
    description: 'An elder dragon whose existence predates the world itself, its power is beyond mortal comprehension.',
    difficulty: 'deadly',
    recommendedLevel: 98,
    family: 'dragon',
  },
};

export const THE_UNMAKER: EnemyDefinition = {
  id: 'the_unmaker',
  name: 'The Unmaker',
  regionId: 'ancient-endgame',
  level: 99,
  maxHealth: 500,
  stats: {
    strength: 40, agility: 30, intelligence: 40, vitality: 40,
    accuracy: 80, evasion: 45, critChance: 20, critDamage: 4.0,
    attackSpeed: 1.4, armor: 28, maxHealth: 500, damage: 44, defense: 24,
  },
  attackStyle: 'magic',
  category: 'boss',
  abilities: [
    { id: 'annihilate', name: 'Annihilate', type: 'damage', description: 'Unmakes reality for 250% damage', cooldown: 5, intensity: 2.5, chance: 0.4 },
    { id: 'void-collapse', name: 'Void Collapse', type: 'stun', description: 'Collapses the void, stunning 2 turns', cooldown: 12, intensity: 1.0, duration: 2, chance: 0.2 },
    { id: 'entropy-wave', name: 'Entropy Wave', type: 'dot', description: 'Wave of entropy dealing damage over time', cooldown: 7, intensity: 1.0, duration: 5, chance: 0.35 },
    { id: 'unmake-reality', name: 'Unmake Reality', type: 'debuff', description: 'Reduces all stats by 40% for 4 turns', cooldown: 15, intensity: 0.6, duration: 4, chance: 0.2 },
    { id: 'abyssal-regeneration', name: 'Abyssal Regeneration', type: 'heal', description: 'Draws from the void, healing 35%', cooldown: 10, intensity: 0.35, chance: 0.2 },
    { id: 'cosmic-power', name: 'Cosmic Power', type: 'buff', description: '+80% all stats for 3 turns', cooldown: 18, intensity: 1.8, duration: 3, chance: 0.1 },
  ],
  lootTableId: 'boss_loot',
  xpReward: 2000,
  goldReward: 1000,
  loreSnippet: 'The ultimate evil, a being whose sole purpose is to unmake all of existence.',
  bestiaryMetadata: {
    title: 'The Final Boss',
    description: 'The supreme antagonist of the Eternal Abyss, whose power threatens to unravel the fabric of reality.',
    difficulty: 'deadly',
    recommendedLevel: 99,
    family: 'void',
  },
};

// ============================================================
// ENEMY REGISTRY
// ============================================================

export const ALL_ENEMIES: EnemyDefinition[] = [
  // Starter Frontier
  GOBLIN, GOBLIN_CHAMPION, SKELETON, SKELETON_ARCHER, WOLF, ALPHA_WOLF,
  FOREST_BOAR, BUSH_RAT, ROOK, FOREST_TROLL_KING,
  // Darkwood Forest
  DARKWOOD_SPIDER, CAVE_BAT, ZOMBIE, GHOUL, WEREWOLF, SHADE,
  ELDER_DRYAD, NIGHT_STALKER, COUNT_VLAD,
  // Ruined Province
  SKELETON_KNIGHT, GRAVE_GUARDIAN, WRAITH, CORRUPTED_MAGE,
  STONE_GOLEM, SOUL_REAPER, ANCIENT_LICH, UNDEAD_DRAGON,
  // Mountain Stronghold
  ICE_ELEMENTAL, MOUNTAIN_TROLL, FROST_DRAKE, GIANT_WARRIOR,
  RUNITE_ELEMENTAL, WYVERN, MOUNTAIN_KING, FROST_GIANT_KING,
  // Haunted Marsh
  BOG_HORROR, MARSH_WRAITH, SWAMP_TROLL, SPECTRAL_KNIGHT,
  PLAGUE_RAT, FLOOD_LICH, MARSH_SERPENT, TYRANT_OF_THE_DEEP,
  // Forgotten Citadel
  CITADEL_GUARDIAN, WAILING_HERALD, OBSIDIAN_GOLEM, FALLEN_PALLY,
  VOID_STALKER, HOLLOW_KING, ARCH_DEMON,
  // Volcanic Wasteland
  MAGMA_DRAKE, INFERNAL_ELEMENTAL, FIRE_GIANT, ASH_WRAITH,
  PYRO_LORD, EMBER_SERPENT, MAGMA_TYRANT,
  // The Eternal Abyss
  ABYSSAL_WALKER, TIME_REAVER, VOID_LORD, ELDER_DRAGON, THE_UNMAKER,
];

export const STARTER_ENEMIES = [
  GOBLIN,
  SKELETON,
  WOLF,
  GOBLIN_CHAMPION,
  SKELETON_ARCHER,
  ALPHA_WOLF,
];
