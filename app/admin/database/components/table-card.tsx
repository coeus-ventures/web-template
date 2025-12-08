"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

interface TableCardProps {
  name: string;
  rowCount: number;
}

export function TableCard({ name, rowCount }: TableCardProps) {
  return (
    <Link href={`/admin/database/${name}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rowCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            {rowCount === 1 ? "row" : "rows"}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
