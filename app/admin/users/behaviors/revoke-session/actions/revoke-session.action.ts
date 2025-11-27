'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const revokeSessionInputSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

export type RevokeSessionInput = z.infer<typeof revokeSessionInputSchema>;

export interface RevokeSessionResult {
  success: boolean;
  error?: string;
}

export async function revokeSession(input: unknown): Promise<RevokeSessionResult> {
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
    const validated = revokeSessionInputSchema.parse(input);

    // Call Better Auth Admin API to revoke session
    await auth.api.revokeUserSession({
      headers: await headers(),
      body: {
        sessionToken: validated.sessionToken,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[revokeSession] error:', error);

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
      error: 'Failed to revoke session',
    };
  }
}
