import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import { PreDB } from "@/lib/b-test/predb";
import { PostDB } from "@/lib/b-test/postdb";
import { authTokens, magicLinks } from "@/db/schema";
import { TokenService } from "../token.service";

// Override the db import with our test database
const testClient = createClient({ url: ":memory:" });
const testDb = drizzle(testClient, { schema: { authTokens, magicLinks } });

// Mock the db module to use our test database
vi.mock("@/db", () => ({
  db: testDb,
}));

const schema = { authTokens, magicLinks };

describe("TokenService", () => {
  beforeAll(async () => {
    // Create auth_tokens table
    await testDb.run(sql`
      CREATE TABLE auth_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        callback_url TEXT,
        ua_hash TEXT,
        expires_at INTEGER NOT NULL,
        consumed_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    // Create magic_links table (needed for cleanup test)
    await testDb.run(sql`
      CREATE TABLE magic_links (
        cid TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        verify_url TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  });

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
      expect(tokens[0].expiresAt).toBeInstanceOf(Date);
      expect(tokens[0].createdAt).toBeInstanceOf(Date);
    });

    it("should create token with null values when optional params omitted", async () => {
      const email = "test@example.com";

      await TokenService.issueOneTimeLoginToken(email);

      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        email,
        callbackUrl: null,
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
      const hasToken = await TokenService.hasValidToken("nonexistent@example.com");

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

      const count = await TokenService.invalidateTokensForEmail("test@example.com");

      expect(count).toBe(2);

      // Verify all tokens are now consumed
      const tokens = await testDb.select().from(authTokens);
      expect(tokens).toHaveLength(2);
      tokens.forEach((token) => {
        expect(token.consumedAt).toBeInstanceOf(Date);
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

      const count = await TokenService.invalidateTokensForEmail("test@example.com");

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
      const count = await TokenService.invalidateTokensForEmail("nonexistent@example.com");

      expect(count).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should delete consumed tokens older than 24 hours", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const oldConsumed = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recentConsumed = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "old-consumed",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: oldConsumed,
            createdAt: now,
          },
          {
            token: "recent-consumed",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: recentConsumed,
            createdAt: now,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.tokens).toBe(1); // Only old consumed token deleted

      await PostDB(testDb, schema, {
        auth_tokens: [
          {
            token: "recent-consumed",
            email: "test@example.com",
          },
        ],
      });
    });

    it("should delete unconsumed tokens older than 90 days", async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      const veryOld = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000); // 91 days ago
      const recent = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "very-old-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: veryOld,
          },
          {
            token: "recent-token",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: futureExpiry,
            consumedAt: null,
            createdAt: recent,
          },
        ],
      });

      const result = await TokenService.cleanup();

      expect(result.tokens).toBe(1); // Only very old token deleted

      await PostDB(testDb, schema, {
        auth_tokens: [
          {
            token: "recent-token",
            email: "test@example.com",
          },
        ],
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
      const oldTime = new Date(now.getTime() - 25 * 60 * 60 * 1000);

      await PreDB(testDb, schema, {
        auth_tokens: [
          {
            token: "old-token-1",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: now,
            consumedAt: oldTime,
            createdAt: now,
          },
          {
            token: "old-token-2",
            email: "test@example.com",
            callbackUrl: null,
            uaHash: null,
            expiresAt: now,
            consumedAt: oldTime,
            createdAt: now,
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
