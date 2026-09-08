import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  SMITHING_RECIPES,
  COOKING_RECIPES,
  FLETCHING_RECIPES,
  ALCHEMY_RECIPES,
  RUNECRAFTING_RECIPES,
  CRAFTING_RECIPES,
  ALL_RECIPES,
  getRecipesForSkill,
  getRecipeById,
  getAvailableRecipes,
  getLockedRecipes,
  getIngredientsForRecipe,
  getOutputsForRecipe,
  hasIngredients,
  calculateMaxCrafts,
  startCraftingAction,
  isCraftingComplete,
  getCraftingProgress,
  getCraftingTimeRemaining,
  completeCraftingAction,
  createCraftingState,
  enqueueCrafting,
  processCraftingQueue,
  cancelCraftingAction,
  clearCraftingQueue,
  removeFromQueue,
  formatCraftingTime,
  getSkillColor,
  getSkillEmoji,
} from '../src/crafting';
import type { CraftingAction, CraftingState } from '@premium-rpg/shared-types';

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── RECIPE DATA INTEGRITY ─────────────────────────────────────────

describe('crafting recipe data', () => {
  const SKILL_COUNTS: Record<string, number> = {
    smithing: SMITHING_RECIPES.length,
    cooking: COOKING_RECIPES.length,
    fletching: FLETCHING_RECIPES.length,
    alchemy: ALCHEMY_RECIPES.length,
    runecrafting: RUNECRAFTING_RECIPES.length,
    crafting: CRAFTING_RECIPES.length,
  };

  it('aggregates every skill-specific recipe into ALL_RECIPES', () => {
    const total = Object.values(SKILL_COUNTS).reduce((a, b) => a + b, 0);
    expect(ALL_RECIPES.length).toBe(total);
    expect(SKILL_COUNTS.smithing).toBeGreaterThan(0);
  });

  it('has unique recipe ids', () => {
    const ids = ALL_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every recipe declares valid required fields', () => {
    for (const r of ALL_RECIPES) {
      expect(r.name.trim().length).toBeGreaterThan(0);
      expect(r.levelRequired).toBeGreaterThanOrEqual(1);
      expect(r.duration).toBeGreaterThan(0);
      expect(r.xp).toBeGreaterThan(0);
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.output.length).toBeGreaterThan(0);
      for (const i of r.ingredients) {
        expect(i.itemId.length).toBeGreaterThan(0);
        expect(i.quantity).toBeGreaterThan(0);
      }
      for (const o of r.output) {
        expect(o.itemId.length).toBeGreaterThan(0);
        expect(o.quantity).toBeGreaterThan(0);
      }
    }
  });

  it('ingredients reference item ids that exist in the item catalog', () => {
    for (const r of ALL_RECIPES) {
      for (const i of r.ingredients) {
        expect(getRecipeById(r.id)).toBeDefined();
        expect(i.itemId.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── RECIPE LOOKUP HELPERS ─────────────────────────────────────────

describe('recipe lookup helpers', () => {
  it('getRecipesForSkill filters by skill', () => {
    const smithing = getRecipesForSkill('smithing');
    expect(smithing.length).toBe(SMITHING_RECIPES.length);
    expect(smithing.every((r) => r.skill === 'smithing')).toBe(true);
  });

  it('getRecipeById finds a known recipe and returns undefined otherwise', () => {
    expect(getRecipeById('smith_bronze_bar')?.name).toBe('Bronze Bar');
    expect(getRecipeById('cook_shark')?.skill).toBe('cooking');
    expect(getRecipeById('does_not_exist')).toBeUndefined();
  });

  it('getAvailableRecipes respects level requirements', () => {
    const available = getAvailableRecipes('smithing', 10);
    expect(available.every((r) => r.levelRequired <= 10)).toBe(true);
    const locked = getLockedRecipes('smithing', 10);
    expect(locked.every((r) => r.levelRequired > 10)).toBe(true);
    expect(available.length + locked.length).toBe(SMITHING_RECIPES.length);
  });

  it('getIngredientsForRecipe returns ingredients for a known recipe', () => {
    expect(getIngredientsForRecipe('smith_steel_bar')).toEqual([
      { itemId: 'iron_ore', quantity: 1 },
      { itemId: 'coal', quantity: 2 },
    ]);
    expect(getIngredientsForRecipe('missing')).toEqual([]);
  });

  it('getOutputsForRecipe returns outputs for a known recipe', () => {
    expect(getOutputsForRecipe('fletch_wooden_arrows')).toEqual([
      { itemId: 'wooden_arrows', quantity: 10 },
    ]);
    expect(getOutputsForRecipe('missing')).toEqual([]);
  });
});

// ─── INGREDIENT CHECKING ───────────────────────────────────────────

describe('ingredient checks', () => {
  const bronze = getRecipeById('smith_bronze_bar')!; // 1 copper_ore + 1 tin_ore

  it('returns canCraft true and empty missing when enough stock', () => {
    const r = hasIngredients(bronze, { copper_ore: 5, tin_ore: 2 });
    expect(r.canCraft).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('reports exactly the shortfall for each missing ingredient', () => {
    const r = hasIngredients(bronze, { copper_ore: 1 }); // tin_ore absent entirely
    expect(r.canCraft).toBe(false);
    expect(r.missing).toEqual([{ itemId: 'tin_ore', quantity: 1 }]);
  });

  it('reports partial shortfall', () => {
    const r = hasIngredients(bronze, { copper_ore: 1, tin_ore: 0 });
    expect(r.missing).toEqual([{ itemId: 'tin_ore', quantity: 1 }]);
  });

  it('calculateMaxCrafts floors to the limiting ingredient', () => {
    expect(calculateMaxCrafts(bronze, { copper_ore: 5, tin_ore: 2 })).toBe(2);
    expect(calculateMaxCrafts(bronze, { copper_ore: 10, tin_ore: 0 })).toBe(0);
    expect(calculateMaxCrafts(bronze, {})).toBe(0);
  });
});

// ─── CRAFTING ACTION LIFECYCLE ─────────────────────────────────────

describe('crafting action lifecycle', () => {
  const T0 = 1_000_000;
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(T0);
  });

  it('startCraftingAction creates an action with the recipe timing', () => {
    const action = startCraftingAction('smith_iron_bar', 3);
    expect(action.recipeId).toBe('smith_iron_bar');
    expect(action.skill).toBe('smithing');
    expect(action.startTime).toBe(T0);
    expect(action.duration).toBe(getRecipeById('smith_iron_bar')!.duration);
    expect(action.quantity).toBe(3);
    expect(action.completed).toBe(0);
  });

  it('throws for unknown recipe or invalid quantity', () => {
    expect(() => startCraftingAction('nope')).toThrow('Recipe not found');
    expect(() => startCraftingAction('smith_iron_bar', 0)).toThrow('Quantity must be at least 1');
  });

  it('reports progress and completion against mocked time', () => {
    const action = startCraftingAction('smith_iron_bar', 1); // duration 4000
    expect(isCraftingComplete(action)).toBe(false);
    expect(getCraftingProgress(action)).toBe(0);
    expect(getCraftingTimeRemaining(action)).toBe(4000);

    nowSpy.mockReturnValue(T0 + 2000);
    expect(isCraftingComplete(action)).toBe(false);
    expect(getCraftingProgress(action)).toBeCloseTo(0.5);

    nowSpy.mockReturnValue(T0 + 4000);
    expect(isCraftingComplete(action)).toBe(true);
    expect(getCraftingProgress(action)).toBe(1);
    expect(getCraftingTimeRemaining(action)).toBe(0);
  });

  describe('completeCraftingAction', () => {
    let randomSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      randomSpy = vi.spyOn(Math, 'random');
    });

    it('produces base output and xp when no bonus rolls succeed', () => {
      randomSpy.mockReturnValue(0.99); // above every recipe bonus chance (max 0.2)
      const result = completeCraftingAction(startCraftingAction('smith_iron_bar', 1));
      expect(result.xpGained).toBe(30);
      expect(result.outputs).toEqual([{ itemId: 'iron_bar', quantity: 1 }]);
      expect(result.consumedIngredients).toEqual([{ itemId: 'iron_ore', quantity: 1 }, { itemId: 'coal', quantity: 1 }]);
    });

    it('applies extra_output bonus to quantity', () => {
      randomSpy.mockReturnValue(0); // succeeds every roll
      const result = completeCraftingAction(startCraftingAction('fletch_wooden_arrows', 1)); // +5 arrows at 15%
      expect(result.outputs).toEqual([{ itemId: 'wooden_arrows', quantity: 15 }]);
    });

    it('applies double_output bonus', () => {
      randomSpy.mockReturnValue(0);
      const result = completeCraftingAction(startCraftingAction('smith_bronze_bar', 1)); // double_output 5%
      expect(result.outputs).toEqual([{ itemId: 'bronze_bar', quantity: 2 }]);
    });

    it('applies bonus_xp', () => {
      randomSpy.mockReturnValue(0);
      const result = completeCraftingAction(startCraftingAction('smith_bronze_sword', 1)); // bonus_xp +10 at 10%
      expect(result.xpGained).toBe(35); // 25 base + 10
    });

    it('consumes ingredients regardless of bonus result', () => {
      randomSpy.mockReturnValue(0.99);
      const result = completeCraftingAction(startCraftingAction('smith_bronze_sword', 1));
      expect(result.consumedIngredients).toEqual([{ itemId: 'bronze_bar', quantity: 2 }]);
    });
  });
});

// ─── CRAFTING QUEUE MANAGEMENT ─────────────────────────────────────

describe('crafting queue management', () => {
  const T0 = 2_000_000;
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(T0);
  });

  it('creates an empty crafting state', () => {
    const s = createCraftingState();
    expect(s.activeAction).toBeNull();
    expect(s.queue).toEqual([]);
    expect(s.recipeBook).toEqual({});
  });

  it('enqueues the first recipe as the active action and subsequent ones to the queue', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 2);
    expect(s.activeAction?.recipeId).toBe('smith_bronze_bar');
    expect(s.queue).toHaveLength(0);

    s = enqueueCrafting(s, 'cook_shrimp', 1);
    expect(s.queue).toHaveLength(1);
    expect(s.queue[0].recipeId).toBe('cook_shrimp');
  });

  it('throws enqueueing an unknown recipe', () => {
    expect(() => enqueueCrafting(createCraftingState(), 'nope')).toThrow('Recipe not found');
  });

  it('processes nothing when idle and queue is empty', () => {
    const s = createCraftingState();
    const { state, completedActions } = processCraftingQueue(s);
    expect(state.activeAction).toBeNull();
    expect(completedActions).toEqual([]);
  });

  it('promotes the queued action into the active slot', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 1);
    const queued = enqueueCrafting(s, 'cook_shrimp', 1);
    const completedState = { ...queued, activeAction: null };
    const { state } = processCraftingQueue(completedState);
    expect(state.activeAction?.recipeId).toBe('cook_shrimp');
    expect(state.queue).toHaveLength(0);
  });

  it('auto-repeats a multi-quantity recipe until quantity is reached', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 2); // quantity 2

    nowSpy.mockReturnValue(T0 + 3000); // past 3000ms duration
    let { state, completedActions } = processCraftingQueue(s);
    expect(completedActions).toHaveLength(1);
    expect(state.activeAction?.completed).toBe(1); // repeat iteration started

    // The next iteration restarted at Date.now() (T0 + 3000); advance past its duration.
    nowSpy.mockReturnValue(T0 + 6000);
    const { state: s2, completedActions: done } = processCraftingQueue(state);
    expect(done).toHaveLength(1);
    expect(s2.activeAction).toBeNull(); // quantity reached, nothing queued
  });

  it('moves to the next queued recipe after the active one finishes', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 1);
    s = enqueueCrafting(s, 'cook_shrimp', 1);

    nowSpy.mockReturnValue(T0 + 3000);
    const { state } = processCraftingQueue(s);
    expect(state.activeAction?.recipeId).toBe('cook_shrimp');
    expect(state.queue).toHaveLength(0);
  });

  it('cancelCraftingAction clears the active action but keeps the queue', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 1);
    s = enqueueCrafting(s, 'cook_shrimp', 1);
    s = cancelCraftingAction(s);
    expect(s.activeAction).toBeNull();
    expect(s.queue).toHaveLength(1);
  });

  it('clearCraftingQueue empties the queue', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 1);
    s = enqueueCrafting(s, 'cook_shrimp', 1);
    s = clearCraftingQueue(s);
    expect(s.queue).toHaveLength(0);
    expect(s.activeAction).not.toBeNull();
  });

  it('removeFromQueue removes a valid index and ignores invalid ones', () => {
    let s = createCraftingState();
    s = enqueueCrafting(s, 'smith_bronze_bar', 1);
    s = enqueueCrafting(s, 'cook_shrimp', 1);
    s = enqueueCrafting(s, 'cook_trout', 1);

    const removed = removeFromQueue(s, 1);
    // queue holds [cook_shrimp, cook_trout]; removing index 1 leaves cook_shrimp
    expect(removed.queue.map((a) => a.recipeId)).toEqual(['cook_shrimp']);

    const unchanged = removeFromQueue(s, -1);
    expect(unchanged.queue).toHaveLength(2);
    const unchanged2 = removeFromQueue(s, 5);
    expect(unchanged2.queue).toHaveLength(2);
  });
});

// ─── UI HELPERS ────────────────────────────────────────────────────

describe('crafting display helpers', () => {
  it('formatCraftingTime renders human-friendly durations', () => {
    expect(formatCraftingTime(500)).toBe('< 1s');
    expect(formatCraftingTime(1000)).toBe('1s');
    expect(formatCraftingTime(30_000)).toBe('30s');
    expect(formatCraftingTime(60_000)).toBe('1m');
    expect(formatCraftingTime(90_000)).toBe('1m 30s');
  });

  it('getSkillColor returns a distinct hex color per skill', () => {
    const skills = ['smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting', 'crafting'] as const;
    const colors = skills.map((s) => getSkillColor(s));
    expect(new Set(colors).size).toBe(skills.length);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('getSkillEmoji returns a non-empty emoji per skill', () => {
    const skills = ['smithing', 'cooking', 'fletching', 'alchemy', 'runecrafting', 'crafting'] as const;
    for (const s of skills) expect(getSkillEmoji(s).length).toBeGreaterThan(0);
  });
});