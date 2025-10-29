import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

config({ path: '.env' });

// Reuse DB instance to avoid too many connections in dev HMR
declare global {
  var db: LibSQLDatabase<typeof schema> | undefined;
  var dbIsTest: boolean | undefined;
}

function createSqliteDb(url: string) {
  const client = createClient({
    url,
  });

  return drizzle(client, { schema });
}

function createTursoDb() {
  const client = createClient({
    url: process.env.DATABASE_URL_PRODUCTION!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return drizzle(client, { schema });
}

// Environment-based database selection
function createDbInstance() {
  // Check for test environment via custom env var since Next.js overrides NODE_ENV
  const isTestEnv = process.env.USE_TEST_DB === 'true';
  const environment = process.env.NODE_ENV || 'development';

  if (isTestEnv) {
    return createSqliteDb(process.env.DATABASE_URL_TEST!);
  }

  switch (environment) {
    case 'production':
      return createTursoDb();
    case 'test':
      return createSqliteDb(process.env.DATABASE_URL_TEST!);
    case 'development':
    default:
      return createSqliteDb(process.env.DATABASE_URL_DEVELOPMENT!);
  }
}

// Force refresh if we're switching to test DB
const shouldUseTestDb = process.env.USE_TEST_DB === 'true';
const currentDbIsTest = global.dbIsTest === true;

if (shouldUseTestDb !== currentDbIsTest) {
  // Environment changed, clear cached instance
  global.db = undefined;
  global.dbIsTest = shouldUseTestDb;
}

const dbInstance = global.db ?? (global.db = createDbInstance());

export const db = dbInstance;
