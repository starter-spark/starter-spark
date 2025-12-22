import { Page, Locator, expect } from "@playwright/test"

/**
 * Page Object Model for the Product Detail Page
 */
export class ProductPage {
  readonly page: Page

  // Product info
  readonly productTitle: Locator
  readonly productPrice: Locator
  readonly stockBadge: Locator
  readonly productDescription: Locator

  // Buy box elements
  readonly buyBox: Locator
  readonly quantityDisplay: Locator
  readonly decreaseQuantityBtn: Locator
  readonly increaseQuantityBtn: Locator
  readonly addToCartBtn: Locator

  // Trust signals
  readonly freeShippingNote: Locator
  readonly returnsNote: Locator
  readonly secureCheckoutNote: Locator
  readonly charityNote: Locator

  // Product tabs
  readonly descriptionTab: Locator
  readonly learningTab: Locator
  readonly includedTab: Locator
  readonly specsTab: Locator

  // Gallery
  readonly productGallery: Locator

  constructor(page: Page) {
    this.page = page

    // Product info
    this.productTitle = page.getByRole("heading", { level: 1 })
    this.productPrice = page.locator("text=/\\$\\d+/").first()
    this.stockBadge = page.getByText(/in stock|pre-order/i)
    this.productDescription = page.locator('[class*="text-slate-600"]').first()

    // Buy box
    this.buyBox = page.locator('[class*="sticky"]').first()
    this.quantityDisplay = page.locator("text=/^\\d+$/").first()
    this.decreaseQuantityBtn = page.getByLabel("Decrease quantity")
    this.increaseQuantityBtn = page.getByLabel("Increase quantity")
    this.addToCartBtn = page.getByRole("button", { name: /add to cart/i })

    // Trust signals
    this.freeShippingNote = page.getByText(/free shipping/i)
    this.returnsNote = page.getByText(/30-day returns/i)
    this.secureCheckoutNote = page.getByText(/secure checkout/i)
    this.charityNote = page.getByTestId("product-charity")

    // Tabs
    this.descriptionTab = page.getByRole("tab", { name: /description/i })
    this.learningTab = page.getByRole("tab", { name: /learning/i })
    this.includedTab = page.getByRole("tab", { name: /included/i })
    this.specsTab = page.getByRole("tab", { name: /specs/i })

    // Gallery
    this.productGallery = page.locator('[class*="gallery"], canvas').first()
  }

  async goto(slug: string) {
    await this.page.goto(`/shop/${slug}`)
    await this.page
      .locator('header[data-hydrated="true"]')
      .waitFor({ timeout: 5000 })
      .catch(() => {})
  }

  async expectPageLoaded() {
    await expect(this.productTitle).toBeVisible()
    await expect(this.addToCartBtn).toBeVisible()
  }

  async getQuantity(): Promise<number> {
    const text = await this.page.locator(".text-center.font-mono").first().textContent()
    return parseInt(text || "1", 10)
  }

  async setQuantity(quantity: number) {
    const current = await this.getQuantity()
    if (quantity > current) {
      for (let i = current; i < quantity; i++) {
        await this.increaseQuantityBtn.click()
      }
    } else if (quantity < current) {
      for (let i = current; i > quantity; i--) {
        await this.decreaseQuantityBtn.click()
      }
    }
  }

  async addToCart(quantity: number = 1) {
    await this.setQuantity(quantity)
    await this.addToCartBtn.click()
    // Wait for cart dialog to open
    await this.page.getByRole("dialog").waitFor({ state: "visible", timeout: 3000 })
  }

  async expectAddToCartEnabled() {
    await expect(this.addToCartBtn).toBeEnabled()
  }

  async expectTrustSignalsVisible() {
    await expect(this.freeShippingNote).toBeVisible()
    await expect(this.returnsNote).toBeVisible()
    await expect(this.secureCheckoutNote).toBeVisible()
    await expect(this.charityNote).toBeVisible()
  }

  async clickTab(tabName: "description" | "learning" | "included" | "specs") {
    const tabs = {
      description: this.descriptionTab,
      learning: this.learningTab,
      included: this.includedTab,
      specs: this.specsTab,
    }
    await tabs[tabName].click()
  }
}
