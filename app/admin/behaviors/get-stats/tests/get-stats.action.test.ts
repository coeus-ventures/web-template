import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock server-only before importing the action
vi.mock("server-only", () => ({}));

// Mock authentication
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual("@/lib/auth");
  return {
    ...actual,
    getUser: vi.fn(),
  };
});

import { getStats } from "../actions/get-stats.action";
import { getUser } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB, PostDB } from "@/lib/b-test";

describe("getStats action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clean up database before each test
    await PreDB(db, schema, {
      user: [],
      session: [],
    });
  });

  it("should return stats for admin user", async () => {
    // Setup: Create admin user and some test data
    const adminId = "admin-123";
    const userId1 = "user-1";
    const userId2 = "user-2";
    const now = new Date();
    const futureDate = new Date(now.getTime() + 3600000); // 1 hour from now
    const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago

    await PreDB(db, schema, {
      user: [
        {
          id: adminId,
          email: "admin@example.com",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          role: "admin",
          banned: false,
        },
        {
          id: userId1,
          email: "user1@example.com",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          role: "user",
          banned: false,
        },
        {
          id: userId2,
          email: "user2@example.com",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          role: "user",
          banned: true,
        },
      ],
      session: [
        {
          id: "session-1",
          userId: userId1,
          token: "token-1",
          expiresAt: futureDate,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "session-2",
          userId: userId2,
          token: "token-2",
          expiresAt: futureDate,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "session-3",
          userId: userId1,
          token: "token-3",
          expiresAt: pastDate, // Expired session
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    // Mock admin user
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

    const result = await getStats();

    expect(result.error).toBeUndefined();
    expect(result.stats).toBeDefined();
    expect(result.stats?.totalUsers).toBe(3);
    expect(result.stats?.activeSessions).toBe(2); // Only future-dated sessions
    expect(result.stats?.bannedUsers).toBe(1);
  });

  it("should return error for unauthenticated user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
    });

    const result = await getStats();

    expect(result.stats).toBeUndefined();
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

    const result = await getStats();

    expect(result.stats).toBeUndefined();
    expect(result.error).toBe("Forbidden - admin role required");
  });

  it("should return zero counts when database is empty", async () => {
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

    const result = await getStats();

    expect(result.error).toBeUndefined();
    expect(result.stats).toBeDefined();
    expect(result.stats?.totalUsers).toBe(0);
    expect(result.stats?.activeSessions).toBe(0);
    expect(result.stats?.bannedUsers).toBe(0);
  });
});
