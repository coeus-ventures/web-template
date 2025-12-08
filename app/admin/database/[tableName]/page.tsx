"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable } from "./components/data-table";
import { TableToolbar } from "./components/table-toolbar";
import { ColumnHeader } from "./components/column-header";
import { RowActions } from "./components/row-actions";
import { AddRowDialog } from "./components/add-row-dialog";
import { EditRowDialog } from "./components/edit-row-dialog";
import { DeleteConfirmation } from "./components/delete-confirmation";
import { Pagination } from "./components/pagination";

import { useTableData } from "./behaviors/view-table/use-table-data";
import { useAddRow } from "./behaviors/add-row/use-add-row";
import { useEditRow } from "./behaviors/edit-row/use-edit-row";
import { useDeleteRow } from "./behaviors/delete-row/use-delete-row";

import type { TableRow } from "./state";

export default function TableViewPage() {
  const params = useParams();
  const tableName = params.tableName as string;

  const {
    rows,
    total,
    page,
    totalPages,
    isLoading,
    error,
    columns: columnMetadata,
    sort,
    handleSortChange,
    handleFilterChange,
    handleGoToPage,
    handleRefresh,
  } = useTableData(tableName);

  const {
    handleAddRow,
    handleOpenDialog: openAddDialog,
    handleCloseDialog: closeAddDialog,
    isDialogOpen: isAddDialogOpen,
    duplicateData,
    isLoading: isAddLoading,
  } = useAddRow(tableName);

  const {
    handleEditRow,
    handleEditCell,
    handleOpenDialog: openEditDialog,
    handleCloseDialog: closeEditDialog,
    isDialogOpen: isEditDialogOpen,
    selectedRow: editingRow,
    isLoading: isEditLoading,
  } = useEditRow(tableName);

  const {
    handleDeleteRow,
    handleOpenDialog: openDeleteDialog,
    handleCloseDialog: closeDeleteDialog,
    isDialogOpen: isDeleteDialogOpen,
    selectedRow: deletingRow,
    isLoading: isDeleteLoading,
  } = useDeleteRow(tableName);

  // Build column definitions
  const tableColumns: ColumnDef<TableRow>[] = React.useMemo(() => {
    if (columnMetadata.length === 0) return [];

    const cols: ColumnDef<TableRow>[] = columnMetadata.map((col) => ({
      accessorKey: col.name,
      header: () => (
        <ColumnHeader
          column={col.name}
          title={col.name}
          sort={sort}
          onSortChange={handleSortChange}
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue(col.name);

        // Format special types
        if (col.type === "timestamp" && value) {
          return new Date(value as number).toLocaleString();
        }
        if (col.type === "boolean") {
          return value === 1 || value === true ? "Yes" : "No";
        }
        if (col.type === "json" && value) {
          const str =
            typeof value === "string" ? value : JSON.stringify(value);
          return str.length > 50 ? str.slice(0, 50) + "..." : str;
        }

        const str = String(value ?? "");
        return str.length > 100 ? str.slice(0, 100) + "..." : str;
      },
    }));

    // Add actions column
    cols.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          row={row.original}
          onEdit={openEditDialog}
          onDuplicate={(r) => openAddDialog(r)}
          onDelete={openDeleteDialog}
        />
      ),
    });

    return cols;
  }, [
    columnMetadata,
    sort,
    handleSortChange,
    openEditDialog,
    openAddDialog,
    openDeleteDialog,
  ]);

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/database">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{tableName}</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/database">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{tableName}</h1>
      </div>

      <TableToolbar
        columns={columnMetadata}
        onSearch={handleFilterChange}
        onAddRow={() => openAddDialog()}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {isLoading && rows.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <DataTable
            columns={tableColumns}
            data={rows}
            columnMetadata={columnMetadata}
            onCellEdit={handleEditCell}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handleGoToPage}
          />
        </>
      )}

      <AddRowDialog
        open={isAddDialogOpen}
        onClose={closeAddDialog}
        columns={columnMetadata}
        onSubmit={handleAddRow}
        initialValues={duplicateData}
        isLoading={isAddLoading}
      />

      <EditRowDialog
        open={isEditDialogOpen}
        onClose={closeEditDialog}
        columns={columnMetadata}
        row={editingRow}
        onSubmit={handleEditRow}
        isLoading={isEditLoading}
      />

      <DeleteConfirmation
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => {
          if (deletingRow?.id) {
            handleDeleteRow(deletingRow.id as string | number);
          }
        }}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
