import "@testing-library/jest-dom/vitest";
import { config } from "dotenv";

// Load environment variables
config({ path: '.env', quiet: true });

// Database setup and cleanup for tests
import { beforeAll } from "vitest";
import { db } from "@/db";
import { migrate } from "drizzle-orm/libsql/migrator";

// Run migrations for in-memory database
// Uses the same migrations as dev/production (Rails-style single migration folder)
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "db/migrations" });
});
