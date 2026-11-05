import type { Product } from '#engine/types'
import {
  COMPOSER_CATEGORY_SLUG,
  COMPOSER_LINK,
  COMPOSER_ONLY_SHOP,
  composerHero,
  isBowlComposer,
} from './composer'
import { describe, expect, it } from 'vite-plus/test'

const inCategory = (slug: string) => ({ category: { slug } }) as Product

describe('isBowlComposer', () => {
  it('is true for the products of the composer category only', () => {
    expect(isBowlComposer(inCategory(COMPOSER_CATEGORY_SLUG))).toBe(true)
    expect(isBowlComposer(inCategory('malatang'))).toBe(false)
  })
})

describe('composerHero', () => {
  it('gives the dry Mala Mix composer its own photo and a subtitle without broth', () => {
    expect(composerHero('mala-mix-personnalise')).toEqual({
      photo: '/images/bowls/mala-dry-mix-top',
      subtitleKey: 'composer.heroSubtitleDry',
      brothKey: 'composer.withoutBroth',
    })
  })

  it('falls back to the broth bowl and subtitle for any other composer', () => {
    expect(composerHero('malatang-personnalise')).toEqual({
      photo: '/images/bowls/beef-bone-top',
      subtitleKey: 'composer.heroSubtitle',
      brothKey: 'composer.withBroth',
    })
  })
})

describe('the composer-only shop', () => {
  it('leads "Composer" to the composer page, where the visitor picks with or without broth', () => {
    expect(COMPOSER_ONLY_SHOP).toBe(true)
    expect(COMPOSER_LINK).toBe('/menu')
  })
})
