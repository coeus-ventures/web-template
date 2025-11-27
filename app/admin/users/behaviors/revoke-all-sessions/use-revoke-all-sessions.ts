'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { selectedUserSessionsAtom } from '@/app/admin/users/state';
import { revokeAllSessions } from './actions/revoke-all-sessions.action';

export function useRevokeAllSessions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSessions = useSetAtom(selectedUserSessionsAtom);

  const handleRevokeAllSessions = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Optimistic update - clear all sessions
      let previousSessions: any[] = [];
      setSessions((prev) => {
        previousSessions = prev;
        return [];
      });

      // 2. Call server action
      const result = await revokeAllSessions({ userId });

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error - restore sessions
        setSessions(previousSessions);
        setError(result.error || 'Failed to revoke all sessions');
        throw new Error(result.error || 'Failed to revoke all sessions');
      }

      // Success - sessions already cleared
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to revoke all sessions');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleRevokeAllSessions,
    isLoading,
    error,
  };
}
