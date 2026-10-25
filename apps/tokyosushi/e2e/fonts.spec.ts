import {
  dismissCookieConsent,
  waitForNuxtHydration,
} from '../../../layers/engine/e2e/support/hydration'
import { expect, test } from '../../../layers/engine/e2e/support/test'

// Montserrat is self-hosted by @nuxt/fonts (downloaded at build time): the browser never talks to Google, and the
// Local Channel display font is left alone.
test('fonts are self-hosted: Montserrat body, Channel headings, no request to Google', async ({
  page,
}) => {
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
  expect(bodyFamily).toMatch(/^"?Montserrat"?,/u)

  // Every weight of the brand font is declared and loads from this origin.
  const loaded = await page.evaluate(async () => {
    const weights = [400, 500, 600, 700]
    await Promise.all(weights.map((w) => document.fonts.load(`${w} 16px Montserrat`, 'Menu')))
    return {
      weights: weights.filter((w) => document.fonts.check(`${w} 16px Montserrat`, 'Menu')),
      channel: await document.fonts.load('16px Channel', 'Menu').then((f) => f.length > 0),
      sources: [...document.fonts]
        .filter((f) => f.family.replaceAll('"', '') === 'Montserrat')
        .map((f) => f.status),
    }
  })
  expect(loaded.weights).toEqual([400, 500, 600, 700])
  expect(loaded.channel).toBe(true)
  expect(loaded.sources).toContain('loaded')

  const faceUrls = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule)
      .filter((rule) => rule.style.getPropertyValue('font-family').includes('Montserrat'))
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
