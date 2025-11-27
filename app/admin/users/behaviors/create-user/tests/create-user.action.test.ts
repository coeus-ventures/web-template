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
        createUser: vi.fn(),
      },
    },
  };
});

import { createUser } from "../actions/create-user.action";
import { getUser, auth } from "@/lib/auth";

describe("createUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create user successfully", async () => {
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

    const newUser = {
      id: "user-456",
      email: "newuser@example.com",
      name: "New User",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    // Mock returns { user: UserWithRole }
    vi.mocked(auth.api.createUser).mockResolvedValue({
      user: newUser,
    });

    const result = await createUser({
      email: "newuser@example.com",
      password: "password123",
      name: "New User",
      role: "user",
    });

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("newuser@example.com");
    expect(result.user?.name).toBe("New User");
    expect(result.user?.role).toBe("user");
    expect(result.user?.emailVerified).toBe(true);
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await createUser({
      email: "newuser@example.com",
      password: "password123",
      name: "New User",
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

    const result = await createUser({
      email: "newuser@example.com",
      password: "password123",
      name: "New User",
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

    const result = await createUser({
      email: "invalid-email",
      password: "password123",
      name: "New User",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toContain("Invalid email address");
  });

  it("should return error for short password", async () => {
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

    const result = await createUser({
      email: "newuser@example.com",
      password: "short",
      name: "New User",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toContain("Password must be at least 8 characters");
  });

  it("should default to user role when not specified", async () => {
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

    const newUser = {
      id: "user-456",
      email: "newuser@example.com",
      name: "New User",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      image: null,
    };

    // Mock returns { user: UserWithRole }
    vi.mocked(auth.api.createUser).mockResolvedValue({
      user: newUser,
    });

    const result = await createUser({
      email: "newuser@example.com",
      password: "password123",
      name: "New User",
    });

    expect(result.error).toBeUndefined();
    expect(result.user?.role).toBe("user");
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

    vi.mocked(auth.api.createUser).mockRejectedValue(
      new Error("Email already exists")
    );

    const result = await createUser({
      email: "existing@example.com",
      password: "password123",
      name: "New User",
    });

    expect(result.user).toBeUndefined();
    expect(result.error).toBe("Email already exists");
  });
});
