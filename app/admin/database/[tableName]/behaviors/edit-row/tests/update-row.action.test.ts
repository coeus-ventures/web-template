import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/b-test";
import { updateRow } from "../update-row.action";

describe("updateRow action", () => {
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

  it("should update a row in the table", async () => {
    const result = await updateRow({
      tableName: "user",
      id: "user-1",
      data: {
        name: "Alice Smith",
      },
    });

    expect(result.id).toBe("user-1");
    expect(result.name).toBe("Alice Smith");
    expect(result.email).toBe("alice@example.com");
  });

  it("should update multiple fields", async () => {
    const result = await updateRow({
      tableName: "user",
      id: "user-1",
      data: {
        name: "Alice Updated",
        image: "https://example.com/alice.jpg",
      },
    });

    expect(result.name).toBe("Alice Updated");
    expect(result.image).toBe("https://example.com/alice.jpg");
  });

  it("should update updated_at automatically", async () => {
    const beforeUpdate = Date.now();

    const result = await updateRow({
      tableName: "user",
      id: "user-1",
      data: {
        name: "Alice Updated",
      },
    });

    const afterUpdate = Date.now();

    expect(result.updated_at).toBeGreaterThanOrEqual(beforeUpdate);
    expect(result.updated_at).toBeLessThanOrEqual(afterUpdate);
  });

  it("should not update primary key even if included in data", async () => {
    const result = await updateRow({
      tableName: "user",
      id: "user-1",
      data: {
        id: "new-id",
        name: "Alice Updated",
      },
    });

    expect(result.id).toBe("user-1"); // ID should not change
    expect(result.name).toBe("Alice Updated");
  });

  it("should throw error for non-existent table", async () => {
    await expect(
      updateRow({
        tableName: "nonexistent",
        id: "some-id",
        data: { foo: "bar" },
      })
    ).rejects.toThrow('Table "nonexistent" not found');
  });

  it("should throw error for non-existent row", async () => {
    await expect(
      updateRow({
        tableName: "user",
        id: "nonexistent-id",
        data: { name: "Test" },
      })
    ).rejects.toThrow("Row not found");
  });

  it("should throw error for invalid column", async () => {
    await expect(
      updateRow({
        tableName: "user",
        id: "user-1",
        data: { invalid_column: "value" },
      })
    ).rejects.toThrow('Column "invalid_column" not found');
  });
});
