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
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sort: z
    .object({
      column: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  filter: z.string().optional(),
});

export type FetchTableDataInput = z.infer<typeof inputSchema>;

export interface FetchTableDataResult {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchTableData(
  input: unknown
): Promise<FetchTableDataResult> {
  const { tableName, page, limit, sort, filter } = inputSchema.parse(input);

  // Validate table exists
  const tableObj = getTableByName(tableName);
  if (!tableObj) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const metadata = getTableMetadata(tableName);
  if (!metadata) {
    throw new Error(`Could not get metadata for table "${tableName}"`);
  }

  // Build the base query parts
  const offset = (page - 1) * limit;

  // Get string columns for filtering
  const textColumns = metadata.columns
    .filter((col) => col.type === "text")
    .map((col) => col.name);

  // Build WHERE clause for filter
  let whereClause = "";
  if (filter && filter.trim() && textColumns.length > 0) {
    const conditions = textColumns
      .map((col) => `"${col}" LIKE '%${filter.replace(/'/g, "''")}%'`)
      .join(" OR ");
    whereClause = `WHERE (${conditions})`;
  }

  // Build ORDER BY clause
  let orderByClause = "";
  if (sort) {
    // Validate column exists
    const columnExists = metadata.columns.some(
      (col) => col.name === sort.column
    );
    if (!columnExists) {
      throw new Error(`Column "${sort.column}" not found in table`);
    }
    orderByClause = `ORDER BY "${sort.column}" ${sort.direction.toUpperCase()}`;
  }

  // Get total count
  const countQuery = sql.raw(
    `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`
  );
  const countResult = await db.run(countQuery);
  const total = (countResult.rows[0] as unknown as { count: number }).count;

  // Get rows with pagination
  const dataQuery = sql.raw(
    `SELECT * FROM "${tableName}" ${whereClause} ${orderByClause} LIMIT ${limit} OFFSET ${offset}`
  );
  const dataResult = await db.run(dataQuery);

  // Transform rows to plain objects for serialization
  // Use JSON.parse(JSON.stringify()) to strip any non-serializable properties
  const rows = dataResult.rows.map((row) => {
    return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  });

  const totalPages = Math.ceil(total / limit);

  return {
    rows,
    total,
    page,
    totalPages,
  };
}
