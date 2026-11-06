import { defineConfig } from '@playwright/test'
import type { BrandOptions } from '../../layers/engine/e2e/support/test'
import { fileURLToPath } from 'node:url'
import { mockPlaywrightConfig } from '../../layers/engine/e2e/mock/playwright'

// Mock mode: the app against the mock tsb-service, no secret or real backend. See layers/engine/e2e/mock/playwright.ts.
export default defineConfig<BrandOptions>(
  mockPlaywrightConfig({
    brand: 'ygfliege',
    appDir: fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/u, ''),
    appPort: 3201,
    mockPort: 8101,
    // The full menu, with the composer open (data/composer.ts): the shared shop specs walk the product grid, which the
    // composer-only shop hides, and the brand specs build a bowl, which the "coming soon" page does not offer.
    appEnv: { NUXT_PUBLIC_COMPOSER_ONLY: 'false', NUXT_PUBLIC_COMPOSER_COMING_SOON: 'false' },
  }),
)
