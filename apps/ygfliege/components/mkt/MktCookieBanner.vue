<template>
  <!--
    The cookie choice for the Google Ads tag (brand.googleAdsId, engine plugin google-ads.client.ts). A card of the
    redesign (white, 24px radius, warm border and shadow) in the bottom-left corner from sm up, and across the bottom of
    a phone above the action bar. Not modal: the site stays usable while it is open, and nothing is set before an
    answer. Refusing is one click, next to accepting and at the same size.
  -->
  <Transition name="cookie-banner">
    <section
      v-if="bannerOpen"
      ref="rootRef"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      tabindex="-1"
      data-testid="cookie-banner"
      class="cookie-banner fixed inset-x-3 z-40 rounded-ygf-lg border border-ygf-border bg-white p-5 shadow-ygf-lg outline-none sm:inset-x-auto sm:left-6 sm:w-[26rem]"
    >
      <div class="flex items-center gap-3">
        <span
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ygf-cream text-ygf-orange-text"
        >
          <MktIcon name="cookie" :size="22" />
        </span>
        <h2 id="cookie-banner-title" class="section-title text-xl">
          {{ $t('mkt.cookieBanner.title') }}
        </h2>
      </div>
      <p id="cookie-banner-text" class="mt-3 text-sm leading-relaxed text-ygf-gray-600">
        {{ $t('mkt.cookieBanner.text') }}
        <NuxtLinkLocale to="/privacy" class="btn-link text-sm">{{
          $t('mkt.cookieBanner.privacy')
        }}</NuxtLinkLocale>
      </p>
      <div class="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          class="btn btn-secondary px-4"
          data-testid="cookie-banner-decline"
          @click="decline"
        >
          {{ $t('mkt.cookieBanner.decline') }}
        </button>
        <button
          type="button"
          class="btn btn-primary px-4"
          data-testid="cookie-banner-accept"
          @click="accept"
        >
          {{ $t('mkt.cookieBanner.accept') }}
        </button>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import MktIcon from '~/components/mkt/MktIcon.vue'
import { useCookieConsent } from '#engine/composables/useCookieConsent'

const { bannerOpen, choice, accept, decline } = useCookieConsent()
const rootRef = ref<HTMLElement | null>(null)

/*
 * Opened again from the footer ("Manage cookies"), the banner takes the focus so a keyboard or screen reader user lands
 * on the choice they asked for. On a first visit it does not: it must not pull the visitor away from the page.
 */
watch(bannerOpen, async (open) => {
  if (!open || choice.value === null) return
  await nextTick()
  rootRef.value?.focus()
})
</script>

<style scoped>
.cookie-banner {
  /* Above the phone's action bar (its height is published as --action-bar-h), else above the safe area. */
  bottom: calc(var(--action-bar-h, env(safe-area-inset-bottom, 0px)) + 0.75rem);
}

@media (min-width: 640px) {
  .cookie-banner {
    bottom: 1.5rem;
  }
}

.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition:
    transform 300ms var(--ygf-ease-out),
    opacity 300ms var(--ygf-ease-out);
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  transform: translateY(1.5rem);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .cookie-banner-enter-active,
  .cookie-banner-leave-active {
    transition: opacity 150ms linear;
  }

  .cookie-banner-enter-from,
  .cookie-banner-leave-to {
    transform: none;
  }
}
</style>
