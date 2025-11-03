import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.DRIZZLE_GATEWAY_URL || "http://127.0.0.1:4983";

export class DrizzleGatewayService {
  private readonly gatewayUrl: string;

  constructor(options?: { gatewayUrl?: string }) {
    this.gatewayUrl = options?.gatewayUrl || GATEWAY_URL;
  }

  async fetchGateway(req: NextRequest, path: string = ""): Promise<Response> {
    const url = `${this.gatewayUrl}/${path}${req.nextUrl.search}`;
    const headers = new Headers(req.headers);
    headers.delete("host");
    return await fetch(url, {
      method: req.method,
      headers,
      body: req.body,
      // @ts-expect-error - duplex needed for streaming
      duplex: "half",
    });
  }

  async proxyToGatewayWithHtmlRewrite(
    req: NextRequest,
    path: string = "",
    basePath: string = "/api/admin"
  ): Promise<NextResponse> {
    // Remove accept-encoding to prevent gzipped response
    const modifiedHeaders = new Headers(req.headers);
    modifiedHeaders.delete("accept-encoding");
    modifiedHeaders.delete("host");

    const url = `${this.gatewayUrl}/${path}${req.nextUrl.search}`;
    const response = await fetch(url, {
      method: req.method,
      headers: modifiedHeaders,
      body: req.body,
      // @ts-expect-error - duplex needed for streaming
      duplex: "half",
    });

    if (response.headers.get("content-type")?.includes("text/html")) {
      let html = await response.text();
      // Rewrite links
      html = html.replace(/href="\//g, `href="${basePath}/`);
      // Rewrite scripts and images
      html = html.replace(/src="\//g, `src="${basePath}/`);
      // Rewrite form actions (critical for passcode submission)
      html = html.replace(/action="\//g, `action="${basePath}/`);

      const headers = new Headers(response.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");
      headers.set("content-type", "text/html; charset=utf-8");

      return new NextResponse(html, {
        status: response.status,
        headers,
      });
    }

    // For non-HTML content, also remove content-encoding header
    const headers = new Headers(response.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  }
}

export const drizzleGatewayService = new DrizzleGatewayService();
