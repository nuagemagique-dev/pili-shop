import type { IngredientIconKey } from './ingredientIcons'

/*
 * The illustrated recipes of the posters in the window (public/images/recipes, the franchisor's four classics drawn
 * for the Liège shop and set in French): "Composer ce bol" on the home page and in the bowl composer loads one into
 * the composer as a starting point, broth, heat and ingredients, that the customer then changes as they like.
 *
 * The ingredients are the icon keys of data/ingredientIcons.ts, not choice ids: the composer finds the choice of the
 * live catalogue whose name maps to that icon (so a renamed or reordered choice still lands), and skips any the shop
 * does not have that day. Copy lives under `mkt.recipes.items.<key>`.
 */
export interface Recipe {
  key: string
  /** Poster asset base under /images/recipes (widths + ext appended by MktPicture, 640 has the .png). */
  image: string
  /** The broth of the recipe, as a /images/bowls slug (data/broths.ts): the composer picks that broth's card. */
  broth: 'beef-bone' | 'tomato' | 'mala-dry-mix' | 'tom-yum' | 'mushroom'
  /** The heat of the broth (data/composerSteps.ts heatLevel): 1 mild, 2 medium, 3 hot. Ignored on a broth without variants. */
  heat: 1 | 2 | 3
  /** The composer product this recipe is built in (by slug), when it is not the first composer of the menu. */
  composerSlug?: string
  ingredients: Partial<Record<IngredientIconKey, number>>
}

export const RECIPES: readonly Recipe[] = [
  {
    key: 'seafood',
    image: '/images/recipes/boeuf-fruits-de-mer',
    broth: 'beef-bone',
    heat: 2,
    ingredients: { shrimp: 2, squid: 1, 'fish-balls': 1, 'wood-ear': 1, enoki: 1 },
  },
  {
    key: 'tomato',
    image: '/images/recipes/boeuf-braise-tomate',
    broth: 'tomato',
    heat: 1,
    ingredients: { 'beef-slices': 2, potato: 1, 'sweet-potato-noodles': 1, 'chinese-cabbage': 1 },
  },
  {
    key: 'mix',
    image: '/images/recipes/mala-mix-leger',
    broth: 'mala-dry-mix',
    heat: 1,
    composerSlug: 'mala-mix-personnalise',
    ingredients: { 'pak-choi': 1, 'chinese-cabbage': 1, broccoli: 1, 'beef-slices': 1, shrimp: 1 },
  },
  {
    key: 'japanese',
    image: '/images/recipes/tomate-japonaise',
    broth: 'tomato',
    heat: 1,
    ingredients: { udon: 1, spinach: 1, 'beef-slices': 1, surimi: 1, enoki: 1 },
  },
]

/** The poster PNG fallback is 640 x 452 (every width of a set has the same ratio). */
export const RECIPE_IMAGE = { widths: [640, 1000, 1400], fallbackWidth: 640, fallbackHeight: 452 }

export const recipeByKey = (key: unknown): Recipe | undefined =>
  typeof key === 'string' ? RECIPES.find((recipe) => recipe.key === key) : undefined

/** How many portions a recipe puts in the bowl. */
export const recipeCount = (recipe: Recipe): number =>
  Object.values(recipe.ingredients).reduce((sum, qty) => sum + (qty ?? 0), 0)
