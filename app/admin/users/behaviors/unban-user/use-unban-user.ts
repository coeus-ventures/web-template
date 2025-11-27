'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { unbanUser } from './actions/unban-user.action';

export function useUnbanUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleUnbanUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Optimistic update - mark user as unbanned
      let previousState: any[] = [];
      setUsers((prev) => {
        previousState = prev;
        return prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                banned: false,
                banReason: null,
                banExpires: null,
                pending: true,
              }
            : u
        );
      });

      // 2. Call server action
      const result = await unbanUser({ userId });

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error
        setUsers(previousState);
        setError(result.error || 'Failed to unban user');
        throw new Error(result.error || 'Failed to unban user');
      }

      // Remove pending flag
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, pending: false } : u))
      );
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to unban user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUnbanUser,
    isLoading,
    error,
  };
}
