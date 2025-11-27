'use server';

import { getUser } from '@/lib/auth';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { count, eq, gt } from 'drizzle-orm';

export interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  bannedUsers: number;
}

export interface GetStatsResult {
  stats?: AdminStats;
  error?: string;
}

export async function getStats(): Promise<GetStatsResult> {
  try {
    // Authentication check - requires admin role
    const { user: currentUser } = await getUser();

    if (!currentUser) {
      return {
        error: 'Unauthorized - please sign in',
      };
    }

    if (currentUser.role !== 'admin') {
      return {
        error: 'Forbidden - admin role required',
      };
    }

    // Get total users count
    const totalUsersResult = await db
      .select({ count: count() })
      .from(user);

    // Get active sessions count (sessions that haven't expired)
    const now = new Date();
    const activeSessionsResult = await db
      .select({ count: count() })
      .from(session)
      .where(gt(session.expiresAt, now));

    // Get banned users count
    const bannedUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.banned, true));

    return {
      stats: {
        totalUsers: totalUsersResult[0]?.count ?? 0,
        activeSessions: activeSessionsResult[0]?.count ?? 0,
        bannedUsers: bannedUsersResult[0]?.count ?? 0,
      },
    };
  } catch (error) {
    console.error('[getStats] error:', error);

    return {
      error: 'Failed to fetch statistics',
    };
  }
}
