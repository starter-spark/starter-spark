import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for the Cart Page
 */
export class CartPage {
  readonly page: Page

  // Page elements
  readonly pageTitle: Locator
  readonly continueShoppingLink: Locator
  readonly emptyCartMessage: Locator
  readonly browseKitsButton: Locator

  // Cart items section
  readonly itemCount: Locator
  readonly clearCartButton: Locator
  readonly cartItems: Locator

  // Order summary
  readonly orderSummary: Locator
  readonly subtotal: Locator
  readonly shipping: Locator
  readonly total: Locator
  readonly checkoutButton: Locator

  // Trust signals
  readonly freeShippingNote: Locator
  readonly secureCheckoutNote: Locator
  readonly charityNote: Locator

  constructor(page: Page) {
    this.page = page

    // Page
    this.pageTitle = page.getByRole('heading', { name: /your cart/i })
    this.continueShoppingLink = page.getByRole('link', {
      name: /continue shopping/i,
    })
    this.emptyCartMessage = page.getByText(/your cart is empty/i)
    this.browseKitsButton = page.getByRole('link', { name: /browse kits/i })

    // Cart items, use text matching for clear cart button
    this.itemCount = page.locator('text=/\\d+ items?/')
    this.clearCartButton = page.getByText('Clear Cart')
    this.cartItems = page.locator('[class*="divide-y"] > div')

    // Order summary
    this.orderSummary = page.getByRole('heading', { name: /order summary/i })
    this.subtotal = page.getByText(/subtotal/i)
    this.shipping = page.getByText(/shipping/i).first()
    this.total = page.locator('text=/^Total$/i')
    this.checkoutButton = page.getByRole('button', { name: /checkout/i })

    // Trust signals
    this.freeShippingNote = page.getByText(/free shipping on orders/i)
    this.secureCheckoutNote = page.getByText(/secure checkout with stripe/i)
    this.charityNote = page.getByTestId('cart-charity')
  }

  async goto() {
    await this.page.goto('/cart')
    // Wait for Zustand hydration, loading state shows "Loading cart..."
    // Wait for h1 to appear first
    await this.page.waitForFunction(() => {
      return document.querySelector('h1')?.textContent?.includes('Cart')
    })
    // Then wait for loading state to finish (either empty cart or items visible)
    await this.page.waitForFunction(
      () => {
        const hasLoading =
          document.body.textContent?.includes('Loading cart...')
        return !hasLoading
      },
      { timeout: 10000 },
    )
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async expectEmptyCart() {
    await expect(this.emptyCartMessage).toBeVisible()
    await expect(this.browseKitsButton).toBeVisible()
  }

  async expectItemsInCart() {
    await expect(this.orderSummary).toBeVisible()
    await expect(this.checkoutButton).toBeVisible()
  }

  async getCartItemCount(): Promise<number> {
    const countText = await this.itemCount.textContent()
    const match = countText?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  async clearCart() {
    if (await this.clearCartButton.isVisible()) {
      await this.clearCartButton.click()
      // Wait for state update
      await expect(this.emptyCartMessage).toBeVisible({ timeout: 5000 })
    }
  }

  async removeItem(index: number = 0) {
    const item = this.cartItems.nth(index)
    await item
      .getByLabel(/remove item/i)
      .first()
      .click()
  }

  async increaseItemQuantity(index: number = 0) {
    const item = this.cartItems.nth(index)
    await item.getByLabel('Increase quantity').click()
  }

  async decreaseItemQuantity(index: number = 0) {
    const item = this.cartItems.nth(index)
    const decreaseButton = item.getByLabel('Decrease quantity')
    if (await decreaseButton.count()) {
      await decreaseButton.click()
      return
    }

    // When quantity is 1, the decrement control becomes a remove button.
    await item
      .getByLabel(/remove item/i)
      .first()
      .click()
  }

  async getSubtotal(): Promise<number> {
    const subtotalRow = this.page
      .locator('text=Subtotal')
      .locator('..')
      .locator('span')
      .last()
    const text = await subtotalRow.textContent()
    return parseFloat(text?.replace('$', '') || '0')
  }

  async getTotal(): Promise<number> {
    const totalElement = this.page.locator('text=/^\\$\\d+\\.\\d{2}$/').last()
    const text = await totalElement.textContent()
    return parseFloat(text?.replace('$', '') || '0')
  }

  async isFreeShipping(): Promise<boolean> {
    const shippingText = this.page.getByText('FREE')
    return await shippingText.isVisible()
  }

  async proceedToCheckout() {
    await this.checkoutButton.click()
    // Should redirect to Stripe, so we wait for navigation
    await this.page.waitForURL(/stripe\.com|checkout/, { timeout: 10000 })
  }

  async clickContinueShopping() {
    await this.continueShoppingLink.click()
    await expect(this.page).toHaveURL('/shop')
  }

  /**
   * Wait for quantity to update after clicking increase/decrease
   * Scoped to main to avoid matching hidden header badge on mobile
   */
  async waitForQuantityUpdate(expectedQuantity: number) {
    await expect(
      this.page
        .locator('main .font-mono')
        .filter({ hasText: new RegExp(`^${expectedQuantity}$`) })
        .first(),
    ).toBeVisible({ timeout: 5000 })
  }
}
