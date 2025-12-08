import * as schema from "@/db/schema";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export interface ColumnMetadata {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
}

// Get all exported table names from the schema
export function getTableNames(): string[] {
  const tables: string[] = [];

  for (const [, value] of Object.entries(schema)) {
    if (isTable(value)) {
      tables.push(getTableName(value));
    }
  }

  return tables.sort();
}

// Check if a value is a SQLite table
function isTable(value: unknown): value is SQLiteTable {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.for("drizzle:IsDrizzleTable") in value
  );
}

// Get detailed metadata for a specific table
export function getTableMetadata(tableName: string): TableMetadata | null {
  // Find the table object by name
  let tableObj: SQLiteTable | null = null;

  for (const [, value] of Object.entries(schema)) {
    if (isTable(value) && getTableName(value) === tableName) {
      tableObj = value;
      break;
    }
  }

  if (!tableObj) {
    return null;
  }

  const columns: ColumnMetadata[] = [];

  // Access the columns through the table's internal structure
  const tableSymbol = Symbol.for("drizzle:Columns");
  const tableColumns = (tableObj as unknown as Record<symbol, unknown>)[
    tableSymbol
  ] as Record<
    string,
    {
      name: string;
      dataType: string;
      notNull: boolean;
      primary: boolean;
      isUnique: boolean;
    }
  >;

  if (tableColumns) {
    for (const [, column] of Object.entries(tableColumns)) {
      columns.push({
        name: column.name,
        type: mapDrizzleType(column.dataType),
        isNullable: !column.notNull,
        isPrimaryKey: column.primary,
        isUnique: column.isUnique,
      });
    }
  }

  return {
    name: tableName,
    columns,
  };
}

// Map Drizzle internal types to UI-friendly names
function mapDrizzleType(drizzleType: string): string {
  const typeMap: Record<string, string> = {
    string: "text",
    number: "integer",
    boolean: "boolean",
    date: "timestamp",
    bigint: "bigint",
    json: "json",
  };

  return typeMap[drizzleType] || drizzleType;
}

// Get row count for a specific table
export async function getTableRowCount(tableName: string): Promise<number> {
  const result = await db.run(
    sql.raw(`SELECT COUNT(*) as count FROM "${tableName}"`)
  );
  return (result.rows[0] as unknown as { count: number }).count;
}

// Get the table object by name (useful for queries)
export function getTableByName(tableName: string): SQLiteTable | null {
  for (const [, value] of Object.entries(schema)) {
    if (isTable(value) && getTableName(value) === tableName) {
      return value;
    }
  }
  return null;
}
