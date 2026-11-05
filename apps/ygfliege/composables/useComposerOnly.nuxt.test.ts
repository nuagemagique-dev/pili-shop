// The composer-only shop flag (NUXT_PUBLIC_COMPOSER_ONLY), read from the runtime config.
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { useRuntimeConfig } from '#imports'
import { useComposerOnly } from './useComposerOnly'

// The runtime config types the flag as the boolean of nuxt.config; the environment sets it as a string.
const config = () => useRuntimeConfig().public as { composerOnly: unknown }
let original: unknown
beforeEach(() => {
  original = config().composerOnly
})
afterEach(() => {
  config().composerOnly = original
})

describe('useComposerOnly', () => {
  it('is on by default: "Composer" leads to the composer page', () => {
    expect(useComposerOnly()).toEqual({ composerOnly: true, composerLink: '/menu' })
  })

  it('turned off, brings the full menu back and "Composer" opens the first composer', () => {
    config().composerOnly = 'false'
    expect(useComposerOnly()).toEqual({ composerOnly: false, composerLink: '/menu?compose' })
  })
})
