import type { Product } from '#engine/types'
import {
  COMPOSER_CATEGORY_SLUG,
  composerHero,
  composerLink,
  isBowlComposer,
  isComposerOnlyValue,
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
  it('is on unless the flag says false, 0 or off', () => {
    expect(isComposerOnlyValue(true)).toBe(true)
    expect(isComposerOnlyValue(undefined)).toBe(true)
    for (const off of [false, 'false', '0', 'OFF']) expect(isComposerOnlyValue(off)).toBe(false)
  })

  it('leads "Composer" to the composer page, where the visitor picks with or without broth', () => {
    expect(composerLink(true)).toBe('/menu')
    expect(composerLink(false)).toBe('/menu?compose')
  })
})
