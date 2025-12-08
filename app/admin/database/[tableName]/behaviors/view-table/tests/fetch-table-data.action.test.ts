import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/b-test";
import { fetchTableData } from "../fetch-table-data.action";

describe("fetchTableData action", () => {
  const now = new Date();

  beforeEach(async () => {
    await PreDB(db, schema, {
      user: [],
      session: [],
      account: [],
      verification: [],
      auth_tokens: [],
      magic_links: [],
    });
  });

  it("should return paginated data from a table", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "user-1",
          email: "alice@example.com",
          name: "Alice",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "user-2",
          email: "bob@example.com",
          name: "Bob",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
    });

    expect(result.rows.length).toBe(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("should handle pagination correctly", async () => {
    // Create 15 users
    const users = Array.from({ length: 15 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    }));

    await PreDB(db, schema, { user: users });

    // Page 1
    const page1 = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
    });

    expect(page1.rows.length).toBe(10);
    expect(page1.total).toBe(15);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(2);

    // Page 2
    const page2 = await fetchTableData({
      tableName: "user",
      page: 2,
      limit: 10,
    });

    expect(page2.rows.length).toBe(5);
    expect(page2.page).toBe(2);
  });

  it("should sort by column ascending", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "user-1",
          email: "charlie@example.com",
          name: "Charlie",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "user-2",
          email: "alice@example.com",
          name: "Alice",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "user-3",
          email: "bob@example.com",
          name: "Bob",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
      sort: { column: "email", direction: "asc" },
    });

    expect(result.rows[0].email).toBe("alice@example.com");
    expect(result.rows[1].email).toBe("bob@example.com");
    expect(result.rows[2].email).toBe("charlie@example.com");
  });

  it("should sort by column descending", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "user-1",
          email: "alice@example.com",
          name: "Alice",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "user-2",
          email: "charlie@example.com",
          name: "Charlie",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
      sort: { column: "email", direction: "desc" },
    });

    expect(result.rows[0].email).toBe("charlie@example.com");
    expect(result.rows[1].email).toBe("alice@example.com");
  });

  it("should filter rows by text search", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "user-1",
          email: "alice@example.com",
          name: "Alice",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "user-2",
          email: "bob@example.com",
          name: "Bob",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
      filter: "alice",
    });

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].email).toBe("alice@example.com");
    expect(result.total).toBe(1);
  });

  it("should throw error for non-existent table", async () => {
    await expect(
      fetchTableData({
        tableName: "nonexistent",
        page: 1,
        limit: 10,
      })
    ).rejects.toThrow('Table "nonexistent" not found');
  });

  it("should throw error for invalid sort column", async () => {
    await expect(
      fetchTableData({
        tableName: "user",
        page: 1,
        limit: 10,
        sort: { column: "invalid_column", direction: "asc" },
      })
    ).rejects.toThrow('Column "invalid_column" not found in table');
  });

  it("should return empty results when filter matches nothing", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "user-1",
          email: "alice@example.com",
          name: "Alice",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await fetchTableData({
      tableName: "user",
      page: 1,
      limit: 10,
      filter: "nonexistent",
    });

    expect(result.rows.length).toBe(0);
    expect(result.total).toBe(0);
  });
});
