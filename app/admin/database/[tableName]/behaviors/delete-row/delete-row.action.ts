"use server";

import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  getTableByName,
  getTableMetadata,
} from "../../../lib/schema-introspection";

const inputSchema = z.object({
  tableName: z.string(),
  id: z.union([z.string(), z.number()]),
});

export type DeleteRowInput = z.infer<typeof inputSchema>;

export async function deleteRow(input: unknown): Promise<void> {
  const { tableName, id } = inputSchema.parse(input);

  // Validate table exists
  const tableObj = getTableByName(tableName);
  if (!tableObj) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const metadata = getTableMetadata(tableName);
  if (!metadata) {
    throw new Error(`Could not get metadata for table "${tableName}"`);
  }

  // Find primary key column
  const pkColumn = metadata.columns.find((col) => col.isPrimaryKey);
  if (!pkColumn) {
    throw new Error(`No primary key found for table "${tableName}"`);
  }

  // Build DELETE query
  const deleteQuery = sql`DELETE FROM ${sql.raw(`"${tableName}"`)} WHERE ${sql.raw(`"${pkColumn.name}"`)} = ${id}`;

  const result = await db.run(deleteQuery);

  if (result.rowsAffected === 0) {
    throw new Error("Row not found");
  }
}
