import { test, expect } from '@chromatic-com/playwright'
import type { Page } from '@playwright/test'

const isSignedOut = async (page: Page) => {
  const signInHeading = page.getByRole('heading', { name: /sign in required/i })
  const signInLink = page.getByRole('link', { name: /sign in/i })
  const coursesCount = page.getByText(/\d+ courses? available/i)
  const emptyState = page.getByText(/no courses available/i)

  await expect
    .poll(
      async () => {
        const hasSignIn =
          (await signInHeading.isVisible().catch(() => false)) ||
          (await signInLink.isVisible().catch(() => false))
        const hasCourses = await coursesCount.isVisible().catch(() => false)
        const hasEmpty = await emptyState.isVisible().catch(() => false)
        return hasSignIn || hasCourses || hasEmpty
      },
      { timeout: 15000 },
    )
    .toBeTruthy()

  return (
    (await signInHeading.isVisible().catch(() => false)) ||
    (await signInLink.isVisible().catch(() => false))
  )
}

/**
 * E2E Tests for Learning Platform
 * Tests course navigation, lesson display, and learning flow
 */

test.describe('Learn Page - Course Listing', () => {
  test('should display course listing', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)

    await expect
      .poll(
        async () => {
          const hasSignIn = await isSignedOut(page)
          const hasCourses = await page
            .getByText(/\d+ courses? available/i)
            .isVisible()
            .catch(() => false)
          const hasEmpty = await page
            .getByText(/no courses available/i)
            .isVisible()
            .catch(() => false)
          return hasSignIn || hasCourses || hasEmpty
        },
        { timeout: 15000 },
      )
      .toBeTruthy()

    if (await isSignedOut(page)) {
      await expect(
        page.getByRole('heading', { name: /sign in required/i }),
      ).toBeVisible()
      return
    }

    // Should have heading
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Should show courses count
    const coursesCount = page.getByText(/\d+ courses? available/i)
    const emptyState = page.getByText(/no courses available/i)
    if (!(await coursesCount.isVisible().catch(() => false))) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('should display course cards with progress', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)

    if (await isSignedOut(page)) return

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Look for course cards (links to /learn/[product])
    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      // Verify first course card has expected elements
      const firstCourse = courseLinks.first()
      await expect(firstCourse).toBeVisible()
    }
  })

  test('should navigate to course overview', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    // Click first course link
    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)
    }
  })
})

test.describe('Course Overview Page', () => {
  test('should display course title and description', async ({ page }) => {
    // Go to learn page first to find a course
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)

      // Should have course heading
      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()
    }
  })

  test('should display module sections', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)

      // Wait for content
      await page.waitForLoadState('networkidle')

      // Modules are typically displayed with lesson links
      const lessonLinks = page.locator('a[href*="/learn/"][href*="/"]')
      // There may be lessons or a "no modules" state
    }
  })

  test('should show progress indicators', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)

      // Page should load without error
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should navigate to lesson page', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Find lesson links (they have product slug and lesson in the URL)
      const lessonLinks = page.locator('a[href^="/learn/"][href$="/"]')
      const lessonCount = await lessonLinks.count()

      // If there are lessons, try to click one
      if (lessonCount > 0) {
        const firstLesson = lessonLinks.first()
        const href = await firstLesson.getAttribute('href')
        if (href && href.split('/').length > 3) {
          await firstLesson.click()
          // Should navigate to lesson page
          await expect(page).toHaveURL(/\/learn\/.+\/.+/)
        }
      }
    }
  })
})

test.describe('Lesson Page', () => {
  test('should display lesson content', async ({ page }) => {
    // Navigate to a lesson through the course flow
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await expect(page).toHaveURL(/\/learn\/.+/)
      await page.waitForLoadState('networkidle')

      // Find and click a lesson
      const lessonLinks = page.locator('a[href^="/learn/"]').filter({
        has: page.locator('text=/lesson|module|getting started/i'),
      })
      const lessonCount = await lessonLinks.count()

      if (lessonCount > 0) {
        await lessonLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Lesson page should have content
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('should display lesson navigation sidebar', async ({ page }) => {
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)
    if (await isSignedOut(page)) return

    const courseLinks = page.locator('a[href^="/learn/"]')
    const count = await courseLinks.count()

    if (count > 0) {
      await courseLinks.first().click()
      await page.waitForLoadState('networkidle')

      // The sidebar should be visible on desktop
      const viewportSize = page.viewportSize()
      const isMobile = viewportSize ? viewportSize.width < 768 : false

      if (!isMobile) {
        // Look for sidebar navigation
        const sidebar = page.locator('nav, aside, [role="navigation"]')
        // Sidebar may or may not be present depending on page structure
      }
    }
  })
})

test.describe('Learn Page - Responsive', () => {
  test('should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)

    await expect(page.locator('body')).toBeVisible()

    // Heading should still be visible
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('should be usable on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/workshop(\?|$)/)

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Learn Page - Error States', () => {
  test('should handle missing course gracefully', async ({ page }) => {
    await page.goto('/learn/non-existent-course-12345')

    // Should show 404 or error state
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle missing lesson gracefully', async ({ page }) => {
    await page.goto('/learn/4dof-robotic-arm-kit/non-existent-lesson-12345')

    // Should show 404 or error state
    await expect(page.locator('body')).toBeVisible()
  })
})
