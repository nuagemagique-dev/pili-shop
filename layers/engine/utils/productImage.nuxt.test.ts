// Product image URLs and the broken-image fallback (real DOM: <img>, <picture>, <source>).
import { describe, expect, it } from 'vite-plus/test'
import {
  ensureProductImageFallback,
  handleProductImageError,
  productImageBase,
  productImageSources,
  productImageUrl,
  productImageVersion,
} from '#engine/utils/productImage'

const S3 = 'https://s3.shop.example'

describe('productImageUrl', () => {
  it('points at the thumbnail of the product in the bucket, png by default', () => {
    expect(productImageUrl(S3, 'p1')).toBe(`${S3}/images/thumbnails/p1.png`)
  })

  it('takes the extension as a string', () => {
    expect(productImageUrl(S3, 'p1', 'avif')).toBe(`${S3}/images/thumbnails/p1.avif`)
  })

  it('takes an options object; every part is optional', () => {
    expect(productImageUrl(S3, 'p1', { ext: 'webp' })).toBe(`${S3}/images/thumbnails/p1.webp`)
    expect(productImageUrl(S3, 'p1', {})).toBe(`${S3}/images/thumbnails/p1.png`)
  })

  it('without a bucket or an id, the placeholder of the variant', () => {
    expect(productImageUrl(undefined, 'p1')).toBe('/images/placeholder-product-thumbnail.png')
    expect(productImageUrl(S3, null, 'webp')).toBe('/images/placeholder-product-thumbnail.webp')
    expect(productImageUrl(S3, '', { variant: 'classic', ext: 'avif' })).toBe(
      '/images/placeholder-product-classic.avif',
    )
    expect(productImageUrl('', 'p1', { variant: 'classic' })).toBe(
      '/images/placeholder-product-classic.png',
    )
  })
})

describe('productImageBase', () => {
  it('is the URL without extension', () => {
    expect(productImageBase(S3, 'p1')).toBe(`${S3}/images/thumbnails/p1`)
  })

  it('falls back to the placeholder base of the variant', () => {
    expect(productImageBase(undefined, 'p1')).toBe('/images/placeholder-product-thumbnail')
    expect(productImageBase(S3, null, 'classic')).toBe('/images/placeholder-product-classic')
  })
})

describe('productImageVersion', () => {
  it('is ?v= and the epoch milliseconds of imageUpdatedAt', () => {
    expect(productImageVersion('2026-11-26T12:27:16Z')).toBe(
      `?v=${Date.parse('2026-11-26T12:27:16Z')}`,
    )
    expect(productImageVersion('2026-11-26T12:27:16.000Z')).toBe('?v=1795696036000')
  })

  it('is empty when the date is missing or unparseable', () => {
    expect(productImageVersion(undefined)).toBe('')
    expect(productImageVersion(null)).toBe('')
    expect(productImageVersion('')).toBe('')
    expect(productImageVersion('not a date')).toBe('')
  })
})

describe('versioned URLs', () => {
  const at = '2026-11-26T12:27:16.000Z'

  it('productImageUrl appends the version after the extension', () => {
    expect(productImageUrl(S3, 'p1', { ext: 'avif', imageUpdatedAt: at })).toBe(
      `${S3}/images/thumbnails/p1.avif?v=1795696036000`,
    )
    expect(productImageUrl(S3, 'p1', { imageUpdatedAt: null })).toBe(
      `${S3}/images/thumbnails/p1.png`,
    )
    expect(productImageUrl(S3, 'p1', { imageUpdatedAt: 'garbage' })).toBe(
      `${S3}/images/thumbnails/p1.png`,
    )
  })

  it('productImageUrl never versions the placeholder', () => {
    expect(productImageUrl(undefined, 'p1', { imageUpdatedAt: at })).toBe(
      '/images/placeholder-product-thumbnail.png',
    )
  })

  it('productImageSources gives the three extensions, each versioned', () => {
    expect(productImageSources(S3, 'p1', { imageUpdatedAt: at })).toEqual({
      avif: `${S3}/images/thumbnails/p1.avif?v=1795696036000`,
      webp: `${S3}/images/thumbnails/p1.webp?v=1795696036000`,
      png: `${S3}/images/thumbnails/p1.png?v=1795696036000`,
    })
  })

  it('productImageSources is bare without a usable version (old persisted cart)', () => {
    const bare = {
      avif: `${S3}/images/thumbnails/p1.avif`,
      webp: `${S3}/images/thumbnails/p1.webp`,
      png: `${S3}/images/thumbnails/p1.png`,
    }
    expect(productImageSources(S3, 'p1')).toEqual(bare)
    expect(productImageSources(S3, 'p1', { variant: 'classic', imageUpdatedAt: null })).toEqual(
      bare,
    )
    expect(productImageSources(S3, 'p1', { variant: 'classic', imageUpdatedAt: 'nope' })).toEqual(
      bare,
    )
  })

  it('productImageSources: the placeholder fallback is never versioned', () => {
    expect(
      productImageSources(undefined, 'p1', { variant: 'classic', imageUpdatedAt: at }),
    ).toEqual({
      avif: '/images/placeholder-product-classic.avif',
      webp: '/images/placeholder-product-classic.webp',
      png: '/images/placeholder-product-classic.png',
    })
    expect(productImageSources(S3, null, { imageUpdatedAt: at }).png).toBe(
      '/images/placeholder-product-thumbnail.png',
    )
  })

  it('the error fallback still swaps a versioned picture for the unversioned placeholders', () => {
    const { avif, webp, img } = picture()
    const sources = productImageSources(S3, 'p1', { imageUpdatedAt: at })
    avif.setAttribute('srcset', sources.avif)
    webp.setAttribute('srcset', sources.webp)
    img.setAttribute('src', sources.png)
    handleProductImageError(errorOn(img))
    expect(avif.getAttribute('srcset')).toBe('/images/placeholder-product-thumbnail.avif')
    expect(webp.getAttribute('srcset')).toBe('/images/placeholder-product-thumbnail.webp')
    expect(img.getAttribute('src')).toBe('/images/placeholder-product-thumbnail.png')
  })
})

function picture() {
  const el = document.createElement('picture')
  const avif = document.createElement('source')
  avif.setAttribute('type', 'image/avif')
  avif.setAttribute('srcset', 'x.avif')
  const webp = document.createElement('source')
  webp.setAttribute('type', 'image/webp')
  webp.setAttribute('srcset', 'x.webp')
  const other = document.createElement('source')
  other.setAttribute('type', 'image/jpeg')
  other.setAttribute('srcset', 'x.jpg')
  const img = document.createElement('img')
  img.src = 'x.png'
  el.append(avif, webp, other, img)
  return { el, avif, webp, other, img }
}

const errorOn = (img: HTMLImageElement) => {
  const event = new Event('error')
  Object.defineProperty(event, 'target', { value: img })
  return event
}

describe('handleProductImageError', () => {
  it('swaps the picture sources and the img for the placeholders of the variant', () => {
    const { avif, webp, other, img } = picture()
    handleProductImageError(errorOn(img))
    expect(avif.getAttribute('srcset')).toBe('/images/placeholder-product-thumbnail.avif')
    expect(webp.getAttribute('srcset')).toBe('/images/placeholder-product-thumbnail.webp')
    expect(other.hasAttribute('srcset')).toBe(false)
    expect(img.getAttribute('src')).toBe('/images/placeholder-product-thumbnail.png')
    expect(img.dataset.fallbackApplied).toBe('true')
  })

  it('uses the classic placeholders for the classic variant', () => {
    const { avif, img } = picture()
    handleProductImageError(errorOn(img), 'classic')
    expect(avif.getAttribute('srcset')).toBe('/images/placeholder-product-classic.avif')
    expect(img.getAttribute('src')).toBe('/images/placeholder-product-classic.png')
  })

  it('applies the fallback once: a failing placeholder does not loop', () => {
    const { img } = picture()
    handleProductImageError(errorOn(img))
    img.setAttribute('src', 'still-broken.png')
    handleProductImageError(errorOn(img))
    expect(img.getAttribute('src')).toBe('still-broken.png')
  })

  it('works for a bare <img> (no <picture>)', () => {
    const img = document.createElement('img')
    const wrapper = document.createElement('div')
    wrapper.append(img)
    handleProductImageError(errorOn(img))
    expect(img.getAttribute('src')).toBe('/images/placeholder-product-thumbnail.png')
  })

  it('ignores an event without an image target', () => {
    const before = document.body.innerHTML
    handleProductImageError(new Event('error'))
    expect(document.body.innerHTML).toBe(before)
  })
})

describe('ensureProductImageFallback', () => {
  function img(state: { complete: boolean; naturalWidth: number }) {
    const el = document.createElement('img')
    el.setAttribute('src', 'x.png')
    Object.defineProperty(el, 'complete', { value: state.complete })
    Object.defineProperty(el, 'naturalWidth', { value: state.naturalWidth })
    return el
  }

  it('replaces an image that finished loading with nothing (a failure that happened before hydration)', () => {
    const broken = img({ complete: true, naturalWidth: 0 })
    ensureProductImageFallback(broken)
    expect(broken.getAttribute('src')).toBe('/images/placeholder-product-thumbnail.png')
  })

  it('uses the given variant', () => {
    const broken = img({ complete: true, naturalWidth: 0 })
    ensureProductImageFallback(broken, 'classic')
    expect(broken.getAttribute('src')).toBe('/images/placeholder-product-classic.png')
  })

  it('leaves a loaded image alone', () => {
    const ok = img({ complete: true, naturalWidth: 120 })
    ensureProductImageFallback(ok)
    expect(ok.getAttribute('src')).toBe('x.png')
  })

  it('leaves an image that is still loading alone (its own error event will handle it)', () => {
    const pending = img({ complete: false, naturalWidth: 0 })
    ensureProductImageFallback(pending)
    expect(pending.getAttribute('src')).toBe('x.png')
  })

  it('accepts a missing element', () => {
    const before = document.body.innerHTML
    ensureProductImageFallback(null)
    ensureProductImageFallback(undefined)
    expect(document.body.innerHTML).toBe(before)
  })
})
