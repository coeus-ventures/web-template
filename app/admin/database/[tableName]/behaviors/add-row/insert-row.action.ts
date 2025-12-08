"use server";

import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  getTableByName,
  getTableMetadata,
} from "../../../lib/schema-introspection";
import { buildZodSchemaFromMetadata } from "../../../lib/zod-schema-builder";

const inputSchema = z.object({
  tableName: z.string(),
  data: z.record(z.string(), z.any()),
});

export type InsertRowInput = z.infer<typeof inputSchema>;

export async function insertRow(
  input: unknown
): Promise<Record<string, unknown>> {
  const { tableName, data } = inputSchema.parse(input);

  // Validate table exists
  const tableObj = getTableByName(tableName);
  if (!tableObj) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const metadata = getTableMetadata(tableName);
  if (!metadata) {
    throw new Error(`Could not get metadata for table "${tableName}"`);
  }

  // Build dynamic Zod schema from table metadata
  const rowSchema = buildZodSchemaFromMetadata(metadata.columns);

  // Prepare data with generated values
  const preparedData: Record<string, unknown> = { ...data };

  // Generate ID if not provided and column exists
  const idColumn = metadata.columns.find((col) => col.name === "id");
  if (idColumn && !preparedData.id) {
    preparedData.id = crypto.randomUUID();
  }

  // Set timestamps if columns exist
  const now = Date.now();
  const createdAtColumn = metadata.columns.find(
    (col) => col.name === "created_at"
  );
  const updatedAtColumn = metadata.columns.find(
    (col) => col.name === "updated_at"
  );

  if (createdAtColumn && preparedData.created_at === undefined) {
    preparedData.created_at = now;
  }
  if (updatedAtColumn && preparedData.updated_at === undefined) {
    preparedData.updated_at = now;
  }

  // Validate prepared data
  const validatedData = rowSchema.parse(preparedData);

  // Only use columns that exist in the table schema
  const validColumnNames = new Set(metadata.columns.map((c) => c.name));
  const columns = Object.keys(validatedData).filter((col) =>
    validColumnNames.has(col)
  );
  const values = columns.map((col) => validatedData[col]);

  // Bind values to the query
  const boundQuery = sql`INSERT INTO ${sql.raw(`"${tableName}"`)} (${sql.raw(columns.map((c) => `"${c}"`).join(", "))}) VALUES (${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `
  )}) RETURNING *`;

  const result = await db.run(boundQuery);

  if (!result.rows[0]) {
    throw new Error("Failed to insert row");
  }

  // Return as plain object for serialization
  return JSON.parse(JSON.stringify(result.rows[0])) as Record<string, unknown>;
}
