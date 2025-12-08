"use client";

import { useState, useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import { tableDataAtom, dialogAtom } from "../../state";
import { insertRow } from "./insert-row.action";
import { toast } from "sonner";

export function useAddRow(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTableData = useSetAtom(tableDataAtom);
  const [dialog, setDialog] = useAtom(dialogAtom);

  const isDialogOpen = dialog.type === "add";
  const isDuplicate = dialog.isDuplicate;
  const duplicateRow = isDuplicate ? dialog.row : null;

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

        setDialog({ type: null, row: null, isDuplicate: false });
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
    [tableName, setTableData, setDialog]
  );

  const handleOpenDialog = useCallback(
    (initialData?: Record<string, unknown>) => {
      if (initialData) {
        // Remove id for duplication
        const { id: _id, ...rest } = initialData;
        setDialog({ type: "add", row: rest as Record<string, unknown> & { _pending?: boolean }, isDuplicate: true });
      } else {
        setDialog({ type: "add", row: null, isDuplicate: false });
      }
    },
    [setDialog]
  );

  const handleCloseDialog = useCallback(() => {
    setDialog({ type: null, row: null, isDuplicate: false });
    setError(null);
  }, [setDialog]);

  return {
    handleAddRow,
    handleOpenDialog,
    handleCloseDialog,
    isDialogOpen,
    isDuplicate,
    duplicateRow,
    isLoading,
    error,
  };
}
