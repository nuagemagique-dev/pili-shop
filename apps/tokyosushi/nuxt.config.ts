import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// ─────────────────────────────────────────────────────────────────────────────
// Tokyo Sushi Bar app; the main app. Extends the shared engine layer and owns
// Everything visual: pages, components, layouts, theme, assets, copy, and the
// Brand identity (brand.ts / app.config.ts / locale overrides).
//
//   #engine → the shared layer (app files import engine code via this alias;
//             Engine-internal imports keep using ~/ which resolves per-layer).
//   #brand  → this app's root, so engine files that import brand data
//             (i18n.config.ts, server/routes/robots.txt.ts & llms.txt.ts) and
//             UseAppConfig().brand resolve against this brand.
// ─────────────────────────────────────────────────────────────────────────────

// An empty variable counts as unset: it falls back like a missing one (CI passes unset repository variables as '').
const envOr = (name: string, fallback: string): string => {
  const value = process.env[name]
  return value !== undefined && value !== '' ? value : fallback
}

const appDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  extends: [fileURLToPath(new URL('../../layers/engine', import.meta.url))],

  alias: {
    '#engine': fileURLToPath(new URL('../../layers/engine', import.meta.url)),
    '#brand': appDir,
  },

  css: [
    // Tailwind: theme tokens, base layer and the component vocabulary; must come first.
    '~/assets/css/tailwind.css',
    '~/assets/css/main.css',
    // Brand display font (@font-face Channel) + html background.
    '~/assets/css/brand.css',
  ],

  // Modules that are UI/brand concerns (fonts). Engine registers the
  // Rest (i18n, pinia, sitemap, sentry); module arrays concat across layers.
  modules: ['@nuxt/fonts'],

  // Tailwind 4 runs as a Vite plugin; the theme lives in assets/css/tailwind.css.
  vite: {
    plugins: [tailwindcss()],
  },

  $meta: {
    title: 'Tokyo Sushi Bar',
    description:
      'Restaurant japonais à Liège : sushi frais, sashimi et cuisine japonaise authentique. Livraison et à emporter.',
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Tokyo Sushi Bar',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Restaurant japonais à Liège : sushi frais, sashimi et cuisine japonaise authentique. Livraison et à emporter.',
        },
        // Light only (no dark theme): stops Android auto-dark from inverting the UI. theme-color is the page background (site.webmanifest agrees).
        { name: 'color-scheme', content: 'only light' },
        { name: 'theme-color', content: '#F6F5F2' },
      ],
      link: [
        // Favicon: light theme (black logo)
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon-light.ico',
          media: '(prefers-color-scheme: light)',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-light-32x32.png',
          media: '(prefers-color-scheme: light)',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-light-16x16.png',
          media: '(prefers-color-scheme: light)',
        },
        // Favicon: dark theme (white logo)
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon-dark.ico',
          media: '(prefers-color-scheme: dark)',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-dark-32x32.png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-dark-16x16.png',
          media: '(prefers-color-scheme: dark)',
        },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  // Montserrat is fetched from Google at build time and self-hosted (same origin, no runtime request to Google). The size-adjusted
  // Fallback faces are hand-written in assets/css/brand.css, so the module's generated ones are switched off (fallbacks: []).
  fonts: {
    families: [
      {
        name: 'Montserrat',
        provider: 'google',
        global: true,
        preload: true,
        fallbacks: [],
        weights: [400, 500, 600, 700],
        styles: ['normal'],
      },
    ],
    defaults: {
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
    },
    // Url-only sources, as before: no local() lookup of a same-named installed font.
    experimental: { disableLocalFallbacks: true },
  },

  /*
   * @sentry/nuxt module (registered by the engine layer when SENTRY_DSN is set):
   * org/project defaults for this brand's Sentry project. SENTRY_AUTH_TOKEN
   * is the CI-only source-map upload token.
   */
  sentry: {
    org: envOr('SENTRY_ORG', 'tokyo-sushi-bar'),
    project: envOr('SENTRY_PROJECT', 'tsb-core'),
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      disable: envOr('SENTRY_AUTH_TOKEN', '') === '',
    },
  },

  // Per-subdirectory long cache headers for static assets (logos, hero images,
  // Display font, icons). Nitro's public-asset handler sets Cache-Control
  // Directly; routeRules headers don't override it. All public assets live
  // Under this app.
  nitro: {
    publicAssets: [
      { baseURL: '/images', dir: `${appDir}public/images`, maxAge: 60 * 60 * 24 * 365 },
      { baseURL: '/icons', dir: `${appDir}public/icons`, maxAge: 60 * 60 * 24 * 365 },
      { baseURL: '/fonts', dir: `${appDir}public/fonts`, maxAge: 60 * 60 * 24 * 365 },
    ],
  },
})
