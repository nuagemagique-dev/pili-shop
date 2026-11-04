// YGF cookie banner (brand.googleAdsId): shown while the visitor has not answered, Refuse and Accept side by side, a
// link to the privacy policy; reopened from the footer it takes the focus.
// Run: `vp test run apps/ygfliege/components/mkt/MktCookieBanner.nuxt.test.ts`.
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { useCookieConsent } from '#engine/composables/useCookieConsent'

const { default: MktCookieBanner } = await import('./MktCookieBanner.vue')

let unmount: (() => void) | undefined
const mount = async () => {
  const wrapper = await mountSuspended(MktCookieBanner, { attachTo: document.body })
  unmount = () => {
    wrapper.unmount()
  }
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  const { choice, bannerOpen } = useCookieConsent()
  choice.value = null
  bannerOpen.value = true
})
afterEach(() => {
  unmount?.()
  unmount = undefined
})

describe('MktCookieBanner', () => {
  it('asks for consent with a refuse and an accept button and a link to the privacy policy', async () => {
    const banner = await mount()
    const dialog = banner.get('[data-testid="cookie-banner"]')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-modal')).toBe('false')
    expect(dialog.text()).toContain('Google Ads')
    expect(banner.get('[data-testid="cookie-banner-decline"]').text()).toBe('Decline')
    expect(banner.get('[data-testid="cookie-banner-accept"]').text()).toBe('Accept')
    expect(banner.get('a').attributes('href')).toMatch(/^\/[a-z]{2}\/privacy$/u)
  })

  it('does not take the focus on a first visit', async () => {
    await mount()
    await nextTick()
    expect(document.activeElement).toBe(document.body)
  })

  it('accepting closes it and records the consent', async () => {
    const banner = await mount()
    await banner.get('[data-testid="cookie-banner-accept"]').trigger('click')
    expect(useCookieConsent().choice.value).toBe('granted')
    expect(banner.find('[data-testid="cookie-banner"]').exists()).toBe(false)
  })

  it('refusing closes it and records the refusal', async () => {
    const banner = await mount()
    await banner.get('[data-testid="cookie-banner-decline"]').trigger('click')
    expect(useCookieConsent().choice.value).toBe('denied')
    expect(banner.find('[data-testid="cookie-banner"]').exists()).toBe(false)
  })

  it('reopened from the footer after a choice, it takes the focus', async () => {
    const consent = useCookieConsent()
    consent.bannerOpen.value = false
    consent.choice.value = 'denied'
    const banner = await mount()
    consent.reopen()
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(banner.get('[data-testid="cookie-banner"]').element)
  })
})
