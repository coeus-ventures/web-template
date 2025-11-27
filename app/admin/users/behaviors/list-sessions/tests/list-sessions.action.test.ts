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
        listUserSessions: vi.fn(),
      },
    },
  };
});

import { listSessions } from "../actions/list-sessions.action";
import { getUser, auth } from "@/lib/auth";

describe("listSessions action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list user sessions successfully", async () => {
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

    const mockSessions = [
      {
        id: "session-1",
        userId: targetUserId,
        token: "token-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 3600000),
        impersonatedBy: undefined,
      },
      {
        id: "session-2",
        userId: targetUserId,
        token: "token-2",
        ipAddress: null,
        userAgent: null,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 7200000),
        impersonatedBy: "admin-123",
      },
    ];

    vi.mocked(auth.api.listUserSessions).mockResolvedValue({
      sessions: mockSessions,
    });

    const result = await listSessions({
      userId: targetUserId,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessions).toBeDefined();
    expect(result.sessions.length).toBe(2);
    expect(result.sessions[0].id).toBe("session-1");
    expect(result.sessions[0].userId).toBe(targetUserId);
    expect(result.sessions[0].ipAddress).toBe("192.168.1.1");
    expect(result.sessions[1].impersonatedBy).toBe("admin-123");
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await listSessions({
      userId: "user-123",
    });

    expect(result.sessions).toEqual([]);
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

    const result = await listSessions({
      userId: "user-456",
    });

    expect(result.sessions).toEqual([]);
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
        updatedAt: new Date(),
        banned: false,
      },
      sessionToken: "session-token-123",
    });

    const result = await listSessions({
      userId: "", // Invalid: empty string
    });

    expect(result.sessions).toEqual([]);
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

    vi.mocked(auth.api.listUserSessions).mockRejectedValue(
      new Error("User not found")
    );

    const result = await listSessions({
      userId: "user-123",
    });

    expect(result.sessions).toEqual([]);
    expect(result.error).toBe("User not found");
  });

  it("should return empty array when user has no sessions", async () => {
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

    vi.mocked(auth.api.listUserSessions).mockResolvedValue({
      sessions: [],
    });

    const result = await listSessions({
      userId: targetUserId,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessions).toEqual([]);
  });
});
