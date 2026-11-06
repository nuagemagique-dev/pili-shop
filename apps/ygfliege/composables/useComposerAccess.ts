import { useAppConfig, useRuntimeConfig } from '#imports'
import {
  type ComposerAccess,
  composerAccess,
  isComposerComingSoonValue,
  isComposerOnlyValue,
} from '~/data/composer'
import { useShopEnabled } from '#engine/composables/useShopEnabled'

/**
 * What the pages may offer of the online composer (data/composer.ts): the shop flag, `NUXT_PUBLIC_COMPOSER_ONLY` and
 * `NUXT_PUBLIC_COMPOSER_COMING_SOON` are read at container start and fixed for the life of the process, so plain
 * values rather than refs.
 */
export const useComposerAccess = (): ComposerAccess => {
  const { composerOnly, composerComingSoon } = useRuntimeConfig().public
  return composerAccess({
    shopEnabled: useShopEnabled(),
    composerOnly: isComposerOnlyValue(composerOnly),
    composerComingSoon: isComposerComingSoonValue(composerComingSoon),
    staticMenuWhenShopClosed: useAppConfig().brand.staticMenuWhenShopClosed,
  })
}
