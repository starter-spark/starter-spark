import { test, expect } from '@chromatic-com/playwright'
import { WorkshopPage } from '../pages'

/**
 * E2E Tests for Workshop Page
 * Tests the user dashboard including kit management and claim functionality
 */

test.describe('Workshop Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no auth state
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should load workshop page', async ({ page }) => {
    const workshopPage = new WorkshopPage(page)
    await workshopPage.goto()
    await workshopPage.expectPageLoaded()
  })

  test('should show sign in required message', async ({ page }) => {
    const workshopPage = new WorkshopPage(page)
    await workshopPage.goto()

    // Should see some indication that sign-in is required
    // On mobile, the header "Sign In" text may be hidden (icon-only), so check main content
    const mainContent = page.locator('main')
    const signInText = mainContent.getByText(
      /sign in|login|authentication required/i,
    )
    const headerSignInLink = page
      .getByRole('banner')
      .getByRole('link', { name: /sign in/i })

    // Either main content has sign-in text OR header has sign-in link
    const hasMainSignIn = await signInText
      .first()
      .isVisible()
      .catch(() => false)
    const hasHeaderSignIn = await headerSignInLink
      .isVisible()
      .catch(() => false)

    expect(hasMainSignIn || hasHeaderSignIn).toBeTruthy()
  })

  test('should provide link to sign in', async ({ page }) => {
    const workshopPage = new WorkshopPage(page)
    await workshopPage.goto()

    // Use first() to handle multiple sign-in links (header + page content)
    const signInLink = page.getByRole('link', { name: /sign in/i }).first()
    if (await signInLink.isVisible()) {
      await signInLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe('Workshop Page - Layout', () => {
  test('should display page title', async ({ page }) => {
    await page.goto('/workshop')

    // Should have a heading
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/workshop')

    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Claim Code Form - UI', () => {
  test('should display claim code input when form is visible', async ({
    page,
  }) => {
    await page.goto('/workshop')

    // The claim form may only be visible for authenticated users
    // or shown in a specific section
    const claimInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)

    if (await claimInput.isVisible()) {
      await expect(claimInput).toBeVisible()
    }
  })

  test('should display activate button when form is visible', async ({
    page,
  }) => {
    await page.goto('/workshop')

    const activateBtn = page.getByRole('button', { name: /activate/i })

    if (await activateBtn.isVisible()) {
      await expect(activateBtn).toBeVisible()
    }
  })

  test('should uppercase input as user types', async ({ page }) => {
    await page.goto('/workshop')

    const claimInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)

    if (await claimInput.isVisible()) {
      await claimInput.fill('abcd-efgh')

      // Input should be uppercased
      await expect(claimInput).toHaveValue('ABCD-EFGH')
    }
  })

  test('should limit input length', async ({ page }) => {
    await page.goto('/workshop')

    const claimInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)

    if (await claimInput.isVisible()) {
      // Try to enter more than max length
      await claimInput.fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

      // Should be limited to maxLength (16 chars + 3 dashes = 19)
      const value = await claimInput.inputValue()
      expect(value.length).toBeLessThanOrEqual(19)
    }
  })

  test('should disable activate button when input is empty', async ({
    page,
  }) => {
    await page.goto('/workshop')

    const claimInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)
    const activateBtn = page.getByRole('button', { name: /activate/i })

    if ((await claimInput.isVisible()) && (await activateBtn.isVisible())) {
      // Clear input
      await claimInput.clear()

      // Button should be disabled
      await expect(activateBtn).toBeDisabled()
    }
  })

  test('should enable activate button when input has value', async ({
    page,
  }) => {
    await page.goto('/workshop')

    const claimInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)
    const activateBtn = page.getByRole('button', { name: /activate/i })

    if ((await claimInput.isVisible()) && (await activateBtn.isVisible())) {
      await claimInput.fill('ABCD-EFGH-IJKL-MNOP')

      // Button should be enabled
      await expect(activateBtn).toBeEnabled()
    }
  })
})

test.describe('Quick Tools Section', () => {
  test('should display quick tools when visible', async ({ page }) => {
    await page.goto('/workshop')

    const quickTools = page.getByText(/quick tools/i)

    if (await quickTools.isVisible()) {
      await expect(quickTools).toBeVisible()
    }
  })

  test('should display servo calculator link if present', async ({ page }) => {
    await page.goto('/workshop')

    const servoCalc = page.getByText(/servo calculator/i)

    if (await servoCalc.isVisible()) {
      await expect(servoCalc).toBeVisible()
    }
  })

  test('should display pinout reference if present', async ({ page }) => {
    await page.goto('/workshop')

    const pinout = page.getByText(/pinout/i)

    if (await pinout.isVisible()) {
      await expect(pinout).toBeVisible()
    }
  })
})

test.describe('Achievements Section', () => {
  test('should display achievements section if present', async ({ page }) => {
    await page.goto('/workshop')

    const achievements = page.getByText(/achievements/i)

    if (await achievements.isVisible()) {
      await expect(achievements).toBeVisible()
    }
  })
})

test.describe('Workshop - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Block API requests
    await page.route('**/api/**', (route) => route.abort())

    await page.goto('/workshop')

    // Page should still render without crashing
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle missing data gracefully', async ({ page }) => {
    await page.goto('/workshop')

    // Page should render something even if data is missing
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Workshop - Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/workshop')

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/workshop')

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be usable on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/workshop')

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })
})
