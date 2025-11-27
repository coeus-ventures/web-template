import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

// When NODE_ENV=test, load .env.test, otherwise load .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile, quiet: true });

// Reuse DB instance to avoid too many connections in dev HMR
declare global {
  var db: LibSQLDatabase<typeof schema> | undefined;
}

function createDbInstance() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_DATABASE_TOKEN,
  });

  return drizzle(client, { schema });
}

const dbInstance = global.db ?? (global.db = createDbInstance());

export const db = dbInstance;
