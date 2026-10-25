import {
  dismissCookieConsent,
  waitForNuxtHydration,
} from '../../../layers/engine/e2e/support/hydration'
import { expect, test } from '../../../layers/engine/e2e/support/test'

// Inter is self-hosted by @nuxt/fonts (downloaded at build time): the browser never talks to Google, and the
// Accent serif for the Chinese calligraphy stays a local subset.
test('fonts are self-hosted: Inter body, no request to Google', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (/googleapis|gstatic/u.test(request.url())) {
      external.push(request.url())
    }
  })

  await page.goto('/fr/menu')
  await waitForNuxtHydration(page)
  await dismissCookieConsent(page)

  const bodyFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(bodyFamily).toMatch(/^"?Inter"?,/u)

  // Every weight of the brand font is declared and loads from this origin.
  const loaded = await page.evaluate(async () => {
    const weights = [400, 500, 600, 700]
    await Promise.all(weights.map((w) => document.fonts.load(`${w} 16px Inter`, 'Menu')))
    return {
      weights: weights.filter((w) => document.fonts.check(`${w} 16px Inter`, 'Menu')),
      sources: [...document.fonts]
        .filter((f) => f.family.replaceAll('"', '') === 'Inter')
        .map((f) => f.status),
    }
  })
  expect(loaded.weights).toEqual([400, 500, 600, 700])
  expect(loaded.sources).toContain('loaded')

  const faceUrls = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule)
      .filter((rule) => rule.style.getPropertyValue('font-family').includes('Inter'))
      .filter((rule) => !rule.style.getPropertyValue('font-family').includes('Fallback'))
      .map((rule) => rule.style.getPropertyValue('src')),
  )
  expect(faceUrls.length).toBeGreaterThan(0)
  for (const src of faceUrls) {
    expect(src).toContain('/_nuxt/fonts/')
    expect(src).not.toMatch(/https?:/u)
  }

  expect(external).toEqual([])
})
