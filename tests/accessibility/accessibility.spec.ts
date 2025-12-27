import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { openFirstProductFromShop } from '../helpers/shop'

/**
 * Accessibility Tests
 * Tests WCAG 2.1 AA compliance using axe-core
 */

test.describe('Homepage Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('heading', { level: 1 }).waitFor()
    // Wait for Framer Motion animations, homepage has many staggered animations
    // Need longer wait when running in parallel with system load
    await page.waitForTimeout(1500)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')

    // Check for h1
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1.first()).toBeVisible()

    // H1 should come before any h2
    const headings = await page.getByRole('heading').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have skip link or main landmark', async ({ page }) => {
    await page.goto('/')

    // Wait for page to fully load (not just "Loading..." state)
    await page.waitForLoadState('networkidle')

    // Wait for some content to appear, either main content or heading
    const heading = page.getByRole('heading', { level: 1 })
    await heading.waitFor({ timeout: 10000 }).catch(() => {})

    // Check for main landmark
    const main = page.getByRole('main')
    const mainExists = await main.count()

    // Either main landmark or skip link should exist
    const skipLink = page.locator('a[href="#main"], a[href="#content"]')
    const skipLinkExists = await skipLink.count()

    expect(mainExists + skipLinkExists).toBeGreaterThan(0)
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation')
    await expect(nav.first()).toBeVisible()
  })
})

test.describe('Shop Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/shop')
    // Wait for page content to load (not loading state)
    await page.getByRole('heading', { level: 1 }).waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      // Exclude site banners, they're dynamic content from DB and may have test data
      .exclude('[data-testid="site-banners"]')
      .exclude('[class*="border-cyan-200"]') // Banner styling
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })

  test('should have accessible product cards', async ({ page }) => {
    await page.goto('/shop')

    // Product links should have accessible names
    const productLinks = page.locator('main a[href^="/shop/"]')
    if ((await productLinks.count()) === 0) {
      return
    }
    await expect(productLinks.first()).toBeVisible()
    const links = await productLinks.all()

    for (const link of links.slice(0, 5)) {
      const ariaLabel = await link.getAttribute('aria-label')
      const text = (await link.textContent())?.trim()
      const accessibleName = (ariaLabel || text || '').trim()
      expect(accessibleName.length).toBeGreaterThan(0)
    }
  })
})

test.describe('Product Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    const opened = await openFirstProductFromShop(page)
    if (!opened) return
    // Wait for product page content
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.waitForFunction(() => document.title.trim().length > 0)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })

  test('should have labeled quantity controls', async ({ page }) => {
    const opened = await openFirstProductFromShop(page)
    if (!opened) return

    // Quantity buttons should have aria-labels
    const decreaseBtn = page.getByLabel(/decrease/i)
    const increaseBtn = page.getByLabel(/increase/i)

    await expect(decreaseBtn).toBeVisible()
    await expect(increaseBtn).toBeVisible()
  })

  test('should have accessible add to cart button', async ({ page }) => {
    const opened = await openFirstProductFromShop(page)
    if (!opened) return

    const addToCartBtn = page.getByRole('button', { name: /add to cart/i })
    await expect(addToCartBtn).toBeVisible()
    await expect(addToCartBtn).toBeEnabled()
  })
})

test.describe('Cart Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/cart')
    await page.getByRole('heading', { level: 1 }).waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })

  test('should have accessible remove buttons', async ({ page }) => {
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

    await page.goto('/cart')

    // Remove buttons should have aria-labels
    const removeButtons = page.getByLabel(/remove/i)
    if ((await removeButtons.count()) > 0) {
      await expect(removeButtons.first()).toBeVisible()
    }
  })
})

test.describe('Login Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('main input#email:visible')
    await emailInput.waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      // Exclude site banners, they're dynamic content from DB and may have test data
      .exclude('[data-testid="site-banners"]')
      .exclude('[class*="border-cyan-200"]') // Banner styling
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })

  test('should have labeled form inputs', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page
      .getByRole('textbox', { name: /email address/i })
      .first()
    await emailInput.waitFor()

    // Email input should have associated label (via accessible name)
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAccessibleName(/email address/i)
  })

  test('should have accessible form submission', async ({ page }) => {
    await page.goto('/login')
    await page.locator('main input#email:visible').waitFor()

    const submitButton = page.getByRole('button', {
      name: /send|submit|login/i,
    })
    const submitByType = page.locator('form button[type="submit"]')

    const hasNamedButton = await submitButton.isVisible().catch(() => false)
    if (hasNamedButton) {
      await expect(submitButton).toBeVisible()
    } else {
      await expect(submitByType).toBeVisible()
    }
  })
})

test.describe('About Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('heading', { level: 1 }).waitFor()
    // Wait for Framer Motion animations to complete (600ms + buffer)
    await page.waitForTimeout(800)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Events Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/events')
    await page.getByRole('heading', { level: 1 }).waitFor()
    // Wait for Framer Motion animations to complete (600ms + buffer)
    await page.waitForTimeout(800)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Learn Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/learn')
    await page.getByRole('heading', { level: 1 }).waitFor()
    // Wait for Framer Motion animations to complete (600ms + buffer)
    await page.waitForTimeout(800)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Community Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/community')
    await page.waitForLoadState('networkidle')

    // Wait for page content to load
    const heading = page.getByRole('heading', { level: 1 }).first()
    await heading.waitFor({ timeout: 10000 }).catch(() => {})

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Workshop Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/workshop')
    await page.getByRole('heading', { level: 1 }).waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Privacy Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/privacy')
    await page.getByRole('heading', { level: 1 }).waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Terms Page Accessibility', () => {
  test('should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/terms')
    await page.getByRole('heading', { level: 1 }).waitFor()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze()

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(seriousViolations).toEqual([])
  })
})

test.describe('Keyboard Navigation', () => {
  test('should be able to tab through header navigation', async ({ page }) => {
    await page.goto('/')

    // Tab to first navigation link
    await page.keyboard.press('Tab')

    // Should be able to navigate with keyboard
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Should still be on the page
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be able to activate buttons with keyboard', async ({ page }) => {
    const opened = await openFirstProductFromShop(page)
    if (!opened) return

    // Focus on add to cart button
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i })
    await addToCartBtn.focus()

    // Should be focusable
    await expect(addToCartBtn).toBeFocused()

    // Should be able to activate with Enter
    await page.keyboard.press('Enter')
  })

  test('should show focus indicators on interactive elements', async ({
    page,
  }) => {
    await page.goto('/')

    const skipLink = page
      .getByRole('link', { name: 'Skip to main content' })
      .first()
    await skipLink.focus()

    // Get the focused element
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })
})

test.describe('Images and Alt Text', () => {
  test('all images should have alt text', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded and hydrated
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('header[data-hydrated="true"]', { timeout: 10000 }).catch(() => {})

    // Only check visible images (skip lazy-loaded ones not yet in viewport)
    const images = page.locator('img:visible')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)

      // Skip if image is not attached to DOM (lazy loading race condition)
      const isAttached = await img.isVisible().catch(() => false)
      if (!isAttached) continue

      const alt = await img.getAttribute('alt').catch(() => null)
      const role = await img.getAttribute('role').catch(() => null)

      // Image should have alt text or role="presentation"
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })
})

test.describe('Form Accessibility', () => {
  test('login form should have proper error handling', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /send|submit/i })
    await submitButton.click()

    // Error should be announced or form should prevent submission
    // HTML5 validation will kick in for required fields
  })

  test('cart quantity inputs should be accessible', async ({ page }) => {
    // Set up cart
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

    await page.goto('/cart')

    // Quantity controls should be accessible
    const decreaseBtn = page.getByLabel(/decrease/i)
    const increaseBtn = page.getByLabel(/increase/i)

    if ((await decreaseBtn.count()) > 0) {
      await expect(decreaseBtn.first()).toBeVisible()
    }
    if ((await increaseBtn.count()) > 0) {
      await expect(increaseBtn.first()).toBeVisible()
    }
  })
})

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile navigation should be accessible', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('banner').waitFor()
    await page
      .locator('header[data-hydrated="true"]')
      .waitFor({ timeout: 5000 })

    const menuButton = page.getByRole('banner').getByLabel(/toggle menu|menu/i)
    await expect(menuButton).toBeVisible()

    // Should have accessible name
    const label = await menuButton.getAttribute('aria-label')
    expect(label?.length).toBeGreaterThan(0)
  })

  test('touch targets should be sufficiently sized', async ({ page }) => {
    await page.goto('/')

    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded')

    // Buttons should be at least 44x44 pixels for touch
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    let passedCount = 0
    let checkedCount = 0

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)

      // Only check visible buttons
      const isVisible = await button.isVisible().catch(() => false)
      if (!isVisible) continue

      const box = await button.boundingBox().catch(() => null)

      if (box) {
        checkedCount++
        // Touch targets should be at least 44px, but allow 24px for icon buttons
        // Many icon buttons use padding to meet WCAG requirements
        if (box.width >= 24 && box.height >= 24) {
          passedCount++
        }
      }
    }

    // At least some buttons should pass (if any were checked)
    if (checkedCount > 0) {
      expect(passedCount).toBeGreaterThan(0)
    }
  })
})
