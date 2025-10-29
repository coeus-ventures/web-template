import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";
import { MagicLink } from "@/models/magic-link";
import { auth, getUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const redirectTo = url.searchParams.get("redirectTo");


  const { user } = await getUser();

  if (user) {
    // User is already authenticated, redirect to the intended destination or dashboard
    const finalRedirectUrl = redirectTo || "/dashboard";
    const host = req.headers.get("host");
    const isLocalhost = host?.includes("localhost");
    const protocol = isLocalhost ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(new URL(finalRedirectUrl, baseUrl));
  }

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
    const magicLink = await MagicLink.findByCidWithRetry(cid, 5, 50);

    if (!magicLink) {
      return NextResponse.redirect(
        new URL("/auth/signin?e=link_generation_failed", req.url)
      );
    }

    // Redirect the user to BetterAuth's verification URL
    // This will complete the authentication and establish a session
    return NextResponse.redirect(magicLink.verifyUrl);
  } catch (error) {
    console.error("Error during magic link flow:", error);
    return NextResponse.redirect(
      new URL("/auth/signin?e=authentication_error", req.url)
    );
  }
}
