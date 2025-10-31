#!/usr/bin/env bun

import { existsSync } from "node:fs";
import path from "node:path";

async function main() {
  const projectRoot = process.cwd();
  const binaryPath = path.resolve(projectRoot, "lib/drizzle-gateway/start");
  const storePath = path.resolve(projectRoot, "lib/drizzle-gateway/.store");
  const devDbPath = path.resolve(projectRoot, "db/databases/development.db");

  requireMasterpass();
  checkBinary(binaryPath);
  await setExecutable(binaryPath);
  await writeStore(storePath, devDbPath);

  const env = buildEnv(storePath, devDbPath);

  const portInUse = await checkPortInUse(env.PORT);
  if (portInUse) {
    console.error(`❌ Port ${env.PORT} is already in use.`);
    console.error("   Another gateway instance may be running.");
    console.error("   Kill it with: lsof -ti:4983 | xargs kill");
    process.exit(1);
  }

  logStart(env.PORT, devDbPath);

  const child = startGateway(binaryPath, projectRoot, env);
  setupShutdown(child);

  const exitCode = await child.exited;
  console.log(`\nGateway exited with code: ${exitCode}`);
  process.exit(exitCode);
}

async function checkPortInUse(port: string): Promise<boolean> {
  try {
    const result = await Bun.$`lsof -ti:${port}`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export function requireMasterpass() {
  const masterpass = Bun.env.DRIZZLE_GATEWAY_MASTERPASS || "";
  if (!masterpass) {
    console.error("❌ DRIZZLE_GATEWAY_MASTERPASS is required.");
    process.exit(1);
  }
}

export function checkBinary(binaryPath: string) {
  if (!existsSync(binaryPath)) {
    console.error("❌ Binary not found:", binaryPath);
    process.exit(1);
  }
}

export async function setExecutable(binaryPath: string) {
  await Bun.$`chmod +x ${binaryPath}`.quiet();
}

export async function writeStore(storePath: string, devDbPath: string) {
  await Bun.$`mkdir -p ${storePath}`.quiet();
  const store = {
    id: "web-template-gateway",
    slots: [
      [
        "dev-db",
        {
          id: "dev-db",
          name: "Development",
          dialect: "sqlite",
          credentials: { url: devDbPath },
        },
      ],
    ],
    name: "Web Template Databases",
  };
  await Bun.write(
    path.join(storePath, "store.json"),
    JSON.stringify(store, null, 2)
  );
}

export function buildEnv(storePath: string, devDbPath: string) {
  const port = Bun.env.DRIZZLE_GATEWAY_PORT || "4983";
  return {
    ...Bun.env,
    HOST: "127.0.0.1",
    PORT: port,
    MASTERPASS: Bun.env.DRIZZLE_GATEWAY_MASTERPASS!,
    STORE_PATH: storePath,
    DATABASE_URL: devDbPath,
  };
}

export function logStart(port: string, devDbPath: string) {
  console.log("\n🚀 Starting Drizzle Studio (Dev)");
  console.log(`   URL:   http://127.0.0.1:${port}`);
  console.log(`   DB:    ${devDbPath}`);
  console.log("   Auth:  MASTERPASS required\n");
}

export function startGateway(
  binaryPath: string,
  projectRoot: string,
  env: Record<string, string>
) {
  return Bun.spawn({
    cmd: [binaryPath],
    cwd: projectRoot,
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });
}

export function setupShutdown(child: ReturnType<typeof Bun.spawn>) {
  let isShuttingDown = false;

  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("\n⏹️  Stopping Drizzle Studio...");
    try {
      child.kill();
    } catch {
      // Ignore errors if process already dead
    }
  };

  const gracefulExit = () => {
    shutdown();
    process.exit(0);
  };

  process.on("SIGINT", gracefulExit);
  process.on("SIGTERM", gracefulExit);

  // Ensure child is killed when parent exits for any reason
  process.on("exit", () => {
    shutdown();
  });

  // Also handle uncaught errors
  process.on("uncaughtException", (err) => {
    shutdown();
    throw err;
  });
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Gateway failed to start:", err);
    process.exit(1);
  });
}
