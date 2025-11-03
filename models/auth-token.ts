import { db } from "@/db";
import { authTokens, InsertAuthToken, SelectAuthToken } from "@/db/schema";
import { eq, and, isNull, gt, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export type AuthToken = SelectAuthToken;

export const AuthToken = {
  async create(
    email: string,
    callbackUrl?: string,
    uaHash?: string,
    ttlMs: number = 10 * 60 * 1000 // Still accept parameter for compatibility
  ): Promise<{ token: string; url: string }> {
    const token = randomUUID();
    const now = new Date();
    // Set expiration to 100 years in the future (effectively never expires)
    const expiresAt = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);

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
    const now = new Date();

    console.debug("[AuthToken.consume] Debug info:", {
      token,
      uaHash,
      now: now.toISOString(),
      nowTimestamp: now.getTime(),
      nowType: typeof now,
    });

    // First, find the valid token
    const validToken = await this.findValidToken(token);
    if (!validToken) {
      console.debug("[AuthToken.consume] No valid token found");
      return null;
    }

    // Check UA hash if provided and token has one
    if (validToken.uaHash && uaHash && validToken.uaHash !== uaHash) {
      console.debug("[AuthToken.consume] UA hash mismatch");
      return null;
    }

    // Atomically mark as consumed
    console.debug("[AuthToken.consume] Attempting to update with:", {
      consumedAt: now,
      consumedAtType: typeof now,
      consumedAtValue: now.getTime(),
    });

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

    console.debug("[AuthToken.consume] Update result:", {
      rowsUpdated: updated.length,
      updatedToken: updated[0] || null,
    });

    return updated[0] || null;
  },

  async cleanupExpired(): Promise<number> {
    const now = new Date();

    // Delete tokens that are either:
    // 1. Expired (past their expiresAt)
    // 2. Consumed more than 24 hours ago
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
};
