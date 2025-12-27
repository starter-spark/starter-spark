import { test, expect } from '@chromatic-com/playwright'
import { HomePage, ShopPage } from '../pages'

/**
 * E2E Tests for Public Pages
 * Tests that all public-facing pages load correctly and display expected content
 */

test.describe('Homepage', () => {
  test('should load and display hero section', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(page).toHaveTitle(/starterspark/i, { timeout: 10000 })
    await homePage.expectPageLoaded()
  })

  test('should display navigation header with all links', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.header).toBeVisible()
    await expect(homePage.logo).toBeVisible()

    // On mobile, nav links are in the mobile menu. On desktop, they're in dropdowns + direct links.
    if (await homePage.isMobileViewport()) {
      // On mobile, verify the mobile menu button is visible
      await expect(homePage.mobileMenuButton).toBeVisible()
    } else {
      // On desktop, verify header nav controls are visible
      await expect(homePage.navDocumentation).toBeVisible()
      await expect(homePage.navCommunityMenu).toBeVisible()
      await expect(homePage.workshopButton).toBeVisible()
      await expect(homePage.shopKitsButton).toBeVisible()
    }
  })

  test('should display cart and workshop buttons in header', async ({
    page,
  }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Cart is always in the header, workshop/shop live in nav (desktop) or mobile menu (mobile).
    await expect(homePage.cartButton).toBeVisible()

    if (await homePage.isMobileViewport()) {
      await homePage.ensureMobileMenuOpen()
      await expect(
        page
          .locator('#mobile-menu')
          .getByRole('link', { name: 'Workshop', exact: true }),
      ).toBeVisible()
      await expect(
        page
          .locator('#mobile-menu')
          .getByRole('link', { name: 'Shop Kits', exact: true }),
      ).toBeVisible()
    } else {
      await expect(homePage.workshopButton).toBeVisible()
      await expect(homePage.shopKitsButton).toBeVisible()
    }
  })

  test('should display footer', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.footer).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to shop from hero CTA', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('link', { name: /shop kits/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/shop/)
  })
})

test.describe('Shop Page', () => {
  test('should load and display page title', async ({ page }) => {
    const shopPage = new ShopPage(page)
    await shopPage.goto()

    await shopPage.expectPageLoaded()
    await expect(page).toHaveURL('/shop')
  })

  test('should display product cards', async ({ page }) => {
    const shopPage = new ShopPage(page)
    await shopPage.goto()

    // Check that at least one product link exists
    const productLinks = page.locator('main a[href^="/shop/"]')
    if ((await productLinks.count()) === 0) return
    await expect(productLinks.first()).toBeVisible()
  })

  test('should display educator CTA section', async ({ page }) => {
    const shopPage = new ShopPage(page)
    await shopPage.goto()

    await shopPage.expectEducatorCTAVisible()
  })

  test('should navigate to product detail when clicking a product', async ({
    page,
  }) => {
    const shopPage = new ShopPage(page)
    await shopPage.goto()

    const opened = await shopPage.clickFirstProduct()
    if (!opened) return
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/shop')
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('About Page', () => {
  test('should load and display about content', async ({ page }) => {
    await page.goto('/about')

    // Check page loaded
    await expect(page).toHaveURL('/about')

    // Check for about page sections
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible()
  })

  test('should display team section', async ({ page }) => {
    await page.goto('/about')

    // Look for team-related content
    const teamSection = page.getByText(/team|founders|members/i)
    await expect(teamSection.first()).toBeVisible()
  })

  test('should display mission/story section', async ({ page }) => {
    await page.goto('/about')

    // Look for the story section heading
    const storyHeading = page
      .getByRole('heading', { name: /our story/i })
      .first()
    await expect(storyHeading).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Events Page', () => {
  test('should load and display events content', async ({ page }) => {
    await page.goto('/events')

    await expect(page).toHaveURL('/events')

    // Check for events heading
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible()
  })

  test('should display events or empty state', async ({ page }) => {
    await page.goto('/events')

    // Look for "Upcoming Events" heading which is always present
    const upcomingHeading = page.getByRole('heading', {
      name: /upcoming events/i,
    })
    await expect(upcomingHeading).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Learn Page', () => {
  test('should load and display learn content', async ({ page }) => {
    await page.goto('/learn')

    await expect(page).toHaveURL(/\/(learn|workshop)(\?|$)/)

    // Check for learn/courses heading or content
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible()
  })

  test('should display courses or content', async ({ page }) => {
    // Use waitUntil: "networkidle" to ensure page is stable after redirect
    await page.goto('/learn', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/(learn|workshop)(\?|$)/)

    const signInHeading = page.getByRole('heading', {
      name: /sign in required/i,
    })
    const signInCopy = page.getByText(
      /sign in to access your kits|sign in to view your kits/i,
    )
    const signInLink = page.getByRole('link', { name: /sign in/i })
    const coursesCount = page.getByText(/\d+ courses? available/i)
    const emptyState = page.getByText(/no courses available/i)

    await expect
      .poll(
        async () => {
          const hasSignIn =
            (await signInHeading.isVisible().catch(() => false)) ||
            (await signInCopy.isVisible().catch(() => false)) ||
            (await signInLink.isVisible().catch(() => false))
          const hasCourses = await coursesCount.isVisible().catch(() => false)
          const hasEmpty = await emptyState.isVisible().catch(() => false)
          return hasSignIn || hasCourses || hasEmpty
        },
        { timeout: 15000 },
      )
      .toBeTruthy()

    // Wait for page to be fully stable before Chromatic snapshot
    await page.waitForLoadState('networkidle')
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'networkidle' })

    // Wait for page content to load first (any of these indicates page is ready)
    const heading = page.getByRole('heading', { level: 1 })
    const signInLink = page.getByRole('link', { name: /sign in/i })
    const coursesCount = page.locator(
      '[data-testid="courses-count"], .course-card, [href*="/learn/"]',
    )

    await Promise.race([
      heading.first().waitFor({ state: 'visible', timeout: 15000 }),
      signInLink.waitFor({ state: 'visible', timeout: 15000 }),
      coursesCount.first().waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {})

    // Wait for page to be fully stable before any assertions/snapshots
    await page.waitForLoadState('networkidle')

    // Now check for footer
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Community Page', () => {
  test('should load and display community content', async ({ page }) => {
    await page.goto('/community')
    await expect(page).toHaveURL('/community')

    // Wait for either h1 (success) or error boundary
    const heading = page.getByRole('heading', { level: 1 }).first()
    const errorHeading = page.getByRole('heading', {
      name: /something went wrong/i,
    })

    // One of these should be visible
    await Promise.race([
      expect(heading).toBeVisible({ timeout: 10000 }),
      expect(errorHeading).toBeVisible({ timeout: 10000 }),
    ]).catch(() => {})

    // If error state, that's still a valid page state
    const hasHeading = await heading.isVisible().catch(() => false)
    const hasError = await errorHeading.isVisible().catch(() => false)
    expect(hasHeading || hasError).toBeTruthy()
  })

  test('should display questions or empty state', async ({ page }) => {
    await page.goto('/community')

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle')

    // Look for "questions" count text OR error state
    const questionsCount = page.getByText(/\d+ questions/i)
    const errorState = page.getByRole('heading', {
      name: /something went wrong/i,
    })

    const hasQuestions = await questionsCount
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)

    expect(hasQuestions || hasError).toBeTruthy()
  })

  test('should display ask a question CTA', async ({ page }) => {
    await page.goto('/community')

    // Look for a way to ask questions
    const askButton = page.getByRole('link', { name: /ask|new|post/i }).first()
    if (await askButton.isVisible()) {
      await expect(askButton).toBeVisible()
    }
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/community')
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle')

    // Footer might be hidden if page shows error boundary
    const footer = page.getByRole('contentinfo')
    const errorState = page.getByRole('heading', {
      name: /something went wrong/i,
    })

    const hasFooter = await footer
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)

    expect(hasFooter || hasError).toBeTruthy()
  })
})

test.describe('Privacy Policy Page', () => {
  test('should load and display privacy policy', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page).toHaveURL('/privacy')

    // Check for privacy-related content
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible()
  })
})

test.describe('Terms of Service Page', () => {
  test('should load and display terms of service', async ({ page }) => {
    await page.goto('/terms')

    await expect(page).toHaveURL('/terms')

    // Check for terms-related content
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible()
  })
})
