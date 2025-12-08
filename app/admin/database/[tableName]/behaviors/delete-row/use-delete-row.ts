"use client";

import { useState, useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import {
  tableDataAtom,
  deleteDialogOpenAtom,
  selectedRowAtom,
  type TableRow,
} from "../../state";
import { deleteRow } from "./delete-row.action";
import { toast } from "sonner";

export function useDeleteRow(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTableData = useSetAtom(tableDataAtom);
  const [isDialogOpen, setDialogOpen] = useAtom(deleteDialogOpenAtom);
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom);

  const handleDeleteRow = useCallback(
    async (id: string | number) => {
      setIsLoading(true);
      setError(null);

      // Store row for rollback
      let deletedRow: TableRow | null = null;
      let deletedIndex = -1;

      // Optimistic update - remove row
      setTableData((prev) => {
        const index = prev.rows.findIndex((row) => row.id === id);
        if (index !== -1) {
          deletedRow = prev.rows[index];
          deletedIndex = index;
        }
        return {
          ...prev,
          rows: prev.rows.filter((row) => row.id !== id),
          total: prev.total - 1,
        };
      });

      try {
        await deleteRow({ tableName, id });

        setDialogOpen(false);
        setSelectedRow(null);
        toast.success("Row deleted successfully");
      } catch (err) {
        // Rollback optimistic update
        if (deletedRow) {
          setTableData((prev) => {
            const rows = [...prev.rows];
            rows.splice(deletedIndex, 0, deletedRow!);
            return {
              ...prev,
              rows,
              total: prev.total + 1,
            };
          });
        }

        const message = err instanceof Error ? err.message : "Failed to delete row";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tableName, setTableData, setDialogOpen, setSelectedRow]
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
    handleDeleteRow,
    handleOpenDialog,
    handleCloseDialog,
    isDialogOpen,
    selectedRow,
    isLoading,
    error,
  };
}
