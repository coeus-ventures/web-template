import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { deleteRow } from "../delete-row.action";
import { sql } from "drizzle-orm";

describe("deleteRow action", () => {
  const now = new Date();

  beforeEach(async () => {
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
      session: [],
      account: [],
      verification: [],
      auth_tokens: [],
      magic_links: [],
    });
  });

  it("should delete a row from the table", async () => {
    await deleteRow({
      tableName: "user",
      id: "user-1",
    });

    // Verify user-1 is deleted
    const result = await db.run(sql`SELECT * FROM "user"`);
    expect(result.rows.length).toBe(1);
    expect((result.rows[0] as Record<string, unknown>).id).toBe("user-2");
  });

  it("should throw error for non-existent table", async () => {
    await expect(
      deleteRow({
        tableName: "nonexistent",
        id: "some-id",
      })
    ).rejects.toThrow('Table "nonexistent" not found');
  });

  it("should throw error for non-existent row", async () => {
    await expect(
      deleteRow({
        tableName: "user",
        id: "nonexistent-id",
      })
    ).rejects.toThrow("Row not found");
  });

  it("should not affect other rows when deleting", async () => {
    await deleteRow({
      tableName: "user",
      id: "user-1",
    });

    // Verify user-2 still exists
    const result = await db.run(sql`SELECT * FROM "user" WHERE id = 'user-2'`);
    expect(result.rows.length).toBe(1);
    expect((result.rows[0] as Record<string, unknown>).email).toBe("bob@example.com");
  });
});
