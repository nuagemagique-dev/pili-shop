// useCookieConsent: the visitor's answer to the cookie banner, kept six months in localStorage, then asked again.
// Run: `vp test run layers/engine/composables/useCookieConsent.nuxt.test.ts`.
import {
  COOKIE_CONSENT_MAX_AGE_MS,
  COOKIE_CONSENT_STORAGE_KEY,
  readStoredConsent,
  useCookieConsent,
} from './useCookieConsent'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const store = (value: unknown) => {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(value))
}

beforeEach(() => {
  localStorage.clear()
  const { choice, bannerOpen } = useCookieConsent()
  choice.value = null
  bannerOpen.value = false
})
afterEach(() => {
  vi.useRealTimers()
})

describe('readStoredConsent', () => {
  it('is null when nothing was chosen', () => {
    expect(readStoredConsent()).toBeNull()
  })

  it('gives back a choice made less than six months ago', () => {
    const now = Date.now()
    store({ choice: 'granted', at: now - 1000 })
    expect(readStoredConsent(now)).toBe('granted')
    store({ choice: 'denied', at: now - COOKIE_CONSENT_MAX_AGE_MS })
    expect(readStoredConsent(now)).toBe('denied')
  })

  it('forgets a choice older than six months, so the banner asks again', () => {
    const now = Date.now()
    store({ choice: 'granted', at: now - COOKIE_CONSENT_MAX_AGE_MS - 1 })
    expect(readStoredConsent(now)).toBeNull()
  })

  it('ignores an unreadable or foreign value', () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, '{not json')
    expect(readStoredConsent()).toBeNull()
    store({ choice: 'maybe', at: Date.now() })
    expect(readStoredConsent()).toBeNull()
    store({ choice: 'granted' })
    expect(readStoredConsent()).toBeNull()
    store('granted')
    expect(readStoredConsent()).toBeNull()
  })

  it('is null when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredConsent()).toBeNull()
  })
})

describe('useCookieConsent', () => {
  it('accepting records the choice with its date and closes the banner', () => {
    vi.useFakeTimers({ now: new Date('2026-11-04T10:00:00Z') })
    const consent = useCookieConsent()
    consent.bannerOpen.value = true
    consent.accept()
    expect(consent.choice.value).toBe('granted')
    expect(consent.bannerOpen.value).toBe(false)
    expect(JSON.parse(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? '')).toEqual({
      choice: 'granted',
      at: Date.parse('2026-11-04T10:00:00Z'),
    })
  })

  it('refusing is recorded the same way, and is shared with every caller', () => {
    const banner = useCookieConsent()
    banner.bannerOpen.value = true
    banner.decline()
    expect(useCookieConsent().choice.value).toBe('denied')
    expect(useCookieConsent().bannerOpen.value).toBe(false)
    expect(readStoredConsent()).toBe('denied')
  })

  it('reopening shows the banner again with the current choice kept', () => {
    const consent = useCookieConsent()
    consent.accept()
    consent.reopen()
    expect(consent.bannerOpen.value).toBe(true)
    expect(consent.choice.value).toBe('granted')
  })

  it('still answers for this visit when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const consent = useCookieConsent()
    consent.decline()
    expect(consent.choice.value).toBe('denied')
  })
})
