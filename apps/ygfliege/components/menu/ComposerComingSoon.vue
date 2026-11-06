<template>
  <div>
    <!-- ── The composer, announced: nothing to order and no price; the counter instead (directions, phone, concept) ── -->
    <section class="coming-soon-hero overflow-hidden" data-testid="composer-coming-soon">
      <div
        class="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pt-14 sm:pb-16 lg:py-20 grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center"
      >
        <div class="text-center lg:text-left">
          <span class="section-label section-label-rule">{{ $t('mkt.comingSoon.label') }}</span>
          <h1
            class="font-display font-black font-stretch-expanded text-4xl sm:text-5xl lg:text-6xl text-ygf-black leading-[0.95] tracking-tight text-balance"
          >
            {{ $t('mkt.comingSoon.title') }}
          </h1>
          <p
            class="mt-5 text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 text-pretty"
          >
            {{ $t('mkt.comingSoon.desc') }}
          </p>

          <div
            class="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start sm:gap-3"
          >
            <a
              :href="brand.mapsUrl"
              target="_blank"
              rel="noopener"
              class="btn btn-primary"
              data-testid="coming-soon-directions"
            >
              <MktIcon name="map-pin" :size="18" />
              {{ $t('mkt.actionBar.directions') }}
            </a>
            <a
              :href="telHref(brand.phone)"
              class="btn btn-secondary"
              data-testid="coming-soon-call"
            >
              <MktIcon name="phone" :size="18" />
              {{ $t('mkt.actionBar.call') }}
            </a>
            <NuxtLinkLocale
              to="/concept"
              class="btn btn-secondary"
              data-testid="coming-soon-concept"
            >
              {{ $t('mkt.hero.ctaConcept') }}
              <MktIcon name="arrow-right" :size="18" />
            </NuxtLinkLocale>
          </div>

          <!-- The live status and the address, as in the home hero -->
          <div
            class="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-ygf-gray-600"
          >
            <MktOpenStatus />
            <span class="inline-flex items-center gap-1.5">
              <span class="text-ygf-orange-text"><MktIcon name="map-pin-fill" :size="16" /></span>
              {{ brand.address.street }}, {{ brand.address.city }}
            </span>
          </div>
        </div>

        <div class="relative flex justify-center">
          <div aria-hidden="true">
            <span class="steam-wisp" style="left: 42%; animation-delay: 0s" />
            <span class="steam-wisp" style="left: 50%; animation-delay: 1.1s" />
            <span class="steam-wisp" style="left: 58%; animation-delay: 2.2s" />
          </div>
          <MktPicture
            src="/images/bowls/beef-bone-top"
            :widths="[320, 560, 800]"
            :fallback-width="560"
            :fallback-height="560"
            alt=""
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 320px, 60vw"
            eager
            class="block w-[60vw] max-w-[320px] lg:max-w-[400px]"
            img-class="coming-soon-bowl w-full"
          />
        </div>
      </div>
    </section>

    <!-- ── How it works at the counter, for a visitor who landed here looking for the menu ── -->
    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div v-reveal class="mb-6 sm:mb-10 sm:text-center">
          <h2 class="section-title text-3xl sm:text-4xl">{{ $t('mkt.home.steps.title') }}</h2>
          <p class="mt-2 text-gray-600">{{ $t('mkt.home.steps.subtitle') }}</p>
        </div>
        <MktSteps key-prefix="mkt.home.steps" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/*
 * /menu while the composer is announced but not open yet (NUXT_PUBLIC_COMPOSER_COMING_SOON, data/composer.ts): says
 * so, sends the visitor to the counter (directions, phone, the concept) and shows nothing to order and no price. The
 * composer (ShopMenu.vue) and the static menu are untouched and come back once the flag is turned off.
 */
import MktIcon from '~/components/mkt/MktIcon.vue'
import MktOpenStatus from '~/components/mkt/MktOpenStatus.vue'
import MktPicture from '~/components/mkt/MktPicture.vue'
import MktSteps from '~/components/mkt/MktSteps.vue'
import { telHref } from '#engine/utils/phone'

const { t } = useI18n()
const { brand } = useAppConfig()

useSeoMeta({
  title: `${t('mkt.comingSoon.title')} - ${t('brandName')}`,
  ogType: 'website',
  ogTitle: `${t('mkt.comingSoon.title')} - ${t('brandName')}`,
  description: t('mkt.comingSoon.seo_desc'),
  ogDescription: t('mkt.comingSoon.seo_desc'),
  ...useLocaleSeoMeta(),
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

/* The home hero's warm background. */
.coming-soon-hero {
  background: radial-gradient(
    120% 80% at 50% 0%,
    var(--ygf-peach) 0%,
    var(--ygf-orange-bg) 55%,
    #ffe6cf 100%
  );
}

.coming-soon-hero .steam-wisp {
  bottom: 88%;
}

:deep(.coming-soon-bowl) {
  filter: drop-shadow(0 24px 48px --alpha(--theme(--color-ygf inline) / 28%));
}
</style>
