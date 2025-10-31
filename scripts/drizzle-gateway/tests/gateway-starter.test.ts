import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  buildEnv,
  checkBinary,
  requireMasterpass,
  writeStore,
} from "../gateway-starter";
import { existsSync } from "node:fs";
import path from "node:path";
import { rm } from "node:fs/promises";

describe("drizzle-gateway", () => {
  const testStorePath = path.join(process.cwd(), ".test-store");

  beforeEach(async () => {
    if (existsSync(testStorePath)) {
      await rm(testStorePath, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    if (existsSync(testStorePath)) {
      await rm(testStorePath, { recursive: true, force: true });
    }
  });

  describe("requireMasterpass", () => {
    test("should exit if MASTERPASS is not set", () => {
      const originalEnv = Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      delete Bun.env.DRIZZLE_GATEWAY_MASTERPASS;

      let exitCalled = false;
      const originalExit = process.exit;
      const originalError = console.error;
      console.error = () => {}; // Silence error output during test
      process.exit = ((code?: number) => {
        exitCalled = true;
        expect(code).toBe(1);
      }) as typeof process.exit;

      requireMasterpass();
      expect(exitCalled).toBe(true);

      process.exit = originalExit;
      console.error = originalError;
      if (originalEnv) {
        Bun.env.DRIZZLE_GATEWAY_MASTERPASS = originalEnv;
      }
    });

    test("should not exit if MASTERPASS is set", () => {
      const originalEnv = Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      Bun.env.DRIZZLE_GATEWAY_MASTERPASS = "test-password";

      let exitCalled = false;
      const originalExit = process.exit;
      process.exit = (() => {
        exitCalled = true;
      }) as typeof process.exit;

      requireMasterpass();
      expect(exitCalled).toBe(false);

      process.exit = originalExit;
      if (originalEnv) {
        Bun.env.DRIZZLE_GATEWAY_MASTERPASS = originalEnv;
      } else {
        delete Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      }
    });
  });

  describe("checkBinary", () => {
    test("should exit if binary does not exist", () => {
      const nonExistentPath = "/non/existent/path/to/binary";

      let exitCalled = false;
      const originalExit = process.exit;
      const originalError = console.error;
      console.error = () => {}; // Silence error output during test
      process.exit = ((code?: number) => {
        exitCalled = true;
        expect(code).toBe(1);
      }) as typeof process.exit;

      checkBinary(nonExistentPath);
      expect(exitCalled).toBe(true);

      process.exit = originalExit;
      console.error = originalError;
    });

    test("should not exit if binary exists", () => {
      const existingPath = process.cwd();

      let exitCalled = false;
      const originalExit = process.exit;
      process.exit = (() => {
        exitCalled = true;
      }) as typeof process.exit;

      checkBinary(existingPath);
      expect(exitCalled).toBe(false);

      process.exit = originalExit;
    });
  });

  describe("writeStore", () => {
    test("should create store.json with correct structure", async () => {
      const devDbPath = path.resolve(
        process.cwd(),
        "db/databases/development.db"
      );

      await writeStore(testStorePath, devDbPath);

      expect(existsSync(testStorePath)).toBe(true);
      const storeFile = path.join(testStorePath, "store.json");
      expect(existsSync(storeFile)).toBe(true);

      const storeContent = await Bun.file(storeFile).json();
      expect(storeContent.id).toBe("web-template-gateway");
      expect(storeContent.name).toBe("Web Template Databases");
      expect(storeContent.slots).toHaveLength(1);
      expect(storeContent.slots[0][0]).toBe("dev-db");
      expect(storeContent.slots[0][1].credentials.url).toBe(devDbPath);
      expect(storeContent.slots[0][1].dialect).toBe("sqlite");
    });
  });

  describe("buildEnv", () => {
    test("should build env with default port", () => {
      const originalPort = Bun.env.DRIZZLE_GATEWAY_PORT;
      const originalMasterpass = Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      delete Bun.env.DRIZZLE_GATEWAY_PORT;
      Bun.env.DRIZZLE_GATEWAY_MASTERPASS = "test-password";

      const storePath = "/test/store";
      const devDbPath = "/test/db/development.db";

      const env = buildEnv(storePath, devDbPath);

      expect(env.HOST).toBe("127.0.0.1");
      expect(env.PORT).toBe("4983");
      expect(env.MASTERPASS).toBe("test-password");
      expect(env.STORE_PATH).toBe(storePath);
      expect(env.DATABASE_URL).toBe(devDbPath);

      if (originalPort) {
        Bun.env.DRIZZLE_GATEWAY_PORT = originalPort;
      }
      if (originalMasterpass) {
        Bun.env.DRIZZLE_GATEWAY_MASTERPASS = originalMasterpass;
      } else {
        delete Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      }
    });

    test("should build env with custom port", () => {
      const originalMasterpass = Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      Bun.env.DRIZZLE_GATEWAY_PORT = "5000";
      Bun.env.DRIZZLE_GATEWAY_MASTERPASS = "test-password";

      const storePath = "/test/store";
      const devDbPath = "/test/db/development.db";

      const env = buildEnv(storePath, devDbPath);

      expect(env.PORT).toBe("5000");

      delete Bun.env.DRIZZLE_GATEWAY_PORT;
      if (originalMasterpass) {
        Bun.env.DRIZZLE_GATEWAY_MASTERPASS = originalMasterpass;
      } else {
        delete Bun.env.DRIZZLE_GATEWAY_MASTERPASS;
      }
    });
  });
});
