import { Page, Locator, expect } from "@playwright/test"

/**
 * Page Object Model for the Login Page
 */
export class LoginPage {
  readonly page: Page

  // Page elements
  readonly pageTitle: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  // Success state
  readonly successMessage: Locator
  readonly checkEmailTitle: Locator
  readonly useDifferentEmailButton: Locator

  constructor(page: Page) {
    this.page = page

    this.pageTitle = page.getByRole("heading", { name: /sign in|login/i })
    // Use #email id to avoid matching footer newsletter input
    this.emailInput = page.locator("main input#email:visible").first()
    this.submitButton = page.getByRole("button", { name: /send magic link/i })
    this.errorMessage = page.locator("#login-email-error")

    // Success state
    this.successMessage = page.getByText(/check your email/i)
    this.checkEmailTitle = page.getByRole("heading", { name: /check your email/i })
    this.useDifferentEmailButton = page.getByRole("button", {
      name: /different email/i,
    })
  }

  async goto(options?: { redirect?: string; claimToken?: string }) {
    let url = "/login"
    const params = new URLSearchParams()

    if (options?.redirect) {
      params.set("redirect", options.redirect)
    }
    if (options?.claimToken) {
      params.set("claim", options.claimToken)
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    await this.page.goto(url, { waitUntil: "domcontentloaded" })
    // Wait for client hydration to attach handlers before interactions
    await this.page.waitForLoadState("networkidle")
  }

  async expectPageLoaded() {
    await expect(this.emailInput).toBeVisible({ timeout: 10000 })
    await expect(this.submitButton).toBeVisible({ timeout: 10000 })
    await this.page
      .locator('header[data-hydrated="true"]')
      .waitFor({ timeout: 5000 })
      .catch(() => {})
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async login(email: string) {
    await this.fillEmail(email)
    await this.submitForm()
  }

  async expectSuccessState() {
    await expect(this.successMessage).toBeVisible()
    await expect(this.useDifferentEmailButton).toBeVisible()
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible()
  }

  async clickUseDifferentEmail() {
    await this.useDifferentEmailButton.click()
    await expect(this.emailInput).toBeVisible()
  }

  async expectLoadingState() {
    const loadingButton = this.page.getByRole("button", { name: /sending/i })
    await expect(loadingButton).toBeVisible()
  }
}
