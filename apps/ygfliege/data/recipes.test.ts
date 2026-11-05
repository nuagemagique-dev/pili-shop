// The recipe posters: every recipe ships its poster in every size and its copy in the four locales.
// Run: `vp test run apps/ygfliege/data/recipes.test.ts`. The recipe plans are tested in ingredientIcons.test.ts.
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'
import en from '../locales/en.json'
import fr from '../locales/fr.json'
import nl from '../locales/nl.json'
import zh from '../locales/zh.json'
import { RECIPES, RECIPE_IMAGE, SHOWN_RECIPES, recipeByKey } from './recipes'

const publicFile = (path: string) => new URL(`../public${path}`, import.meta.url)

describe('the recipe posters', () => {
  it('ship every size MktPicture asks for: avif and webp at each width, the png fallback', () => {
    for (const recipe of RECIPES) {
      for (const width of RECIPE_IMAGE.widths) {
        for (const ext of ['avif', 'webp']) {
          const file = `${recipe.image}-${width}.${ext}`
          expect(existsSync(publicFile(file)), file).toBe(true)
        }
      }
      const fallback = `${recipe.image}-${RECIPE_IMAGE.fallbackWidth}.png`
      expect(existsSync(publicFile(fallback)), fallback).toBe(true)
    }
  })

  it('are one per recipe, each under its own key', () => {
    expect(new Set(RECIPES.map((recipe) => recipe.key)).size).toBe(RECIPES.length)
    expect(new Set(RECIPES.map((recipe) => recipe.image)).size).toBe(RECIPES.length)
  })

  it('load the noodle bowls on their own broth and heat', () => {
    expect(recipeByKey('beefNoodles')).toMatchObject({ broth: 'beef-bone', heat: 1 })
    expect(recipeByKey('tomYumNoodles')).toMatchObject({ broth: 'tom-yum', heat: 1 })
    expect(recipeByKey('tomatoNoodles')).toMatchObject({ broth: 'tomato', heat: 0 })
  })
})

describe.each([
  ['fr', fr],
  ['en', en],
  ['nl', nl],
  ['zh', zh],
])('the %s locale', (_locale, messages) => {
  const items = messages.mkt.recipes.items as Record<
    string,
    { name?: string; desc?: string; alt?: string } | undefined
  >

  it('names, describes and captions every recipe', () => {
    for (const { key } of RECIPES) {
      expect(items[key]?.name, key).toBeTruthy()
      expect(items[key]?.desc, key).toBeTruthy()
      expect(items[key]?.alt, key).toBeTruthy()
    }
  })
})

describe('the recipes shown', () => {
  it('are the three noodle bowls only, in poster order', () => {
    expect(SHOWN_RECIPES.map((recipe) => recipe.key)).toEqual([
      'beefNoodles',
      'tomYumNoodles',
      'tomatoNoodles',
    ])
  })
})
