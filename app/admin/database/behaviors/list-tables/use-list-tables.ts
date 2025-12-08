"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTables, type TableInfo } from "./fetch-tables.action";

export function useListTables() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchTables();
      setTables(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tables");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  return { tables, isLoading, error, handleRefresh };
}
