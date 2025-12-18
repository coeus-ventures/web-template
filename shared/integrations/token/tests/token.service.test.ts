import { describe, it, expect, beforeEach } from "vitest";
import { sql, eq } from "drizzle-orm";
import { PreDB } from "@/lib/db-test/predb";
import { PostDB } from "@/lib/db-test/postdb";
import { db } from "@/db";
import { authTokens, magicLinks } from "@/db/schema";
import { TokenService } from "../token.service";

// Use the app's db which loads :memory: when NODE_ENV=test
const testDb = db;
const schema = { authTokens, magicLinks };

describe("TokenService", () => {
  beforeEach(async () => {
    // Reset tables before each test
    await PreDB(testDb, schema, {
      auth_tokens: [],
      magic_links: [],
    });
  });

  describe("issueOneTimeLoginToken", () => {
    it("should create a new token with all parameters", async () => {
      const email = "test@example.com";
      const callbackUrl = "/dashboard";
      const uaHash = "test-ua-hash";

      const tokenUrl = await TokenService.issueOneTimeLoginToken(
        email,
        callbackUrl,
        uaHash
      );

      // Verify URL format
      expect(tokenUrl).toMatch(/\/auth\/token\?token=.+/);

      // Extract token from URL
      const token = new URL(tokenUrl).searchParams.get("token");
      expect(token).toBeTruthy();

      // Verify database state - should have exactly 1 token with correct data
      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        token,
        email,
        callbackUrl,
        uaHash,
        consumedAt: null,
      });
      expect(typeof tokens[0].expiresAt).toBe("number");
      expect(typeof tokens[0].createdAt).toBe("number");
    });

    it("should create token with default callback url when optional params omitted", async () => {
      const email = "test@example.com";

      await TokenService.issueOneTimeLoginToken(email);

      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        email,
        callbackUrl: "/home", // Default callback URL
        uaHash: null,
        consumedAt: null,
      });
    });

    it("should generate unique tokens for multiple calls", async () => {
      const email = "test@example.com";

      const url1 = await TokenService.issueOneTimeLoginToken(email);
      const url2 = await TokenService.issueOneTimeLoginToken(email);

      const token1 = new URL(url1).searchParams.get("token");
      const token2 = new URL(url2).searchParams.get("token");

      expect(token1).not.toBe(token2);

      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(2);
    });
  });

  describe("validateAndConsume", () => {
    it("should validate and return data for valid token", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "valid-token",
            email: "test@example.com",
            callbackUrl: "/dashboard",
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.validateAndConsume("valid-token");

      expect(result).toEqual({
        email: "test@example.com",
        callbackUrl: "/dashboard",
        uaHash: undefined,
      });
    });

    it("should return null for non-existent token", async () => {
      const result = await TokenService.validateAndConsume("non-existent");

      expect(result).toBeNull();
    });

    it("should return null for consumed token", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const consumedTime = new Date(now.getTime() - 5 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "consumed-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: consumedTime,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.validateAndConsume("consumed-token");

      expect(result).toBeNull();
    });

    it("should validate UA hash when both present and matching", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const uaHash = "matching-hash";

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "ua-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.validateAndConsume("ua-token", uaHash);

      expect(result).toEqual({
        email: "test@example.com",
        callbackUrl: "/home",
        uaHash,
      });
    });

    it("should return null when UA hash does not match", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "ua-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: "correct-hash",
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.validateAndConsume(
        "ua-token",
        "wrong-hash"
      );

      expect(result).toBeNull();
    });

    it("should use default callback URL when none provided", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "token-no-callback",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.validateAndConsume("token-no-callback");

      expect(result?.callbackUrl).toBe("/home");
    });
  });

  describe("hashUserAgent", () => {
    it("should generate consistent hash for same inputs", () => {
      const userAgent = "Mozilla/5.0";
      const ip = "192.168.1.1";

      const hash1 = TokenService.hashUserAgent(userAgent, ip);
      const hash2 = TokenService.hashUserAgent(userAgent, ip);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 produces 64 hex chars
    });

    it("should generate different hashes for different inputs", () => {
      const hash1 = TokenService.hashUserAgent("Mozilla/5.0", "192.168.1.1");
      const hash2 = TokenService.hashUserAgent("Chrome/90.0", "192.168.1.1");
      const hash3 = TokenService.hashUserAgent("Mozilla/5.0", "192.168.1.2");

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    it("should handle null user agent", () => {
      const hash = TokenService.hashUserAgent(null, "192.168.1.1");

      expect(hash).toHaveLength(64);
      expect(hash).toBeTruthy();
    });
  });

  describe("hasValidToken", () => {
    it("should return true when valid token exists", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "valid-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const hasToken = await TokenService.hasValidToken("test@example.com");

      expect(hasToken).toBe(true);
    });

    it("should return false when no tokens exist for email", async () => {
      const hasToken = await TokenService.hasValidToken(
        "nonexistent@example.com"
      );

      expect(hasToken).toBe(false);
    });

    it("should return false when only consumed tokens exist", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const consumedTime = new Date(now.getTime() - 5 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "consumed-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: consumedTime,
            createdAt: now,
          },
        ],
      });

      const hasToken = await TokenService.hasValidToken("test@example.com");

      expect(hasToken).toBe(false);
    });

    it("should return true when at least one valid token exists among multiple", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const consumedTime = new Date(now.getTime() - 5 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "consumed-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: consumedTime,
            createdAt: now,
          },
          {
            token: "valid-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const hasToken = await TokenService.hasValidToken("test@example.com");

      expect(hasToken).toBe(true);
    });
  });

  describe("invalidateTokensForEmail", () => {
    it("should mark all valid tokens as consumed", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "token1",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
          {
            token: "token2",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const count = await TokenService.invalidateTokensForEmail(
        "test@example.com"
      );

      expect(count).toBe(2);

      // Verify all tokens are now consumed
      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(2);
      tokens.forEach((token) => {
        expect(typeof token.consumedAt).toBe("number");
      });
    });

    it("should not affect already consumed tokens", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const consumedTime = new Date(now.getTime() - 5 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "already-consumed",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: consumedTime,
            createdAt: now,
          },
          {
            token: "valid-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      const count = await TokenService.invalidateTokensForEmail(
        "test@example.com"
      );

      expect(count).toBe(1); // Only one token was updated
    });

    it("should not affect tokens for other emails", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "token1",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
          {
            token: "token2",
            email: "other@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      await TokenService.invalidateTokensForEmail("test@example.com");

      // Verify other email's token is still valid
      const otherToken = await testDb
        .select()
        .from(authTokens)
        .where(sql`token = 'token2'`);
      expect(otherToken[0].consumedAt).toBeNull();
    });

    it("should return 0 when no valid tokens exist for email", async () => {
      const count = await TokenService.invalidateTokensForEmail(
        "nonexistent@example.com"
      );

      expect(count).toBe(0);
    });

    it("should handle timestamp serialization correctly (simulating production error)", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "error-test-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: now,
          },
        ],
      });

      // This test validates that timestamps are stored as Unix milliseconds (not Date objects)
      const count = await TokenService.invalidateTokensForEmail(
        "test@example.com"
      );

      expect(count).toBe(1);

      // Verify the consumedAt was set correctly as Unix timestamp
      const tokens = await testDb
        .select()
        .from(authTokens)
        .where(eq(authTokens.token, "error-test-token"));

      expect(tokens).toHaveLength(1);
      expect(typeof tokens[0].consumedAt).toBe("number");
      expect(tokens[0].consumedAt).not.toBeNull();

      // Verify it's a valid recent timestamp (within last minute)
      const consumedTime = tokens[0].consumedAt as number;
      const timeDiff = Math.abs(consumedTime - now.getTime());
      expect(timeDiff).toBeLessThan(60 * 1000); // Should be within 1 minute
    });
  });

  describe("cleanup", () => {
    it("should delete tokens created more than 24 hours ago", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const oldCreatedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recentCreatedAt = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "old-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: oldCreatedAt,
          },
          {
            token: "recent-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: recentCreatedAt,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.tokens).toBe(1); // Only old token deleted (based on createdAt)

      await PostDB(testDb, schema, {
        auth_tokens: [
          {
            token: "recent-token",
            email: "test@example.com",
          },
        ],
      });
    });

    it("should delete all tokens older than 24 hours regardless of consumed status", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const oldCreatedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "old-unconsumed",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: oldCreatedAt,
          },
          {
            token: "old-consumed",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: oldCreatedAt,
            createdAt: oldCreatedAt,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.tokens).toBe(2); // Both old tokens deleted (based on createdAt)

      await PostDB(testDb, schema, {
        auth_tokens: [],
      });
    });

    it("should delete expired magic links older than 24 hours", async () => {
      const now = new Date();
      const oldExpired = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recentExpired = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      await PreDB(testDb, schema, {
        auth_tokens: [],
        magic_links: [
          {
            cid: "old-link",
            email: "test@example.com",
            verifyUrl: "http://example.com/verify?cid=old",
            expiresAt: oldExpired,
            createdAt: oldExpired,
          },
          {
            cid: "recent-link",
            email: "test@example.com",
            verifyUrl: "http://example.com/verify?cid=recent",
            expiresAt: recentExpired,
            createdAt: recentExpired,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.magicLinks).toBe(1); // Only old magic link deleted

      await PostDB(testDb, schema, {
        magic_links: [
          {
            cid: "recent-link",
            email: "test@example.com",
          },
        ],
      });
    });

    it("should return correct counts for both tokens and magic links", async () => {
      const now = new Date();
      const oldTime = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "old-token-1",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: now,
            consumedAt: oldTime,
            createdAt: oldTime, // Old createdAt - will be deleted
          },
          {
            token: "old-token-2",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: now,
            consumedAt: oldTime,
            createdAt: oldTime, // Old createdAt - will be deleted
          },
        ],
        magic_links: [
          {
            cid: "old-link-1",
            email: "test@example.com",
            verifyUrl: "http://example.com/verify",
            expiresAt: oldTime,
            createdAt: oldTime,
          },
          {
            cid: "old-link-2",
            email: "test@example.com",
            verifyUrl: "http://example.com/verify",
            expiresAt: oldTime,
            createdAt: oldTime,
          },
          {
            cid: "old-link-3",
            email: "test@example.com",
            verifyUrl: "http://example.com/verify",
            expiresAt: oldTime,
            createdAt: oldTime,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.tokens).toBe(2);
      expect(result.magicLinks).toBe(3);

      // Verify all were deleted
      await PostDB(testDb, schema, {
        auth_tokens: [],
        magic_links: [],
      });
    });
  });
});
