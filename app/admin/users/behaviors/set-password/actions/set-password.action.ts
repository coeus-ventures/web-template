'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const setPasswordInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SetPasswordInput = z.infer<typeof setPasswordInputSchema>;

export interface SetPasswordResult {
  success: boolean;
  error?: string;
}

export async function setPassword(input: unknown): Promise<SetPasswordResult> {
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
    const validated = setPasswordInputSchema.parse(input);

    // Call Better Auth Admin API to set password
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId: validated.userId,
        newPassword: validated.newPassword,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[setPassword] error:', error);

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
      error: 'Failed to reset password',
    };
  }
}
