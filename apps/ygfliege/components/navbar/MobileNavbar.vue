<template>
  <nav
    ref="navRef"
    @keydown.esc.capture="onEscape"
    class="mobile-only bg-white text-ygf-black fixed z-50 h-20 w-full"
  >
    <div class="relative px-4 flex items-center h-full mx-auto">
      <!-- Logo with its name (never the circle alone, GUIDELINES.md §2.2) -->
      <BrandLockup />

      <!-- Right part -->
      <div class="flex items-center ml-auto shrink-0">
        <!-- Cart icon with its count, on every page once the cart has items (it opens the cart drawer) -->
        <div>
          <CartButton
            v-if="shopEnabled && isMounted && cartStore.totalItems > 0"
            class="lg:hidden"
          />
        </div>

        <!-- Hamburger Menu -->
        <div class="flex flex-col items-center ml-4">
          <button
            ref="hamburgerRef"
            type="button"
            :aria-label="$t('nav.toggleMenu')"
            :aria-expanded="isMenuOpen"
            aria-controls="mobile-menu"
            class="hamburger inline-flex h-11 w-11 items-center justify-center cursor-pointer rounded-full border border-ygf-border bg-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            :class="{ 'hamburger-active': isMenuOpen }"
            @click="toggleMenu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <!-- The phone menu: the redesign's full-screen night overlay, the six destinations as big lines with their
               Chinese accents, the account, the languages and the address under them. -->
          <div
            id="mobile-menu"
            ref="menuRef"
            :inert="!isMenuOpen"
            :class="isMenuOpen ? 'menu-open' : 'menu-closed'"
            class="fixed top-[var(--nav-h)] left-0 w-full h-[calc(100dvh-var(--nav-h))] px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto"
          >
            <ul class="flex flex-col w-full">
              <!-- Login and account are gone while the shop is switched off (utils/shopGate.ts); the menu stays,
                   showing the static menu. -->
              <MobileNavItem
                v-if="menuOpen && !(shopEnabled && COMPOSER_ONLY_SHOP)"
                :label="$t('nav.menu')"
                zh="菜单"
                to="/menu"
                @click="closeMenu"
              />
              <MobileNavItem
                v-if="shopEnabled"
                :label="$t('mkt.nav.compose')"
                zh="自选搭配"
                :to="COMPOSER_LINK"
                @click="closeMenu"
              />
              <MobileNavItem
                :label="$t('mkt.nav.concept')"
                zh="理念"
                to="/concept"
                @click="closeMenu"
              />
              <MobileNavItem
                :label="$t('mkt.nav.about')"
                zh="我们的故事"
                to="/about"
                @click="closeMenu"
              />
              <MobileNavItem
                :label="$t('nav.contact')"
                zh="联系我们"
                to="/contact"
                @click="closeMenu"
              />
              <MobileNavItem
                :label="$t('mkt.nav.faq')"
                zh="常见问题"
                to="/faq"
                @click="closeMenu"
              />
            </ul>

            <ClientOnly v-if="shopEnabled">
              <NuxtLinkLocale
                v-if="!authStore.user"
                to="/auth/login"
                class="btn btn-primary w-full mt-6"
                data-testid="mobile-menu-login"
                @click="closeMenu"
              >
                {{ $t('nav.login') }}
              </NuxtLinkLocale>
              <NuxtLinkLocale
                v-else
                to="/me"
                class="btn btn-primary w-full mt-6"
                data-testid="mobile-menu-account"
                @click="closeMenu"
              >
                {{ $t('nav.myAccount') }}
              </NuxtLinkLocale>
            </ClientOnly>

            <!-- The language: the current one by name, and the brand's picker (the disclosure every page shares, listing
                 the four languages in their own names) -->
            <div class="mt-6 flex items-center justify-between gap-4">
              <span class="text-sm text-white/70">
                {{ $t('nav.language') }}<span class="sr-only">:</span>
                <strong class="ml-1 font-semibold text-white">{{ currentLanguage.label }}</strong>
              </span>
              <ul class="flex">
                <LanguagePicker :label="$t('nav.language')" icon="/icons/translate-icon.svg" />
              </ul>
            </div>

            <address class="mt-8 not-italic text-sm leading-relaxed text-white/60">
              {{ brand.address.street }}, {{ brand.address.postal }} {{ brand.address.city }}<br />
              <a
                :href="telHref(brand.phone)"
                class="inline-flex min-h-11 items-center text-white/80 hover:text-white transition-colors"
                >{{ brand.phone }}</a
              >
            </address>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from '#imports'
import BrandLockup from './BrandLockup.vue'
import CartButton from '#engine/components/cart/CartButton.vue'
import LanguagePicker from './LanguagePicker.vue'
import MobileNavItem from './MobileNavItem.vue'
import { telHref } from '#engine/utils/phone'
import { useAuthStore } from '#engine/stores/auth'
import { useBodyScrollLock } from '#engine/composables/useBodyScrollLock'
import { useCartStore } from '#engine/stores/cart'
import { useFocusTrap } from '#engine/composables/useFocusTrap'
import { useLanguagePicker } from '#engine/composables/useLanguagePicker'
import { useMediaQuery, useMounted } from '@vueuse/core'
import { useMenuOpen, useShopEnabled } from '#engine/composables/useShopEnabled'
import { COMPOSER_LINK, COMPOSER_ONLY_SHOP } from '~/data/composer'

const authStore = useAuthStore()
const cartStore = useCartStore()
const shopEnabled = useShopEnabled()
const menuOpen = useMenuOpen()
const { brand } = useAppConfig()
// Cart store rehydrates from localStorage post-mount; defer the totalItems read.
const isMounted = useMounted()
// The name of the current language, shown beside the picker.
const { current: currentLanguage } = useLanguagePicker()

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// The open menu is a modal overlay: the page cannot scroll behind it, and Tab stays inside the header and the menu.
useBodyScrollLock(isMenuOpen)

const navRef = ref<HTMLElement | null>(null)
const hamburgerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

useFocusTrap(
  computed(() => (isMenuOpen.value ? navRef.value : null)),
  {
    // First link of the menu; the menu stops being inert in the same render, so this runs once it is reachable.
    initialFocus: () => menuRef.value?.querySelector<HTMLElement>('a[href]'),
    // Back to the hamburger, unless the cart sheet took over (it manages its own focus).
    returnFocus: () => (cartStore.isCartVisible ? false : hamburgerRef.value),
  },
)

// Escape closes the menu.
const onEscape = () => {
  if (isMenuOpen.value) closeMenu()
}

/*
 * `.mobile-only` hides this whole navbar from 640px up (rotating a phone to landscape): the hamburger is gone, so an open menu
 * must close or its scroll lock would stay on a page nobody can unlock.
 */
const isWide = useMediaQuery('(min-width: 640px)')
watch(isWide, (wide) => {
  if (wide) closeMenu()
})

// Opening the cart from the header hands the screen over to the cart sheet.
watch(
  () => cartStore.isCartVisible,
  (visible) => {
    if (visible) closeMenu()
  },
)
</script>

<style>
:root {
  --transition-duration: 0.4s;
  --transition-easing: ease;
}

/* Hamburger lines */
.hamburger {
  position: relative;
  color: var(--ygf-black);
}

.hamburger span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 2px;
  border-radius: 9999px;
  background-color: currentColor;
  /* The bars move with transform only (the old top transition animated layout). */
  transform: translate(-50%, calc(-50% - 6px));
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.hamburger span:nth-child(2) {
  transform: translate(-50%, -50%);
}

.hamburger span:nth-child(3) {
  transform: translate(-50%, calc(-50% + 6px));
}

/* Transform the hamburger into an X when active */
.hamburger-active span:nth-child(1) {
  transform: translate(-50%, -50%) rotate(45deg);
}

.hamburger-active span:nth-child(2) {
  opacity: 0;
  transform: translate(-50%, -50%) scaleX(0.6);
}

.hamburger-active span:nth-child(3) {
  transform: translate(-50%, -50%) rotate(-45deg);
}

/* Mobile Menu Styles */
#mobile-menu {
  /* The redesign's night overlay: warm near-black, white lines, the brand orange only on the current page and the CTA. */
  background-color: var(--ygf-night);
  color: var(--ygf-white);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  z-index: 40;
}

/* visibility flips only after the fade-out, so the animation stays and the closed menu is never focusable or read aloud. */
.menu-closed {
  opacity: 0;
  transform: translateY(-20px);
  pointer-events: none;
  visibility: hidden;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease,
    visibility 0s linear 0.4s;
}

.menu-open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  visibility: visible;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease,
    visibility 0s;
}

.menu-closed li {
  opacity: 0;
  transform: translateX(-10px);
  transition:
    opacity var(--duration-normal) var(--ygf-ease-out),
    transform var(--duration-normal) var(--ygf-ease-out);
  transition-delay: 0s;
}

.menu-open li {
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity var(--duration-normal) var(--ygf-ease-out),
    transform var(--duration-normal) var(--ygf-ease-out);
}
.menu-open li:nth-child(1) {
  transition-delay: 0.05s;
}
.menu-open li:nth-child(2) {
  transition-delay: 0.1s;
}
.menu-open li:nth-child(3) {
  transition-delay: 0.15s;
}
.menu-open li:nth-child(4) {
  transition-delay: 0.2s;
}
.menu-open li:nth-child(5) {
  transition-delay: 0.25s;
}
.menu-open li:nth-child(6) {
  transition-delay: 0.3s;
}
.menu-open li:nth-child(7) {
  transition-delay: 0.35s;
}
.menu-open li:nth-child(8) {
  transition-delay: 0.4s;
}
</style>
