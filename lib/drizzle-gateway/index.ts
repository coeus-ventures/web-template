#!/usr/bin/env bun

import { existsSync } from "node:fs";
import path from "node:path";

async function main() {
  const projectRoot = process.cwd();
  const binaryPath = path.resolve(projectRoot, "lib/drizzle-gateway/start");
  const storePath = path.resolve(projectRoot, "lib/drizzle-gateway/.store");
  const devDbPath = path.resolve(projectRoot, "db/databases/development.db");

  if (!existsSync(binaryPath)) {
    console.error("❌ Binary not found:", binaryPath);
    process.exit(1);
  }
  await Bun.$`chmod +x ${binaryPath}`.quiet();

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

  const port = Bun.env.DRIZZLE_GATEWAY_PORT || "4983";
  const env = {
    ...Bun.env,
    HOST: "127.0.0.1",
    PORT: port,
    STORE_PATH: storePath,
    DATABASE_URL: devDbPath,
  };

  console.log("\n🚀 Starting Drizzle Studio (Dev)");
  console.log(`   URL:   http://127.0.0.1:${port}`);
  console.log(`   DB:    ${devDbPath}\n`);

  const child = Bun.spawn({
    cmd: [binaryPath],
    cwd: projectRoot,
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });

  process.on("SIGINT", () => {
    console.log("\n⏹️  Stopping Drizzle Studio...");
    child.kill();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    console.log("\n⏹️  Stopping Drizzle Studio...");
    child.kill();
    process.exit(0);
  });

  const exitCode = await child.exited;
  console.log(`\nGateway exited with code: ${exitCode}`);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("❌ Gateway failed to start:", err);
  process.exit(1);
});
