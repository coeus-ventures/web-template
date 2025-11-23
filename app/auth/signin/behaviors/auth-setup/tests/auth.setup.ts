import { test as setup } from '@playwright/test';
import { userSeed } from '@/db/seed/user.seed';
import { HOME_URL, SIGNIN_URL } from '@/app.config';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto(SIGNIN_URL);
  await page.fill('input[name="email"]', userSeed.email);
  await page.fill('input[name="password"]', userSeed.password);
  await page.click('button[type="submit"]');

  // Wait for successful login with robust error handling
  try {
    await page.waitForURL(HOME_URL, { timeout: 10000 }); // 10 second timeout
  } catch (error) {
    // Capture error messages
    const errorElement = await page.locator('[role="alert"]').textContent().catch(() => null);
    console.error('Login failed with error:', errorElement);
    console.error('Current URL:', page.url());

    // Screenshot for debugging
    await page.screenshot({ path: 'playwright/.auth/auth-setup-failed.png' });

    throw new Error(`Failed to login. Current URL: ${page.url()}`);
  }

  // Save signed-in state to 'playwright/.auth/user.json'
  await page.context().storageState({ path: authFile });
});