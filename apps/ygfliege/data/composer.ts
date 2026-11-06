import type { Product } from '#engine/types'
import { isMenuOpen } from '#engine/utils/shopGate'

// The build-your-own bowls are the products of this category. The shape rule
// (any multi-pick group) is not enough on this menu: the fixed sets also have
// multi-pick groups (extra toppings, condiments, drinks) and are not composers.
export const COMPOSER_CATEGORY_SLUG = 'sur-mesure'

export const isBowlComposer = (p: Product): boolean => p.category.slug === COMPOSER_CATEGORY_SLUG

/** A runtime flag that is on unless it says false, 0 or off: an unset or empty value keeps the default. */
const onUnlessOff = (value: unknown): boolean =>
  !['false', '0', 'off'].includes(String(value).trim().toLowerCase())

// The online shop can sell only the build-your-own bowls (owner's choice, 2026-11-05; runtime flag
// NUXT_PUBLIC_COMPOSER_ONLY, on by default, read by composables/useComposerOnly.ts): /menu is then the composer page,
// the two composer cards (with broth, without broth) and nothing else. The sets, drinks and snacks stay in the
// catalogue (and in the composers' own choice groups) but get no grid of cards; the header has no "Menu" entry, only
// "Composer". Off, /menu is the full menu again (the mock e2e runs that way).
export const isComposerOnlyValue = (value: unknown): boolean => onUnlessOff(value)

// The online composer can be announced before it opens (owner's choice, 2026-11-06; runtime flag
// NUXT_PUBLIC_COMPOSER_COMING_SOON, on by default, read by composables/useComposerAccess.ts): /menu is then a
// "coming soon" page instead of the composer, every "Composer" entry point is gone, and no price shows anywhere on
// the site (the hero's price line, the price estimator, the online price rule, the SEO descriptions). Nothing is
// removed: the catalogue, the composer and the estimator come back with NUXT_PUBLIC_COMPOSER_COMING_SOON=false.
export const isComposerComingSoonValue = (value: unknown): boolean => onUnlessOff(value)

/** Where "Composer" leads: the composer page, where the visitor picks with or without broth (else straight into the first composer). */
export const composerLink = (composerOnly: boolean): string =>
  composerOnly ? '/menu' : '/menu?compose'

export interface ComposerAccessInput {
  /** The shop is on (NUXT_PUBLIC_SHOP_ENABLED, engine utils/shopGate.ts). */
  shopEnabled: boolean
  composerOnly: boolean
  composerComingSoon: boolean
  /** brand.staticMenuWhenShopClosed: /menu stays up, as the static menu, while the shop is off. */
  staticMenuWhenShopClosed: boolean | undefined
}

/** What the pages may offer of the online composer, from the shop flag, the two composer flags and the brand's static menu: the rule in one place. */
export interface ComposerAccess {
  /** The online composer opens for visitors: the shop is on and the composer is not "coming soon". */
  composerOpen: boolean
  composerOnly: boolean
  composerComingSoon: boolean
  /** Where a "Composer" entry leads, while `composerOpen`. */
  composerLink: string
  /** Prices may show (the hero's price line, the estimator, the online price rule): never while the composer is coming soon. */
  pricesShown: boolean
  /** A "Menu" entry has a page to lead to: the full menu with the shop on, the static menu with it off; none on a composer-only shop, none while the composer is coming soon. */
  menuEntryShown: boolean
  /** Where a showcase call to action leads while the composer is not open: the static menu when the brand keeps one up, else the concept page. */
  showcaseLink: '/menu' | '/concept'
}

export const composerAccess = ({
  shopEnabled,
  composerOnly,
  composerComingSoon,
  staticMenuWhenShopClosed,
}: ComposerAccessInput): ComposerAccess => {
  const composerOpen = shopEnabled && !composerComingSoon
  const menuOpen = isMenuOpen(shopEnabled, staticMenuWhenShopClosed) && !composerComingSoon
  return {
    composerOpen,
    composerOnly,
    composerComingSoon,
    composerLink: composerLink(composerOnly),
    pricesShown: !composerComingSoon,
    menuEntryShown: menuOpen && !(shopEnabled && composerOnly),
    showcaseLink: menuOpen ? '/menu' : '/concept',
  }
}

// Hero card of each composer, by product slug: the official bowl shot and
// the subtitle. A bowl built in a broth gets the beef-bone bowl and the broth
// copy; the dry one (Mala Mix, sans bouillon) the mala dry-mix bowl and a
// subtitle about the sauce instead.
export interface ComposerHero {
  /** Asset base under /public, widths + ext appended by MktPicture. */
  photo: string
  /** I18n key of the subtitle. */
  subtitleKey: string
  /** I18n key of the badge that says whether the bowl comes in a broth. */
  brothKey: 'composer.withBroth' | 'composer.withoutBroth'
}

const DEFAULT_HERO: ComposerHero = {
  photo: '/images/bowls/beef-bone-top',
  subtitleKey: 'composer.heroSubtitle',
  brothKey: 'composer.withBroth',
}

const COMPOSER_HEROES: Record<string, ComposerHero> = {
  'mala-mix-personnalise': {
    photo: '/images/bowls/mala-dry-mix-top',
    subtitleKey: 'composer.heroSubtitleDry',
    brothKey: 'composer.withoutBroth',
  },
}

export const composerHero = (slug: string): ComposerHero => COMPOSER_HEROES[slug] ?? DEFAULT_HERO
