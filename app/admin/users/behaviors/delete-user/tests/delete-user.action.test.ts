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
        removeUser: vi.fn(),
      },
    },
  };
});

import { deleteUser } from "../actions/delete-user.action";
import { getUser, auth } from "@/lib/auth";

describe("deleteUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete user successfully", async () => {
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

    vi.mocked(auth.api.removeUser).mockResolvedValue({ success: true });

    const result = await deleteUser({
      userId: targetUserId,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await deleteUser({
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

    const result = await deleteUser({
      userId: "user-456",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should prevent self-deletion", async () => {
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

    const result = await deleteUser({
      userId: adminId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Cannot delete your own account");
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

    const result = await deleteUser({
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

    vi.mocked(auth.api.removeUser).mockRejectedValue(
      new Error("User not found")
    );

    const result = await deleteUser({
      userId: targetUserId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
