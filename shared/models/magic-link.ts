import { db } from "@/db";
import { magicLinks, InsertMagicLink, SelectMagicLink } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";

export type MagicLink = SelectMagicLink;

export const MagicLink = {
  async create(
    cid: string,
    email: string,
    verifyUrl: string,
    expiresAtMs?: number
  ): Promise<MagicLink> {
    const now = Date.now();
    const expiry = expiresAtMs || now + 5 * 60 * 1000; // 5 minutes default

    const insertData: InsertMagicLink = {
      cid,
      email,
      verifyUrl,
      expiresAt: expiry,
      createdAt: now,
    };

    const result = await db.insert(magicLinks).values(insertData).returning();
    return result[0];
  },

  async upsert(
    cid: string,
    email: string,
    verifyUrl: string,
    expiresAtMs?: number
  ): Promise<MagicLink> {
    const now = Date.now();
    const expiry = expiresAtMs || now + 5 * 60 * 1000;

    const insertData: InsertMagicLink = {
      cid,
      email,
      verifyUrl,
      expiresAt: expiry,
      createdAt: now,
    };

    // SQLite doesn't have native UPSERT, so we'll use INSERT OR REPLACE
    // First try to update if exists
    const existing = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.cid, cid))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(magicLinks)
        .set({
          email,
          verifyUrl,
          expiresAt: expiry,
        })
        .where(eq(magicLinks.cid, cid))
        .returning();
      return updated[0];
    }

    // Otherwise insert new
    const result = await db.insert(magicLinks).values(insertData).returning();
    return result[0];
  },

  async findByCid(cid: string): Promise<MagicLink | null> {
    const results = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.cid, cid))
      .limit(1);

    return results[0] || null;
  },

  async findByCidWithRetry(
    cid: string,
    maxRetries: number = 4,
    delayMs: number = 40
  ): Promise<MagicLink | null> {
    // Try to find immediately
    let magicLink = await this.findByCid(cid);

    if (magicLink) {
      // Check if expired
      const now = Date.now();
      if (magicLink.expiresAt <= now) {
        return null;
      }
      return magicLink;
    }

    // Retry with delay if not found (in case of write lag)
    for (let i = 0; i < maxRetries && !magicLink; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      magicLink = await this.findByCid(cid);
    }

    // Final expiry check
    if (magicLink) {
      const now = Date.now();
      if (magicLink.expiresAt <= now) {
        return null;
      }
    }

    return magicLink;
  },

  async findByEmail(email: string): Promise<MagicLink[]> {
    return await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.email, email));
  },

  async findValidByEmail(email: string): Promise<MagicLink[]> {
    const now = Date.now();

    return await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.email, email), gt(magicLinks.expiresAt, now)));
  },

  async cleanupExpired(): Promise<number> {
    const now = Date.now();

    // Delete magic links that expired more than 24 hours ago
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const result = await db
      .delete(magicLinks)
      .where(lt(magicLinks.expiresAt, dayAgo));

    return result.rowsAffected || 0;
  },
};
