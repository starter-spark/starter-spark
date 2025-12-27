import type { Page } from '@playwright/test'

export async function openFirstProductFromShop(page: Page): Promise<boolean> {
  await page.goto('/shop', { waitUntil: 'domcontentloaded' })

  // Wait for either products to load or empty state
  const productLinks = page.locator('main a[href^="/shop/"]')
  const emptyState = page.getByText(/no products/i)

  // Wait up to 15s for content to appear
  try {
    await Promise.race([
      productLinks.first().waitFor({ state: 'visible', timeout: 15000 }),
      emptyState.waitFor({ state: 'visible', timeout: 15000 }),
    ])
  } catch {
    // Timeout, check what we have
  }

  const count = await productLinks.count()
  if (count === 0) {
    return false
  }

  const firstLink = productLinks.first()
  await firstLink.waitFor({ state: 'visible', timeout: 10000 })
  const href = await firstLink.getAttribute('href')
  if (!href) return false

  await page.goto(href, { waitUntil: 'domcontentloaded' })

  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15000 })
  await page.waitForSelector('[aria-label*="ncrease"], [aria-label*="ecrease"]', {
    state: 'visible',
    timeout: 30000,
  })

  return true
}
