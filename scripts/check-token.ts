import { authTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

async function checkToken() {
  const token = process.argv[2];

  if (!token) {
    console.log("Usage: npx tsx scripts/check-token.ts <token>");
    process.exit(1);
  }

  console.log(`Checking token: ${token}\n`);

  const results = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.token, token));

  if (results.length === 0) {
    console.log("Token not found in database");
  } else {
    const record = results[0];
    const now = new Date();

    console.log("Token found:");
    console.log(`- Email: ${record.email}`);
    console.log(`- Created: ${record.createdAt}`);
    console.log(`- Expires: ${record.expiresAt}`);
    console.log(`- Consumed: ${record.consumedAt || "NOT CONSUMED"}`);
    console.log(`- Callback URL: ${record.callbackUrl}`);
    console.log(`- UA Hash: ${record.uaHash || "NONE"}`);

    console.log("\nStatus:");
    if (record.consumedAt) {
      console.log("❌ Token already consumed");
    } else if (record.expiresAt < now) {
      console.log("❌ Token expired (but we ignore this now)");
    } else {
      console.log("✅ Token is valid");
    }
  }
}

checkToken();
