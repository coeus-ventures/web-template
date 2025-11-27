import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock server-only before importing the action
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

// Mock authentication and auth
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual("@/lib/auth");
  return {
    ...actual,
    getUser: vi.fn(),
    auth: {
      api: {
        stopImpersonating: vi.fn(),
      },
    },
  };
});

import { stopImpersonating } from "../actions/stop-impersonating.action";
import { getUser, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

describe("stopImpersonating action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should stop impersonating successfully and redirect", async () => {
    const adminId = "admin-123";

    vi.mocked(getUser).mockResolvedValue({
      user: {
        id: adminId,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
      sessionToken: "session-token-123",
    });

    const now = new Date();
    vi.mocked(auth.api.stopImpersonating).mockResolvedValue({
      session: {
        id: "session-123",
        userId: adminId,
        token: "token-123",
        expiresAt: new Date(now.getTime() + 3600000),
        createdAt: now,
        updatedAt: now,
      },
      user: {
        id: adminId,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    } as Awaited<ReturnType<typeof auth.api.stopImpersonating>>);

    // redirect() throws an error, so we expect the promise to reject
    await expect(stopImpersonating()).rejects.toThrow();
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await stopImpersonating();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized - please sign in");
  });

  it("should handle Better Auth API errors", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: {
        id: "admin-123",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
      sessionToken: "session-token-123",
    });

    vi.mocked(auth.api.stopImpersonating).mockRejectedValue(
      new Error("Not impersonating")
    );

    const result = await stopImpersonating();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not impersonating");
  });
});
