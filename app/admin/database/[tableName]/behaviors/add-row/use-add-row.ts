"use client";

import { useState, useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import { tableDataAtom, addDialogOpenAtom, duplicateDataAtom } from "../../state";
import { insertRow } from "./insert-row.action";
import { toast } from "sonner";

export function useAddRow(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTableData = useSetAtom(tableDataAtom);
  const [isDialogOpen, setDialogOpen] = useAtom(addDialogOpenAtom);
  const [duplicateData, setDuplicateData] = useAtom(duplicateDataAtom);

  const handleAddRow = useCallback(
    async (data: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);

      // Optimistic update - add a pending row
      const tempId = `temp-${Date.now()}`;
      const optimisticRow = { ...data, id: tempId, _pending: true };

      setTableData((prev) => ({
        ...prev,
        rows: [optimisticRow, ...prev.rows],
        total: prev.total + 1,
      }));

      try {
        const newRow = await insertRow({ tableName, data });

        // Replace optimistic row with actual row
        setTableData((prev) => ({
          ...prev,
          rows: prev.rows.map((row) =>
            row.id === tempId ? { ...newRow, _pending: false } : row
          ),
        }));

        setDialogOpen(false);
        setDuplicateData(null);
        toast.success("Row added successfully");

        return newRow;
      } catch (err) {
        // Rollback optimistic update
        setTableData((prev) => ({
          ...prev,
          rows: prev.rows.filter((row) => row.id !== tempId),
          total: prev.total - 1,
        }));

        const message = err instanceof Error ? err.message : "Failed to add row";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tableName, setTableData, setDialogOpen, setDuplicateData]
  );

  const handleOpenDialog = useCallback(
    (initialData?: Record<string, unknown>) => {
      if (initialData) {
        // Remove id for duplication
        const { id: _id, ...rest } = initialData;
        setDuplicateData(rest);
      } else {
        setDuplicateData(null);
      }
      setDialogOpen(true);
    },
    [setDialogOpen, setDuplicateData]
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setDuplicateData(null);
    setError(null);
  }, [setDialogOpen, setDuplicateData]);

  return {
    handleAddRow,
    handleOpenDialog,
    handleCloseDialog,
    isDialogOpen,
    duplicateData,
    isLoading,
    error,
  };
}
