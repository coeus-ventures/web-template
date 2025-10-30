#!/usr/bin/env bun

/**
 * Drizzle Gateway - Production Server
 *
 * Secure database administration gateway for production environments.
 * - Runs on internal port (not exposed externally)
 * - Protected by MASTERPASS authentication
 * - Accessible only through /admin route with user authentication
 *
 * Usage:
 *   bun run lib/drizzle-gateway/index.ts
 *   bun run drizzle:gateway
 */

import { existsSync } from "node:fs";
import path from "node:path";

// Parse environment variables from .env
if (existsSync(".env")) {
  const envFile = Bun.file(".env");
  const envContent = await envFile.text();
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        let value = values.join("=");
        // Remove surrounding quotes
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        Bun.env[key] = value;
      }
    }
  });
}

/**
 * Resolve database URL for the target environment
 */
function resolveDatabaseUrl(): string {
  const env = Bun.env.NODE_ENV || "development";

  // Select database based on environment
  let dbUrl: string | undefined;
  if (env === "production") {
    dbUrl = Bun.env.DATABASE_URL_PRODUCTION || Bun.env.DATABASE_URL;
  } else if (env === "test") {
    dbUrl = Bun.env.DATABASE_URL_TEST;
  } else {
    dbUrl = Bun.env.DATABASE_URL_DEVELOPMENT || Bun.env.DATABASE_URL;
  }

  if (!dbUrl || dbUrl.trim().length === 0) {
    // Fallback to development database
    const projectRoot = process.cwd();
    return path.resolve(projectRoot, "db/databases/development.db");
  }

  const url = dbUrl.trim();

  // Strip file: prefix if present and convert to absolute path
  if (url.startsWith("file:")) {
    const projectRoot = process.cwd();
    const filePath = url.replace(/^file:/, "");

    if (!path.isAbsolute(filePath)) {
      return path.resolve(projectRoot, filePath);
    }
    return filePath;
  }

  // Handle relative paths
  if (!url.includes("://") && !path.isAbsolute(url)) {
    const projectRoot = process.cwd();
    return path.resolve(projectRoot, url);
  }

  return url;
}

/**
 * Initialize Gateway store with correct database configurations
 */
async function initializeStore(storePath: string) {
  const storeFile = path.join(storePath, "store.json");
  const projectRoot = process.cwd();

  // Define all database connections
  const devDb = Bun.env.DATABASE_URL_DEVELOPMENT?.replace(/^file:/, "") ||
    path.resolve(projectRoot, "db/databases/development.db");
  const testDb = Bun.env.DATABASE_URL_TEST?.replace(/^file:/, "") ||
    path.resolve(projectRoot, "db/databases/test.db");
  const prodDb = Bun.env.DATABASE_URL_PRODUCTION?.replace(/^file:/, "") ||
    path.resolve(projectRoot, "db/databases/production.db");

  const storeConfig = {
    id: "web-template-gateway",
    slots: [
      [
        "dev-db",
        {
          id: "dev-db",
          name: "Development",
          dialect: "sqlite",
          credentials: {
            url: path.isAbsolute(devDb) ? devDb : path.resolve(projectRoot, devDb),
          },
        },
      ],
      [
        "test-db",
        {
          id: "test-db",
          name: "Test",
          dialect: "sqlite",
          credentials: {
            url: path.isAbsolute(testDb) ? testDb : path.resolve(projectRoot, testDb),
          },
        },
      ],
      [
        "prod-db",
        {
          id: "prod-db",
          name: "Production",
          dialect: "sqlite",
          credentials: {
            url: path.isAbsolute(prodDb) ? prodDb : path.resolve(projectRoot, prodDb),
          },
        },
      ],
    ],
    name: "Web Template Databases",
  };

  await Bun.write(storeFile, JSON.stringify(storeConfig, null, 2));
}

async function main() {
  const projectRoot = process.cwd();
  const gatewayDir = path.resolve(projectRoot, "lib/drizzle-gateway");
  const binaryPath = path.resolve(gatewayDir, "start");
  const storePath = path.resolve(gatewayDir, ".store");

  // Ensure binary exists
  if (!existsSync(binaryPath)) {
    console.error("❌ Gateway binary not found at:", binaryPath);
    console.error("   Please ensure the binary is in lib/drizzle-gateway/start");
    process.exit(1);
  }

  // Ensure binary is executable
  await Bun.$`chmod +x ${binaryPath}`.quiet();

  // Create store directory and initialize configuration
  await Bun.$`mkdir -p ${storePath}`.quiet();
  await initializeStore(storePath);

  const dbUrl = resolveDatabaseUrl();
  const port = Bun.env.DRIZZLE_GATEWAY_PORT || "4983";
  const masterpass = Bun.env.DRIZZLE_GATEWAY_MASTERPASS || "";

  if (!masterpass) {
    console.warn("⚠️  WARNING: No DRIZZLE_GATEWAY_MASTERPASS set!");
    console.warn("   Add DRIZZLE_GATEWAY_MASTERPASS to .env for security");
  }

  const env = {
    ...Bun.env,
    DATABASE_URL: dbUrl,
    STORE_PATH: storePath,
    PORT: port,
    MASTERPASS: masterpass,
    // Bind to localhost only (not 0.0.0.0) for security
    HOST: "127.0.0.1",
  };

  console.log("\n🚀 Starting Drizzle Gateway (Production Mode)");
  console.log(`   Environment:  ${Bun.env.NODE_ENV || "development"}`);
  console.log(`   Internal URL: http://127.0.0.1:${port}`);
  console.log(`   Public URL:   https://yourdomain.com/admin`);
  console.log(`   Database:     ${dbUrl}`);
  console.log(`   Store:        ${storePath}`);
  console.log(`   Protected:    ${masterpass ? "✓ Yes" : "✗ No (WARNING!)"}\n`);

  // Spawn Gateway process
  const child = Bun.spawn({
    cmd: [binaryPath],
    cwd: projectRoot,
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });

  // Graceful shutdown
  const shutdownHandler = () => {
    console.log("\n\n⏹️  Shutting down Drizzle Gateway...");
    child.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdownHandler);
  process.on("SIGTERM", shutdownHandler);

  // Wait for exit
  const exitCode = await child.exited;
  console.log(`\nGateway exited with code: ${exitCode}`);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("❌ Gateway failed to start:", err);
  process.exit(1);
});
