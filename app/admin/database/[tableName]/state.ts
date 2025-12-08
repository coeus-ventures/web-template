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
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

// Table data atom
export const tableDataAtom = atom<TableState>({
  rows: [],
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

// Column metadata atom
export const columnsAtom = atom<ColumnMetadata[]>([]);

// Column visibility atom (column name -> visible)
export const columnVisibilityAtom = atom<Record<string, boolean>>({});

// Dialog state atoms
export const addDialogOpenAtom = atom(false);
export const editDialogOpenAtom = atom(false);
export const deleteDialogOpenAtom = atom(false);

// Selected row for editing/deleting
export const selectedRowAtom = atom<TableRow | null>(null);

// Duplicate data for pre-filling add dialog
export const duplicateDataAtom = atom<Record<string, unknown> | null>(null);
