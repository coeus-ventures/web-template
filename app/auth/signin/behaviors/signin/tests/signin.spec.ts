import { test, expect } from '@playwright/test';
import { userSeed } from '@/db/seed/user.seed';

const baseUrl = 'http://localhost:8080';

// Override storage state to test unauthenticated signin flow
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Signin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/auth/signin`);
  });

  test('should successfully signin with valid inputs', async ({ page }) => {

    // Fill in valid form data
    await page.fill('input#email', userSeed.email);
    await page.fill('input#password', userSeed.password);
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should redirect to dashboard after successful signup
    await page.waitForURL(`${baseUrl}/home`, { timeout: 10000 });
    
    // Verify we're on the dashboard
    expect(page.url()).toBe(`${baseUrl}/home`);
  });


});