import "@testing-library/jest-dom/vitest";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
dotenv.config({ path: ".env", quiet: true });
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test", override: true, quiet: true });
} else if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production", override: true, quiet: true });
}

// Set required environment variables for tests if not already set
// IMPORTANT: These must be set BEFORE any Better Auth imports
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:8080";
}
if (!process.env.BETTER_AUTH_URL) {
  process.env.BETTER_AUTH_URL = "http://localhost:8080";
}
if (!process.env.BETTER_AUTH_SECRET) {
  // Generate a test secret if not provided (must be at least 32 chars)
  process.env.BETTER_AUTH_SECRET =
    "test-secret-key-for-testing-only-32-chars-min";
}

// Database setup and cleanup for tests
import { beforeAll } from "vitest";
import { db } from "@/db";
import { migrate } from "drizzle-orm/libsql/migrator";

// Run migrations for in-memory database
// Uses the same migrations as dev/production (Rails-style single migration folder)
// For in-memory databases, if tables already exist, the migration will fail gracefully
beforeAll(async () => {
  try {
    await migrate(db, { migrationsFolder: "db/migrations" });
  } catch (error: unknown) {
    // If migration fails because tables already exist, that's okay for in-memory DB
    // The error "table already exists" is expected when reusing connections
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("already exists")) {
      // Re-throw if it's a different error
      throw error;
    }
    // Silently ignore "table already exists" errors for in-memory databases
  }
});
