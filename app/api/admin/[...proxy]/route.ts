/**
 * Drizzle Gateway Proxy
 *
 * Secure reverse proxy for the Drizzle Gateway.
 * - Verifies user authentication via better-auth
 * - Forwards requests to internal Gateway (127.0.0.1:4983)
 * - Handles streaming responses, WebSocket upgrades, etc.
 */

import { getUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.DRIZZLE_GATEWAY_URL || "http://127.0.0.1:4983";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy handler for all HTTP methods
 */
async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  // 1. Verify authentication
  const { user } = await getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Please login first" },
      { status: 401 }
    );
  }

  // 2. Check admin permissions (optional - customize based on your needs)
  // Example: if (!user.role || user.role !== 'admin') { return 401 }

  try {
    // 3. Build target URL
    const { proxy } = await params;
    const path = proxy ? proxy.join("/") : "";
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${GATEWAY_URL}/${path}${
      searchParams ? `?${searchParams}` : ""
    }`;

    // 4. Forward request headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Skip host and connection headers
      if (!["host", "connection", "keep-alive"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Add Gateway masterpass if configured
    const masterpass = process.env.DRIZZLE_GATEWAY_MASTERPASS;
    if (masterpass) {
      headers.set("Authorization", `Bearer ${masterpass}`);
    }

    // 5. Forward the request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await req.text()
          : undefined,
      // @ts-expect-error - Node.js fetch supports duplex
      duplex: "half",
    });

    // 6. Forward response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const keyLower = key.toLowerCase();
      // Skip problematic headers that cause encoding issues
      if (
        ![
          "transfer-encoding",
          "connection",
          "content-encoding",
          "content-length",
        ].includes(keyLower)
      ) {
        responseHeaders.set(key, value);
      }
    });

    // 7. Return proxied response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Gateway proxy error:", error);
    return NextResponse.json(
      {
        error: "Gateway unavailable",
        message: "Database administration service is not running",
      },
      { status: 503 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
