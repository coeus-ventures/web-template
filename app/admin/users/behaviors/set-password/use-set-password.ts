'use client';

import { useState } from 'react';
import { setPassword } from './actions/set-password.action';

export interface SetPasswordData {
  userId: string;
  newPassword: string;
}

export function useSetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetPassword = async (data: SetPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call server action (no optimistic update for password)
      const result = await setPassword(data);

      if (!result.success || result.error) {
        setError(result.error || 'Failed to reset password');
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to reset password');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSetPassword,
    isLoading,
    error,
  };
}
