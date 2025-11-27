'use client';

import { useState } from 'react';
import { impersonateUser } from './actions/impersonate-user.action';

export function useImpersonateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImpersonateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call server action (will redirect on success)
      const result = await impersonateUser({ userId });

      if (!result.success || result.error) {
        setError(result.error || 'Failed to impersonate user');
        throw new Error(result.error || 'Failed to impersonate user');
      }

      // If we reach here, redirect didn't happen (error case)
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to impersonate user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleImpersonateUser,
    isLoading,
    error,
  };
}
