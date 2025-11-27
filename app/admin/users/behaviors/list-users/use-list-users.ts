"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { listUsers } from "./actions/list-users.action";
import {
  usersAtom,
  usersLoadingAtom,
  usersTotalAtom,
  usersPageAtom,
  usersLimitAtom,
  usersSearchAtom,
  usersRoleFilterAtom,
  usersSortByAtom,
  usersSortDirectionAtom,
} from "@/app/admin/users/state";

export function useListUsers() {
  const [error, setError] = useState<string | null>(null);

  // Read filter/search/pagination atoms
  const page = useAtomValue(usersPageAtom);
  const limit = useAtomValue(usersLimitAtom);
  const search = useAtomValue(usersSearchAtom);
  const roleFilter = useAtomValue(usersRoleFilterAtom);
  const sortBy = useAtomValue(usersSortByAtom);
  const sortDirection = useAtomValue(usersSortDirectionAtom);

  // Read loading state
  const isLoading = useAtomValue(usersLoadingAtom);

  // Setters for updating state
  const setUsers = useSetAtom(usersAtom);
  const setUsersLoading = useSetAtom(usersLoadingAtom);
  const setUsersTotal = useSetAtom(usersTotalAtom);

  const handleListUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);

      // Calculate offset from page number
      const offset = (page - 1) * limit;

      // Build query parameters with required fields
      const queryParams: Parameters<typeof listUsers>[0] = {
        limit,
        offset,
        sortDirection: sortDirection || "asc",
      };

      // Add search if provided
      if (search && search.trim()) {
        queryParams.searchValue = search.trim();
        queryParams.searchField = "email"; // Default to email search
        queryParams.searchOperator = "contains";
      }

      // Add role filter if provided
      if (roleFilter) {
        queryParams.filterField = "role";
        queryParams.filterValue = roleFilter;
        queryParams.filterOperator = "eq";
      }

      // Add sort if provided
      if (sortBy) {
        queryParams.sortBy = sortBy;
        queryParams.sortDirection = sortDirection || "asc";
      }

      // Call server action
      const result = await listUsers(queryParams);

      if (result.error) {
        setError(result.error);
        console.error("[useListUsers] action error:", result.error);
        // Still update with empty data on error
        setUsers([]);
        setUsersTotal(0);
      } else {
        // Update atoms with fetched data
        setUsers(result.users);
        setUsersTotal(result.total);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      console.error("[useListUsers] unexpected error:", err);
      // Set empty data on error
      setUsers([]);
      setUsersTotal(0);
    } finally {
      setUsersLoading(false);
    }
  };

  // Auto-fetch when filter/search/pagination changes
  useEffect(() => {
    handleListUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, roleFilter, sortBy, sortDirection]);

  return {
    handleListUsers,
    isLoading,
    error,
  };
}
