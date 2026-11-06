import type { Product } from '#engine/types'
import {
  COMPOSER_CATEGORY_SLUG,
  composerAccess,
  composerHero,
  composerLink,
  isBowlComposer,
  isComposerComingSoonValue,
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

describe('the composer announced but not open yet (coming soon)', () => {
  it('is on unless the flag says false, 0 or off: an unset or empty value keeps the default', () => {
    expect(isComposerComingSoonValue(true)).toBe(true)
    expect(isComposerComingSoonValue(undefined)).toBe(true)
    expect(isComposerComingSoonValue('')).toBe(true)
    for (const off of [false, 'false', '0', 'OFF', ' off '])
      expect(isComposerComingSoonValue(off)).toBe(false)
  })
})

describe('composerAccess', () => {
  // Liège keeps /menu up as the static menu while the shop is off (brand.staticMenuWhenShopClosed).
  const liege = { staticMenuWhenShopClosed: true }

  it('opens the composer, with prices and no "Menu" entry, on a composer-only shop that is not coming soon', () => {
    expect(
      composerAccess({
        shopEnabled: true,
        composerOnly: true,
        composerComingSoon: false,
        ...liege,
      }),
    ).toEqual({
      composerOpen: true,
      composerOnly: true,
      composerComingSoon: false,
      composerLink: '/menu',
      pricesShown: true,
      menuEntryShown: false,
      showcaseLink: '/menu',
    })
  })

  it('offers a "Menu" entry too on a full-menu shop, where "Composer" opens the first composer', () => {
    expect(
      composerAccess({
        shopEnabled: true,
        composerOnly: false,
        composerComingSoon: false,
        ...liege,
      }),
    ).toMatchObject({ composerOpen: true, composerLink: '/menu?compose', menuEntryShown: true })
  })

  it('coming soon: no composer, no price, no menu entry, and the showcase leads to the concept', () => {
    expect(
      composerAccess({ shopEnabled: true, composerOnly: true, composerComingSoon: true, ...liege }),
    ).toEqual({
      composerOpen: false,
      composerOnly: true,
      composerComingSoon: true,
      composerLink: '/menu',
      pricesShown: false,
      menuEntryShown: false,
      showcaseLink: '/concept',
    })
  })

  it('coming soon wins over the shop flag and the full menu', () => {
    expect(
      composerAccess({
        shopEnabled: false,
        composerOnly: false,
        composerComingSoon: true,
        ...liege,
      }),
    ).toMatchObject({
      composerOpen: false,
      pricesShown: false,
      menuEntryShown: false,
      showcaseLink: '/concept',
    })
  })

  it('with the shop off, leads to the static menu when the brand keeps one up, else to the concept', () => {
    expect(
      composerAccess({
        shopEnabled: false,
        composerOnly: true,
        composerComingSoon: false,
        ...liege,
      }),
    ).toMatchObject({
      composerOpen: false,
      pricesShown: true,
      menuEntryShown: true,
      showcaseLink: '/menu',
    })
    expect(
      composerAccess({
        shopEnabled: false,
        composerOnly: true,
        composerComingSoon: false,
        staticMenuWhenShopClosed: undefined,
      }),
    ).toMatchObject({ menuEntryShown: false, showcaseLink: '/concept' })
  })
})
