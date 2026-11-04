// Google Ads plugin (brand.googleAdsId): Consent Mode v2 "basic". Every signal starts denied and gtag.js is only
// downloaded once the visitor accepts; a later refusal denies the signals again and deletes Google's ad cookies.
// Run: `vp test run layers/engine/plugins/google-ads.client.nuxt.test.ts`.
import { COOKIE_CONSENT_STORAGE_KEY, useCookieConsent } from '#engine/composables/useCookieConsent'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { effectScope, nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const adsId = vi.hoisted(() => ({ value: undefined as string | undefined }))
mockNuxtImport('useAppConfig', (original) => () => {
  const config = original()
  return { ...config, brand: { ...config.brand, googleAdsId: adsId.value } }
})

const { default: plugin, GTAG_SRC } = await import('./google-ads.client')

const w = window
// The commands queued for gtag.js, as plain arrays (gtag pushes `arguments` objects).
const commands = () => (w.dataLayer ?? []).map((args) => Array.from(args))
const denied = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}
const granted = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
}

let scope: ReturnType<typeof effectScope> | undefined
let appended: HTMLScriptElement[]
const install = () => {
  scope = effectScope()
  scope.run(() => {
    ;(plugin as unknown as (app: unknown) => void)({})
  })
}

beforeEach(() => {
  adsId.value = 'AW-123'
  localStorage.clear()
  delete w.dataLayer
  delete w.gtag
  const { choice, bannerOpen } = useCookieConsent()
  choice.value = null
  bannerOpen.value = false
  appended = []
  // Record the script instead of letting happy-dom fetch Google.
  vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
    appended.push(...(nodes as HTMLScriptElement[]))
  })
})
afterEach(() => {
  scope?.stop()
  scope = undefined
})

describe('google-ads plugin', () => {
  it('does nothing for a brand without a Google Ads id: no tag, no banner', () => {
    adsId.value = undefined
    install()
    expect(w.dataLayer).toBeUndefined()
    expect(useCookieConsent().bannerOpen.value).toBe(false)
    expect(appended).toEqual([])
  })

  it('on a first visit opens the banner, queues the tag with every signal denied, and downloads nothing', () => {
    install()
    expect(useCookieConsent().bannerOpen.value).toBe(true)
    expect(commands()).toEqual([
      ['consent', 'default', denied],
      ['js', expect.any(Date)],
      ['config', 'AW-123'],
    ])
    expect(appended).toEqual([])
  })

  it('accepting grants the signals and loads gtag.js once', async () => {
    install()
    const consent = useCookieConsent()
    consent.accept()
    await nextTick()
    expect(commands().at(-1)).toEqual(['consent', 'update', granted])
    expect(appended).toHaveLength(1)
    expect(appended[0]?.src).toBe(`${GTAG_SRC}?id=AW-123`)
    expect(appended[0]?.async).toBe(true)

    // Reopened and accepted again: the tag is not added a second time.
    consent.reopen()
    consent.decline()
    await nextTick()
    consent.accept()
    await nextTick()
    expect(appended).toHaveLength(1)
  })

  it('a returning visitor who accepted gets the tag at once, without the banner', () => {
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ choice: 'granted', at: Date.now() }),
    )
    install()
    expect(useCookieConsent().bannerOpen.value).toBe(false)
    expect(commands().at(-1)).toEqual(['consent', 'update', granted])
    expect(appended).toHaveLength(1)
  })

  it('a returning visitor who refused gets neither the tag nor the banner', () => {
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ choice: 'denied', at: Date.now() }),
    )
    install()
    expect(useCookieConsent().bannerOpen.value).toBe(false)
    expect(commands()).toHaveLength(3)
    expect(appended).toEqual([])
  })

  it('withdrawing consent denies the signals again and deletes the Google Ads cookies', async () => {
    install()
    const consent = useCookieConsent()
    consent.accept()
    await nextTick()
    document.cookie = '_gcl_au=1.1.123; path=/'
    document.cookie = 'i18n_redirected=fr; path=/'
    consent.decline()
    await nextTick()
    expect(commands().at(-1)).toEqual(['consent', 'update', denied])
    expect(document.cookie).not.toContain('_gcl_au')
    expect(document.cookie).toContain('i18n_redirected=fr')
  })

  it('refusing before the tag was loaded sends no update at all', async () => {
    install()
    useCookieConsent().decline()
    await nextTick()
    expect(commands()).toHaveLength(3)
    expect(appended).toEqual([])
  })
})
