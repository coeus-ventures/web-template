import { AuthToken } from "@/models/auth-token";
import crypto from "crypto";
import { db } from "@/db";
import { authTokens } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { MagicLink } from "@/models/magic-link";

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
    const { url } = await AuthToken.create(
      email,
      callbackUrl || "/home",
      uaHash,
      10 * 60 * 1000 // 10 minutes
    );

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
    const tokensDeleted = await AuthToken.cleanupExpired();
    const magicLinksDeleted = await MagicLink.cleanupExpired();

    return {
      tokens: tokensDeleted,
      magicLinks: magicLinksDeleted,
    };
  },
};
