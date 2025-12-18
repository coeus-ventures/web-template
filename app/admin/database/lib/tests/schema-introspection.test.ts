import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import {
  getTableNames,
  getTableMetadata,
  getTableRowCount,
  getTableByName,
} from "../schema-introspection";

describe("schema-introspection", () => {
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

  describe("getTableNames", () => {
    it("should return all table names from schema", () => {
      const tables = getTableNames();

      expect(tables).toContain("user");
      expect(tables).toContain("session");
      expect(tables).toContain("account");
      expect(tables).toContain("verification");
      expect(tables).toContain("auth_tokens");
      expect(tables).toContain("magic_links");
      expect(tables.length).toBeGreaterThanOrEqual(6);
    });

    it("should return sorted table names", () => {
      const tables = getTableNames();
      const sorted = [...tables].sort();

      expect(tables).toEqual(sorted);
    });
  });

  describe("getTableMetadata", () => {
    it("should return metadata for existing table", () => {
      const metadata = getTableMetadata("user");

      expect(metadata).not.toBeNull();
      expect(metadata?.name).toBe("user");
      expect(metadata?.columns.length).toBeGreaterThan(0);
    });

    it("should return null for non-existent table", () => {
      const metadata = getTableMetadata("nonexistent_table");

      expect(metadata).toBeNull();
    });

    it("should include column information", () => {
      const metadata = getTableMetadata("user");

      expect(metadata?.columns).toBeDefined();

      const idColumn = metadata?.columns.find((col) => col.name === "id");
      expect(idColumn).toBeDefined();
      expect(idColumn?.isPrimaryKey).toBe(true);

      const emailColumn = metadata?.columns.find((col) => col.name === "email");
      expect(emailColumn).toBeDefined();
      expect(emailColumn?.isUnique).toBe(true);
    });
  });

  describe("getTableRowCount", () => {
    it("should return 0 for empty table", async () => {
      const count = await getTableRowCount("user");

      expect(count).toBe(0);
    });

    it("should return correct count after inserting data", async () => {
      const now = new Date();

      await PreDB(db, schema, {
        user: [
          {
            id: "user-1",
            email: "user1@example.com",
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "user-2",
            email: "user2@example.com",
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      });

      const count = await getTableRowCount("user");

      expect(count).toBe(2);
    });
  });

  describe("getTableByName", () => {
    it("should return table object for existing table", () => {
      const table = getTableByName("user");

      expect(table).not.toBeNull();
    });

    it("should return null for non-existent table", () => {
      const table = getTableByName("nonexistent_table");

      expect(table).toBeNull();
    });
  });
});
