import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { insertRow } from "../insert-row.action";

describe("insertRow action", () => {
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

  it("should insert a new row into the table", async () => {
    const result = await insertRow({
      tableName: "user",
      data: {
        email: "newuser@example.com",
        name: "New User",
        email_verified: 1,
      },
    });

    expect(result.email).toBe("newuser@example.com");
    expect(result.name).toBe("New User");
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
    expect(result.updated_at).toBeDefined();
  });

  it("should auto-generate id if not provided", async () => {
    const result = await insertRow({
      tableName: "user",
      data: {
        email: "autoid@example.com",
        email_verified: 1,
      },
    });

    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe("string");
  });

  it("should use provided id if given", async () => {
    const result = await insertRow({
      tableName: "user",
      data: {
        id: "custom-id-123",
        email: "customid@example.com",
        email_verified: 1,
      },
    });

    expect(result.id).toBe("custom-id-123");
  });

  it("should set created_at and updated_at automatically", async () => {
    const beforeInsert = Date.now();

    const result = await insertRow({
      tableName: "user",
      data: {
        email: "timestamps@example.com",
        email_verified: 1,
      },
    });

    const afterInsert = Date.now();

    expect(result.created_at).toBeGreaterThanOrEqual(beforeInsert);
    expect(result.created_at).toBeLessThanOrEqual(afterInsert);
    expect(result.updated_at).toBeGreaterThanOrEqual(beforeInsert);
    expect(result.updated_at).toBeLessThanOrEqual(afterInsert);
  });

  it("should throw error for non-existent table", async () => {
    await expect(
      insertRow({
        tableName: "nonexistent",
        data: { foo: "bar" },
      })
    ).rejects.toThrow('Table "nonexistent" not found');
  });

  it("should handle nullable fields", async () => {
    const result = await insertRow({
      tableName: "user",
      data: {
        email: "nullable@example.com",
        email_verified: 1,
        name: null,
        image: null,
      },
    });

    expect(result.email).toBe("nullable@example.com");
    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
  });
});
