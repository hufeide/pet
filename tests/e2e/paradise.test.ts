/**
 * E2E tests for Pet Paradise component
 * Tests social features, player interactions, and garden chat
 */

import { test, expect } from '@playwright/test';

test.describe('Pet Paradise', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175');
    // Navigate to paradise tab
    await page.getByText('Paradise').first().click();
  });

  test('should display pet paradise container', async ({ page }) => {
    await expect(page.locator('.pet-paradise')).toBeVisible();
  });

  test('should display pet status panel', async ({ page }) => {
    await expect(page.locator('.pet-status-panel')).toBeVisible();
  });

  test('should display friendship bar', async ({ page }) => {
    await expect(page.locator('.friendship-bar')).toBeVisible();
  });

  test('should display pet actions', async ({ page }) => {
    // Check for Feed button
    await expect(page.locator('.feed-btn')).toBeVisible();
  });

  test('should display health bar', async ({ page }) => {
    await expect(page.locator('.health-bar')).toBeVisible();
  });
});
