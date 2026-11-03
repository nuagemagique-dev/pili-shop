import type { IngredientIconKey } from './ingredientIcons'

/*
 * The illustrated recipes of the posters in the window (public/images/recipes, the franchisor's four classics drawn
 * for the Liège shop and set in French): "Composer ce bol" on the home page and in the bowl composer loads one into
 * the composer as a starting point, broth, heat and ingredients, that the customer then changes as they like.
 *
 * The ingredients are the icon keys of data/ingredientIcons.ts, not choice ids: the composer finds the choice of the
 * live catalogue whose name maps to that icon (so a renamed or reordered choice still lands). A poster ingredient the
 * shop does not sell takes its closest substitute on the menu (RECIPE_SUBSTITUTES), so a recipe always fills the bowl.
 * Copy lives under `mkt.recipes.items.<key>`.
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
    // Poster: fish fillet, shrimp, squid, wax gourd, wood ear. Fish balls stand for the fillet, lotus root for the gourd.
    ingredients: {
      shrimp: 3,
      squid: 2,
      'fish-balls': 2,
      'wood-ear': 2,
      'lotus-root': 2,
      enoki: 2,
      'pak-choi': 1,
    },
  },
  {
    key: 'tomato',
    image: '/images/recipes/boeuf-braise-tomate',
    broth: 'tomato',
    heat: 1,
    // Poster: plenty of braised beef and potato chunks over sweet potato noodles.
    ingredients: {
      'beef-slices': 4,
      potato: 3,
      'sweet-potato-noodles': 2,
      'chinese-cabbage': 2,
      enoki: 1,
    },
  },
  {
    key: 'mix',
    image: '/images/recipes/mala-mix-leger',
    broth: 'mala-dry-mix',
    heat: 1,
    composerSlug: 'mala-mix-personnalise',
    // Poster: pak choi, baby Chinese cabbage, broccoli, beef, shrimp and chicken (not on the menu: beef balls instead).
    ingredients: {
      'pak-choi': 2,
      'chinese-cabbage': 2,
      broccoli: 2,
      'beef-slices': 2,
      shrimp: 2,
      'beef-balls': 2,
    },
  },
  {
    key: 'japanese',
    image: '/images/recipes/tomate-japonaise',
    broth: 'tomato',
    heat: 1,
    // Poster: udon, a fried egg (quail eggs on the menu), spinach, beef rolls and surimi.
    ingredients: {
      udon: 2,
      'quail-eggs': 2,
      spinach: 2,
      'beef-slices': 3,
      surimi: 2,
      enoki: 1,
    },
  },
]

/** The poster PNG fallback is 640 x 452 (every width of a set has the same ratio). */
export const RECIPE_IMAGE = { widths: [640, 1000, 1400], fallbackWidth: 640, fallbackHeight: 452 }

export const recipeByKey = (key: unknown): Recipe | undefined =>
  typeof key === 'string' ? RECIPES.find((recipe) => recipe.key === key) : undefined

/*
 * The closest ingredients, in order, for a poster ingredient the menu does not sell (the Liège menu has no squid, wood
 * ear, potato or Chinese cabbage): same family first, and an ingredient of the recipe itself last, so a substitute adds
 * something rather than doubling what is already there.
 */
export const RECIPE_SUBSTITUTES: Partial<Record<IngredientIconKey, readonly IngredientIconKey[]>> =
  {
    squid: ['surimi', 'fish-balls', 'shrimp'],
    shrimp: ['surimi', 'fish-balls'],
    'fish-balls': ['surimi', 'beef-balls', 'shrimp'],
    surimi: ['fish-balls', 'shrimp'],
    'wood-ear': ['shiitake', 'kombu', 'enoki'],
    enoki: ['shiitake', 'oyster-mushroom', 'king-oyster', 'bean-sprouts'],
    potato: ['lotus-root', 'corn', 'sweet-potato-noodles'],
    'chinese-cabbage': ['pak-choi', 'lettuce', 'spinach', 'bean-sprouts'],
    'pak-choi': ['chinese-cabbage', 'spinach', 'lettuce'],
    spinach: ['pak-choi', 'lettuce', 'chinese-cabbage'],
    broccoli: ['pak-choi', 'bean-sprouts', 'corn'],
    'beef-slices': ['beef-balls', 'pork-belly', 'lamb'],
    'beef-balls': ['fish-balls', 'sausage', 'beef-slices'],
    'lotus-root': ['potato', 'corn', 'bean-sprouts'],
    'quail-eggs': ['silken-tofu', 'tofu-skin'],
    'sweet-potato-noodles': ['rice-vermicelli', 'udon', 'instant-noodles'],
    udon: ['instant-noodles', 'sweet-potato-noodles', 'rice-vermicelli'],
  }

/**
 * What a recipe puts in the bowl on a menu that sells `available` (icon keys): each poster ingredient, or else its
 * first substitute on the menu, with the poster's quantity; an ingredient with neither is left out.
 */
export const recipePlan = (
  recipe: Recipe,
  available: ReadonlySet<string>,
): [IngredientIconKey, number][] => {
  const plan = new Map<IngredientIconKey, number>()
  // Object.entries widens the keys to string; the recipe's keys are icon keys by its type.
  const poster = Object.entries(recipe.ingredients).filter(
    (entry): entry is [IngredientIconKey, number] => entry[1] !== undefined,
  )
  for (const [key, quantity] of poster) {
    const pick = [key, ...(RECIPE_SUBSTITUTES[key] ?? [])].find((candidate) =>
      available.has(candidate),
    )
    if (pick !== undefined) plan.set(pick, (plan.get(pick) ?? 0) + quantity)
  }
  return [...plan]
}
