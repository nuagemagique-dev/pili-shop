// /menu while the composer is coming soon (NUXT_PUBLIC_COMPOSER_COMING_SOON, data/composer.ts): says so, shows no
// price and nothing to order, and sends the visitor to the counter (directions, phone) and to the concept. The
// restaurant config query and its subscription are the boundaries; i18n, the brand data, the status pill and the
// counter steps run for real.
// Run: `vp test run apps/ygfliege/components/menu/ComposerComingSoon.nuxt.test.ts`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { clearNuxtData, useAppConfig, useNuxtApp } from '#imports'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { settle } from '../../../../test/helpers/settle'

const gqlFetch = vi.hoisted(() => vi.fn())
mockNuxtImport('useNuxtApp', async (original) => {
  const { withGqlFetch } = await import('../../../../test/helpers/gqlFetch')
  return () => withGqlFetch(original(), gqlFetch)
})
// The live config feed: no WebSocket in a unit test.
vi.mock('#engine/composables/useGqlSubscription', async () => {
  const { ref } = await import('vue')
  return {
    useGqlSubscription: () => ({ data: ref<unknown>(), error: ref<unknown>(null), stop: vi.fn() }),
  }
})

const { default: ComposerComingSoon } = await import('./ComposerComingSoon.vue')

// The restaurant: open at the counter, online ordering switched off (the production state while the composer is coming soon).
const restaurantConfig = {
  orderingEnabled: false,
  openingHours: {
    monday: { open: '11:30', close: '22:00' },
    tuesday: { open: '11:30', close: '22:00' },
    wednesday: { open: '11:30', close: '22:00' },
    thursday: { open: '11:30', close: '22:00' },
    friday: { open: '11:30', close: '22:00' },
    saturday: { open: '11:30', close: '22:00' },
    sunday: { open: '11:30', close: '22:00' },
  },
  orderingHours: null,
  preparationMinutes: 30,
  isCurrentlyOpen: true,
  isOrderingCurrentlyOpen: false,
  availableSlotsToday: [],
  nextOpeningAt: null,
}

let unmount: (() => void) | undefined
const mount = async () => {
  const wrapper = await mountSuspended(ComposerComingSoon)
  await settle()
  unmount = () => {
    wrapper.unmount()
  }
  return wrapper
}

beforeEach(() => {
  clearNuxtData()
  gqlFetch.mockReset()
  gqlFetch.mockResolvedValue({ restaurantConfig })
})
afterEach(() => {
  unmount?.()
  unmount = undefined
})

describe('ComposerComingSoon', () => {
  it('says the composer is coming, as the page title, and shows no price', async () => {
    const page = await mount()
    const { t } = useNuxtApp().$i18n
    expect(page.get('[data-testid="composer-coming-soon"] h1').text()).toBe(
      t('mkt.comingSoon.title'),
    )
    expect(page.text()).toContain(t('mkt.comingSoon.label'))
    expect(page.text()).toContain(t('mkt.comingSoon.desc'))
    // No amount anywhere: not the counter's rate, not the broth, not the online base price.
    expect(page.text()).not.toMatch(/€|\d+[,.]\d\d/u)
    expect(page.find('[data-testid="estimator"]').exists()).toBe(false)
    expect(page.find('[data-testid="composer-hero"]').exists()).toBe(false)
  })

  it('sends the visitor to the counter (directions, phone) and to the concept page', async () => {
    const page = await mount()
    const { brand } = useAppConfig()
    expect(page.get('[data-testid="coming-soon-directions"]').attributes('href')).toBe(
      brand.mapsUrl,
    )
    expect(page.get('[data-testid="coming-soon-call"]').attributes('href')).toMatch(/^tel:/u)
    expect(page.get('[data-testid="coming-soon-concept"]').attributes('href')).toMatch(
      /^\/[a-z]{2}\/concept$/u,
    )
    expect(page.text()).toContain(brand.address.street)
  })

  it('shows the counter steps only: nothing to switch to the online steps', async () => {
    const page = await mount()
    expect(page.find('[data-testid="steps-mode"]').exists()).toBe(false)
    expect(page.findAll('ol li')).toHaveLength(4)
  })
})
