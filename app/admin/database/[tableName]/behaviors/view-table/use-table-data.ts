"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import {
  tableDataAtom,
  sortAtom,
  filterAtom,
  type SortState,
} from "../../state";
import { fetchTableData } from "./fetch-table-data.action";

const LIMIT = 10;
const DEBOUNCE_MS = 300;

export function useTableData(tableName: string) {
  const [tableData, setTableData] = useAtom(tableDataAtom);
  const [sort, setSort] = useAtom(sortAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  const [localPage, setLocalPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data function
  const loadData = useCallback(
    async (page: number, currentSort: SortState | null, currentFilter: string) => {
      setTableData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await fetchTableData({
          tableName,
          page,
          limit: LIMIT,
          sort: currentSort ?? undefined,
          filter: currentFilter || undefined,
        });

        setTableData({
          rows: result.rows,
          columns: result.columns,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setTableData((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        }));
      }
    },
    [tableName, setTableData]
  );

  // Initial load and reload on sort/filter/page change
  useEffect(() => {
    loadData(localPage, sort, filter);
  }, [loadData, localPage, sort, filter]);

  // Debounced filter change handler
  const handleFilterChange = useCallback(
    (newFilter: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setFilter(newFilter);
        setLocalPage(1); // Reset to first page on filter change
      }, DEBOUNCE_MS);
    },
    [setFilter]
  );

  // Sort handler - cycles through asc -> desc -> null
  const handleSortChange = useCallback(
    (column: string) => {
      setSort((prev) => {
        if (!prev || prev.column !== column) {
          return { column, direction: "asc" };
        }
        if (prev.direction === "asc") {
          return { column, direction: "desc" };
        }
        return null;
      });
      setLocalPage(1); // Reset to first page on sort change
    },
    [setSort]
  );

  // Page change handler
  const handleGoToPage = useCallback((page: number) => {
    setLocalPage(page);
  }, []);

  // Refresh function
  const handleRefresh = useCallback(() => {
    loadData(localPage, sort, filter);
  }, [loadData, localPage, sort, filter]);

  return {
    rows: tableData.rows,
    columns: tableData.columns,
    total: tableData.total,
    page: tableData.page,
    totalPages: tableData.totalPages,
    isLoading: tableData.isLoading,
    error: tableData.error,
    sort,
    filter,
    handleSortChange,
    handleFilterChange,
    handleGoToPage,
    handleRefresh,
  };
}
