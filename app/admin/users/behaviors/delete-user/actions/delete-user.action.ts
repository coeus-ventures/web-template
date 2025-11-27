'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const deleteUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

export async function deleteUser(input: unknown): Promise<DeleteUserResult> {
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
    const validated = deleteUserInputSchema.parse(input);

    // Prevent self-deletion
    if (validated.userId === currentUser.id) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    // Call Better Auth Admin API to remove user
    await auth.api.removeUser({
      headers: await headers(),
      body: {
        userId: validated.userId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[deleteUser] error:', error);

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
      error: 'Failed to delete user',
    };
  }
}
