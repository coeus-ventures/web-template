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
        listUsers: vi.fn(),
      },
    },
  };
});

import { listUsers } from "../actions/list-users.action";
import { getUser, auth } from "@/lib/auth";

describe("listUsers action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list users successfully with default pagination", async () => {
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

    const mockUsers = [
      {
        id: "user-1",
        email: "user1@example.com",
        name: "User 1",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
      },
      {
        id: "user-2",
        email: "user2@example.com",
        name: "User 2",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
      },
    ];

    vi.mocked(auth.api.listUsers).mockResolvedValue({
      users: mockUsers,
      total: 2,
      limit: 10,
      offset: 0,
    });

    const result = await listUsers();

    expect(result.error).toBeUndefined();
    expect(result.users).toBeDefined();
    expect(result.users.length).toBe(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it("should list users with custom pagination", async () => {
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

    const mockUsers = [
      {
        id: "user-1",
        email: "user1@example.com",
        name: "User 1",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
      },
    ];

    vi.mocked(auth.api.listUsers).mockResolvedValue({
      users: mockUsers,
      total: 10,
      limit: 5,
      offset: 5,
    });

    const result = await listUsers({
      limit: 5,
      offset: 5,
      sortDirection: "asc",
    });

    expect(result.error).toBeUndefined();
    expect(result.users.length).toBe(1);
    expect(result.total).toBe(10);
    expect(result.limit).toBe(5);
    expect(result.offset).toBe(5);
  });

  it("should list users with search parameters", async () => {
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

    const mockUsers = [
      {
        id: "user-1",
        email: "john@example.com",
        name: "John Doe",
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
      },
    ];

    vi.mocked(auth.api.listUsers).mockResolvedValue({
      users: mockUsers,
      total: 1,
      limit: 10,
      offset: 0,
    });

    const result = await listUsers({
      limit: 10,
      offset: 0,
      sortDirection: "asc",
      searchValue: "john",
      searchField: "email",
      searchOperator: "contains",
    });

    expect(result.error).toBeUndefined();
    expect(result.users.length).toBe(1);
    expect(result.users[0].email).toBe("john@example.com");
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await listUsers();

    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
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

    const result = await listUsers();

    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should return error for invalid pagination", async () => {
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

    const result = await listUsers({
      limit: 200, // Invalid: exceeds max of 100
      offset: 0,
      sortDirection: "asc",
    });

    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toContain("Validation error");
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

    vi.mocked(auth.api.listUsers).mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await listUsers();

    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBe("Database connection failed");
  });
});
