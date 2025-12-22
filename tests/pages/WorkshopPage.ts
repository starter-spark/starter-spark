import { Page, Locator, expect } from "@playwright/test"

/**
 * Page Object Model for the Workshop Page
 */
export class WorkshopPage {
  readonly page: Page

  // Page elements
  readonly pageTitle: Locator

  // Unauthenticated state
  readonly signInRequired: Locator
  readonly signInButton: Locator

  // Authenticated - empty state
  readonly emptyState: Locator
  readonly shopButton: Locator

  // Authenticated - with kits
  readonly myKitsSection: Locator
  readonly kitCards: Locator
  readonly claimSection: Locator
  readonly claimCodeInput: Locator
  readonly activateButton: Locator
  readonly quickToolsSection: Locator
  readonly achievementsSection: Locator

  // Claim form feedback
  readonly claimSuccess: Locator
  readonly claimError: Locator

  constructor(page: Page) {
    this.page = page

    this.pageTitle = page.getByRole("heading", { name: /workshop|my kits/i })

    // Unauthenticated
    this.signInRequired = page.getByText(/sign in required|must be logged in/i)
    this.signInButton = page.getByRole("link", { name: /sign in/i })

    // Empty state
    this.emptyState = page.getByText(/no kits yet|haven't claimed/i)
    // Scope to main to avoid matching header nav links
    this.shopButton = page.locator("main").getByRole("link", { name: /shop|browse/i }).first()

    // With kits
    this.myKitsSection = page.getByText(/my kits/i)
    this.kitCards = page.locator('[class*="border"][class*="rounded"]').filter({
      has: page.locator('[class*="font-mono"]'),
    })
    this.claimSection = page.getByText(/claim a kit/i)
    this.claimCodeInput = page.getByPlaceholder(/xxxx-xxxx-xxxx-xxxx/i)
    this.activateButton = page.getByRole("button", { name: /activate/i })
    this.quickToolsSection = page.getByText(/quick tools/i)
    this.achievementsSection = page.getByText(/achievements/i)

    // Claim feedback
    this.claimSuccess = page.locator('[class*="text-green"]')
    this.claimError = page.locator('[class*="text-red"]')
  }

  async goto() {
    await this.page.goto("/workshop")
    await this.page
      .locator('header[data-hydrated="true"]')
      .waitFor({ timeout: 5000 })
      .catch(() => {})
  }

  async expectPageLoaded() {
    await expect(this.page.locator("main")).toBeVisible()
    await expect(this.pageTitle.first()).toBeVisible()
  }

  async expectSignInRequired() {
    await expect(this.signInRequired).toBeVisible()
    await expect(this.signInButton).toBeVisible()
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async expectKitsDisplayed() {
    await expect(this.myKitsSection).toBeVisible()
  }

  async getKitCount(): Promise<number> {
    return await this.kitCards.count()
  }

  async claimCode(code: string) {
    await this.claimCodeInput.fill(code)
    await this.activateButton.click()
  }

  async expectClaimSuccess() {
    await expect(this.claimSuccess).toBeVisible()
  }

  async expectClaimError() {
    await expect(this.claimError).toBeVisible()
  }

  async clickSignIn() {
    await this.signInButton.click()
    await expect(this.page).toHaveURL(/\/login/)
  }
}
