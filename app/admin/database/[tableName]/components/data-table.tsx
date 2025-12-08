"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtom } from "jotai";
import { columnVisibilityAtom, type TableRow as DataRow } from "../state";
import { CellEditor } from "./cell-editor";
import type { ColumnMetadata } from "../state";

interface DataTableProps {
  columns: ColumnDef<DataRow>[];
  data: DataRow[];
  columnMetadata: ColumnMetadata[];
  onCellEdit?: (rowId: string | number, column: string, value: unknown) => void;
}

export function DataTable({
  columns,
  data,
  columnMetadata,
  onCellEdit,
}: DataTableProps) {
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [editingCell, setEditingCell] = React.useState<{
    rowId: string | number;
    column: string;
  } | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: (updater) => {
      const newValue =
        typeof updater === "function"
          ? updater(columnVisibility as VisibilityState)
          : updater;
      setColumnVisibility(newValue as Record<string, boolean>);
    },
    state: {
      columnVisibility: columnVisibility as VisibilityState,
    },
  });

  const handleDoubleClick = (
    rowId: string | number,
    column: string,
    isPrimaryKey: boolean
  ) => {
    if (isPrimaryKey) return; // Don't allow editing primary key
    setEditingCell({ rowId, column });
  };

  const handleSave = async (value: unknown) => {
    if (editingCell && onCellEdit) {
      await onCellEdit(editingCell.rowId, editingCell.column, value);
    }
    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const getColumnType = (columnName: string): string => {
    const col = columnMetadata.find((c) => c.name === columnName);
    return col?.type || "text";
  };

  const isPrimaryKeyColumn = (columnName: string): boolean => {
    const col = columnMetadata.find((c) => c.name === columnName);
    return col?.isPrimaryKey || false;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={row.original._pending ? "opacity-50" : ""}
              >
                {row.getVisibleCells().map((cell) => {
                  const columnId = cell.column.id;
                  const rowId = row.original.id as string | number;
                  const isEditing =
                    editingCell?.rowId === rowId &&
                    editingCell?.column === columnId;
                  const isPk = isPrimaryKeyColumn(columnId);

                  // Skip rendering CellEditor for action columns
                  if (columnId === "actions") {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={cell.id}
                      onDoubleClick={() =>
                        handleDoubleClick(rowId, columnId, isPk)
                      }
                      className={!isPk ? "cursor-pointer hover:bg-muted/50" : ""}
                    >
                      {isEditing ? (
                        <CellEditor
                          value={cell.getValue()}
                          type={getColumnType(columnId)}
                          onSave={handleSave}
                          onCancel={handleCancel}
                        />
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
