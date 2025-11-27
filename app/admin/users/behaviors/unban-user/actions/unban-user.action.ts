'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const unbanUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type UnbanUserInput = z.infer<typeof unbanUserInputSchema>;

export interface UnbanUserResult {
  success: boolean;
  error?: string;
}

export async function unbanUser(input: unknown): Promise<UnbanUserResult> {
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
    const validated = unbanUserInputSchema.parse(input);

    // Call Better Auth Admin API to unban user
    await auth.api.unbanUser({
      headers: await headers(),
      body: {
        userId: validated.userId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[unbanUser] error:', error);

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
      error: 'Failed to unban user',
    };
  }
}
