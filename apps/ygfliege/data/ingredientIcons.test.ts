import { describe, expect, it } from 'vite-plus/test'
import {
  INGREDIENT_ICON_KEYS,
  foodIconKey,
  foodIconSrc,
  productIllustration,
} from './ingredientIcons'
import { INGREDIENTS } from './menuIngredients'
import { RECIPES, recipeByKey } from './recipes'

describe('foodIconKey', () => {
  it('reads the seed names in the four locales', () => {
    expect(foodIconKey('Boulettes de poisson')).toBe('fish-balls')
    expect(foodIconKey('Boulettes de bœuf')).toBe('beef-balls')
    expect(foodIconKey('Peau de tofu')).toBe('tofu-skin')
    expect(foodIconKey('Tofu frit')).toBe('fried-tofu')
    expect(foodIconKey('Tofu')).toBe('tofu')
    expect(foodIconKey('Nouilles de patate douce')).toBe('sweet-potato-noodles')
    expect(foodIconKey('Vermicelles')).toBe('sweet-potato-noodles')
    expect(foodIconKey('Rice noodles')).toBe('rice-vermicelli')
    expect(foodIconKey('Pleurote royal')).toBe('king-oyster')
    expect(foodIconKey('Pleurote')).toBe('oyster-mushroom')
    expect(foodIconKey('Chou chinois')).toBe('chinese-cabbage')
    expect(foodIconKey('Pak choï')).toBe('pak-choi')
    expect(foodIconKey('金针菇')).toBe('enoki')
    expect(foodIconKey('Garnalen')).toBe('shrimp')
    expect(foodIconKey('Tranches de bœuf')).toBe('beef-slices')
  })

  it('leaves a name it cannot place alone', () => {
    expect(foodIconKey('Sauce maison')).toBeUndefined()
  })

  it('knows every ingredient of the static menu', () => {
    for (const ingredient of INGREDIENTS) expect(ingredient.icon, ingredient.key).toBeTruthy()
  })

  it('only names icons that exist and recipes made of them', () => {
    const keys = new Set<string>(INGREDIENT_ICON_KEYS)
    for (const recipe of RECIPES) {
      for (const key of Object.keys(recipe.ingredients)) expect(keys.has(key), key).toBe(true)
    }
    expect(foodIconSrc('shrimp')).toBe('/images/ingredients/shrimp.svg')
    expect(foodIconSrc('dumplings')).toBe('/images/illustrations/dumplings.svg')
  })
})

describe('productIllustration', () => {
  it('maps the products awaiting photography by slug, then by name', () => {
    expect(productIllustration('raviolis-chinois', 'Raviolis chinois')?.key).toBe('dumplings')
    expect(productIllustration('coca-cola-zero', 'Coca-Cola Zero')?.key).toBe('soda-can')
    expect(productIllustration('unknown-slug', 'Thé glacé litchi')?.key).toBe('iced-tea')
    // A dish before one of its ingredients: these are dumplings, not beef slices.
    expect(productIllustration('gyoza-boeuf', 'Gyoza de bœuf (5 pièces)')?.key).toBe('dumplings')
    expect(productIllustration('unknown-slug', 'Menu Découverte')).toBeUndefined()
  })
})

describe('recipeByKey', () => {
  it('reads the ?recipe= query: a known key, anything else is no recipe', () => {
    expect(recipeByKey('seafood')?.image).toBe('/images/recipes/boeuf-fruits-de-mer')
    expect(recipeByKey('mix')?.composerSlug).toBe('mala-mix-personnalise')
    expect(recipeByKey('unknown')).toBeUndefined()
    // A repeated query parameter arrives as an array, a bare one as null.
    expect(recipeByKey(['seafood', 'tomato'])).toBeUndefined()
    expect(recipeByKey(null)).toBeUndefined()
  })
})
