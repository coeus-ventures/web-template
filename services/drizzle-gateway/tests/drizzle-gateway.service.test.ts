import { describe, test, expect, beforeEach, vi } from "vitest";
import { DrizzleGatewayService } from "../drizzle-gateway.service";
import { NextRequest } from "next/server";

describe("DrizzleGatewayService.proxyToGatewayWithHtmlRewrite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should proxy GET request to gateway", async () => {
    const mockResponse = new Response('{"data": "test"}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin?page=1", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    const response = await svc.proxyToGatewayWithHtmlRewrite(request);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4983/?page=1",
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(response.status).toBe(200);
  });

  test("should proxy POST request with body", async () => {
    const mockResponse = new Response('{"id": 1}', { status: 201 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "POST",
      body: '{"name": "test"}',
      headers: { "content-type": "application/json" },
    });

    const svc = new DrizzleGatewayService();
    const response = await svc.proxyToGatewayWithHtmlRewrite(request);

    expect(response.status).toBe(201);
  });

  test("should handle path parameter", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    await svc.proxyToGatewayWithHtmlRewrite(request, "users/123");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4983/users/123",
      expect.any(Object)
    );
  });

  test("should remove host header", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
      headers: {
        host: "example.com",
        "x-custom": "value",
      },
    });

    const svc = new DrizzleGatewayService();
    await svc.proxyToGatewayWithHtmlRewrite(request);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Headers;
    expect(headers.has("host")).toBe(false);
    expect(headers.get("x-custom")).toBe("value");
  });

  test("should add Authorization header when token is set", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    await svc.proxyToGatewayWithHtmlRewrite(request);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Headers;

    // Se o token está definido no ambiente, verifica que foi adicionado
    if (process.env.DRIZZLE_GATEWAY_MASTERPASS) {
      expect(headers.has("authorization")).toBe(true);
      expect(headers.get("authorization")).toContain("Bearer ");
    }
  });

  test("should pass through response headers", async () => {
    const mockResponse = new Response("{}", {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-custom-header": "value",
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    const response = await svc.proxyToGatewayWithHtmlRewrite(request);

    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("x-custom-header")).toBe("value");
  });

  test("should handle network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    await expect(svc.proxyToGatewayWithHtmlRewrite(request)).rejects.toThrow(
      "Network error"
    );
  });

  test("should preserve search params", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest(
      "http://example.com/api/admin?foo=bar&baz=qux",
      {
        method: "GET",
      }
    );

    const svc = new DrizzleGatewayService();
    await svc.proxyToGatewayWithHtmlRewrite(request, "path/to/resource");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4983/path/to/resource?foo=bar&baz=qux",
      expect.any(Object)
    );
  });

  test("should handle empty path", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const request = new NextRequest("http://example.com/api/admin", {
      method: "GET",
    });

    const svc = new DrizzleGatewayService();
    await svc.proxyToGatewayWithHtmlRewrite(request, "");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4983/",
      expect.any(Object)
    );
  });
});
