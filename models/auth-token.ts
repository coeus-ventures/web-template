import { db } from "@/db";
import { authTokens, InsertAuthToken, SelectAuthToken } from "@/db/schema";
import { eq, and, isNull, isNotNull, gt, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export type AuthToken = SelectAuthToken;

export const AuthToken = {
  async create(
    email: string,
    callbackUrl?: string,
    uaHash?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ttlMs: number = 10 * 60 * 1000 // Still accept parameter for compatibility (not used - tokens have 100 year expiry)
  ): Promise<{ token: string; url: string }> {
    const token = randomUUID();
    const now = Date.now(); // Unix timestamp in milliseconds
    // Set expiration to 100 years in the future (effectively never expires)
    const expiresAt = now + 100 * 365 * 24 * 60 * 60 * 1000;

    const insertData: InsertAuthToken = {
      token,
      email,
      callbackUrl: callbackUrl || null,
      uaHash: uaHash || null,
      expiresAt,
      consumedAt: null,
      createdAt: now,
    };

    await db.insert(authTokens).values(insertData);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";
    const url = `${baseUrl}/auth/token?token=${token}`;

    return { token, url };
  },

  async findValidToken(token: string): Promise<AuthToken | null> {
    const results = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          isNull(authTokens.consumedAt)
          // Removed expiration check - tokens only expire when new ones are generated
        )
      )
      .limit(1);

    return results[0] || null;
  },

  async consume(token: string, uaHash?: string): Promise<AuthToken | null> {
    const now = Date.now(); // Unix timestamp in milliseconds

    // First, find the valid token
    const validToken = await this.findValidToken(token);
    if (!validToken) {
      return null;
    }

    // Check UA hash if provided and token has one
    if (validToken.uaHash && uaHash && validToken.uaHash !== uaHash) {
      return null;
    }

    // Atomically mark as consumed
    try {
      const updated = await db
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.token, token),
            isNull(authTokens.consumedAt) // Double-check to prevent race conditions
          )
        )
        .returning();

      return updated[0] || null;
    } catch (error) {
      console.error("[AuthToken.consume] Update failed:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  async cleanupExpired(): Promise<number> {
    const now = Date.now();

    // Delete tokens that are either:
    // 1. Expired (past their expiresAt)
    // 2. Consumed more than 24 hours ago
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const result = await db.delete(authTokens).where(
      and(
        // Either expired or consumed more than a day ago
        lt(authTokens.createdAt, dayAgo)
      )
    );

    return result.rowsAffected || 0;
  },

  async findByEmail(email: string): Promise<AuthToken[]> {
    return await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.email, email));
  },

  /**
   * Check if email has a recent consumed token (consumed in the last 10 minutes)
   * This indicates the user authenticated via token, which means they are the owner
   * Only checks consumed tokens to ensure the token was actually used for authentication
   */
  async hasRecentToken(
    email: string,
    maxAgeMs: number = 10 * 60 * 1000
  ): Promise<boolean> {
    const now = Date.now();
    const minTime = now - maxAgeMs;

    const results = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.email, email),
          // Only check tokens that were CONSUMED recently (actually used for auth)
          isNotNull(authTokens.consumedAt),
          gt(authTokens.consumedAt, minTime)
        )
      )
      .limit(1);

    return results.length > 0;
  },
};
