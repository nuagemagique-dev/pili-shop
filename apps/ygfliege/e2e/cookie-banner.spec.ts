import { expect, test } from '../../../layers/engine/e2e/support/test'

/*
 * The cookie banner of the Google Ads tag (brand.googleAdsId): asked on a first visit, the answer kept across visits, the
 * footer link to change it, and gtag.js requested only after Accept. The other specs start with a stored refusal
 * (seedCookieChoice in support/test.ts); these start like a first-time visitor.
 */
test.use({ seedCookieChoice: false })

const GTAG = /googletagmanager\.com\/gtag\/js\?id=AW-18511262555/u

test('a first visit asks; a refusal is kept and loads nothing from Google', async ({ page }) => {
  const google: string[] = []
  page.on('request', (request) => {
    if (GTAG.test(request.url())) google.push(request.url())
  })

  await page.goto('/fr')
  const banner = page.getByTestId('cookie-banner')
  await expect(banner).toBeVisible()
  await expect(banner.getByRole('heading', { name: 'Cookies' })).toBeVisible()
  await expect(banner.getByRole('link', { name: 'En savoir plus' })).toHaveAttribute(
    'href',
    '/fr/privacy',
  )

  await banner.getByRole('button', { name: 'Refuser' }).click()
  await expect(banner).toBeHidden()

  await page.reload()
  await page.waitForFunction(() => '__vue_app__' in (document.getElementById('__nuxt') ?? {}))
  await expect(page.getByTestId('cookie-banner')).toBeHidden()
  expect(google).toEqual([])
})

test('Accept requests the Google Ads tag; the footer link reopens the choice', async ({ page }) => {
  await page.goto('/fr')
  const gtag = page.waitForRequest(GTAG)
  await page.getByTestId('cookie-banner').getByRole('button', { name: 'Accepter' }).click()
  await gtag
  await expect(page.getByTestId('cookie-banner')).toBeHidden()

  await page.getByTestId('footer-manage-cookies').click()
  const banner = page.getByTestId('cookie-banner')
  await expect(banner).toBeVisible()
  await expect(banner).toBeFocused()
  await banner.getByRole('button', { name: 'Refuser' }).click()
  await expect(banner).toBeHidden()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent') ?? '{}').choice),
  ).toBe('denied')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('the banner sits above the action bar, never over it', async ({ page }) => {
    await page.goto('/fr')
    await page.mouse.wheel(0, 1500)
    const actionBar = page.getByTestId('action-bar')
    await expect(actionBar).toBeVisible()
    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()
    // The bar publishes its height after it appears: give the banner's position a moment to follow.
    await expect
      .poll(async () => {
        const bannerBox = await banner.boundingBox()
        const barBox = await actionBar.boundingBox()
        return bannerBox && barBox ? bannerBox.y + bannerBox.height <= barBox.y : false
      })
      .toBe(true)
  })
})
