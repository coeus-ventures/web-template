"use client";

import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import type { SortState } from "../state";

interface ColumnHeaderProps {
  column: string;
  title: string;
  type?: string;
  sort: SortState | null;
  onSortChange: (column: string) => void;
}

export function ColumnHeader({
  column,
  title,
  type,
  sort,
  onSortChange,
}: ColumnHeaderProps) {
  const isSorted = sort?.column === column;
  const direction = isSorted ? sort.direction : null;

  return (
    <button
      onClick={() => onSortChange(column)}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left w-full"
    >
      <span className="font-medium text-foreground">{title}</span>
      {type && <span className="text-muted-foreground text-xs">{type}</span>}
      <span className="ml-auto">
        {direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : direction === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </button>
  );
}
