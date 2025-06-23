import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TEST_URLS } from '../fixtures/auth-fixtures';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardTitle = page.locator(SELECTORS.dashboardTitle);
    this.welcomeMessage = page.locator(SELECTORS.welcomeMessage);
    this.userMenu = page.locator(SELECTORS.userMenu);
    this.logoutButton = page.locator(SELECTORS.logoutButton);
  }

  async goto() {
    await this.page.goto(TEST_URLS.dashboard);
  }

  async logout() {
    // Open user menu if it exists
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
    }
    
    await this.logoutButton.click();
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(new RegExp(TEST_URLS.dashboard));
    await expect(this.dashboardTitle).toBeVisible();
  }

  async expectWelcomeMessage(userName: string) {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.welcomeMessage).toContainText(userName);
  }

  async expectUserToBeLoggedIn() {
    // Check if user menu or logout button is visible
    const isLoggedIn = await this.userMenu.isVisible() || await this.logoutButton.isVisible();
    expect(isLoggedIn).toBeTruthy();
  }

  async expectProtectedContent() {
    // Verify that protected dashboard content is visible
    await expect(this.dashboardTitle).toBeVisible();
    
    // Check for specific dashboard elements that should only be visible to authenticated users
    const protectedElements = [
      '[data-testid="portfolio-chart"]',
      '[data-testid="recent-transactions"]',
      '[data-testid="quick-actions"]'
    ];

    for (const selector of protectedElements) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  }

  async waitForDashboardToLoad() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.dashboardTitle).toBeVisible({ timeout: 10000 });
  }
}
