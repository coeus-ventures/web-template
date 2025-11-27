import "@testing-library/jest-dom/vitest";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
dotenv.config({ path: '.env' });
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true });
}

// Database setup and cleanup for tests
import { beforeAll } from "vitest";
import { db } from "@/db";
import { migrate } from "drizzle-orm/libsql/migrator";

// Run migrations for in-memory database
// Uses the same migrations as dev/production (Rails-style single migration folder)
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "db/migrations" });
});
