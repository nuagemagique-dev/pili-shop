const PRODUCT_IMAGE_FALLBACK_THUMBNAIL = '/images/placeholder-product-thumbnail.png'
const PRODUCT_IMAGE_FALLBACK_CLASSIC = '/images/placeholder-product-classic.png'
const PRODUCT_IMAGE_FALLBACK_THUMBNAIL_BASE = '/images/placeholder-product-thumbnail'
const PRODUCT_IMAGE_FALLBACK_CLASSIC_BASE = '/images/placeholder-product-classic'

type ProductImageVariant = 'thumbnail' | 'classic'

type ProductImageExt = 'avif' | 'webp' | 'png'

const fallbackBaseByVariant = (variant: ProductImageVariant): string =>
  variant === 'classic'
    ? PRODUCT_IMAGE_FALLBACK_CLASSIC_BASE
    : PRODUCT_IMAGE_FALLBACK_THUMBNAIL_BASE

const fallbackPngByVariant = (variant: ProductImageVariant): string =>
  variant === 'classic' ? PRODUCT_IMAGE_FALLBACK_CLASSIC : PRODUCT_IMAGE_FALLBACK_THUMBNAIL

const hasText = (value: string | null | undefined): value is string =>
  value !== undefined && value !== null && value !== ''

/**
 * Cache-busting suffix of a stored product image: `?v=<epoch ms of imageUpdatedAt>`, appended AFTER the
 * extension (the dashboard builds the exact same URLs, so the CDN and browser caches line up). The image is
 * overwritten in place on re-upload; the version makes a replaced image a new URL. Empty when the date is
 * missing or unparseable (old persisted carts, a pre-#180 API): the bare URL.
 */
export const productImageVersion = (imageUpdatedAt?: string | null): string => {
  if (!hasText(imageUpdatedAt)) return ''
  const ms = Date.parse(imageUpdatedAt)
  return Number.isFinite(ms) ? `?v=${ms}` : ''
}

export interface ProductImageSources {
  avif: string
  webp: string
  png: string
}

/**
 * The three URLs of a product image (for `<picture>`), versioned with `imageUpdatedAt`. The placeholder
 * fallback (no bucket or no id) never carries a version.
 */
export const productImageSources = (
  s3BaseUrl?: string,
  id?: string | null,
  {
    variant = 'thumbnail',
    imageUpdatedAt,
  }: { variant?: ProductImageVariant; imageUpdatedAt?: string | null } = {},
): ProductImageSources => {
  const base = productImageBase(s3BaseUrl, id, variant)
  const version = hasText(s3BaseUrl) && hasText(id) ? productImageVersion(imageUpdatedAt) : ''
  return {
    avif: `${base}.avif${version}`,
    webp: `${base}.webp${version}`,
    png: `${base}.png${version}`,
  }
}

export const productImageUrl = (
  s3BaseUrl?: string,
  id?: string | null,
  format:
    | ProductImageExt
    | {
        ext?: ProductImageExt
        variant?: ProductImageVariant
        imageUpdatedAt?: string | null
      } = 'png',
): string => {
  const ext = typeof format === 'string' ? format : (format.ext ?? 'png')
  const variant = typeof format === 'string' ? 'thumbnail' : (format.variant ?? 'thumbnail')
  const imageUpdatedAt = typeof format === 'string' ? undefined : format.imageUpdatedAt

  if (!hasText(s3BaseUrl) || !hasText(id)) {
    return `${fallbackBaseByVariant(variant)}.${ext}`
  }

  return `${s3BaseUrl}/images/thumbnails/${id}.${ext}${productImageVersion(imageUpdatedAt)}`
}

export const productImageBase = (
  s3BaseUrl?: string,
  id?: string | null,
  variant: ProductImageVariant = 'thumbnail',
): string => {
  if (!hasText(s3BaseUrl) || !hasText(id)) {
    return fallbackBaseByVariant(variant)
  }

  return `${s3BaseUrl}/images/thumbnails/${id}`
}

export const handleProductImageError = (
  event: Event,
  variant: ProductImageVariant = 'thumbnail',
): void => {
  const img = event.target instanceof HTMLImageElement ? event.target : null
  applyProductImageFallback(img, variant)
}

export const ensureProductImageFallback = (
  img: HTMLImageElement | null | undefined,
  variant: ProductImageVariant = 'thumbnail',
): void => {
  if (!img) return
  if (!img.complete) return
  if (img.naturalWidth > 0) return

  applyProductImageFallback(img, variant)
}

const applyProductImageFallback = (
  img: HTMLImageElement | null,
  variant: ProductImageVariant,
): void => {
  if (!img) return
  if (img.dataset.fallbackApplied === 'true') return

  img.dataset.fallbackApplied = 'true'
  const fallbackBase = fallbackBaseByVariant(variant)
  const fallbackPng = fallbackPngByVariant(variant)

  const picture = img.parentElement
  if (picture?.tagName === 'PICTURE') {
    const sources = picture.querySelectorAll('source')
    for (const source of sources) {
      const sourceType = source.getAttribute('type')
      if (sourceType === 'image/avif') {
        source.setAttribute('srcset', `${fallbackBase}.avif`)
      } else if (sourceType === 'image/webp') {
        source.setAttribute('srcset', `${fallbackBase}.webp`)
      } else {
        source.removeAttribute('srcset')
      }
    }
  }

  img.src = fallbackPng
}

export {
  PRODUCT_IMAGE_FALLBACK_CLASSIC,
  PRODUCT_IMAGE_FALLBACK_THUMBNAIL as PRODUCT_IMAGE_FALLBACK,
}
