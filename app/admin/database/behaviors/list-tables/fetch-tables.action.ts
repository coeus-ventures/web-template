"use server";

import {
  getTableNames,
  getTableRowCount,
} from "../../lib/schema-introspection";

export interface TableInfo {
  name: string;
  rowCount: number;
}

export async function fetchTables(): Promise<TableInfo[]> {
  const tableNames = getTableNames();

  const tables: TableInfo[] = await Promise.all(
    tableNames.map(async (name) => ({
      name,
      rowCount: await getTableRowCount(name),
    }))
  );

  return tables;
}
