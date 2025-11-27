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
        adminUpdateUser: vi.fn(),
      },
    },
  };
});

import { updateUser } from "../actions/update-user.action";
import { getUser, auth } from "@/lib/auth";

describe("updateUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update user email successfully", async () => {
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

    const updatedUser = {
      id: targetUserId,
      email: "updated@example.com",
      name: "User",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    vi.mocked(auth.api.adminUpdateUser).mockResolvedValue(updatedUser);

    const result = await updateUser({
      userId: targetUserId,
      email: "updated@example.com",
    });

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("updated@example.com");
  });

  it("should update user name successfully", async () => {
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

    const updatedUser = {
      id: targetUserId,
      email: "user@example.com",
      name: "Updated Name",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    vi.mocked(auth.api.adminUpdateUser).mockResolvedValue(updatedUser);

    const result = await updateUser({
      userId: targetUserId,
      name: "Updated Name",
    });

    expect(result.error).toBeUndefined();
    expect(result.user?.name).toBe("Updated Name");
  });

  it("should update user role successfully", async () => {
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

    const updatedUser = {
      id: targetUserId,
      email: "user@example.com",
      name: "User",
      role: "admin",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    vi.mocked(auth.api.adminUpdateUser).mockResolvedValue(updatedUser);

    const result = await updateUser({
      userId: targetUserId,
      role: "admin",
    });

    expect(result.error).toBeUndefined();
    expect(result.user?.role).toBe("admin");
  });

  it("should update multiple fields at once", async () => {
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

    const updatedUser = {
      id: targetUserId,
      email: "updated@example.com",
      name: "Updated Name",
      role: "admin",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    vi.mocked(auth.api.adminUpdateUser).mockResolvedValue(updatedUser);

    const result = await updateUser({
      userId: targetUserId,
      email: "updated@example.com",
      name: "Updated Name",
      role: "admin",
    });

    expect(result.error).toBeUndefined();
    expect(result.user?.email).toBe("updated@example.com");
    expect(result.user?.name).toBe("Updated Name");
    expect(result.user?.role).toBe("admin");
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await updateUser({
      userId: "user-123",
      email: "updated@example.com",
    });

    expect(result.user).toBeUndefined();
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

    const result = await updateUser({
      userId: "user-456",
      email: "updated@example.com",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should return error for invalid email", async () => {
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

    const result = await updateUser({
      userId: "user-123",
      email: "invalid-email",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toContain("Invalid email address");
  });

  it("should return error for empty name", async () => {
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

    const result = await updateUser({
      userId: "user-123",
      name: "",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toContain("Name cannot be empty");
  });

  it("should return error for invalid userId", async () => {
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

    const result = await updateUser({
      userId: "", // Invalid: empty string
      email: "updated@example.com",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toContain("User ID is required");
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

    vi.mocked(auth.api.adminUpdateUser).mockRejectedValue(
      new Error("User not found")
    );

    const result = await updateUser({
      userId: "user-123",
      email: "updated@example.com",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toBe("User not found");
  });
});
