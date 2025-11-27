'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { selectedUserSessionsAtom } from '@/app/admin/users/state';
import { revokeSession } from './actions/revoke-session.action';

export function useRevokeSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSessions = useSetAtom(selectedUserSessionsAtom);

  const handleRevokeSession = async (sessionToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Optimistic update - remove session from list
      let removedSession: any = null;
      setSessions((prev) => {
        removedSession = prev.find((s) => s.token === sessionToken);
        return prev.filter((s) => s.token !== sessionToken);
      });

      // 2. Call server action
      const result = await revokeSession({ sessionToken });

      // 3. Handle result
      if (!result.success || result.error) {
        // Rollback on error - add session back
        if (removedSession) {
          setSessions((prev) => [removedSession, ...prev]);
        }
        setError(result.error || 'Failed to revoke session');
        throw new Error(result.error || 'Failed to revoke session');
      }

      // Success - session already removed from list
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to revoke session');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleRevokeSession,
    isLoading,
    error,
  };
}
