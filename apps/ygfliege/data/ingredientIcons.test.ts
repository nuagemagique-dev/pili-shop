import { describe, expect, it } from 'vite-plus/test'
import {
  INGREDIENT_ICON_KEYS,
  foodIconKey,
  foodIconSrc,
  productIllustration,
} from './ingredientIcons'
import { INGREDIENTS } from './menuIngredients'
import { RECIPES, RECIPE_SUBSTITUTES, recipeByKey, recipePlan } from './recipes'

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

// The fr/en/nl/zh names of the Liège composer's ingredients (tsb-service seeds/ygfliege_menu.sql).
const LIEGE_INGREDIENTS = [
  ['Pak choï', 'Pak choi', 'Paksoi', '上海青'],
  ['Épinards', 'Spinach', 'Spinazie', '菠菜'],
  ['Pousses de soja', 'Bean sprouts', 'Taugé', '豆芽'],
  ['Brocoli', 'Broccoli', 'Broccoli', '西兰花'],
  ['Champignons enoki', 'Enoki mushrooms', 'Enoki-paddenstoelen', '金针菇'],
  ['Champignons shiitaké', 'Shiitake mushrooms', 'Shiitake-paddenstoelen', '香菇'],
  ['Tofu frais', 'Fresh tofu', 'Verse tofu', '嫩豆腐'],
  ['Peau de tofu', 'Tofu skin', 'Tofuvel', '豆皮'],
  ['Algue kombu', 'Kombu seaweed', 'Kombu-zeewier', '海带'],
  ['Maïs doux', 'Sweet corn', 'Zoete maïs', '玉米'],
  ['Racine de lotus', 'Lotus root', 'Lotuswortel', '莲藕'],
  ['Boulettes de bœuf', 'Beef balls', 'Rundvleesballetjes', '牛肉丸'],
  ['Boulettes de poisson', 'Fish balls', 'Visballetjes', '鱼丸'],
  ['Tranches de bœuf', 'Sliced beef', 'Rundvleesplakjes', '肥牛卷'],
  ['Poitrine de porc', 'Pork belly', 'Buikspek', '五花肉'],
  ['Crevettes', 'Shrimp', 'Garnalen', '鲜虾'],
  ['Bâtonnets de surimi', 'Surimi sticks', 'Surimisticks', '蟹柳'],
  ['Saucisse chinoise', 'Chinese sausage', 'Chinese worst', '亲亲肠'],
  ['Œufs de caille', 'Quail eggs', 'Kwarteleitjes', '鹌鹑蛋'],
  ['Nouilles de patate douce', 'Sweet potato noodles', 'Zoete-aardappelnoedels', '红薯粉'],
  ['Nouilles udon', 'Udon noodles', 'Udonnoedels', '乌冬面'],
  ['Vermicelles de riz', 'Rice vermicelli', 'Rijstvermicelli', '米线'],
  ['Nouilles instantanées', 'Instant noodles', 'Instantnoedels', '方便面'],
] as const

describe('the Liège menu', () => {
  it('names one ingredient in all four locales', () => {
    for (const names of LIEGE_INGREDIENTS) {
      const keys = new Set(names.map((name) => foodIconKey(name)))
      expect([...keys], names[0]).toHaveLength(1)
      expect([...keys][0], names[0]).toBeDefined()
    }
  })

  it('fills every recipe with its full count, substitutes included', () => {
    const menu = new Set(LIEGE_INGREDIENTS.map(([fr]) => foodIconKey(fr)!))
    for (const recipe of RECIPES) {
      const wanted = Object.values(recipe.ingredients).reduce((sum, qty) => sum + qty, 0)
      const plan = recipePlan(recipe, menu)
      expect(
        plan.reduce((sum, [, qty]) => sum + qty, 0),
        recipe.key,
      ).toBe(wanted)
      for (const [key] of plan) expect(menu.has(key), `${recipe.key}: ${key}`).toBe(true)
    }
  })
})

describe('recipePlan', () => {
  const seafood = recipeByKey('seafood')!

  it('keeps the poster ingredients the menu sells, and leaves out one with no substitute on it', () => {
    // Squid and fish balls fall back to shrimp, wood ear to enoki: the bowl still gets its 6 portions.
    expect(recipePlan(seafood, new Set(['shrimp', 'enoki']))).toEqual([
      ['shrimp', 4],
      ['enoki', 2],
    ])
    expect(recipePlan(seafood, new Set())).toEqual([])
  })

  it('every substitute is an ingredient icon, never the ingredient it replaces', () => {
    const keys = new Set<string>(INGREDIENT_ICON_KEYS)
    for (const [key, substitutes] of Object.entries(RECIPE_SUBSTITUTES)) {
      for (const substitute of substitutes) {
        expect(keys.has(substitute), substitute).toBe(true)
        expect(substitute).not.toBe(key)
      }
    }
  })
})
