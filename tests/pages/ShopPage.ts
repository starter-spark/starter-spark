import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for the Shop Page
 */
export class ShopPage {
  readonly page: Page

  // Page elements
  readonly pageTitle: Locator
  readonly productGrid: Locator
  readonly productCards: Locator
  readonly educatorCTA: Locator
  readonly footer: Locator

  constructor(page: Page) {
    this.page = page

    this.pageTitle = page.getByRole('heading', { level: 1 }).first()
    this.productGrid = page.locator('[class*="grid"]').first()
    this.productCards = page
      .locator('[class*="border"][class*="rounded"]')
      .filter({
        has: page.locator('[class*="font-mono"]'),
      })
    this.educatorCTA = page.getByRole('heading', {
      name: /educator or school/i,
    })
    this.footer = page.getByRole('contentinfo')
  }

  async goto() {
    await this.page.goto('/shop', { waitUntil: 'domcontentloaded' })
    await this.page
      .locator('header[data-hydrated="true"]')
      .waitFor({ timeout: 5000 })
      .catch(() => {})
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async getProductCount(): Promise<number> {
    // Find elements that look like product cards (have price and name)
    const cards = this.page.locator('main a[href^="/shop/"]')
    return await cards.count()
  }

  async clickProduct(slug: string) {
    await this.page
      .getByRole('link', { name: new RegExp(slug, 'i') })
      .first()
      .click()
    await expect(this.page).toHaveURL(new RegExp(`/shop/${slug}(\\?.*)?$`))
  }

  async clickFirstProduct(): Promise<boolean> {
    const products = this.page.locator('main a[href^="/shop/"]')

    // Wait for at least one product to be visible
    await products.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

    if ((await products.count()) === 0) {
      return false
    }

    // Get the href before clicking to know what URL to expect
    const href = await products.first().getAttribute('href')
    if (!href) {
      return false
    }

    // Click and wait for navigation
    await Promise.all([
      this.page.waitForURL(href, { timeout: 10000 }),
      products.first().click(),
    ])

    return true
  }

  async expectProductsDisplayed() {
    const count = await this.getProductCount()
    expect(count).toBeGreaterThan(0)
  }

  async expectEducatorCTAVisible() {
    await expect(this.educatorCTA).toBeVisible({ timeout: 10000 })
  }
}
