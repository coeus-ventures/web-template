import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock server-only before importing the action
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock authentication and auth
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual("@/lib/auth");
  return {
    ...actual,
    getUser: vi.fn(),
    auth: {
      api: {
        unbanUser: vi.fn(),
      },
    },
  };
});

import { unbanUser } from "../actions/unban-user.action";
import { getUser, auth } from "@/lib/auth";

describe("unbanUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should unban user successfully", async () => {
    const adminId = "admin-123";
    const targetUserId = "user-456";
    const now = new Date();

    vi.mocked(getUser).mockResolvedValue({
      user: {
        id: adminId,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
      },
      sessionToken: "session-token-123",
    });

    vi.mocked(auth.api.unbanUser).mockResolvedValue({
      user: {
        id: targetUserId,
        email: "user@example.com",
        name: "User",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
      },
    });

    const result = await unbanUser({
      userId: targetUserId,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await unbanUser({
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
        banned: false,
        updatedAt: new Date(),
      },
      sessionToken: "session-token-123",
    });

    const result = await unbanUser({
      userId: "user-456",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Forbidden - admin role required");
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
        banned: false,
        updatedAt: new Date(),
      },
      sessionToken: "session-token-123",
    });

    const result = await unbanUser({
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
        banned: false,
        updatedAt: new Date(),
      },
      sessionToken: "session-token-123",
    });

    vi.mocked(auth.api.unbanUser).mockRejectedValue(
      new Error("User not found")
    );

    const result = await unbanUser({
      userId: targetUserId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
