import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env', quiet: true });

const environment = process.env.NODE_ENV || 'development';

// Environment-specific database URLs
const getDatabaseUrl = () => {
  switch (environment) {
    case 'production':
      return process.env.DATABASE_URL_PRODUCTION!;
    case 'test':
      return process.env.DATABASE_URL_TEST!;
    case 'development':
    default:
      return process.env.DATABASE_URL_DEVELOPMENT!;
  }
};

// Environment-specific dialect
const getDialect = () => {
  return environment === 'production' ? 'turso' : 'sqlite';
};

// Environment-specific credentials
const getDbCredentials = () => {
  if (environment === 'production') {
    return {
      url: getDatabaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN!,
    };
  }
  return {
    url: getDatabaseUrl(),
  };
};

// Single migrations folder for all environments (like Rails db/migrate/)
// The same migrations are run against dev, test, and production databases
// Only the database URL changes per environment
export default defineConfig({
  schema: 'db/schema.ts',
  out: 'db/migrations',
  dialect: getDialect() as 'sqlite' | 'turso',
  dbCredentials: getDbCredentials(),
});
