import { Page, Locator, expect } from "@playwright/test"

/**
 * Page Object Model for the Homepage
 * Handles both desktop and mobile viewports automatically
 */
export class HomePage {
  readonly page: Page

  // Header elements
  readonly header: Locator
  readonly logo: Locator
  readonly mobileMenuButton: Locator
  readonly cartButton: Locator
  readonly footer: Locator

  // Hero section
  readonly heroSection: Locator
  readonly heroTitle: Locator
  readonly heroCTA: Locator

  // Content sections
  readonly differentiatorSection: Locator
  readonly productSpotlight: Locator
  readonly learningPreview: Locator
  readonly missionSection: Locator
  readonly eventsPreview: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.header = page.locator("header")
    this.logo = page.getByRole("link", { name: /starterspark/i })
    this.mobileMenuButton = page.getByLabel("Toggle menu")
    // Cart is always available in the header (desktop + mobile)
    this.cartButton = page.getByLabel(/^Shopping cart/i).first()
    this.footer = page.locator("footer")

    // Hero
    this.heroSection = page.locator("section").first()
    this.heroTitle = page.getByRole("heading", { level: 1 }).first()
    this.heroCTA = page.getByRole("link", { name: /shop|get started/i }).first()

    // Sections
    this.differentiatorSection = page.locator("section").nth(1)
    this.productSpotlight = page.getByText(/spotlight/i).first()
    this.learningPreview = page.getByText(/learning|learn/i).first()
    this.missionSection = page.getByText(/mission|70%|charity/i).first()
    this.eventsPreview = page.getByText(/events|upcoming/i).first()
  }

  /**
   * Check if we're in mobile viewport (width < 768px)
   */
  async isMobileViewport(): Promise<boolean> {
    const viewportSize = this.page.viewportSize()
    return viewportSize ? viewportSize.width < 768 : false
  }

  private get mobileMenu(): Locator {
    return this.page.locator("#mobile-menu")
  }

  /**
   * Open mobile menu if in mobile viewport
   */
  async ensureMobileMenuOpen(): Promise<void> {
    if (await this.isMobileViewport()) {
      const isMobileMenuVisible = await this.mobileMenuButton.isVisible()
      if (isMobileMenuVisible) {
        if (!(await this.mobileMenu.isVisible())) {
          await this.mobileMenuButton.click()
          await this.mobileMenu.waitFor({ state: "visible", timeout: 3000 })
        }
      }
    }
  }

  /**
   * Close any open dialogs/sheets that might block interactions
   */
  async closeAnyOpenDialogs(): Promise<void> {
    const dialog = this.page.getByRole("dialog")
    if (await dialog.isVisible()) {
      await this.page.keyboard.press("Escape")
      await dialog.waitFor({ state: "hidden", timeout: 3000 })
    }
  }

  /**
   * Open a desktop dropdown and click a menu item (Radix DropdownMenu).
   */
  private async clickDesktopMenuItem(
    menu: "Documentation" | "Community",
    itemName: string
  ): Promise<void> {
    const trigger = this.page
      .locator("nav.hidden.md\\:flex")
      .getByRole("button", { name: menu, exact: true })
      .first()

    await trigger.click()
    const escaped = itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    await this.page.getByRole("menuitem", { name: new RegExp(escaped, "i") }).click()
  }

  // Desktop-only locators (for visibility assertions)
  get navDocumentation(): Locator {
    return this.page
      .locator("nav.hidden.md\\:flex")
      .getByRole("button", { name: "Documentation", exact: true })
  }

  get navCommunityMenu(): Locator {
    return this.page
      .locator("nav.hidden.md\\:flex")
      .getByRole("button", { name: "Community", exact: true })
  }

  get workshopButton(): Locator {
    return this.page.locator("header").getByRole("link", { name: "Workshop", exact: true }).first()
  }

  get shopKitsButton(): Locator {
    return this.page.locator("header").getByRole("link", { name: "Shop Kits", exact: true }).first()
  }

  async goto() {
    await this.page.goto("/")
  }

  async expectPageLoaded() {
    await expect(this.header).toBeVisible()
    await expect(this.heroTitle).toBeVisible()
  }

  async navigateToShop() {
    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      await this.mobileMenu.getByRole("link", { name: "Shop Kits", exact: true }).click()
    } else {
      await this.page.locator("header").getByRole("link", { name: "Shop Kits", exact: true }).click()
    }
    await this.page.waitForURL("**/shop")
  }

  async navigateToLearn() {
    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      await this.mobileMenu.getByRole("button", { name: "Documentation", exact: true }).click()
      await this.mobileMenu.getByRole("link", { name: "Getting Started", exact: true }).click()
    } else {
      await this.clickDesktopMenuItem("Documentation", "Getting Started")
    }
    await this.page.waitForURL("**/learn")
  }

  async navigateToAbout() {
    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      await this.mobileMenu.getByRole("button", { name: "Community", exact: true }).click()
      await this.mobileMenu.getByRole("link", { name: "About Us", exact: true }).click()
    } else {
      await this.clickDesktopMenuItem("Community", "About Us")
    }
    await this.page.waitForURL("**/about")
  }

  async navigateToEvents() {
    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      await this.mobileMenu.getByRole("button", { name: "Community", exact: true }).click()
      await this.mobileMenu.getByRole("link", { name: "Events", exact: true }).click()
    } else {
      await this.clickDesktopMenuItem("Community", "Events")
    }
    await this.page.waitForURL("**/events")
  }

  async navigateToCommunity() {
    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      await this.mobileMenu.getByRole("button", { name: "Community", exact: true }).click()
      await this.mobileMenu.getByRole("link", { name: "The Lab", exact: true }).click()
    } else {
      await this.clickDesktopMenuItem("Community", "The Lab")
    }
    await this.page.waitForURL("**/community")
  }

  async navigateToWorkshop() {
    // Close any open dialogs that might block the click
    await this.closeAnyOpenDialogs()

    if (await this.isMobileViewport()) {
      await this.ensureMobileMenuOpen()
      // On mobile, Workshop is inside the mobile menu
      await this.mobileMenu.getByRole("link", { name: "Workshop", exact: true }).click()
    } else {
      // On desktop, Workshop is in the header nav
      await this.page.locator("header").getByRole("link", { name: "Workshop", exact: true }).click()
    }
    await this.page.waitForURL("**/workshop")
  }

  async openCart() {
    await this.cartButton.click()
  }

  async openMobileMenu() {
    await this.mobileMenuButton.click()
  }

  async getCartCount(): Promise<number> {
    const badge = this.page.locator('[aria-label^="Shopping cart"] span')
    if (await badge.isVisible()) {
      const text = await badge.textContent()
      return text === "9+" ? 10 : parseInt(text || "0", 10)
    }
    return 0
  }
}
