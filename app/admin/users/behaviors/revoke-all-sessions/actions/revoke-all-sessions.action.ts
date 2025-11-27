'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const revokeAllSessionsInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type RevokeAllSessionsInput = z.infer<typeof revokeAllSessionsInputSchema>;

export interface RevokeAllSessionsResult {
  success: boolean;
  error?: string;
}

export async function revokeAllSessions(input: unknown): Promise<RevokeAllSessionsResult> {
  try {
    // Authentication check - requires admin role
    const { user: currentUser } = await getUser();

    if (!currentUser) {
      return {
        success: false,
        error: 'Unauthorized - please sign in',
      };
    }

    if (currentUser.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden - admin role required',
      };
    }

    // Validate and parse input
    const validated = revokeAllSessionsInputSchema.parse(input);

    // Call Better Auth Admin API to revoke all sessions
    await auth.api.revokeUserSessions({
      headers: await headers(),
      body: {
        userId: validated.userId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[revokeAllSessions] error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(', '),
      };
    }

    // Handle Better Auth API errors
    if (error && typeof error === 'object' && 'message' in error) {
      return {
        success: false,
        error: String(error.message),
      };
    }

    return {
      success: false,
      error: 'Failed to revoke all sessions',
    };
  }
}
