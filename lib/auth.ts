import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { cache } from "react";
import { headers } from "next/headers";
import { admin } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import { MagicLink } from "@/shared/models/magic-link";

export const auth = betterAuth({
  plugins: [
    admin({
      defaultRole: "user",
    }),
    magicLink({
      expiresIn: 300, // 5 minutes
      // Capture the magic link URL instead of sending email
      sendMagicLink: async ({ email, url }) => {
        let finalUrl = url;

        const headersList = await headers();
        const host = headersList.get("host");

        if (host && !host.includes("localhost")) {
          finalUrl = url.replace(/https?:\/\/[^\/]+/, `https://${host}`);
        }

        const u = new URL(finalUrl);
        const callbackURL = u.searchParams.get("callbackURL");

        let cid: string | null = null;
        if (callbackURL) {
          const callbackU = new URL(callbackURL);
          cid = callbackU.searchParams.get("cid");
        }

        if (!cid) {
          console.error("Missing correlation ID in magic link callback URL");
          return;
        }

        try {
          await MagicLink.upsert(
            cid,
            email,
            finalUrl,
            Date.now() + 5 * 60 * 1000 // 5 minutes
          );
        } catch (error) {
          console.error("Failed to store magic link:", error);
        }
      },
    }),
    nextCookies(),
  ], // make sure nextCookies is the last plugin in the array
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendEmailVerificationOnSignUp: false,
  },
  user: {
    additionalFields: {},
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 1 day
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:8080",
});

export const getUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { user: null };
  }

  return { user: session.user, sessionToken: session.session.token };
});
