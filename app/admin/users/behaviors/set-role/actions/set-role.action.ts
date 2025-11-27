'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const setRoleInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['user', 'admin']),
});

export type SetRoleInput = z.infer<typeof setRoleInputSchema>;

export interface SetRoleResult {
  success: boolean;
  error?: string;
}

export async function setRole(input: unknown): Promise<SetRoleResult> {
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
    const validated = setRoleInputSchema.parse(input);

    // Prevent removing own admin role
    if (validated.userId === currentUser.id && validated.role !== 'admin') {
      return {
        success: false,
        error: 'Cannot remove your own admin role',
      };
    }

    // Call Better Auth Admin API to set role
    await auth.api.setRole({
      headers: await headers(),
      body: {
        userId: validated.userId,
        role: validated.role,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[setRole] error:', error);

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
      error: 'Failed to update role',
    };
  }
}
