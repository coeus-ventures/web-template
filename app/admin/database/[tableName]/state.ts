import { atom } from "jotai";

export interface ColumnMetadata {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface TableRow extends Record<string, unknown> {
  _pending?: boolean;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface TableState {
  rows: TableRow[];
  columns: ColumnMetadata[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

// Consolidated dialog state
export type DialogType = "add" | "edit" | "delete" | null;

export interface DialogState {
  type: DialogType;
  row: TableRow | null;
  isDuplicate: boolean;
}

// Table data atom (now includes columns)
export const tableDataAtom = atom<TableState>({
  rows: [],
  columns: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: true,
  error: null,
});

// Sort state atom
export const sortAtom = atom<SortState | null>(null);

// Filter state atom
export const filterAtom = atom<string>("");

// Column visibility atom (column name -> visible)
export const columnVisibilityAtom = atom<Record<string, boolean>>({});

// Consolidated dialog atom
export const dialogAtom = atom<DialogState>({
  type: null,
  row: null,
  isDuplicate: false,
});
