import crypto from "crypto";
import { db } from "@/db";
import { authTokens, InsertAuthToken, magicLinks } from "@/db/schema";
import { and, eq, isNull, isNotNull, lt, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface TokenData {
  email: string;
  callbackUrl: string;
  uaHash?: string;
}

export const TokenService = {
  /**
   * Issues a new one-time login token URL
   */
  async issueOneTimeLoginToken(
    email: string,
    callbackUrl?: string,
    uaHash?: string
  ): Promise<string> {
    // Create the token with 10-minute TTL
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

    return url;
  },

  /**
   * Validates a token (no longer consumes it - tokens are reusable until a new one is generated)
   * Returns token data if valid, null otherwise
   */
  async validateAndConsume(
    token: string,
    uaHash?: string
  ): Promise<TokenData | null> {
    try {
      // Find the valid token (no longer marking as consumed)
      const rows = await db
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.token, token),
            isNull(authTokens.consumedAt)
            // Removed expiration check - tokens only expire when new ones are generated
          )
        );

      const tokenRecord = rows[0];
      if (!tokenRecord) {
        return null;
      }

      // Validate UA hash if present
      if (tokenRecord.uaHash && uaHash && tokenRecord.uaHash !== uaHash) {
        return null;
      }

      // No longer marking as consumed - tokens are reusable
      return {
        email: tokenRecord.email,
        callbackUrl: tokenRecord.callbackUrl || "/home",
        uaHash: tokenRecord.uaHash || undefined,
      };
    } catch (error) {
      console.error("Error validating token:", error);
      return null;
    }
  },

  /**
   * Hashes user agent and IP for device binding
   */
  hashUserAgent(userAgent: string | null, ip: string): string {
    const data = `${userAgent || "unknown"}:${ip}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  },

  /**
   * Checks if an email has any valid (unconsumed) tokens
   */
  async hasValidToken(email: string): Promise<boolean> {
    const results = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.email, email),
          isNull(authTokens.consumedAt)
          // Removed expiration check - tokens only expire when new ones are generated
        )
      )
      .limit(1);

    return results.length > 0;
  },

  /**
   * Invalidates all tokens for a given email
   */
  async invalidateTokensForEmail(email: string): Promise<number> {
    const now = new Date();

    const result = await db
      .update(authTokens)
      .set({ consumedAt: now })
      .where(and(eq(authTokens.email, email), isNull(authTokens.consumedAt)));

    return result.rowsAffected || 0;
  },

  /**
   * Cleans up old tokens and magic links
   */
  async cleanup(): Promise<{ tokens: number; magicLinks: number }> {
    const now = new Date();

    // Delete tokens that are:
    // 1. Consumed more than 24 hours ago (cleaning up used tokens)
    // 2. Not consumed but created more than 90 days ago (general cleanup of old unused tokens)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const tokenResult = await db.delete(authTokens).where(
      or(
        // Tokens consumed more than 24 hours ago
        and(
          isNotNull(authTokens.consumedAt),
          lt(authTokens.consumedAt, dayAgo)
        ),
        // Tokens not consumed but created more than 90 days ago
        and(
          isNull(authTokens.consumedAt),
          lt(authTokens.createdAt, ninetyDaysAgo)
        )
      )
    );
    const tokensDeleted = tokenResult.rowsAffected || 0;

    // Delete magic links that expired more than 24 hours ago
    const magicLinksResult = await db
      .delete(magicLinks)
      .where(lt(magicLinks.expiresAt, dayAgo));

    const magicLinksDeleted = magicLinksResult.rowsAffected || 0;

    return {
      tokens: tokensDeleted,
      magicLinks: magicLinksDeleted,
    };
  },
};
