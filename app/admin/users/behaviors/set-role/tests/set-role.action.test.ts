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
        setRole: vi.fn(),
      },
    },
  };
});

import { setRole } from "../actions/set-role.action";
import { getUser, auth } from "@/lib/auth";

describe("setRole action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set role successfully", async () => {
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

    vi.mocked(auth.api.setRole).mockResolvedValue({
      user: {
        id: targetUserId,
        email: "user@example.com",
        name: "User",
        role: "admin",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
      },
    });

    const result = await setRole({
      userId: targetUserId,
      role: "admin",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await setRole({
      userId: "user-123",
      role: "admin",
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

    const result = await setRole({
      userId: "user-456",
      role: "admin",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should prevent removing own admin role", async () => {
    const adminId = "admin-123";

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

    const result = await setRole({
      userId: adminId,
      role: "user", // Trying to remove own admin role
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Cannot remove your own admin role");
  });

  it("should allow setting own role to admin", async () => {
    const adminId = "admin-123";
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

    vi.mocked(auth.api.setRole).mockResolvedValue({
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
    });

    const result = await setRole({
      userId: adminId,
      role: "admin", // Setting to same role should be allowed
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
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

    const result = await setRole({
      userId: "", // Invalid: empty string
      role: "admin",
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

    vi.mocked(auth.api.setRole).mockRejectedValue(new Error("User not found"));

    const result = await setRole({
      userId: targetUserId,
      role: "admin",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });
});
