import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
dotenv.config({ path: '.env', quiet: true });
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true, quiet: true });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true, quiet: true });
}

const baseURL = process.env.BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project - runs first to authenticate
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // Test project - depends on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json', // Use saved auth
      },
      dependencies: ['setup'], // Run setup first
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
