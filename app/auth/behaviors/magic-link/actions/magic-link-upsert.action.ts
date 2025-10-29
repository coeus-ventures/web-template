"use server";

import { InsertMagicLink, magicLinks, SelectMagicLink } from "@/db/schema";
import { db } from "@/db";

type MagicLink = SelectMagicLink;

export async function magicLinkUpsertAction(
  cid: string,
  email: string,
  verifyUrl: string,
  expiresAt?: Date
): Promise<MagicLink> {
  const now = new Date();
  const expiry = expiresAt || new Date(now.getTime() + 5 * 60 * 1000);

  const insertData: InsertMagicLink = {
    cid,
    email,
    verifyUrl,
    expiresAt: expiry,
    createdAt: now,
  };

  const result = await db.insert(magicLinks).values(insertData).returning();
  return result[0];
}
