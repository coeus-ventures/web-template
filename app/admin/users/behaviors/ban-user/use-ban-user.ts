'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { banUser } from './actions/ban-user.action';

export interface BanUserData {
  userId: string;
  banReason?: string;
  banExpiresInDays?: number; // Convert to seconds in the hook
}

export function useBanUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleBanUser = async (data: BanUserData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert days to seconds if provided
      const banExpiresIn = data.banExpiresInDays
        ? data.banExpiresInDays * 24 * 60 * 60
        : undefined;

      // 1. Optimistic update - mark user as banned
      let previousState: any[] = [];
      setUsers((prev) => {
        previousState = prev;
        return prev.map((u) =>
          u.id === data.userId
            ? {
                ...u,
                banned: true,
                banReason: data.banReason || null,
                pending: true,
              }
            : u
        );
      });

      // 2. Call server action
      const result = await banUser({
        userId: data.userId,
        banReason: data.banReason,
        banExpiresIn,
      });

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error
        setUsers(previousState);
        setError(result.error || 'Failed to ban user');
        throw new Error(result.error || 'Failed to ban user');
      }

      // Remove pending flag
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, pending: false } : u
        )
      );
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to ban user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleBanUser,
    isLoading,
    error,
  };
}
