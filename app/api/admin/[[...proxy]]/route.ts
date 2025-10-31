import { NextRequest } from "next/server";
import { drizzleGatewayService } from "@/services/drizzle-gateway/drizzle-gateway.service";
import { getUser } from "@/lib/auth";
import { authErrors } from "@/lib/auth-error";

export const dynamic = "force-dynamic";
const ADMIN_BASE_PATH = "/api/admin";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const { user } = await getUser();
  if (!user) throw authErrors.gatewayUnauthorized;
  if (user.role !== "admin") throw authErrors.gatewayForbidden;

  const { proxy } = await params;
  const path = proxy?.length ? proxy.join("/") : undefined;

  return drizzleGatewayService.proxyToGatewayWithHtmlRewrite(
    req,
    path,
    ADMIN_BASE_PATH
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
