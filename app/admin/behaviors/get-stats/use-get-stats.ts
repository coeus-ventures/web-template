'use client';

import { useState, useEffect } from 'react';
import { getStats, AdminStats } from './actions/get-stats.action';

export function useGetStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGetStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getStats();

      if (result.error) {
        setError(result.error);
        setStats(null);
      } else if (result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    handleGetStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: handleGetStats,
  };
}
