<template>
  <ComposerComingSoon v-if="composerComingSoon" />
  <ShopMenu v-else-if="shopEnabled" />
  <StaticMenu v-else />
</template>

<script setup lang="ts">
/*
 * /menu: the dynamic, orderable menu while the shop is on; while it is switched off (NUXT_PUBLIC_SHOP_ENABLED=false,
 * utils/shopGate.ts) the brand keeps this route up (staticMenuWhenShopClosed) and shows the static menu of the old
 * ygfliege.be instead: broths, ingredients and the price by weight, nothing to order. While the composer is announced
 * but not open yet (NUXT_PUBLIC_COMPOSER_COMING_SOON, data/composer.ts) the route shows the "coming soon" page,
 * whatever the shop flag says.
 */
import { defineAsyncComponent } from 'vue'
import { useShopEnabled } from '#engine/composables/useShopEnabled'
import { useComposerAccess } from '~/composables/useComposerAccess'

definePageMeta({
  sitemap: { priority: 0.9, changefreq: 'weekly' },
  // With the shop on, the layout leaves the restaurant config to the dynamic menu on the server (see layouts/default.vue).
  loadsRestaurantConfig: true,
})

// Only the variant in use is loaded: a closed shop never ships the dynamic menu's code, and the reverse.
const ShopMenu = defineAsyncComponent(() => import('~/components/menu/ShopMenu.vue'))
const StaticMenu = defineAsyncComponent(() => import('~/components/menu/StaticMenu.vue'))
const ComposerComingSoon = defineAsyncComponent(
  () => import('~/components/menu/ComposerComingSoon.vue'),
)

const shopEnabled = useShopEnabled()
const { composerComingSoon } = useComposerAccess()
</script>
