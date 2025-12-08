import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const environment = process.env.NODE_ENV || 'development';

// Load environment-specific .env file
config({ path: '.env', quiet: true });
if (environment === 'development') {
  config({ path: '.env.development', override: true, quiet: true });
} else if (environment === 'test') {
  config({ path: '.env.test', override: true, quiet: true });
} else if (environment === 'production') {
  config({ path: '.env.production', override: true, quiet: true });
}

// Use DATABASE_URL from the loaded environment file
const getDatabaseUrl = () => {
  return process.env.DATABASE_URL!;
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
