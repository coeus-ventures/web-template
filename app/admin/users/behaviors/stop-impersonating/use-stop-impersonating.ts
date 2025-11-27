'use client';

import { useState } from 'react';
import { stopImpersonating } from './actions/stop-impersonating.action';

export function useStopImpersonating() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStopImpersonating = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call server action (will redirect on success)
      const result = await stopImpersonating();

      if (!result.success || result.error) {
        setError(result.error || 'Failed to stop impersonating');
        throw new Error(result.error || 'Failed to stop impersonating');
      }

      // If we reach here, redirect didn't happen (error case)
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to stop impersonating');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleStopImpersonating,
    isLoading,
    error,
  };
}
