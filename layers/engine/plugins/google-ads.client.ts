import { defineNuxtPlugin, useAppConfig } from '#imports'
import {
  type CookieConsentChoice,
  readStoredConsent,
  useCookieConsent,
} from '#engine/composables/useCookieConsent'
import { watch } from 'vue'

declare global {
  interface Window {
    // The command queue of gtag.js: it only reads `arguments` objects, never arrays.
    dataLayer?: IArguments[]
    gtag?: (...args: unknown[]) => void
  }
}

type ConsentState = 'granted' | 'denied'
const consentSignals = (state: ConsentState) => ({
  ad_storage: state,
  ad_user_data: state,
  ad_personalization: state,
  analytics_storage: state,
})

export const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js'

// Google's advertising cookies (`_gcl_au`, `_gcl_aw`, ...), set on the site's registrable domain.
const clearAdCookies = () => {
  const names = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim() ?? '')
    .filter((name) => name.startsWith('_gcl'))
  const host = location.hostname
  const domains = ['', host, `.${host.replace(/^www\./u, '')}`]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

/*
 * Google Ads tag (brand.googleAdsId) behind the visitor's consent, Consent Mode v2 "basic": every signal starts
 * denied and gtag.js is not even downloaded until the visitor accepts in the brand's cookie banner. Accepting grants
 * the signals and loads the tag; withdrawing later denies them again (the tag stops reading and writing its cookies)
 * and deletes the cookies it had set. A brand without the id gets nothing: no banner, no tag.
 */
export default defineNuxtPlugin(() => {
  const id = useAppConfig().brand.googleAdsId
  if (id === undefined || id === '') return

  const { choice, bannerOpen } = useCookieConsent()
  choice.value = readStoredConsent()
  bannerOpen.value = choice.value === null

  window.dataLayer ??= []
  const queue = window.dataLayer
  // gtag.js only runs commands pushed as an `arguments` object (an array is ignored), hence no rest parameter.
  const gtag: (...args: unknown[]) => void = function gtag() {
    // oxlint-disable-next-line prefer-rest-params
    queue.push(arguments)
  }
  window.gtag = gtag
  gtag('consent', 'default', consentSignals('denied'))
  gtag('js', new Date())
  gtag('config', id)

  let loaded = false
  const apply = (value: CookieConsentChoice | null) => {
    if (value === 'granted') {
      gtag('consent', 'update', consentSignals('granted'))
      if (loaded) return
      loaded = true
      const script = document.createElement('script')
      script.async = true
      script.src = `${GTAG_SRC}?id=${encodeURIComponent(id)}`
      document.head.append(script)
    } else if (value === 'denied') {
      if (loaded) gtag('consent', 'update', consentSignals('denied'))
      clearAdCookies()
    }
  }
  watch(choice, apply, { immediate: true })
})
