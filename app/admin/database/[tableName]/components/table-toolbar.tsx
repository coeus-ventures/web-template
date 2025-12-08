"use client";

import * as React from "react";
import { Search, Plus, Columns, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { columnVisibilityAtom } from "../state";
import type { ColumnMetadata } from "../state";

interface TableToolbarProps {
  columns: ColumnMetadata[];
  onSearch: (value: string) => void;
  onAddRow: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function TableToolbar({
  columns,
  onSearch,
  onAddRow,
  onRefresh,
  isLoading,
}: TableToolbarProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);

  // Initialize visibility for all columns if not set
  React.useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    let needsUpdate = false;

    for (const col of columns) {
      if (columnVisibility[col.name] === undefined) {
        initialVisibility[col.name] = true;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setColumnVisibility((prev) => ({ ...prev, ...initialVisibility }));
    }
  }, [columns, columnVisibility, setColumnVisibility]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const toggleColumnVisibility = (columnName: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-8 w-[250px]"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.name}
                checked={columnVisibility[column.name] !== false}
                onCheckedChange={() => toggleColumnVisibility(column.name)}
              >
                {column.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onAddRow} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>
    </div>
  );
}
