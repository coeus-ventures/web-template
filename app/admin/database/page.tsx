"use client";

import { AdminHeader } from "../components/admin-header";
import { TableList } from "./components/table-list";
import { RefreshButton } from "./components/refresh-button";
import { useListTables } from "./behaviors/list-tables/use-list-tables";

export default function DatabasePage() {
  const { tables, isLoading, error, handleRefresh } = useListTables();

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader
        title="Database Tables"
        description="View and manage database tables"
        action={<RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />}
      />

      <div className="flex-1 px-4 md:px-6 py-8 space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <TableList tables={tables} isLoading={isLoading} />
      </div>
    </div>
  );
}
