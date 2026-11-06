<script setup lang="ts">
import { computed, ref } from 'vue'
import { BRAND_FIGURES } from '~/data/brandFigures'
import { COMPOSER_CATEGORY_SLUG } from '~/data/composer'
import { useComposerAccess } from '~/composables/useComposerAccess'
import { COUNTER_PRICE_PER_100G_CENTS } from '~/data/estimator'
import { INGREDIENTS, ingredientIconSrc } from '~/data/menuIngredients'
import { RECIPE_IMAGE, SHOWN_RECIPES } from '~/data/recipes'
import MktEstimator from '~/components/mkt/MktEstimator.vue'
import MktIcon from '~/components/mkt/MktIcon.vue'
import MktOpenStatus from '~/components/mkt/MktOpenStatus.vue'
import MktPicture from '~/components/mkt/MktPicture.vue'
import MktPracticalInfo from '~/components/mkt/MktPracticalInfo.vue'
import { formatCents, formatPrice } from '#engine/lib/price'
import { toCents } from '#engine/utils/money'
import { useHeroMotion, useMagnetic } from '~/composables/useMktMotion'
// Phosphor icons (same set as the vitrine site); raw SVGs, tinted via
// CurrentColor. Never emojis or hand-drawn paths.
import bowlSteamIcon from '~/assets/icons/bowl-steam.svg?raw'
import leafIcon from '~/assets/icons/leaf.svg?raw'
import scalesIcon from '~/assets/icons/scales.svg?raw'

// Marketing homepage (the 2026 redesign, "Main" board of the design canvas): hero with live status and price, how it
// works, the broths, the illustrated recipes ("Composer ce bol"), everything that goes in the bowl, the price
// estimator, the video band, why Yangguofu with the brand's figures, practical info with the map. Every ordering
// affordance shows only while the composer is open (data/composer.ts); otherwise it is a complete showcase (menu,
// directions, call, hours), and while the composer is coming soon no price shows at all (hero line, estimator).
definePageMeta({
  public: true,
  sitemap: { priority: 1, changefreq: 'weekly' },
})

const { t } = useI18n()
const { brand } = useAppConfig()
// What the page may offer of the online composer (data/composer.ts): the composer itself, or the showcase links (the
// static menu while the shop is off, else the concept) and, while the composer is coming soon, no price at all.
const { composerOpen, composerOnly, composerLink, composerComingSoon, pricesShown, showcaseLink } =
  useComposerAccess()

const { config: restaurantConfig } = await useOrderingAvailability({ lazy: true })
const preparationMinutes = computed(
  () => restaurantConfig.value?.restaurantConfig?.preparationMinutes ?? null,
)

// The online price rule ("En ligne : 2,50 € + vos ingrédients"), read from the composer product's own price: only
// asked for while the composer is open, and never in the server render's way.
const { data: composerData } = await useGqlQuery<{
  productCategories: { slug: string; products: { slug: string; price: string }[] }[]
}>(
  /* GraphQL */ `
    query HomeComposerPrice {
      productCategories {
        slug
        products {
          slug
          price
        }
      }
    }
  `,
  {},
  { immediate: composerOpen, lazy: true, server: false, cache: true },
)
const onlinePrice = computed(() => {
  if (!composerOpen) return null
  const composer = composerData.value?.productCategories.find(
    (category) => category.slug === COMPOSER_CATEGORY_SLUG,
  )?.products[0]
  if (!composer) return null
  return toCents(composer.price) > 0
    ? t('composer.onlinePrice', { base: formatPrice(composer.price) })
    : t('composer.onlinePriceNoBase')
})
const counterPrice = computed(() =>
  t('mkt.estimator.rate', { price: formatCents(COUNTER_PRICE_PER_100G_CENTS) }),
)

/** "Composer ce bol" opens the composer on that recipe; with the composer not open the poster leads to the showcase. */
const recipeLink = (key: string): string =>
  composerOpen ? `/menu?compose&recipe=${key}` : showcaseLink

// The page's description names the counter's price: another one while the composer is coming soon.
const homeDescription = pricesShown ? t('mkt.seo.home_desc') : t('mkt.comingSoon.home_desc')

// Motion of the old site (client only, none under reduced motion): hero bowl pop-in and scroll parallax, magnetic CTA.
// The bowl's levitation is the CSS animation below.
const hero = ref<HTMLElement | null>(null)
const heroContent = ref<HTMLElement | null>(null)
const heroBowl = ref<HTMLElement | null>(null)
const heroBowlPop = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
useHeroMotion({ hero, bowl: heroBowl, bowlPop: heroBowlPop, content: heroContent })
useMagnetic(heroCta)

useSeoMeta({
  title: t('mkt.seo.home_title'),
  ogType: 'website',
  ogTitle: t('mkt.seo.home_title'),
  description: homeDescription,
  ogDescription: homeDescription,
  ...useLocaleSeoMeta(),
})
</script>

<template>
  <div>
    <!-- ── 1 · Hero: status, levitating bowl, price, two actions (motion: useHeroMotion, as on the old site) ── -->
    <section ref="hero" class="hero relative overflow-hidden">
      <div
        class="max-w-6xl mx-auto px-6 pt-5 pb-10 sm:pt-10 lg:py-20 grid gap-6 lg:gap-10 lg:grid-cols-2 lg:items-center"
      >
        <!-- Phone: the live status sits above the bowl (desktop: in the info row under the actions) -->
        <div class="lg:hidden flex justify-center">
          <MktOpenStatus />
        </div>

        <div
          ref="heroContent"
          class="relative z-[2] text-center lg:text-left order-2 lg:order-none"
        >
          <!-- One line always: the short eyebrow on a phone, the full tagline from 640px -->
          <span class="section-label section-label-rule whitespace-nowrap">
            <span class="sm:hidden">{{ $t('mkt.hero.eyebrowShort') }}</span>
            <span class="hidden sm:inline">{{ $t('home.heroTagline') }}</span>
          </span>
          <h1
            class="font-display font-black font-stretch-expanded text-[2.75rem] sm:text-6xl lg:text-7xl text-ygf-black leading-[0.95] tracking-tight text-balance"
          >
            {{ $t('mkt.hero.slogan') }}
          </h1>
          <p
            class="mt-5 text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 text-pretty"
          >
            {{ $t('mkt.hero.subtitle') }}
          </p>

          <!-- The price: online base + ingredients while the composer is open, and the counter's rule, labelled as such.
               While the composer is coming soon, no price at all: only that it is coming. -->
          <p
            v-if="pricesShown"
            class="mt-4 flex flex-wrap items-baseline justify-center lg:justify-start gap-x-2 gap-y-1 text-sm text-ygf-gray-600"
            data-testid="hero-price"
          >
            <template v-if="onlinePrice">
              <strong class="text-[1.0625rem] text-ygf-black">{{ onlinePrice }}</strong>
              <span>{{ $t('mkt.hero.counterPrice', { price: counterPrice }) }}</span>
            </template>
            <template v-else>
              <strong class="text-[1.0625rem] text-ygf-black">{{ counterPrice }}</strong>
              <span>{{ $t('mkt.hero.payWhatYouWeigh') }}</span>
            </template>
          </p>
          <p
            v-else
            class="mt-4 flex items-center justify-center lg:justify-start gap-1.5 text-sm font-semibold text-ygf-orange-text"
            data-testid="hero-coming-soon"
          >
            <MktIcon name="clock" :size="16" />
            {{ $t('composer.orderingSoon') }}
          </p>

          <div
            class="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start sm:gap-3"
          >
            <!-- Magnetic on desktop: drifts toward the pointer (useMagnetic). -->
            <span ref="heroCta" class="inline-flex">
              <NuxtLinkLocale
                v-if="composerOpen"
                :to="composerLink"
                data-testid="hero-order"
                class="btn btn-primary w-full"
              >
                {{ $t('composer.open') }}
                <MktIcon name="arrow-right" :size="18" />
              </NuxtLinkLocale>
              <NuxtLinkLocale
                v-else
                :to="showcaseLink"
                data-testid="hero-menu"
                class="btn btn-primary w-full"
              >
                {{ showcaseLink === '/menu' ? $t('mkt.hero.cta') : $t('mkt.hero.ctaConcept') }}
              </NuxtLinkLocale>
            </span>
            <NuxtLinkLocale
              v-if="composerOpen && !composerOnly"
              to="/menu"
              class="btn btn-secondary"
              data-testid="hero-see-menu"
            >
              {{ $t('mkt.hero.seeMenu') }}
            </NuxtLinkLocale>
            <a
              v-else
              :href="brand.mapsUrl"
              target="_blank"
              rel="noopener"
              class="btn btn-secondary"
              data-testid="hero-directions"
            >
              <MktIcon name="map-pin" :size="18" />
              {{ $t('mkt.actionBar.directions') }}
            </a>
          </div>

          <!-- Desktop: status, address, price at a glance -->
          <div
            class="hidden lg:flex mt-8 flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ygf-gray-600"
          >
            <MktOpenStatus />
            <span class="inline-flex items-center gap-1.5">
              <span class="text-ygf-orange-text"><MktIcon name="map-pin-fill" :size="16" /></span>
              {{ brand.address.street }}, {{ brand.address.city }}
            </span>
          </div>
        </div>

        <!-- Three layers: scroll parallax (outer), pop-in (middle), levitation of the image (.hero-bowl-float). -->
        <div ref="heroBowl" class="relative z-[1] flex justify-center order-1 lg:order-none">
          <div ref="heroBowlPop" class="relative">
            <!-- Rising steam -->
            <div aria-hidden="true">
              <span class="steam-wisp" style="left: 42%; animation-delay: 0s" />
              <span class="steam-wisp" style="left: 50%; animation-delay: 1.1s" />
              <span class="steam-wisp" style="left: 58%; animation-delay: 2.2s" />
            </div>
            <!-- The width is on the <picture> (a flex item: a percentage width on the image alone resolved to 0 until
                 the file arrived and the hero jumped). `sizes` is what that box really measures. -->
            <div class="hero-bowl-float">
              <MktPicture
                src="/images/hero/bowl-creative"
                :widths="[640, 1000, 1400]"
                :fallback-width="1000"
                :fallback-height="1299"
                :alt="$t('mkt.hero.bowl_alt')"
                sizes="(min-width: 1024px) min(38vw, 532px), (min-width: 640px) min(66vw, 300px), min(56vw, 230px)"
                eager
                class="block w-[56vw] max-w-[230px] sm:w-[66vw] sm:max-w-[300px] lg:w-[38vw] lg:max-w-xl"
                img-class="w-full drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 2 · How it works: before choosing a broth, a newcomer needs the counter explained (Sur place / En ligne) ── -->
    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
        <div v-reveal class="mb-6 sm:mb-10 sm:text-center">
          <h2 class="section-title text-3xl sm:text-4xl">
            {{ $t('mkt.home.steps.title') }}
          </h2>
          <p class="mt-2 text-gray-600">{{ $t('mkt.home.steps.subtitle') }}</p>
        </div>
        <MktSteps
          key-prefix="mkt.home.steps"
          :switchable="composerOpen"
          :preparation-minutes="preparationMinutes"
        />
      </div>
    </section>

    <!-- ── 3 · Signature broths: the bowls are the tabs; the broth story is on Concept ── -->
    <section class="bg-ygf-cream">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
        <div v-reveal class="text-center mb-8 sm:mb-10">
          <span class="section-label">{{ $t('mkt.broths.label') }}</span>
          <h2 class="section-title text-3xl sm:text-4xl">
            {{ $t('mkt.broths.title') }}
          </h2>
          <p class="mt-3 text-gray-600 max-w-2xl mx-auto">{{ $t('mkt.broths.subtitle') }}</p>
        </div>
        <MktBrothSelector />
      </div>
    </section>

    <!-- ── 4 · The illustrated recipes: a bowl in one tap, then yours to change ── -->
    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
        <div v-reveal class="mb-6 sm:mb-10 max-w-2xl">
          <span class="section-label section-label-rule">{{ $t('mkt.recipes.label') }}</span>
          <h2 class="section-title text-3xl sm:text-4xl">{{ $t('mkt.recipes.title') }}</h2>
          <p class="mt-3 text-gray-600">{{ $t('mkt.recipes.subtitle') }}</p>
        </div>
        <!-- A swipe row on a phone, a grid from 640px -->
        <ul
          class="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 no-scrollbar swipe-row -mx-4 px-4 pb-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible"
          data-testid="home-recipes"
        >
          <li
            v-for="(recipe, i) in SHOWN_RECIPES"
            :key="recipe.key"
            v-reveal="i + 1"
            class="shrink-0 basis-[17.5rem] snap-start sm:basis-auto card flex flex-col"
          >
            <MktPicture
              :src="recipe.image"
              :widths="RECIPE_IMAGE.widths"
              :fallback-width="RECIPE_IMAGE.fallbackWidth"
              :fallback-height="RECIPE_IMAGE.fallbackHeight"
              :alt="$t(`mkt.recipes.items.${recipe.key}.alt`)"
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 280px"
              img-class="w-full aspect-[640/452] object-cover"
            />
            <div class="p-4 sm:p-5 flex flex-col gap-1.5 flex-1">
              <h3 class="text-lg leading-tight">
                {{ $t(`mkt.recipes.items.${recipe.key}.name`) }}
              </h3>
              <p class="text-sm text-gray-600 leading-relaxed">
                {{ $t(`mkt.recipes.items.${recipe.key}.desc`) }}
              </p>
              <!-- No button while the composer is coming soon: the poster is the recipe, there is nothing to open yet -->
              <NuxtLinkLocale
                v-if="!composerComingSoon"
                :to="recipeLink(recipe.key)"
                class="btn btn-secondary btn-sm mt-3 self-start"
                :data-testid="`home-recipe-${recipe.key}`"
              >
                {{ composerOpen ? $t('mkt.recipes.cta') : $t('mkt.hero.seeMenu') }}
                <MktIcon name="arrow-right" :size="16" />
              </NuxtLinkLocale>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── 5 · Everything that goes in the bowl: the illustrated ingredients of the counter ── -->
    <section class="bg-ygf-cream">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div v-reveal class="text-center mb-8">
          <span class="section-label">{{ $t('mkt.home.ingredients.label') }}</span>
          <h2 class="section-title text-3xl sm:text-4xl">
            {{ $t('mkt.home.ingredients.title') }}
          </h2>
          <p class="mt-3 text-gray-600 max-w-2xl mx-auto">
            {{ $t('mkt.home.ingredients.subtitle') }}
          </p>
        </div>
        <!-- Two rows that scroll sideways on a phone, a grid from 640px -->
        <ul
          class="grid grid-flow-col grid-rows-2 auto-cols-[6.5rem] gap-2.5 overflow-x-auto no-scrollbar swipe-row -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:grid-flow-row sm:[grid-template-rows:none] sm:[grid-auto-columns:auto] sm:grid-cols-4 lg:grid-cols-6 sm:gap-3 sm:overflow-visible"
          data-testid="home-ingredients"
        >
          <li
            v-for="ingredient in INGREDIENTS"
            :key="ingredient.key"
            class="flex flex-col items-center gap-2 bg-white rounded-ygf-card border border-ygf-border px-2 py-4 text-center"
          >
            <span class="food-icon" aria-hidden="true">
              <img
                :src="ingredientIconSrc(ingredient)"
                alt=""
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span
              class="text-[13px] sm:text-sm font-semibold leading-tight text-ygf-black text-balance"
            >
              {{ $t(`mkt.menu.ingredients.${ingredient.key}`) }}
            </span>
          </li>
        </ul>
        <p v-if="composerOpen || showcaseLink === '/menu'" class="text-center mt-8">
          <NuxtLinkLocale
            :to="composerOpen ? composerLink : showcaseLink"
            class="btn btn-primary"
            data-testid="home-ingredients-cta"
          >
            {{ composerOpen ? $t('composer.open') : $t('mkt.hero.cta') }}
            <MktIcon name="arrow-right" :size="18" />
          </NuxtLinkLocale>
        </p>
      </div>
    </section>

    <!-- ── 6 · How much is my bowl? (the counter's price by weight; none while the composer is coming soon) ── -->
    <section v-if="pricesShown" class="bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
        <MktEstimator />
      </div>
    </section>

    <!-- ── 7 · Cinematic ingredient loop ── -->
    <MktVideoBand />

    <!-- ── 8 · Why Yangguofu, with the brand's figures ── -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
      <p v-reveal class="text-center font-serifzh text-ygf-orange-text mb-2 text-sm sm:text-base">
        {{ $t('mkt.home.stats.slogan') }}
      </p>
      <h2 v-reveal="1" class="text-center section-title text-3xl sm:text-4xl mb-10">
        {{ $t('mkt.home.why.title') }}
      </h2>
      <div class="grid gap-6 sm:grid-cols-3">
        <article
          v-for="(pillar, i) in ['broth', 'fresh', 'custom']"
          :key="pillar"
          v-reveal="i + 1"
          class="bg-white border border-ygf-border rounded-ygf-card shadow-ygf-sm p-6 text-center"
        >
          <div
            class="w-12 h-12 mx-auto mb-3 text-ygf [&>svg]:w-full [&>svg]:h-full"
            aria-hidden="true"
            v-html="[bowlSteamIcon, leafIcon, scalesIcon][i]"
          />
          <h3 class="text-lg text-ygf-black mb-2">
            {{ $t(`mkt.home.why.${pillar}.title`) }}
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            {{ $t(`mkt.home.why.${pillar}.desc`) }}
          </p>
        </article>
      </div>
      <dl class="mt-10 grid grid-cols-3 gap-4 text-center" data-testid="brand-figures">
        <div v-for="figure in BRAND_FIGURES" :key="figure.key" class="flex flex-col">
          <dt class="order-2 text-sm text-gray-600">
            {{ $t(`mkt.about.counters.${figure.key}`) }}
          </dt>
          <dd
            class="font-display font-black font-stretch-semi-expanded text-3xl sm:text-5xl text-ygf-orange-text tabular-nums tracking-tight"
          >
            {{ figure.value }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- ── 9 · Practical info and the map ── -->
    <section class="bg-ygf-cream">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h2 v-reveal class="section-title text-3xl sm:text-4xl mb-6">
          {{ $t('mkt.practical.title') }}
        </h2>
        <MktPracticalInfo />
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: radial-gradient(
    120% 80% at 50% 0%,
    var(--ygf-peach) 0%,
    var(--ygf-orange-bg) 55%,
    #ffe6cf 100%
  );
}

/* Hero bowl levitation, as on the old site: up 10px and back, 2.2s each way (GSAP sine.inOut yoyo). */
@media (prefers-reduced-motion: no-preference) {
  .hero-bowl-float {
    animation: hero-bowl-levitate 2.2s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
  }
}

@keyframes hero-bowl-levitate {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-10px);
  }
}
</style>
