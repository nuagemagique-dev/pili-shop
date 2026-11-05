import { describe, expect, it } from 'vite-plus/test'
import {
  DRINK_ICON_KEYS,
  INGREDIENT_ICON_KEYS,
  foodIconKey,
  foodIconSrc,
  productIllustration,
} from './ingredientIcons'
import { INGREDIENTS } from './menuIngredients'
import { RECIPES, RECIPE_SUBSTITUTES, preferredOver, recipeByKey, recipePlan } from './recipes'

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

// The fr/en/nl/zh names of the production composer's ingredients (tsb-service seeds/ygfliege_deliveroo_paris.sql,
// three groups: vegetables, proteins, noodles). Some have no icon (konjac, bamboo, rice, rice cake, youtiao).
const PRODUCTION_INGREDIENTS = [
  [
    'Pomme de terre en tranches (5 pcs)',
    'Potato slices (5 pcs)',
    'Aardappelschijfjes (5 st.)',
    '土豆片（5片）',
  ],
  ['Chou-fleur (4 pcs)', 'Cauliflower (4 pcs)', 'Bloemkool (4 st.)', '花菜（4朵）'],
  ['Brocoli (4 pcs)', 'Broccoli (4 pcs)', 'Broccoli (4 st.)', '西兰花（4朵）'],
  ['Chou (50 g)', 'Cabbage (50 g)', 'Kool (50 g)', '卷心菜（50克）'],
  ['Chou chinois (3 pcs)', 'Chinese cabbage (3 pcs)', 'Chinese kool (3 st.)', '大白菜（3片）'],
  ['Chou de Shanghai (4 pcs)', 'Bok choy (4 pcs)', 'Paksoi (4 st.)', '上海青（4颗）'],
  ['Soja (50 g)', 'Bean sprouts (50 g)', 'Taugé (50 g)', '豆芽（50克）'],
  ['Enoki (50 g)', 'Enoki (50 g)', 'Enoki (50 g)', '金针菇（50克）'],
  ['Carotte (10 pcs)', 'Carrot (10 pcs)', 'Wortel (10 st.)', '胡萝卜（10片）'],
  ['Tofu (4 pcs)', 'Tofu (4 pcs)', 'Tofu (4 st.)', '豆腐（4块）'],
  ["Ficelles d'algue (50 g)", 'Kelp strips (50 g)', 'Kelpreepjes (50 g)', '海带丝（50克）'],
  ['Nœuds de konjac (4 pcs)', 'Konjac knots (4 pcs)', 'Konjacknoopjes (4 st.)', '魔芋结（4个）'],
  ['Pousses de bambou (50 g)', 'Bamboo shoots (50 g)', 'Bamboescheuten (50 g)', '笋片（50克）'],
  ['Champignon noir (3 pcs)', 'Black fungus (3 pcs)', 'Zwarte paddenstoel (3 st.)', '木耳（3片）'],
  ['Tranches de lotus', 'Lotus root slices', 'Lotuswortelschijfjes', '藕片'],
  ['Œuf dur (1 pc)', 'Boiled egg (1 pc)', 'Gekookt ei (1 st.)', '水煮蛋（1个）'],
  ['Œuf au plat (1 pc)', 'Fried egg (1 pc)', 'Spiegelei (1 st.)', '煎蛋（1个）'],
  [
    'Poulet épicé doux halal (50 g)',
    'Mildly spicy halal chicken (50 g)',
    'Licht pikante halal kip (50 g)',
    '麻辣鸡肉 清真（50克）',
  ],
  [
    'Bœuf épicé doux (50 g)',
    'Mildly spicy beef (50 g)',
    'Licht pikant rundvlees (50 g)',
    '麻辣牛肉（50克）',
  ],
  ['Tranches de poisson (3 pcs)', 'Fish slices (3 pcs)', 'Visplakjes (3 st.)', '鱼片（3片）'],
  ['Crevettes (3 pcs)', 'Shrimp (3 pcs)', 'Garnalen (3 st.)', '虾（3只）'],
  ['Spam porc (3 pcs)', 'Pork luncheon meat (3 pcs)', 'Varkenslunchvlees (3 st.)', '午餐肉（3片）'],
  ['Boulettes de poulet', 'Chicken balls', 'Kipballetjes', '鸡肉丸'],
  ['Bœuf braisé (50 g)', 'Braised beef (50 g)', 'Gestoofd rundvlees (50 g)', '卤牛肉（50克）'],
  [
    'Porc braisé aux épices (50 g)',
    'Spiced braised pork (50 g)',
    'Gestoofd varkensvlees met specerijen (50 g)',
    '卤肉（50克）',
  ],
  [
    'Boulettes de seiche et porc (50 g)',
    'Cuttlefish & pork balls (50 g)',
    'Inktvis-varkensballetjes (50 g)',
    '墨鱼猪肉丸（50克）',
  ],
  ['Seiche entière (4 pcs)', 'Whole cuttlefish (4 pcs)', 'Hele inktvis (4 st.)', '墨鱼仔（4只）'],
  [
    'Poulet frit à la citronnelle',
    'Lemongrass fried chicken',
    'Gefrituurde kip met citroengras',
    '香茅炸鸡',
  ],
  ['Œufs de caille (5 pcs)', 'Quail eggs (5 pcs)', 'Kwarteleitjes (5 st.)', '鹌鹑蛋（5个）'],
  [
    'Raviolis au poulet (3 pcs)',
    'Chicken dumplings (3 pcs)',
    'Kipdumplings (3 st.)',
    '鸡肉饺子（3个）',
  ],
  ['Un bol de riz (100 g)', 'A bowl of rice (100 g)', 'Een kom rijst (100 g)', '米饭（100克）'],
  ['Nouilles de maïs (50 g)', 'Corn noodles (50 g)', 'Maïsnoedels (50 g)', '玉米粉（50克）'],
  [
    'Nouilles larges de patate douce (4 pcs)',
    'Wide sweet potato noodles (4 pcs)',
    'Brede zoete-aardappelnoedels (4 st.)',
    '火锅宽粉（4片）',
  ],
  ['Pâte de riz (8 pcs)', 'Rice cake (8 pcs)', 'Rijstcake (8 st.)', '年糕（8片）'],
  ['Vermicelles (80 g)', 'Vermicelli (80 g)', 'Vermicelli (80 g)', '粉丝（80克）'],
  [
    'Beignet chinois salé (4 pcs)',
    'Chinese fried dough stick (4 pcs)',
    'Chinese gefrituurde deegstengel (4 st.)',
    '油条（4段）',
  ],
  [
    'Nouilles instantanées (100 g)',
    'Instant noodles (100 g)',
    'Instantnoedels (100 g)',
    '方便面（100克）',
  ],
  ['Nouilles udon (50 g)', 'Udon noodles (50 g)', 'Udon-noedels (50 g)', '乌冬面（50克）'],
] as const

describe('the production menu', () => {
  it('reads one ingredient in all four locales', () => {
    for (const names of PRODUCTION_INGREDIENTS) {
      expect(new Set(names.map((name) => foodIconKey(name))).size, names[0]).toBe(1)
    }
  })

  it('tells the look-alikes apart', () => {
    expect(foodIconKey('Chou-fleur (4 pcs)')).toBe('cauliflower')
    expect(foodIconKey('Chou (50 g)')).toBe('cabbage')
    expect(foodIconKey('Chou chinois (3 pcs)')).toBe('chinese-cabbage')
    expect(foodIconKey('Chou de Shanghai (4 pcs)')).toBe('pak-choi')
    expect(foodIconKey('Soja (50 g)')).toBe('bean-sprouts')
    expect(foodIconKey('Sauce soja')).toBeUndefined()
    expect(foodIconKey('Œuf au plat (1 pc)')).toBe('fried-egg')
    expect(foodIconKey('Œuf dur (1 pc)')).toBe('quail-eggs')
    expect(foodIconKey('Boulettes de seiche et porc (50 g)')).toBe('beef-balls')
    expect(foodIconKey('Seiche entière (4 pcs)')).toBe('squid')
    expect(foodIconKey('Raviolis au poulet (3 pcs)')).toBe('dumplings')
    expect(foodIconKey('Poulet frit à la citronnelle')).toBe('chicken')
    expect(foodIconKey('Lotuswortelschijfjes')).toBe('lotus-root')
    expect(foodIconKey('Wortel (10 st.)')).toBe('carrot')
    expect(foodIconKey('玉米粉（50克）')).toBe('corn')
  })

  it('fills every recipe with its full count, on the poster ingredients where the menu has them', () => {
    const menu = new Set(
      PRODUCTION_INGREDIENTS.map(([fr]) => foodIconKey(fr)).filter((key) => key !== undefined),
    )
    for (const recipe of RECIPES) {
      const wanted = Object.values(recipe.ingredients).reduce((sum, qty) => sum + qty, 0)
      const plan = recipePlan(recipe, menu)
      expect(
        plan.reduce((sum, [, qty]) => sum + qty, 0),
        recipe.key,
      ).toBe(wanted)
      // Sized like the menu's set bowls.
      expect(wanted, recipe.key).toBeGreaterThanOrEqual(6)
      expect(wanted, recipe.key).toBeLessThanOrEqual(9)
    }
    expect(recipePlan(recipeByKey('seafood')!, menu).map(([key]) => key)).toEqual([
      'fish-slices',
      'shrimp',
      'squid',
      'wood-ear',
      'lotus-root',
      'enoki',
    ])
  })

  it('builds the noodle bowls from what their posters show, no substitute needed', () => {
    const menu = new Set(
      PRODUCTION_INGREDIENTS.map(([fr]) => foodIconKey(fr)).filter((key) => key !== undefined),
    )
    expect(recipePlan(recipeByKey('beefNoodles')!, menu)).toEqual([
      ['instant-noodles', 1],
      ['pak-choi', 2],
      ['bean-sprouts', 1],
      ['carrot', 1],
      ['quail-eggs', 1],
    ])
    expect(recipePlan(recipeByKey('tomYumNoodles')!, menu).map(([key]) => key)).toEqual([
      'instant-noodles',
      'shrimp',
      'fish-slices',
      'enoki',
      'pak-choi',
      'carrot',
      'quail-eggs',
    ])
    expect(recipePlan(recipeByKey('tomatoNoodles')!, menu).map(([key]) => key)).toEqual([
      'instant-noodles',
      'pak-choi',
      'enoki',
      'wood-ear',
      'carrot',
      'quail-eggs',
    ])
  })
})

describe('preferredOver', () => {
  const tomato = recipeByKey('tomato')!

  it('takes the choice the poster shows when the menu sells two of an ingredient', () => {
    expect(
      preferredOver(tomato, 'beef-slices', {
        candidate: 'Bœuf braisé (50 g)',
        current: 'Bœuf épicé doux (50 g)',
      }),
    ).toBe(true)
    expect(
      preferredOver(tomato, 'beef-slices', {
        candidate: 'Bœuf épicé doux (50 g)',
        current: 'Bœuf braisé (50 g)',
      }),
    ).toBe(false)
    expect(
      preferredOver(tomato, 'sweet-potato-noodles', {
        candidate: '粉丝（80克）',
        current: '火锅宽粉（4片）',
      }),
    ).toBe(true)
  })

  it('takes the boiled egg of a noodle bowl over the quail eggs, in every locale', () => {
    const noodles = recipeByKey('tomYumNoodles')!
    const eggs = [
      ['Œuf dur (1 pc)', 'Œufs de caille (5 pcs)'],
      ['Boiled egg (1 pc)', 'Quail eggs (5 pcs)'],
      ['Gekookt ei (1 st.)', 'Kwarteleitjes (5 st.)'],
      ['水煮蛋（1个）', '鹌鹑蛋（5个）'],
    ] as const
    for (const [boiled, quail] of eggs) {
      expect(foodIconKey(boiled), boiled).toBe('quail-eggs')
      expect(
        preferredOver(noodles, 'quail-eggs', { candidate: boiled, current: quail }),
        boiled,
      ).toBe(true)
      expect(
        preferredOver(noodles, 'quail-eggs', { candidate: quail, current: boiled }),
        quail,
      ).toBe(false)
    }
  })

  it('keeps the first choice otherwise', () => {
    expect(
      preferredOver(tomato, 'beef-slices', {
        candidate: 'Bœuf braisé',
        current: 'Bœuf braisé maison',
      }),
    ).toBe(false)
    expect(
      preferredOver(tomato, 'potato', { candidate: 'Pomme de terre', current: 'Pommes de terre' }),
    ).toBe(false)
    expect(
      preferredOver(recipeByKey('seafood')!, 'shrimp', {
        candidate: 'Crevettes',
        current: 'Crevettes royales',
      }),
    ).toBe(false)
  })
})

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

  it('swaps what the noodle bowls need and Liège does not sell for its closest', () => {
    const menu = new Set(LIEGE_INGREDIENTS.map(([fr]) => foodIconKey(fr)!))
    // No carrot in Liège: corn. No fish slices: fish balls. No wood ear: shiitake.
    expect(Object.fromEntries(recipePlan(recipeByKey('beefNoodles')!, menu))).toMatchObject({
      corn: 1,
      'pak-choi': 2,
    })
    expect(Object.fromEntries(recipePlan(recipeByKey('tomYumNoodles')!, menu))).toMatchObject({
      corn: 1,
      'fish-balls': 1,
    })
    expect(Object.fromEntries(recipePlan(recipeByKey('tomatoNoodles')!, menu))).toMatchObject({
      corn: 1,
      shiitake: 1,
    })
  })
})

describe('recipePlan', () => {
  const seafood = recipeByKey('seafood')!

  it('keeps the poster ingredients the menu sells, and leaves out one with no substitute on it', () => {
    // Fish slices and squid fall back to shrimp, wood ear to enoki; lotus root has nothing to fall back on.
    expect(recipePlan(seafood, new Set(['shrimp', 'enoki']))).toEqual([
      ['shrimp', 5],
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

describe('DRINK_ICON_KEYS', () => {
  it('covers the drinks of the composer, and no ingredient', () => {
    for (const name of ['Coca original 330 ml', 'Coca zéro 330 ml', 'Evian eau minérale 330 ml'])
      expect(DRINK_ICON_KEYS.has(foodIconKey(name)!)).toBe(true)
    for (const name of ['Brocoli (4 pcs)', 'Crevettes (3 pcs)'])
      expect(DRINK_ICON_KEYS.has(foodIconKey(name)!)).toBe(false)
  })
})
