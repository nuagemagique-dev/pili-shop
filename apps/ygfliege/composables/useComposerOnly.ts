import { useRuntimeConfig } from '#imports'
import { composerLink, isComposerOnlyValue } from '~/data/composer'

/**
 * Whether the shop sells only the build-your-own bowls (`NUXT_PUBLIC_COMPOSER_ONLY`, on by default, see
 * data/composer.ts). Fixed for the life of the process, so plain values rather than refs.
 */
export const useComposerOnly = (): { composerOnly: boolean; composerLink: string } => {
  const composerOnly = isComposerOnlyValue(useRuntimeConfig().public.composerOnly)
  return { composerOnly, composerLink: composerLink(composerOnly) }
}
