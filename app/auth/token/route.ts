import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token/token.service";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";
import { magicLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  console.debug("[auth/token][GET] start", {
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    xff: req.headers.get("x-forwarded-for"),
  });
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const redirectTo = url.searchParams.get("redirectTo");

  // Validate token parameter
  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/signin?e=missing_token", req.url)
    );
  }

  // Extract user agent hash if we want to enable device binding
  const userAgent = req.headers.get("user-agent");
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const uaHash =
    userAgent && ip !== "unknown"
      ? TokenService.hashUserAgent(userAgent, ip)
      : undefined;

  // Validate and consume the token atomically
  const tokenData = await TokenService.validateAndConsume(token, uaHash);

  if (!tokenData) {
    console.debug("[auth/token][GET] invalid_or_expired token", { token });
    return NextResponse.redirect(
      new URL("/auth/signin?e=invalid_or_expired", req.url)
    );
  }

  // Generate a unique correlation ID for this magic link flow
  const cid = randomUUID();

  // Use redirectTo parameter if provided, otherwise fall back to token's callbackUrl
  const finalRedirectUrl = redirectTo || tokenData.callbackUrl;

  // Prepare callback URL with correlation ID
  const host = req.headers.get("host");
  const isLocalhost = host?.includes("localhost");
  const protocol = isLocalhost ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const callbackURL = new URL(finalRedirectUrl, baseUrl);
  callbackURL.searchParams.set("cid", cid);

  try {
    console.debug("[auth/token][GET] signInMagicLink -> BetterAuth", {
      email: tokenData.email,
      callbackURL: callbackURL.toString(),
      cid,
    });
    // Trigger BetterAuth magic link sign-in
    // The sendMagicLink handler will capture the verify URL in our database
    await auth.api.signInMagicLink({
      body: {
        email: tokenData.email,
        callbackURL: callbackURL.toString(),
      },
      headers: {
        "user-agent": req.headers.get("user-agent") || "",
        "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
      },
    });

    // Retrieve the captured magic link URL with retry mechanism
    // This handles potential write lag between the sendMagicLink handler and our read
    const maxRetries = 5;
    const delayMs = 50;

    let magicLinkRecord = null;

    for (let i = 0; i < maxRetries && !magicLinkRecord; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const results = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.cid, cid))
        .limit(1);

      console.debug("[auth/token][GET] magicLink query attempt", {
        attempt: i + 1,
        found: results.length > 0,
      });

      if (results.length > 0) {
        magicLinkRecord = results[0];

        // Check if expired
        const now = new Date();
        if (magicLinkRecord.expiresAt <= now) {
          console.debug("[auth/token][GET] magicLink expired", {
            cid,
            expiresAt: magicLinkRecord.expiresAt,
          });
          return NextResponse.redirect(
            new URL("/auth/signin?e=link_expired", req.url)
          );
        }
      }
    }

    if (!magicLinkRecord) {
      console.debug("[auth/token][GET] link_generation_failed", { cid });
      return NextResponse.redirect(
        new URL("/auth/signin?e=link_generation_failed", req.url)
      );
    }

    // Redirect the user to BetterAuth's verification URL
    // This will complete the authentication and establish a session
    console.debug("[auth/token][GET] redirect to verifyUrl", {
      cid,
      verifyUrl: magicLinkRecord.verifyUrl,
    });
    return NextResponse.redirect(magicLinkRecord.verifyUrl);
  } catch (error) {
    console.error("Error during magic link flow:", error);
    console.debug("[auth/token][GET] authentication_error", { cid });
    return NextResponse.redirect(
      new URL("/auth/signin?e=authentication_error", req.url)
    );
  }
}
