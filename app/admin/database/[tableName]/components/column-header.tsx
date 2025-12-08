"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortState } from "../state";

interface ColumnHeaderProps {
  column: string;
  title: string;
  sort: SortState | null;
  onSortChange: (column: string) => void;
}

export function ColumnHeader({
  column,
  title,
  sort,
  onSortChange,
}: ColumnHeaderProps) {
  const isSorted = sort?.column === column;
  const direction = isSorted ? sort.direction : null;

  return (
    <Button
      variant="ghost"
      onClick={() => onSortChange(column)}
      className="-ml-4 h-8"
    >
      {title}
      {direction === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : direction === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
