// Brand-side product photography overrides, keyed by product slug.
//
// Product images normally come from S3 by product id (uploaded via the
// dashboard); anything without an upload falls back to the logo placeholder.
// Every image here is official Yangguofu photography: the bowl/broth kit
// shipped with the app (same set as the vitrine site), plus dry-mix dishes
// from the official Europe site's store-page kit (v2.zuhecdn.com, 1200px
// cut-outs on transparency: same style as the rest). Slugs are those of the
// production catalog (pili-api `seeds/ygfliege_deliveroo_paris.sql`, live
// since 2026-11-03), whose S3 images are the Deliveroo shots: a product
// listed here shows its official photo instead. An S3 upload still wins for
// any product NOT listed here, so unmapped products keep the normal pipeline.
export interface ProductPhoto {
  /** Asset base, e.g. `/images/bowls/tomato-top` (widths + ext appended). */
  base: string
  /**
   * True for full-frame photographs (fill the card, object-cover); false
   * for cut-outs on transparency (object-contain on the tinted surface).
   */
  cover?: boolean
  /** Available widths, when they differ from PRODUCT_PHOTO_WIDTHS. */
  widths?: number[]
  /** Width that has the .png fallback, when not 560. */
  fallbackWidth?: number
  /** Height of that .png fallback, when it is not square (every mapped asset is today). */
  fallbackHeight?: number
}

export const PRODUCT_PHOTOS: Record<string, ProductPhoto> = {
  // Malatang sets (broth chosen in the set): one official broth bowl each.
  'malatang-menu-decouverte': { base: '/images/bowls/tomato-top' },
  'malatang-menu-gourmand': { base: '/images/bowls/beef-bone-top' },
  'malatang-menu-festin-vegetarien': { base: '/images/bowls/mushroom-top' },
  // Mala Mix sets (dry, no broth), from the official Europe kit (1200px,
  // zuhecdn CDN): `saute_the_red_oil_until_fragrant` (red-oil mala ban,
  // white plate) and `herbal_mala_stir-fry_pot` (mala xiang guo). The
  // vegetarian one reuses the kit's mala-dry-mix bowl; the kit's
  // `spicy_salad` looks near-identical to it, and the other dry-style shots
  // show shrimp or meat.
  'mala-mix-menu-decouverte': { base: '/images/dishes/mala-mix-decouverte' },
  'mala-mix-menu-gourmand': { base: '/images/dishes/mala-mix-gourmand' },
  'mala-mix-menu-festin-vegetarien': { base: '/images/bowls/mala-dry-mix-top' },
  // The composers: the same shot as their hero card (data/composer.ts),
  // deliberately: it IS the composer. `malatang-sur-mesure` is the old Liège
  // seed's composer, still the one of the e2e mock catalog
  // (layers/engine/e2e/mock/catalog/ygfliege.ts).
  'malatang-personnalise': { base: '/images/bowls/beef-bone-top' },
  'mala-mix-personnalise': { base: '/images/bowls/mala-dry-mix-top' },
  'malatang-sur-mesure': { base: '/images/bowls/beef-bone-top' },

  // Every other product keeps its S3 upload (on production, the Deliveroo
  // shot). To give one an official or own photo: run
  //   node scripts/product-photo.mjs <source-image> <slug>
  // (generates the avif/webp/png derivatives in public/images/dishes/),
  // then add its line here.
}

/** Default widths for mapped assets (avif + webp; 560 also png). */
export const PRODUCT_PHOTO_WIDTHS = [320, 560, 800]

export const productPhoto = (slug?: string | null): ProductPhoto | undefined =>
  slug !== undefined && slug !== null && slug !== '' && Object.hasOwn(PRODUCT_PHOTOS, slug)
    ? PRODUCT_PHOTOS[slug]
    : undefined

/**
 * Site-relative URLs of a mapped product's photo for structured data: the PNG fallback and the largest WebP.
 * Same assets as the cards, so a crawler finds files that exist.
 */
export const productPhotoUrls = (
  slug?: string | null,
): { png: string; webp: string } | undefined => {
  const photo = productPhoto(slug)
  if (!photo) return undefined
  return {
    png: `${photo.base}-${photo.fallbackWidth ?? 560}.png`,
    webp: `${photo.base}-${Math.max(...(photo.widths ?? PRODUCT_PHOTO_WIDTHS))}.webp`,
  }
}
