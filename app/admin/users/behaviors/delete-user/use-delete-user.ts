'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { deleteUser } from './actions/delete-user.action';

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Optimistic update - remove user from list
      let removedUser: any = null;
      setUsers((prev) => {
        const userToRemove = prev.find((u) => u.id === userId);
        removedUser = userToRemove;
        return prev.filter((u) => u.id !== userId);
      });

      // 2. Call server action
      const result = await deleteUser({ userId });

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error - add user back
        if (removedUser) {
          setUsers((prev) => [removedUser, ...prev]);
        }
        setError(result.error || 'Failed to delete user');
        throw new Error(result.error || 'Failed to delete user');
      }

      // Success - user is already removed from list
    } catch (err) {
      // Error already handled above
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to delete user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDeleteUser,
    isLoading,
    error,
  };
}
