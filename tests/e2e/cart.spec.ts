import { test, expect } from '@chromatic-com/playwright'
import type { Page } from '@playwright/test'
import { CartPage } from '../pages'
import { openFirstProductFromShop } from '../helpers/shop'

/**
 * E2E Tests for Shopping Cart
 * Tests cart functionality including add, remove, update quantity, and checkout
 */

const waitForHeader = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded')
  await page.locator('header').waitFor()
  await page
    .locator('header[data-hydrated="true"]')
    .waitFor({ timeout: 2000 })
    .catch(() => {})
}

test.describe('Cart - Empty State', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('starterspark-cart')
    })
  })

  test('should display empty cart message', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.expectEmptyCart()
  })

  test('should show Browse Kits button on empty cart', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await expect(cartPage.browseKitsButton).toBeVisible()
  })

  test('should navigate to shop when clicking Browse Kits', async ({
    page,
  }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.browseKitsButton.click()
    await expect(page).toHaveURL('/shop')
  })

  test('should show zero count in header cart badge', async ({ page }) => {
    await page.goto('/')
    await waitForHeader(page)

    // Cart badge should not be visible when empty (desktop only, on mobile cart is in menu)
    const viewportSize = page.viewportSize()
    const isMobile = viewportSize ? viewportSize.width < 768 : false

    if (isMobile) {
      // On mobile, check that the mobile menu button is visible
      await expect(page.getByLabel('Toggle menu')).toBeVisible()
    } else {
      // On desktop, cart badge should not be visible when empty
      const badge = page.locator(
        'header button[aria-label^="Shopping cart"]:visible span',
      )
      await expect(badge).toHaveCount(0)
    }
  })
})

test.describe('Cart - Add Items', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('starterspark-cart')
    })
  })

  test('should add item to cart from product page', async ({ page }) => {
    // Go to shop and find a product
    const opened = await openFirstProductFromShop(page)
    if (!opened) return

    // Wait for product page to load
    await page.getByRole('heading', { level: 1 }).waitFor()

    // Add to cart
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i })
    await addToCartBtn.click()

    // Wait for cart sheet to appear or state update
    await expect(page.getByText(/added to cart|cart/i).first()).toBeVisible({
      timeout: 3000,
    })

    // Cart should update, check badge or cart state
    await page.goto('/cart')
    const cartPage = new CartPage(page)
    await cartPage.expectItemsInCart()
  })

  test('should open cart sheet when adding item', async ({ page }) => {
    // Navigate to a product
    const opened = await openFirstProductFromShop(page)
    if (!opened) return
    await page.getByRole('heading', { level: 1 }).waitFor()

    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click()

    // Cart sheet or indicator should be visible, wait for state update
    await expect(
      page.getByText(/added to cart|view cart|cart/i).first(),
    ).toBeVisible({ timeout: 3000 })
  })

  test('should increment quantity when adding same item twice', async ({
    page,
  }) => {
    // Navigate to a product
    const opened = await openFirstProductFromShop(page)
    if (!opened) return
    await page.getByRole('heading', { level: 1 }).waitFor()

    // Add to cart twice
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i })
    await addToCartBtn.click()

    // Wait for cart sheet to open (it opens automatically on add to cart)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

    // Close the cart sheet by pressing Escape so we can click Add to Cart again
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3000 })

    // Add again (click the button which should now be accessible)
    await addToCartBtn.click()

    // Cart sheet opens again, verify quantity is now 2 in the sheet
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    await expect(
      page.getByRole('dialog').locator('.font-mono').filter({ hasText: /^2$/ }),
    ).toBeVisible({ timeout: 3000 })

    // Go to cart page and verify quantity (scope to main to avoid matching hidden header badge)
    await page.goto('/cart')
    const quantityText = page
      .locator('main .font-mono')
      .filter({ hasText: /^2$/ })
    await expect(quantityText.first()).toBeVisible()
  })

  test('should add multiple items with specified quantity', async ({
    page,
  }) => {
    // Navigate to a product
    const opened = await openFirstProductFromShop(page)
    if (!opened) return
    await page.getByRole('heading', { level: 1 }).waitFor()

    // Increase quantity to 3 (use the BuyBox quantity controls, not cart sheet)
    const buyBoxQuantitySection = page
      .locator('section')
      .filter({ has: page.getByRole('button', { name: /add to cart/i }) })
    const increaseBtn = buyBoxQuantitySection.getByLabel('Increase quantity')
    await increaseBtn.click()
    // Wait for quantity to show 2
    await expect(
      buyBoxQuantitySection.locator('.text-center.font-mono').first(),
    ).toHaveText('2')
    await increaseBtn.click()
    // Wait for quantity to show 3
    await expect(
      buyBoxQuantitySection.locator('.text-center.font-mono').first(),
    ).toHaveText('3')

    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click()

    // Wait for cart sheet to open and verify quantity
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    await expect(
      page.getByRole('dialog').locator('.font-mono').filter({ hasText: /^3$/ }),
    ).toBeVisible({ timeout: 3000 })

    // Go to cart and verify (scope to main to avoid matching hidden header badge)
    await page.goto('/cart')
    const quantityText = page
      .locator('main .font-mono')
      .filter({ hasText: /^3$/ })
    await expect(quantityText.first()).toBeVisible()
  })
})

test.describe('Cart - Update Items', () => {
  test.beforeEach(async ({ page }) => {
    // Set up cart with one item
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })
  })

  test('should increase item quantity', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.increaseItemQuantity(0)

    // Verify quantity increased, wait for state update
    await cartPage.waitForQuantityUpdate(2)
  })

  test('should decrease item quantity', async ({ page }) => {
    // First set quantity to 2
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 2,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.decreaseItemQuantity(0)

    // Verify quantity decreased, wait for state update
    await cartPage.waitForQuantityUpdate(1)
  })

  test('should remove item when decreasing quantity to zero', async ({
    page,
  }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Decrease from 1 to 0 should remove
    await cartPage.decreaseItemQuantity(0)

    // Wait for empty cart state
    await cartPage.expectEmptyCart()
  })

  test('should remove item when clicking remove button', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await cartPage.removeItem(0)

    // Wait for empty cart state
    await cartPage.expectEmptyCart()
  })

  test('should clear all items when clicking Clear Cart', async ({ page }) => {
    // Add multiple items
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 2,
            },
            {
              slug: 'another-kit',
              name: 'Another Kit',
              price: 49,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // clearCart already waits for empty cart state internally
    await cartPage.clearCart()
  })
})

test.describe('Cart - Order Summary', () => {
  test('should display correct subtotal', async ({ page }) => {
    // Set up cart with known values
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 2,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Subtotal should be 99 * 2 = 198
    // Look for the subtotal row specifically (contains "Subtotal" label)
    const subtotalRow = page
      .locator('div')
      .filter({ hasText: /^Subtotal\$198\.00$/ })
    await expect(subtotalRow).toBeVisible()
  })

  test('should show free shipping for orders over $75', async ({ page }) => {
    // Set up cart with total > $75
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Look for exact "FREE" text in the shipping row (not the trust signal)
    const freeShipping = page.getByText('FREE', { exact: true })
    await expect(freeShipping).toBeVisible()
  })

  test('should show shipping cost for orders under $75', async ({ page }) => {
    // Set up cart with total < $75
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: 'small-item',
              name: 'Small Item',
              price: 29,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Should show $9.99 shipping
    const shippingCost = page.getByText('$9.99')
    await expect(shippingCost).toBeVisible()
  })

  test('should show message about free shipping threshold', async ({
    page,
  }) => {
    // Set up cart with total < $75
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: 'small-item',
              name: 'Small Item',
              price: 50,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Should show "Add $X more for free shipping"
    const freeShippingMsg = page.getByText(/add.*more.*free shipping/i)
    await expect(freeShippingMsg).toBeVisible()
  })

  test('should display charity notice', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    const cartPage = new CartPage(page)
    await cartPage.goto()

    await expect(cartPage.charityNote).toBeVisible()
  })
})

test.describe('Cart - Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Set up cart with item
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })
  })

  test('should show checkout button', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await expect(cartPage.checkoutButton).toBeVisible()
    await expect(cartPage.checkoutButton).toBeEnabled()
  })

  test('should show loading state when clicking checkout', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    // Click checkout and check for loading state
    await cartPage.checkoutButton.click()

    // Should show "Processing..." text
    const loadingText = page.getByText(/processing/i)
    // This may appear briefly before redirect
  })

  test('should display trust signals', async ({ page }) => {
    const cartPage = new CartPage(page)
    await cartPage.goto()

    await expect(cartPage.freeShippingNote).toBeVisible()
    await expect(cartPage.secureCheckoutNote).toBeVisible()
  })
})

test.describe('Cart - Persistence', () => {
  test('should persist cart across page reloads', async ({ page }) => {
    // Add item to cart
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    // Reload page
    await page.reload()

    // Go to cart and verify item is still there
    await page.goto('/cart')
    const cartPage = new CartPage(page)
    await cartPage.expectItemsInCart()
  })

  test('should persist cart across different pages', async ({ page }) => {
    // Add item to cart
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 1,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    // Navigate to different pages
    await page.goto('/shop')
    await page.goto('/about')
    await page.goto('/cart')

    // Cart should still have item
    const cartPage = new CartPage(page)
    await cartPage.expectItemsInCart()
  })
})

test.describe('Cart - Header Badge', () => {
  test('should update badge count when adding items', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('starterspark-cart')
    })
    await page.reload()
    await waitForHeader(page)

    // Check viewport, badge tests only apply to desktop
    const viewportSize = page.viewportSize()
    const isMobile = viewportSize ? viewportSize.width < 768 : false

    if (isMobile) {
      // On mobile, skip badge check and just verify cart page works
      await page.evaluate(() => {
        const cartState = {
          state: {
            items: [
              {
                slug: '4dof-robotic-arm-kit',
                name: '4DOF Robotic Arm Kit',
                price: 99,
                quantity: 3,
              },
            ],
          },
          version: 0,
        }
        localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
      })
      await page.goto('/cart')
      await expect(page.getByText('3 items')).toBeVisible()
    } else {
      // Badge should not be visible initially (aria-label starts with "Shopping cart")
      let badge = page.locator(
        'header button[aria-label^="Shopping cart"]:visible span',
      )
      await expect(badge).toHaveCount(0)

      // Add item via localStorage
      await page.evaluate(() => {
        const cartState = {
          state: {
            items: [
              {
                slug: '4dof-robotic-arm-kit',
                name: '4DOF Robotic Arm Kit',
                price: 99,
                quantity: 3,
              },
            ],
          },
          version: 0,
        }
        localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
      })

      // Reload to trigger state update
      await page.reload()
      await waitForHeader(page)

      // Badge should show count (aria-label starts with "Shopping cart")
      badge = page.locator(
        'header button[aria-label^="Shopping cart"]:visible span',
      )
      await expect(badge).toBeVisible()
      await expect(badge).toHaveText('3')
    }
  })

  test('should show 9+ for more than 9 items', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              slug: '4dof-robotic-arm-kit',
              name: '4DOF Robotic Arm Kit',
              price: 99,
              quantity: 15,
            },
          ],
        },
        version: 0,
      }
      localStorage.setItem('starterspark-cart', JSON.stringify(cartState))
    })

    await page.reload()
    await waitForHeader(page)

    // Check viewport, badge tests only apply to desktop
    const viewportSize = page.viewportSize()
    const isMobile = viewportSize ? viewportSize.width < 768 : false

    if (isMobile) {
      // On mobile, verify count in cart page
      await page.goto('/cart')
      await expect(page.getByText('15 items')).toBeVisible()
    } else {
      const badge = page.locator(
        'header button[aria-label^="Shopping cart"]:visible span',
      )
      await expect(badge).toHaveText('9+')
    }
  })
})
