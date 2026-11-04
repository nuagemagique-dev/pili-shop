import { composerHero } from './composer'
import {
  PRODUCT_PHOTOS,
  PRODUCT_PHOTO_WIDTHS,
  productPhoto,
  productPhotoUrls,
} from './productPhotos'
import { describe, expect, it } from 'vite-plus/test'

// The set menus and composers of the production catalog (pili-api seeds/ygfliege_deliveroo_paris.sql, the slugs that
// productCategories answers on ygfliege.be), with the official photo each one shows instead of its Deliveroo shot.
const PRODUCTION_PHOTOS: [slug: string, base: string][] = [
  ['malatang-menu-decouverte', '/images/bowls/tomato-top'],
  ['malatang-menu-gourmand', '/images/bowls/beef-bone-top'],
  ['malatang-menu-festin-vegetarien', '/images/bowls/mushroom-top'],
  ['mala-mix-menu-decouverte', '/images/dishes/mala-mix-decouverte'],
  ['mala-mix-menu-gourmand', '/images/dishes/mala-mix-gourmand'],
  ['mala-mix-menu-festin-vegetarien', '/images/bowls/mala-dry-mix-top'],
  ['malatang-personnalise', '/images/bowls/beef-bone-top'],
  ['mala-mix-personnalise', '/images/bowls/mala-dry-mix-top'],
]

// The composer of the e2e mock catalog (layers/engine/e2e/mock/catalog/ygfliege.ts), from the old Liège seed.
const MOCK_COMPOSER = 'malatang-sur-mesure'

describe('ygfliege productPhoto', () => {
  it.each(PRODUCTION_PHOTOS)('the production product %s shows %s', (slug, base) => {
    expect(productPhoto(slug)).toEqual({ base })
  })

  it('maps only products that exist: the production ones and the e2e mock composer', () => {
    expect(new Set(Object.keys(PRODUCT_PHOTOS))).toEqual(
      new Set([...PRODUCTION_PHOTOS.map(([slug]) => slug), MOCK_COMPOSER]),
    )
  })

  it('a composer shows the photo of its hero card', () => {
    for (const slug of ['malatang-personnalise', 'mala-mix-personnalise', MOCK_COMPOSER])
      expect(productPhoto(slug)?.base).toBe(composerHero(slug).photo)
  })

  it('an unmapped, empty or missing slug has none (the S3 upload or placeholder applies)', () => {
    expect(productPhoto('coca-original')).toBeUndefined()
    expect(productPhoto('')).toBeUndefined()
    expect(productPhoto(null)).toBeUndefined()
    expect(productPhoto(undefined)).toBeUndefined()
  })

  it('does not resolve inherited object keys as products', () => {
    expect(productPhoto('constructor')).toBeUndefined()
  })

  it('every mapped photo points at an asset base under /images', () => {
    for (const photo of Object.values(PRODUCT_PHOTOS)) expect(photo.base).toMatch(/^\/images\//u)
  })
})

describe('productPhotoUrls', () => {
  it('gives the png fallback (560 by default) and the largest webp', () => {
    expect(productPhotoUrls('malatang-menu-gourmand')).toEqual({
      png: '/images/bowls/beef-bone-top-560.png',
      webp: `/images/bowls/beef-bone-top-${Math.max(...PRODUCT_PHOTO_WIDTHS)}.webp`,
    })
  })

  it('honours a photo with its own widths and fallback width', () => {
    const original = PRODUCT_PHOTOS['malatang-menu-decouverte']!
    PRODUCT_PHOTOS['malatang-menu-decouverte'] = {
      ...original,
      widths: [200, 1200, 600],
      fallbackWidth: 320,
    }
    try {
      expect(productPhotoUrls('malatang-menu-decouverte')).toEqual({
        png: '/images/bowls/tomato-top-320.png',
        webp: '/images/bowls/tomato-top-1200.webp',
      })
    } finally {
      PRODUCT_PHOTOS['malatang-menu-decouverte'] = original
    }
  })

  it('is undefined for a product without a photo', () => {
    expect(productPhotoUrls('nothing')).toBeUndefined()
    expect(productPhotoUrls(null)).toBeUndefined()
  })
})
