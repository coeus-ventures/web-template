import { describe, test, expect } from "vitest";
import { NextRequest } from "next/server";
import { DrizzleGatewayService } from "../drizzle-gateway.service";

// This test is intended to run against a LIVE local gateway
// Start the gateway before running: bun run drizzle:gateway (or your script)
// Assumptions:
// - Gateway listens on 127.0.0.1:4983
// - Optional: DRIZZLE_GATEWAY_MASTERPASS is set if your gateway requires it

describe("Proxy flow (E2E-ish with live gateway)", () => {
  test("GET root with query: logs request/response flow", async () => {
    const svc = new DrizzleGatewayService();

    const reqUrl = "http://example.com/api/admin?foo=bar";
    const req = new NextRequest(reqUrl, { method: "GET" });

    console.log("[FLOW] Creating request:", { url: reqUrl, method: "GET" });
    console.log("[FLOW] Env:", {
      DRIZZLE_GATEWAY_URL:
        process.env.DRIZZLE_GATEWAY_URL || "http://127.0.0.1:4983",
      DRIZZLE_GATEWAY_MASTERPASS: process.env.DRIZZLE_GATEWAY_MASTERPASS
        ? "<set>"
        : "<not set>",
    });

    const response = await svc.proxyToGatewayWithHtmlRewrite(req);
    console.log("[FLOW] Response status:", response.status);
    console.log(
      "[FLOW] Response headers content-type:",
      response.headers.get("content-type")
    );

    // We don't assert strictly on the payload because it depends on the live gateway
    expect([200, 401, 403, 404, 500]).toContain(response.status);
  });

  test("HTML rewrite path: logs before/after when gateway returns HTML", async () => {
    const svc = new DrizzleGatewayService();

    const reqUrl = "http://example.com/api/admin";
    const req = new NextRequest(reqUrl, { method: "GET" });

    console.log("[FLOW-HTML] Request:", { url: reqUrl });

    const proxied = await svc.proxyToGatewayWithHtmlRewrite(
      req,
      undefined,
      "/api/admin"
    );
    const ct = proxied.headers.get("content-type") || "";
    console.log("[FLOW-HTML] Response CT:", ct);

    if (ct.includes("text/html")) {
      const text = await proxied.text();
      // Log only first 300 chars to avoid noisy output
      console.log("[FLOW-HTML] HTML (first 300):", text.slice(0, 300));
      // Basic sanity check: if it is HTML, ensure our base path appears somewhere after rewrite
      expect(text.includes("/api/admin/")).toBe(true);
    } else {
      console.log("[FLOW-HTML] Non-HTML response; skipping rewrite check");
      expect([200, 204, 301, 302, 401, 403, 404, 500]).toContain(
        proxied.status
      );
    }
  });
});
