/**
 * Gateway Health Check
 * Simple endpoint to verify if Gateway is available
 */

import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.DRIZZLE_GATEWAY_URL || "http://127.0.0.1:4983";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "HEAD",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    if (response.ok || response.status === 401) {
      // 401 means Gateway is running but needs auth (which is fine)
      return NextResponse.json({ status: "ok", available: true });
    }

    return NextResponse.json(
      { status: "error", available: false, message: "Gateway returned error" },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", available: false, message: "Gateway not reachable" },
      { status: 503 }
    );
  }
}
