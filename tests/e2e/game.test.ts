/**
 * E2E tests for Adventure Ultimate component
 * Tests gameplay, physics, and UI elements
 */

import { test, expect } from '@playwright/test';

test.describe('Adventure Ultimate Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175');
    // Navigate to ultimate tab
    await page.getByText('Ultimate').first().click();
  });

  test('should display ultimate panel', async ({ page }) => {
    await expect(page.locator('.adventure-ultimate-panel')).toBeVisible();
  });

  test('should display game container', async ({ page }) => {
    await expect(page.locator('.game-container')).toBeVisible();
  });

  test('should display player health', async ({ page }) => {
    await expect(page.locator('.stat.health')).toBeVisible();
    // Health should show 3/3 initially
    await expect(page.locator('.stat.health')).toContainText('3/3');
  });

  test('should display gameTime', async ({ page }) => {
    await expect(page.locator('.stat.time')).toBeVisible();
  });

  test('should display phase indicator', async ({ page }) => {
    await expect(page.locator('.phase-badge')).toBeVisible();
  });

  test('should display score', async ({ page }) => {
    await expect(page.locator('.stat.score')).toBeVisible();
  });

  test('should show death count', async ({ page }) => {
    const deathsElement = page.locator('.stat.deaths');
    await expect(deathsElement).toBeVisible();
    // Should have initial value of 0
    await expect(deathsElement).toContainText('0');
  });

  test('should display narrative overlay when message is present', async ({ page }) => {
    await expect(page.locator('.narrative-overlay')).toBeVisible();
  });
});
