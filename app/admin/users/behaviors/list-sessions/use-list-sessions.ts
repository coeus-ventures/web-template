'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { selectedUserSessionsAtom, sessionsLoadingAtom } from '@/app/admin/users/state';
import { listSessions } from './actions/list-sessions.action';

export function useListSessions() {
  const [error, setError] = useState<string | null>(null);
  const setSessions = useSetAtom(selectedUserSessionsAtom);
  const setLoading = useSetAtom(sessionsLoadingAtom);

  const handleListSessions = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call server action
      const result = await listSessions({ userId });

      if (result.error) {
        setError(result.error);
        setSessions([]);
        throw new Error(result.error);
      }

      // Update sessions atom
      setSessions(result.sessions);
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to fetch sessions');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleListSessions,
    error,
  };
}
