import { test, expect } from '@playwright/test';

test.describe('Adventure Ultimate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175');
    // Navigate to ultimate tab
    await page.getByText('Ultimate').first().click();
  });

  test('should navigate to Ultimate tab', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    await expect(page.locator('.adventure-ultimate-panel')).toBeVisible();
  });

  test('should display game container', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    await expect(page.locator('.game-container')).toBeVisible();
  });

  test('should display player health', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    await expect(page.locator('.stat.health')).toBeVisible();
  });

  test('should display gameTime', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    await expect(page.locator('.stat.time')).toBeVisible();
  });

  test('should show player starting with full health', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    // Health should show 3/3 initially
    await expect(page.locator('.stat.health')).toContainText('3/3');
  });

  test('should display phase indicator', async ({ page }) => {
    await page.getByText('Ultimate').first().click();
    await expect(page.locator('.phase-badge')).toBeVisible();
  });
});
