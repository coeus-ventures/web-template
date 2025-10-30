/**
 * Drizzle Gateway Root Proxy
 * Handles requests to /api/admin (root)
 */

import { getUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.DRIZZLE_GATEWAY_URL || "http://127.0.0.1:4983";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleProxy(req: NextRequest) {
  const { user } = await getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Please login first" },
      { status: 401 }
    );
  }

  try {
    // Forward to Gateway root
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${GATEWAY_URL}/${
      searchParams ? `?${searchParams}` : ""
    }`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (!["host", "connection", "keep-alive"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const masterpass = process.env.DRIZZLE_GATEWAY_MASTERPASS;
    if (masterpass) {
      headers.set("Authorization", `Bearer ${masterpass}`);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await req.text()
          : undefined,
    });

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

    // If HTML response, rewrite asset paths to use proxy
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      let html = await response.text();

      // Rewrite all root-relative paths to go through proxy
      html = html.replace(/href="\//g, 'href="/api/admin/');
      html = html.replace(/src="\//g, 'src="/api/admin/');

      return new NextResponse(html, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

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
