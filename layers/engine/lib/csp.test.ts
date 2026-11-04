// The site's CSP builder: the engine's policy is unchanged by the move into lib/csp.ts, and the Google Ads hosts are
// added (for a brand with brand.googleAdsId) only when asked for.
// Run: `vp test run layers/engine/lib/csp.test.ts`.
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { buildCsp, cspOrigins } from './csp'

const directive = (csp: string, name: string) =>
  csp
    .replace(/;$/u, '')
    .split('; ')
    .find((part) => part.startsWith(`${name} `))
    ?.split(' ')
    .slice(1) ?? []

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'https://shop.example.test/api/v1')
  vi.stubEnv('S3_BUCKET_URL', 'https://bucket.example.test/images')
  vi.stubEnv('ZITADEL_AUTHORITY', 'https://auth.example.test')
  vi.stubEnv('UMAMI_HOST', 'https://stats.example.test')
})

describe('buildCsp', () => {
  it('builds the engine policy, exactly as nuxt.config set it before', () => {
    expect(buildCsp()).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://stats.example.test https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://tile.openstreetmap.org https://bucket.example.test/images",
        "font-src 'self'",
        "connect-src 'self' https://shop.example.test wss://shop.example.test https://auth.example.test https://www.openstreetmap.org https://stats.example.test https://challenges.cloudflare.com https://*.ingest.de.sentry.io",
        "frame-src 'self' https://www.openstreetmap.org https://auth.example.test https://challenges.cloudflare.com",
        "worker-src 'self' blob:;",
      ].join('; '),
    )
  })

  it('leaves out the optional hosts that are not configured', () => {
    vi.stubEnv('S3_BUCKET_URL', '')
    vi.stubEnv('ZITADEL_AUTHORITY', '')
    const csp = buildCsp()
    expect(directive(csp, 'img-src')).toEqual(["'self'", 'data:', 'https://tile.openstreetmap.org'])
    expect(directive(csp, 'frame-src')).toEqual([
      "'self'",
      'https://www.openstreetmap.org',
      'https://challenges.cloudflare.com',
    ])
    expect(csp).not.toContain('  ')
  })

  it('names no Google host without googleAds', () => {
    expect(buildCsp()).not.toMatch(/google|doubleclick/u)
  })

  it('lets the Google Ads tag load, send its hits and run its frames with googleAds', () => {
    const csp = buildCsp({ googleAds: true })
    expect(directive(csp, 'script-src')).toContain('https://www.googletagmanager.com')
    expect(directive(csp, 'connect-src')).toEqual(
      expect.arrayContaining([
        'https://www.google.com',
        'https://googleads.g.doubleclick.net',
        'https://www.googleadservices.com',
      ]),
    )
    expect(directive(csp, 'img-src')).toContain('https://www.google.be')
    expect(directive(csp, 'frame-src')).toContain('https://td.doubleclick.net')
    // Everything the engine allows stays allowed.
    for (const name of ['script-src', 'img-src', 'connect-src', 'frame-src']) {
      expect(directive(csp, name)).toEqual(expect.arrayContaining(directive(buildCsp(), name)))
    }
  })
})

describe('cspOrigins', () => {
  it('gives the API and bucket origins', () => {
    expect(cspOrigins()).toEqual({
      api: 'https://shop.example.test',
      s3Url: 'https://bucket.example.test/images',
      s3: 'https://bucket.example.test',
    })
  })

  it('falls back to the local API and no bucket', () => {
    vi.stubEnv('API_BASE_URL', '')
    vi.stubEnv('S3_BUCKET_URL', '')
    expect(cspOrigins()).toEqual({ api: 'http://localhost:8080', s3Url: '', s3: '' })
  })
})
