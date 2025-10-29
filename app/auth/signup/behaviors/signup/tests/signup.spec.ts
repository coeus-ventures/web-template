import { test, expect } from "@playwright/test";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const baseUrl = "http://localhost:8080";

test.describe("Signup Flow", () => {
  const createdEmails: string[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/auth/signup`);
  });

  test.afterEach(async () => {
    // Clean up users created during tests
    for (const email of createdEmails) {
      try {
        await db.delete(user).where(eq(user.email, email));
      } catch (error) {
        console.warn(`Failed to delete test user ${email}:`, error);
      }
    }
    createdEmails.length = 0; // Clear the array
  });

  test("should successfully create account with valid inputs", async ({
    page,
  }) => {
    // Generate unique email to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    createdEmails.push(uniqueEmail); // Track for cleanup

    // Fill in valid form data (no name field anymore)
    await page.fill("input#email", uniqueEmail);
    await page.fill("input#password", "securePassword123");
    await page.fill("input#confirmPassword", "securePassword123");

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard after successful signup
    await page.waitForURL(`${baseUrl}/home`, { timeout: 10000 });

    // Verify we're on the dashboard
    expect(page.url()).toBe(`${baseUrl}/home`);
  });
});
