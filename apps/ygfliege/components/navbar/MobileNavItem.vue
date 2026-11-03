<!-- components/navbar/MobileNavItem.vue -->
<template>
  <li class="w-full">
    <!-- A line of the phone menu (the redesign's night overlay): the big Archivo label, its Chinese accent at the end of the
         line, an orange rule under the current page. -->
    <NuxtLinkLocale
      :to="to"
      active-class="is-current"
      class="mobile-nav-link flex min-h-14 items-baseline justify-between gap-4 border-b border-white/10 py-3 text-white transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <span class="mobile-nav-label">{{ label }}</span>
      <span
        v-if="zh && !isChinese"
        lang="zh-Hans"
        translate="no"
        class="shrink-0 text-sm text-white/55"
        aria-hidden="true"
        >{{ zh }}</span
      >
    </NuxtLinkLocale>
  </li>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  to = undefined,
  label = undefined,
  zh = undefined,
} = defineProps<{
  to?: string
  label?: string
  /** The Chinese accent of the line (decorative; left out when the page is already in Chinese). */
  zh?: string
}>()

const { locale } = useI18n()
const isChinese = computed(() => locale.value === 'zh')
</script>

<style scoped>
.mobile-nav-label {
  font-family: var(--ygf-font-display);
  font-stretch: 112%;
  font-weight: 800;
  font-size: 1.75rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.mobile-nav-link.is-current .mobile-nav-label {
  color: var(--ygf-orange-light);
}
</style>
