import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('should display main content', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('main');
    await expect(heading).toBeVisible();
  });
});
