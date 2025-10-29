import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

config({ path: ".env" });

// Reuse DB instance to avoid too many connections in dev HMR
declare global {
  var db: LibSQLDatabase<typeof schema> | undefined;
  var dbIsTest: boolean | undefined;
}

// Create test database (in-memory SQLite)
// Note: Migrations are run in vitest.setup.ts before tests start
function createTestDb() {
  const client = createClient({
    url: process.env.DATABASE_URL_TEST!,
  });

  return drizzle(client, { schema });
}

// Create development database (file-based SQLite)
function createDevDb() {
  const client = createClient({
    url: process.env.DATABASE_URL_DEVELOPMENT!,
  });

  return drizzle(client, { schema });
}

// Create production database (Turso)
function createProdDb() {
  const client = createClient({
    url: process.env.DATABASE_URL_PRODUCTION!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return drizzle(client, { schema });
}

// Environment-based database selection
function createDbInstance() {
  // Check for test environment via custom env var since Next.js overrides NODE_ENV
  const isTestEnv = process.env.USE_TEST_DB === "true";
  const environment = process.env.NODE_ENV || "development";

  if (isTestEnv || environment === 'test') {
    return createTestDb();
  }

  if (environment === 'production') {
    return createProdDb();
  }

  return createDevDb();
}

// Force refresh if we're switching to test DB
const shouldUseTestDb = process.env.USE_TEST_DB === "true";
const currentDbIsTest = global.dbIsTest === true;

if (shouldUseTestDb !== currentDbIsTest) {
  // Environment changed, clear cached instance
  global.db = undefined;
  global.dbIsTest = shouldUseTestDb;
}

const dbInstance = global.db ?? (global.db = createDbInstance());

export const db = dbInstance;
