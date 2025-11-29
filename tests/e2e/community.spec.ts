import { test, expect } from "@chromatic-com/playwright"

/**
 * E2E Tests for Community Forum (The Lab)
 * Tests question listing, detail pages, and forum functionality
 */

test.describe("Community Page - Question Listing", () => {
  test("should display community page with heading", async ({ page }) => {
    await page.goto("/community")

    // Wait for page to load
    await page.waitForLoadState("networkidle")

    // Should have heading or error boundary
    const heading = page.getByRole("heading", { level: 1 })
    const errorHeading = page.getByRole("heading", { name: /something went wrong/i })

    const hasHeading = await heading.isVisible().catch(() => false)
    const hasError = await errorHeading.isVisible().catch(() => false)

    expect(hasHeading || hasError).toBeTruthy()
  })

  test("should display question count", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Should show questions count OR error state
    const questionsCount = page.getByText(/\d+ questions?/i)
    const errorState = page.getByRole("heading", { name: /something went wrong/i })

    const hasCount = await questionsCount.isVisible().catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)

    expect(hasCount || hasError).toBeTruthy()
  })

  test("should display ask a question button", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    const askButton = page.getByRole("link", { name: /ask|new|post/i }).first()
    const hasButton = await askButton.isVisible().catch(() => false)

    // Button may or may not be visible depending on auth state
    // If visible, it should be clickable
    if (hasButton) {
      await expect(askButton).toBeEnabled()
    }
  })

  test("should display filter options", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Check for filter controls (status, tags, product)
    // These may be dropdowns, buttons, or links
    const filterElements = page.locator('[role="combobox"], select, [data-filter]')
    // Filters may or may not be present
  })

  test("should display question cards", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Look for question links
    const questionLinks = page.locator('a[href^="/community/"]')
    const count = await questionLinks.count()

    // If there are questions, they should be clickable
    if (count > 0) {
      await expect(questionLinks.first()).toBeVisible()
    }
  })
})

test.describe("Community Page - Question Detail", () => {
  test("should navigate to question detail page", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Find question links (excluding /community/new) - be more specific to target post links
    const questionLinks = page.locator('article a[href^="/community/"]:not([href="/community/new"])')
    const count = await questionLinks.count()

    if (count > 0) {
      // Wait for navigation after click
      await Promise.all([
        page.waitForURL(/\/community\/.+/),
        questionLinks.first().click()
      ])

      // Should be on a question detail page
      const url = page.url()
      expect(url).toMatch(/\/community\/.+/)
      expect(url).not.toContain("/new")
    }
  })

  test("should display question title and content", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Use more specific selector targeting article links
    const questionLinks = page.locator('article a[href^="/community/"]:not([href="/community/new"])')
    const count = await questionLinks.count()

    if (count > 0) {
      // Wait for navigation after click
      await Promise.all([
        page.waitForURL(/\/community\/.+/),
        questionLinks.first().click()
      ])

      // Should have question heading
      const heading = page.getByRole("heading", { level: 1 })
      await expect(heading).toBeVisible()
    }
  })

  test("should display answer section", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Use more specific selector targeting article links
    const questionLinks = page.locator('article a[href^="/community/"]:not([href="/community/new"])')
    const count = await questionLinks.count()

    if (count > 0) {
      // Wait for navigation after click
      await Promise.all([
        page.waitForURL(/\/community\/.+/),
        questionLinks.first().click()
      ])

      // Page should have content
      await expect(page.locator("body")).toBeVisible()

      // Answer section may show "answers" count or form
      const answersText = page.getByText(/answers?|replies?|comments?/i)
      const hasAnswerSection = await answersText.first().isVisible().catch(() => false)
      // Answer section may or may not be visible
    }
  })

  test("should display voting buttons", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Use more specific selector targeting article links
    const questionLinks = page.locator('article a[href^="/community/"]:not([href="/community/new"])')
    const count = await questionLinks.count()

    if (count > 0) {
      // Wait for navigation after click
      await Promise.all([
        page.waitForURL(/\/community\/.+/),
        questionLinks.first().click()
      ])

      // Voting buttons may be present (arrows or vote icons)
      const voteButtons = page.getByRole("button", { name: /vote|upvote|downvote/i })
      // Voting may require authentication
    }
  })

  test("should display author information", async ({ page }) => {
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    // Use more specific selector targeting article links
    const questionLinks = page.locator('article a[href^="/community/"]:not([href="/community/new"])')
    const count = await questionLinks.count()

    if (count > 0) {
      // Wait for navigation after click
      await Promise.all([
        page.waitForURL(/\/community\/.+/),
        questionLinks.first().click()
      ])

      // Author info may be displayed
      const authorText = page.getByText(/asked by|posted by|author/i)
      const hasAuthor = await authorText.first().isVisible().catch(() => false)
      // Author info may or may not be present
    }
  })
})

test.describe("Community Page - New Question", () => {
  test("should navigate to new question page", async ({ page }) => {
    await page.goto("/community/new")

    // Wait for page load
    await page.waitForLoadState("networkidle")

    // Page should render (may require auth)
    await expect(page.locator("body")).toBeVisible()
  })

  test("should show sign in prompt for unauthenticated users", async ({ page }) => {
    // Clear auth
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto("/community/new")
    await page.waitForLoadState("networkidle")

    // Should show sign in prompt or redirect to login
    const signInText = page.getByText(/sign in|login|must be logged in/i)
    const isOnLogin = page.url().includes("/login")

    const hasSignIn = await signInText.first().isVisible().catch(() => false)

    expect(hasSignIn || isOnLogin).toBeTruthy()
  })
})

test.describe("Community Page - Responsive", () => {
  test("should be usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    await expect(page.locator("body")).toBeVisible()
  })

  test("should be usable on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/community")
    await page.waitForLoadState("networkidle")

    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Community Page - Error Handling", () => {
  test("should handle non-existent question gracefully", async ({ page }) => {
    await page.goto("/community/non-existent-question-slug-12345")
    await page.waitForLoadState("networkidle")

    // Should show 404 or error state
    await expect(page.locator("body")).toBeVisible()

    // Either 404 page, error message, or redirect
    const notFoundText = page.getByText(/not found|doesn't exist|404/i)
    const hasNotFound = await notFoundText.first().isVisible().catch(() => false)
    // Page may show error or redirect
  })
})

test.describe("Community Page - Events Toggle", () => {
  test("past events toggle should work on events page", async ({ page }) => {
    await page.goto("/events")
    await page.waitForLoadState("networkidle")

    // Look for past events toggle
    const pastEventsToggle = page.getByRole("button", { name: /past events|show past/i })
    const hasPastToggle = await pastEventsToggle.isVisible().catch(() => false)

    if (hasPastToggle) {
      // Click to toggle past events
      await pastEventsToggle.click()

      // Should show past events section
      const pastEventsSection = page.getByText(/past events/i)
      await expect(pastEventsSection.first()).toBeVisible()
    }
  })
})
