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
  data: z.record(z.string(), z.any()),
});

export type UpdateRowInput = z.infer<typeof inputSchema>;

export async function updateRow(
  input: unknown
): Promise<Record<string, unknown>> {
  const { tableName, id, data } = inputSchema.parse(input);

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

  // Prepare update data
  const updateData: Record<string, unknown> = { ...data };

  // Remove primary key from update data (should not be updated)
  delete updateData[pkColumn.name];

  // Update timestamp if column exists
  const updatedAtColumn = metadata.columns.find(
    (col) => col.name === "updated_at"
  );
  if (updatedAtColumn) {
    updateData.updated_at = Date.now();
  }

  // Validate column names exist
  for (const colName of Object.keys(updateData)) {
    const columnExists = metadata.columns.some((col) => col.name === colName);
    if (!columnExists) {
      throw new Error(`Column "${colName}" not found in table "${tableName}"`);
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No data to update");
  }

  // Build UPDATE query with parameterized values
  const setClauses = Object.keys(updateData).map(
    (col) => sql`${sql.raw(`"${col}"`)} = ${updateData[col]}`
  );

  const updateQuery = sql`UPDATE ${sql.raw(`"${tableName}"`)} SET ${sql.join(setClauses, sql`, `)} WHERE ${sql.raw(`"${pkColumn.name}"`)} = ${id} RETURNING *`;

  const result = await db.run(updateQuery);

  if (!result.rows[0]) {
    throw new Error("Row not found");
  }

  // Return as plain object for serialization
  return JSON.parse(JSON.stringify(result.rows[0])) as Record<string, unknown>;
}
