import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/b-test";
import { updateCell } from "../update-cell.action";

describe("updateCell action", () => {
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
      ],
      session: [],
      account: [],
      verification: [],
      auth_tokens: [],
      magic_links: [],
    });
  });

  it("should update a single cell value", async () => {
    const result = await updateCell({
      tableName: "user",
      rowId: "user-1",
      column: "name",
      value: "Alice Smith",
    });

    expect(result.id).toBe("user-1");
    expect(result.name).toBe("Alice Smith");
    expect(result.email).toBe("alice@example.com");
  });

  it("should update updated_at automatically", async () => {
    const beforeUpdate = Date.now();

    const result = await updateCell({
      tableName: "user",
      rowId: "user-1",
      column: "name",
      value: "Alice Updated",
    });

    const afterUpdate = Date.now();

    expect(result.updated_at).toBeGreaterThanOrEqual(beforeUpdate);
    expect(result.updated_at).toBeLessThanOrEqual(afterUpdate);
  });

  it("should throw error when trying to update primary key", async () => {
    await expect(
      updateCell({
        tableName: "user",
        rowId: "user-1",
        column: "id",
        value: "new-id",
      })
    ).rejects.toThrow("Cannot update primary key column");
  });

  it("should throw error for non-existent column", async () => {
    await expect(
      updateCell({
        tableName: "user",
        rowId: "user-1",
        column: "nonexistent",
        value: "value",
      })
    ).rejects.toThrow('Column "nonexistent" not found');
  });

  it("should throw error for non-existent row", async () => {
    await expect(
      updateCell({
        tableName: "user",
        rowId: "nonexistent-id",
        column: "name",
        value: "Test",
      })
    ).rejects.toThrow("Row not found");
  });

  it("should throw error for non-existent table", async () => {
    await expect(
      updateCell({
        tableName: "nonexistent",
        rowId: "some-id",
        column: "name",
        value: "Test",
      })
    ).rejects.toThrow('Table "nonexistent" not found');
  });

  it("should handle null values", async () => {
    const result = await updateCell({
      tableName: "user",
      rowId: "user-1",
      column: "name",
      value: null,
    });

    expect(result.name).toBeNull();
  });
});
