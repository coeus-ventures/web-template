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
        impersonateUser: vi.fn(),
      },
    },
  };
});

import { impersonateUser } from "../actions/impersonate-user.action";
import { getUser, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

describe("impersonateUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should impersonate user successfully and redirect", async () => {
    const adminId = "admin-123";
    const targetUserId = "user-456";

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
    vi.mocked(auth.api.impersonateUser).mockResolvedValue({
      session: {
        id: "session-123",
        userId: targetUserId,
        token: "token-123",
        expiresAt: new Date(now.getTime() + 3600000),
        createdAt: now,
        updatedAt: now,
      },
      user: {
        id: targetUserId,
        email: "user@example.com",
        name: "User",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    } as Awaited<ReturnType<typeof auth.api.impersonateUser>>);

    // redirect() throws an error, so we expect the promise to reject
    await expect(
      impersonateUser({
        userId: targetUserId,
      })
    ).rejects.toThrow();
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await impersonateUser({
      userId: "user-123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized - please sign in");
  });

  it("should return error for non-admin user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "User",
        role: "user",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
      sessionToken: "session-token-123",
    });

    const result = await impersonateUser({
      userId: "user-456",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should prevent self-impersonation", async () => {
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

    const result = await impersonateUser({
      userId: adminId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Cannot impersonate yourself");
  });

  it("should return error for invalid input", async () => {
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

    const result = await impersonateUser({
      userId: "", // Invalid: empty string
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("User ID is required");
  });

  it("should handle Better Auth API errors", async () => {
    const adminId = "admin-123";
    const targetUserId = "user-456";

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

    vi.mocked(auth.api.impersonateUser).mockRejectedValue(
      new Error("User not found")
    );

    const result = await impersonateUser({
      userId: targetUserId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
