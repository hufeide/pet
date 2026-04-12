import { test, expect } from '@playwright/test';

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
  });

  test('should navigate to Chat tab', async ({ page }) => {
    // Click on Chat tab in navigation (use getByText to avoid role issues)
    await page.getByText('Chat').first().click();

    // Check that Chat tab is active by checking the chat container is visible
    await expect(page.locator('.chat-container')).toBeVisible();
  });

  test('should display chat history container', async ({ page }) => {
    await page.getByText('Chat').first().click();

    // Check chat history container exists
    await expect(page.locator('.chat-history')).toBeVisible();
  });

  test('should display chat input area', async ({ page }) => {
    await page.getByText('Chat').first().click();

    // Check textarea exists
    await expect(page.locator('.chat-input textarea')).toBeVisible();

    // Check send button exists
    await expect(page.locator('.chat-input button')).toBeVisible();
  });

  test('should show loading state when sending message', async ({ page }) => {
    await page.getByText('Chat').first().click();

    const textarea = page.locator('.chat-input textarea');
    const sendButton = page.locator('.chat-input button');

    // Type a message
    await textarea.fill('你好');

    // Click send
    await sendButton.click();

    // Wait for loading state
    await expect(page.locator('.loading-dots')).toBeVisible({ timeout: 10000 });
  });

  test('should display user message after sending', async ({ page }) => {
    await page.getByText('Chat').first().click();

    const textarea = page.locator('.chat-input textarea');
    const sendButton = page.locator('.chat-input button');
    const userMessage = '你好， pet';

    // Type and send message
    await textarea.fill(userMessage);
    await sendButton.click();

    // Wait for loading to finish
    await page.waitForSelector('.loading-dots', { state: 'detached', timeout: 15000 });

    // Check user message is displayed
    await expect(page.getByText(userMessage)).toBeVisible();
  });

  test('should display AI response after sending message', async ({ page }) => {
    await page.getByText('Chat').first().click();

    const textarea = page.locator('.chat-input textarea');
    const sendButton = page.locator('.chat-input button');

    // Send a message
    await textarea.fill('你好');
    await sendButton.click();

    // Wait for AI response
    await page.waitForSelector('.loading-dots', { state: 'detached', timeout: 15000 });

    // Check AI response is displayed (should contain assistant message class)
    await expect(page.locator('.message-assistant')).toHaveText(/.*./, { timeout: 10000 });
  });
});
