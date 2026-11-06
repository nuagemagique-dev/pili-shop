// What the pages may offer of the online composer, from the runtime flags (NUXT_PUBLIC_SHOP_ENABLED,
// NUXT_PUBLIC_COMPOSER_ONLY, NUXT_PUBLIC_COMPOSER_COMING_SOON) and the brand's static menu.
// Run: `vp test run apps/ygfliege/composables/useComposerAccess.nuxt.test.ts`.
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { useRuntimeConfig } from '#imports'
import { useComposerAccess } from './useComposerAccess'

// The runtime config types the flags as the booleans of nuxt.config; the environment sets them as strings.
interface Flags {
  shopEnabled: unknown
  composerOnly: unknown
  composerComingSoon: unknown
}
const config = () => useRuntimeConfig().public as unknown as Flags
let original: Flags
beforeEach(() => {
  const { shopEnabled, composerOnly, composerComingSoon } = config()
  original = { shopEnabled, composerOnly, composerComingSoon }
  config().shopEnabled = true
})
afterEach(() => {
  Object.assign(config(), original)
})

describe('useComposerAccess', () => {
  it('by default the composer is coming soon: not open, no price, no menu entry, the showcase leads to the concept', () => {
    expect(useComposerAccess()).toEqual({
      composerOpen: false,
      composerOnly: true,
      composerComingSoon: true,
      composerLink: '/menu',
      pricesShown: false,
      menuEntryShown: false,
      showcaseLink: '/concept',
    })
  })

  it('NUXT_PUBLIC_COMPOSER_COMING_SOON=false opens the composer page, with prices', () => {
    config().composerComingSoon = 'false'
    expect(useComposerAccess()).toEqual({
      composerOpen: true,
      composerOnly: true,
      composerComingSoon: false,
      composerLink: '/menu',
      pricesShown: true,
      menuEntryShown: false,
      showcaseLink: '/menu',
    })
  })

  it('with the full menu too (NUXT_PUBLIC_COMPOSER_ONLY=false), "Composer" opens the first composer and "Menu" is offered', () => {
    config().composerComingSoon = 'false'
    config().composerOnly = 'false'
    expect(useComposerAccess()).toMatchObject({
      composerOpen: true,
      composerLink: '/menu?compose',
      menuEntryShown: true,
    })
  })

  it('with the shop off (NUXT_PUBLIC_SHOP_ENABLED=false) the brand keeps its static menu up', () => {
    config().composerComingSoon = 'false'
    config().shopEnabled = 'false'
    expect(useComposerAccess()).toMatchObject({
      composerOpen: false,
      pricesShown: true,
      menuEntryShown: true,
      showcaseLink: '/menu',
    })
  })
})
