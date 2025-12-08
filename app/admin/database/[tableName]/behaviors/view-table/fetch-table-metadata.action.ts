"use server";

import { z } from "zod";
import { getTableMetadata } from "../../../lib/schema-introspection";

const inputSchema = z.object({
  tableName: z.string(),
});

export interface ColumnMetadataResult {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface FetchTableMetadataResult {
  name: string;
  columns: ColumnMetadataResult[];
}

export async function fetchTableMetadata(
  input: unknown
): Promise<FetchTableMetadataResult | null> {
  const { tableName } = inputSchema.parse(input);

  const metadata = getTableMetadata(tableName);

  if (!metadata) {
    return null;
  }

  // Explicitly create plain objects to ensure serialization works
  return {
    name: metadata.name,
    columns: metadata.columns.map((col) => ({
      name: col.name,
      type: col.type,
      isNullable: col.isNullable,
      isPrimaryKey: col.isPrimaryKey,
      isUnique: col.isUnique,
    })),
  };
}
