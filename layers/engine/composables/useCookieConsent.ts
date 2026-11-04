import { useState } from '#imports'

/** The visitor's answer to the cookie banner: advertising cookies allowed or refused. */
export type CookieConsentChoice = 'granted' | 'denied'

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent'

/*
 * A choice is kept six months, then the banner asks again (the Belgian DPA's guidance on the lifetime of a consent).
 * A refusal is kept as long as an acceptance: the banner must not come back on every visit to wear a "no" down.
 */
export const COOKIE_CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000

interface StoredConsent {
  choice: CookieConsentChoice
  at: number
}

const isStoredConsent = (value: unknown): value is StoredConsent =>
  typeof value === 'object' &&
  value !== null &&
  'choice' in value &&
  (value.choice === 'granted' || value.choice === 'denied') &&
  'at' in value &&
  typeof value.at === 'number'

/** The stored choice, or null when there is none, it is unreadable or it has expired. Client only. */
export const readStoredConsent = (now = Date.now()): CookieConsentChoice | null => {
  try {
    const raw = globalThis.localStorage?.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (raw === undefined || raw === null || raw === '') return null
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredConsent(parsed) || now - parsed.at > COOKIE_CONSENT_MAX_AGE_MS) return null
    return parsed.choice
  } catch {
    return null
  }
}

/**
 * Cookie consent for the advertising tag (brand.googleAdsId). `choice` is null until the visitor answers; the
 * google-ads plugin fills it from storage at start and opens the banner when there is no valid answer. The brand
 * renders the banner itself (its own design) from `bannerOpen`, `accept` and `decline`, and offers `reopen` (a
 * "Manage cookies" link) so a choice can be changed or withdrawn as easily as it was given.
 */
export const useCookieConsent = () => {
  const choice = useState<CookieConsentChoice | null>('cookie-consent', () => null)
  const bannerOpen = useState<boolean>('cookie-consent-banner', () => false)

  const decide = (value: CookieConsentChoice) => {
    choice.value = value
    bannerOpen.value = false
    try {
      globalThis.localStorage?.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify({ choice: value, at: Date.now() } satisfies StoredConsent),
      )
    } catch {
      // Storage blocked (private mode): the choice holds for this visit only.
    }
  }

  return {
    choice,
    bannerOpen,
    accept: () => {
      decide('granted')
    },
    decline: () => {
      decide('denied')
    },
    reopen: () => {
      bannerOpen.value = true
    },
  }
}
