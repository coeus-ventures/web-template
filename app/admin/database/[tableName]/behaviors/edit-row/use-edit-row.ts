"use client";

import { useState, useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import {
  tableDataAtom,
  editDialogOpenAtom,
  selectedRowAtom,
  type TableRow,
} from "../../state";
import { updateRow } from "./update-row.action";
import { updateCell } from "./update-cell.action";
import { toast } from "sonner";

export function useEditRow(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTableData = useSetAtom(tableDataAtom);
  const [isDialogOpen, setDialogOpen] = useAtom(editDialogOpenAtom);
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom);

  // Edit entire row via dialog
  const handleEditRow = useCallback(
    async (id: string | number, data: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);

      // Store original row for rollback
      let originalRow: TableRow | null = null;

      // Optimistic update
      setTableData((prev) => {
        const rows = prev.rows.map((row) => {
          if (row.id === id) {
            originalRow = row;
            return { ...row, ...data, _pending: true };
          }
          return row;
        });
        return { ...prev, rows };
      });

      try {
        const updatedRow = await updateRow({ tableName, id, data });

        // Apply actual values
        setTableData((prev) => ({
          ...prev,
          rows: prev.rows.map((row) =>
            row.id === id ? { ...updatedRow, _pending: false } : row
          ),
        }));

        setDialogOpen(false);
        setSelectedRow(null);
        toast.success("Row updated successfully");

        return updatedRow;
      } catch (err) {
        // Rollback optimistic update
        if (originalRow) {
          setTableData((prev) => ({
            ...prev,
            rows: prev.rows.map((row) =>
              row.id === id ? originalRow! : row
            ),
          }));
        }

        const message = err instanceof Error ? err.message : "Failed to update row";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tableName, setTableData, setDialogOpen, setSelectedRow]
  );

  // Edit single cell inline
  const handleEditCell = useCallback(
    async (rowId: string | number, column: string, value: unknown) => {
      setIsLoading(true);
      setError(null);

      // Store original value for rollback
      let originalValue: unknown = null;

      // Optimistic update
      setTableData((prev) => {
        const rows = prev.rows.map((row) => {
          if (row.id === rowId) {
            originalValue = row[column];
            return { ...row, [column]: value, _pending: true };
          }
          return row;
        });
        return { ...prev, rows };
      });

      try {
        const updatedRow = await updateCell({ tableName, rowId, column, value });

        // Apply actual values
        setTableData((prev) => ({
          ...prev,
          rows: prev.rows.map((row) =>
            row.id === rowId ? { ...updatedRow, _pending: false } : row
          ),
        }));

        toast.success("Cell updated successfully");

        return updatedRow;
      } catch (err) {
        // Rollback optimistic update
        setTableData((prev) => ({
          ...prev,
          rows: prev.rows.map((row) =>
            row.id === rowId ? { ...row, [column]: originalValue, _pending: false } : row
          ),
        }));

        const message = err instanceof Error ? err.message : "Failed to update cell";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tableName, setTableData]
  );

  const handleOpenDialog = useCallback(
    (row: TableRow) => {
      setSelectedRow(row);
      setDialogOpen(true);
    },
    [setDialogOpen, setSelectedRow]
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedRow(null);
    setError(null);
  }, [setDialogOpen, setSelectedRow]);

  return {
    handleEditRow,
    handleEditCell,
    handleOpenDialog,
    handleCloseDialog,
    isDialogOpen,
    selectedRow,
    isLoading,
    error,
  };
}
