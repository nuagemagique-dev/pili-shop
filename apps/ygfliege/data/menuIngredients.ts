// The static menu's ingredient tiles (pages/menu.vue while the shop is switched off) and the home page's ingredient
// band. Names live under `mkt.menu.ingredients.<key>`, categories under `mkt.menu.categories.<category>`; the icon is
// one of the illustrated ingredients of data/ingredientIcons.ts.
import { type IngredientIconKey, foodIconSrc } from './ingredientIcons'

export const INGREDIENT_CATEGORIES = [
  'vegetables',
  'mushrooms',
  'meat',
  'seafood',
  'tofu',
  'noodles',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

/** A filter chip: one category, or every ingredient. */
export type IngredientFilter = IngredientCategory | 'all'

export const INGREDIENT_FILTERS: readonly IngredientFilter[] = ['all', ...INGREDIENT_CATEGORIES]

export interface Ingredient {
  key: string
  category: IngredientCategory
  icon: IngredientIconKey
}

export const INGREDIENTS: readonly Ingredient[] = [
  { key: 'bok_choy', category: 'vegetables', icon: 'pak-choi' },
  { key: 'spinach', category: 'vegetables', icon: 'spinach' },
  { key: 'lettuce', category: 'vegetables', icon: 'lettuce' },
  { key: 'broccoli', category: 'vegetables', icon: 'broccoli' },
  { key: 'cabbage', category: 'vegetables', icon: 'chinese-cabbage' },
  { key: 'corn', category: 'vegetables', icon: 'corn' },
  { key: 'potato', category: 'vegetables', icon: 'potato' },
  { key: 'lotus_root', category: 'vegetables', icon: 'lotus-root' },
  { key: 'enoki', category: 'mushrooms', icon: 'enoki' },
  { key: 'shiitake', category: 'mushrooms', icon: 'shiitake' },
  { key: 'oyster_mushroom', category: 'mushrooms', icon: 'oyster-mushroom' },
  { key: 'king_oyster', category: 'mushrooms', icon: 'king-oyster' },
  { key: 'wood_ear', category: 'mushrooms', icon: 'wood-ear' },
  { key: 'beef', category: 'meat', icon: 'beef-slices' },
  { key: 'lamb', category: 'meat', icon: 'lamb' },
  { key: 'pork_belly', category: 'meat', icon: 'pork-belly' },
  { key: 'meatballs', category: 'meat', icon: 'beef-balls' },
  { key: 'shrimp', category: 'seafood', icon: 'shrimp' },
  { key: 'fish_balls', category: 'seafood', icon: 'fish-balls' },
  { key: 'squid', category: 'seafood', icon: 'squid' },
  { key: 'crab_sticks', category: 'seafood', icon: 'surimi' },
  { key: 'firm_tofu', category: 'tofu', icon: 'tofu' },
  { key: 'silken_tofu', category: 'tofu', icon: 'silken-tofu' },
  { key: 'tofu_skin', category: 'tofu', icon: 'tofu-skin' },
  { key: 'fried_tofu', category: 'tofu', icon: 'fried-tofu' },
  { key: 'glass_noodles', category: 'noodles', icon: 'sweet-potato-noodles' },
  { key: 'udon', category: 'noodles', icon: 'udon' },
  { key: 'rice_noodles', category: 'noodles', icon: 'rice-vermicelli' },
  { key: 'instant_noodles', category: 'noodles', icon: 'instant-noodles' },
]

/** The tiles a filter shows, in menu order. */
export const ingredientsFor = (filter: IngredientFilter): readonly Ingredient[] =>
  filter === 'all'
    ? INGREDIENTS
    : INGREDIENTS.filter((ingredient) => ingredient.category === filter)

/** The icon file of a static-menu ingredient. */
export const ingredientIconSrc = (ingredient: Ingredient): string => foodIconSrc(ingredient.icon)
