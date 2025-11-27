'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { setRole } from './actions/set-role.action';

export interface SetRoleData {
  userId: string;
  role: 'user' | 'admin';
}

export function useSetRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleSetRole = async (data: SetRoleData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Optimistic update
      let previousState: any[] = [];
      setUsers((prev) => {
        previousState = prev;
        return prev.map((u) =>
          u.id === data.userId
            ? { ...u, role: data.role, pending: true }
            : u
        );
      });

      // 2. Call server action
      const result = await setRole(data);

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error
        setUsers(previousState);
        setError(result.error || 'Failed to update role');
        throw new Error(result.error || 'Failed to update role');
      }

      // Remove pending flag
      setUsers((prev) =>
        prev.map((u) => (u.id === data.userId ? { ...u, pending: false } : u))
      );
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to update role');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSetRole,
    isLoading,
    error,
  };
}
