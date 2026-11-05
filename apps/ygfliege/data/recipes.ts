import type { IngredientIconKey } from './ingredientIcons'

/*
 * The illustrated recipes of the posters in the window (public/images/recipes: the franchisor's four classics drawn
 * for the Liège shop and set in French, and the shop's three noodle bowls drawn in their style): "Composer ce bol" on
 * the home page and in the bowl composer loads one into the composer as a starting point, broth, heat and
 * ingredients, that the customer then changes as they like.
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
  /**
   * The heat of the broth (data/composerSteps.ts heatLevel): 0 not spicy, 1 mild, 2 medium, 3 hot. The broth's first
   * variant when the menu has no such heat; ignored on a broth without variants.
   */
  heat: 0 | 1 | 2 | 3
  /** The composer product this recipe is built in (by slug), when it is not the first composer of the menu. */
  composerSlug?: string
  /**
   * How many portions of each ingredient. A portion is the menu's ("Crevettes (3 pcs)", "Bœuf braisé (50 g)"), so a
   * recipe is sized like the set bowls of the menu (6 to 9 portions).
   */
  ingredients: Partial<Record<IngredientIconKey, number>>
  /** When the menu sells several choices of one ingredient (two beefs, two sweet potato noodles), the one the poster shows. */
  prefer?: Partial<Record<IngredientIconKey, RegExp>>
}

/** The boiled egg of the noodle bowls: the production menu sells it next to quail eggs, under the same icon. */
const BOILED_EGG = /œuf dur|oeuf dur|boiled egg|gekookt ei|水煮蛋/iu

export const RECIPES: readonly Recipe[] = [
  {
    key: 'seafood',
    image: '/images/recipes/boeuf-fruits-de-mer',
    broth: 'beef-bone',
    heat: 2,
    // Poster: fish fillet, shrimp, squid, wax gourd and wood ear (lotus root stands for the gourd, not on the menu).
    ingredients: {
      'fish-slices': 2,
      shrimp: 2,
      squid: 1,
      'wood-ear': 1,
      'lotus-root': 1,
      enoki: 1,
    },
  },
  {
    key: 'tomato',
    image: '/images/recipes/boeuf-braise-tomate',
    broth: 'tomato',
    heat: 0,
    // Poster: plenty of braised beef and potato over vermicelli.
    ingredients: {
      'beef-slices': 2,
      potato: 2,
      'sweet-potato-noodles': 1,
      'chinese-cabbage': 1,
      enoki: 1,
    },
    prefer: {
      'beef-slices': /braisé|braised|gestoofd|卤牛/iu,
      'sweet-potato-noodles': /vermicell|粉丝/iu,
    },
  },
  {
    key: 'mix',
    image: '/images/recipes/mala-mix-leger',
    broth: 'mala-dry-mix',
    heat: 1,
    composerSlug: 'mala-mix-personnalise',
    // Poster: pak choi, baby Chinese cabbage, broccoli, beef, shrimp and chicken.
    ingredients: {
      'pak-choi': 2,
      'chinese-cabbage': 1,
      broccoli: 1,
      'beef-slices': 1,
      shrimp: 1,
      chicken: 1,
    },
  },
  {
    key: 'japanese',
    image: '/images/recipes/tomate-japonaise',
    broth: 'tomato',
    heat: 0,
    // Poster: udon, a fried egg, spinach, beef rolls and surimi.
    ingredients: {
      udon: 1,
      'fried-egg': 1,
      spinach: 1,
      'beef-slices': 2,
      surimi: 1,
      enoki: 1,
    },
  },
  {
    key: 'beefNoodles',
    image: '/images/recipes/nouilles-bouillon-os-de-boeuf',
    broth: 'beef-bone',
    heat: 1,
    // Poster: the shop's beef bone noodle bowl, instant noodles with pak choi, bean sprouts, carrot and a boiled egg.
    ingredients: {
      'instant-noodles': 1,
      'pak-choi': 2,
      'bean-sprouts': 1,
      carrot: 1,
      'quail-eggs': 1,
    },
    prefer: { 'quail-eggs': BOILED_EGG },
  },
  {
    key: 'tomYumNoodles',
    image: '/images/recipes/nouilles-tom-yum',
    broth: 'tom-yum',
    heat: 1,
    // Poster: instant noodles, shrimp, fish slices, enoki (for the shop bowl's shimeji), pak choi, carrot, boiled egg.
    ingredients: {
      'instant-noodles': 1,
      shrimp: 1,
      'fish-slices': 1,
      enoki: 1,
      'pak-choi': 1,
      carrot: 1,
      'quail-eggs': 1,
    },
    prefer: { 'quail-eggs': BOILED_EGG },
  },
  {
    key: 'tomatoNoodles',
    image: '/images/recipes/nouilles-bouillon-tomate',
    broth: 'tomato',
    heat: 0,
    // Poster: instant noodles, pak choi, enoki, wood ear, carrot and a boiled egg.
    ingredients: {
      'instant-noodles': 1,
      'pak-choi': 1,
      enoki: 1,
      'wood-ear': 1,
      carrot: 1,
      'quail-eggs': 1,
    },
    prefer: { 'quail-eggs': BOILED_EGG },
  },
]

/**
 * The recipes the site shows (owner's choice, 2026-11-05): only the three noodle bowls, on the home page and as a start
 * in the composer. The other posters stay defined (and tested) but are not shown.
 */
export const SHOWN_RECIPE_KEYS: ReadonlySet<string> = new Set([
  'beefNoodles',
  'tomYumNoodles',
  'tomatoNoodles',
])

/** The recipes the site shows, in poster order. */
export const SHOWN_RECIPES: readonly Recipe[] = RECIPES.filter((recipe) =>
  SHOWN_RECIPE_KEYS.has(recipe.key),
)

/** The poster PNG fallback is 640 x 452 (every width of a set has the same ratio). */
export const RECIPE_IMAGE = { widths: [640, 1000, 1400], fallbackWidth: 640, fallbackHeight: 452 }

export const recipeByKey = (key: unknown): Recipe | undefined =>
  typeof key === 'string' ? RECIPES.find((recipe) => recipe.key === key) : undefined

/*
 * The closest ingredients, in order, for a poster ingredient the menu does not sell (the Liège menu has no squid, wood
 * ear, potato, carrot or Chinese cabbage): same family first, and an ingredient of the recipe itself last, so a
 * substitute adds something rather than doubling what is already there.
 */
export const RECIPE_SUBSTITUTES: Partial<Record<IngredientIconKey, readonly IngredientIconKey[]>> =
  {
    squid: ['surimi', 'fish-balls', 'shrimp'],
    'fish-slices': ['fish-balls', 'surimi', 'shrimp'],
    chicken: ['beef-balls', 'pork-belly', 'beef-slices'],
    'fried-egg': ['quail-eggs', 'silken-tofu', 'tofu'],
    shrimp: ['surimi', 'fish-balls'],
    'fish-balls': ['surimi', 'beef-balls', 'shrimp'],
    surimi: ['fish-balls', 'fish-slices', 'shrimp'],
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
    carrot: ['corn', 'lotus-root', 'broccoli'],
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

/**
 * Whether the menu choice named `candidate` should stand for the recipe's ingredient `key` instead of the one named
 * `current` (the first of the menu with that key): only when the recipe prefers a name and the candidate has it.
 */
export const preferredOver = (
  recipe: Recipe,
  key: string,
  { candidate, current }: { candidate: string; current: string },
): boolean => {
  // The menu's key can be any food icon (a dish too): look it up rather than index the recipe's ingredient keys.
  const prefer = Object.entries(recipe.prefer ?? {}).find(([name]) => name === key)?.[1]
  return prefer !== undefined && prefer.test(candidate) && !prefer.test(current)
}
