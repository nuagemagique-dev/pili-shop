/*
 * The site's Content-Security-Policy, built at config time from the build environment. The engine's nuxt.config sets
 * it on every route; a brand that loads more third parties (the Google Ads tag of brand.googleAdsId) sets its own
 * `routeRules['/**'].headers['Content-Security-Policy']` from the same builder, so the two never drift apart.
 */

// An empty variable counts as unset: it falls back like a missing one (CI passes unset repository variables as '').
const envOr = (name: string, fallback: string): string => {
  const value = process.env[name]
  return value !== undefined && value !== '' ? value : fallback
}

/** The API origin (a local one for development only) and the S3 bucket origin, also preconnected by the engine. */
export const cspOrigins = () => {
  const s3Url = envOr('S3_BUCKET_URL', '')
  return {
    api: new URL(envOr('API_BASE_URL', 'http://localhost:8080/api/v1')).origin,
    s3Url,
    s3: s3Url ? new URL(s3Url).origin : '',
  }
}

/*
 * Google Ads (gtag.js, conversions and remarketing), the hosts of Google's CSP guide for the Google tag. Only the
 * Belgian and global Google domains are listed for the remarketing pixel: a visitor on another country's domain only
 * loses that pixel, never the conversion.
 */
const GOOGLE_ADS = {
  script: [
    'https://www.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
  ],
  img: [
    'https://www.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
    'https://www.google.be',
  ],
  connect: [
    'https://www.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
    'https://www.google.be',
    'https://pagead2.googlesyndication.com',
  ],
  frame: [
    'https://www.googletagmanager.com',
    'https://td.doubleclick.net',
    'https://bid.g.doubleclick.net',
  ],
}

export const buildCsp = ({ googleAds = false }: { googleAds?: boolean } = {}): string => {
  const { api, s3Url } = cspOrigins()
  const ws = api.replace(/^http/u, 'ws')
  const osm = 'https://www.openstreetmap.org'
  // OSM map tiles (a brand's Leaflet map, e.g. ygfliege's MktMap): images only
  const osmTiles = 'https://tile.openstreetmap.org'
  const umamiHost = envOr('UMAMI_HOST', 'https://analytics.nuagemagique.dev')
  const zitadel = envOr('ZITADEL_AUTHORITY', '')
  const turnstile = 'https://challenges.cloudflare.com'
  const sentryHost = 'https://*.ingest.de.sentry.io'
  const ads = (kind: keyof typeof GOOGLE_ADS) => (googleAds ? GOOGLE_ADS[kind] : [])
  const list = (...sources: (string | string[])[]) => sources.flat().filter(Boolean).join(' ')

  return `${[
    "default-src 'self'",
    `script-src ${list("'self'", "'unsafe-inline'", umamiHost, turnstile, ads('script'))}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${list("'self'", 'data:', osmTiles, s3Url, ads('img'))}`,
    "font-src 'self'",
    `connect-src ${list("'self'", api, ws, zitadel, osm, umamiHost, turnstile, sentryHost, ads('connect'))}`,
    `frame-src ${list("'self'", osm, zitadel, turnstile, ads('frame'))}`,
    "worker-src 'self' blob:",
  ].join('; ')};`
}
