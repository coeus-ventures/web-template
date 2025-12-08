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
  rowId: z.union([z.string(), z.number()]),
  column: z.string(),
  value: z.unknown(),
});

export type UpdateCellInput = z.infer<typeof inputSchema>;

export async function updateCell(
  input: unknown
): Promise<Record<string, unknown>> {
  const { tableName, rowId, column, value } = inputSchema.parse(input);

  // Validate table exists
  const tableObj = getTableByName(tableName);
  if (!tableObj) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const metadata = getTableMetadata(tableName);
  if (!metadata) {
    throw new Error(`Could not get metadata for table "${tableName}"`);
  }

  // Validate column exists
  const columnMeta = metadata.columns.find((col) => col.name === column);
  if (!columnMeta) {
    throw new Error(`Column "${column}" not found in table "${tableName}"`);
  }

  // Validate column is not primary key
  if (columnMeta.isPrimaryKey) {
    throw new Error("Cannot update primary key column");
  }

  // Find primary key column
  const pkColumn = metadata.columns.find((col) => col.isPrimaryKey);
  if (!pkColumn) {
    throw new Error(`No primary key found for table "${tableName}"`);
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    [column]: value,
  };

  // Update timestamp if column exists
  const updatedAtColumn = metadata.columns.find(
    (col) => col.name === "updated_at"
  );
  if (updatedAtColumn) {
    updateData.updated_at = Date.now();
  }

  // Build UPDATE query
  const setClauses = Object.keys(updateData).map(
    (col) => sql`${sql.raw(`"${col}"`)} = ${updateData[col]}`
  );

  const updateQuery = sql`UPDATE ${sql.raw(`"${tableName}"`)} SET ${sql.join(setClauses, sql`, `)} WHERE ${sql.raw(`"${pkColumn.name}"`)} = ${rowId} RETURNING *`;

  const result = await db.run(updateQuery);

  if (!result.rows[0]) {
    throw new Error("Row not found");
  }

  // Return as plain object for serialization
  return JSON.parse(JSON.stringify(result.rows[0])) as Record<string, unknown>;
}
