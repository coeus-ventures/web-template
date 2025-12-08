"use client";

import { TableCard } from "./table-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableInfo } from "../behaviors/list-tables/fetch-tables.action";

interface TableListProps {
  tables: TableInfo[];
  isLoading: boolean;
}

function TableCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-12" />
      </CardContent>
    </Card>
  );
}

export function TableList({ tables, isLoading }: TableListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TableCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tables found in the schema.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tables.map((table) => (
        <TableCard key={table.name} name={table.name} rowCount={table.rowCount} />
      ))}
    </div>
  );
}
