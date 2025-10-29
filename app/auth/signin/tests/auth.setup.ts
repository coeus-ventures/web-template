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

  // Wait for successful login
  await page.waitForURL(HOME_URL);

  // Save signed-in state to 'playwright/.auth/user.json'
  await page.context().storageState({ path: authFile });
});