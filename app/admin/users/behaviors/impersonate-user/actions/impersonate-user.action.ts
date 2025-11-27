'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Input validation schema
const impersonateUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type ImpersonateUserInput = z.infer<typeof impersonateUserInputSchema>;

export interface ImpersonateUserResult {
  success: boolean;
  error?: string;
}

export async function impersonateUser(input: unknown): Promise<ImpersonateUserResult> {
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
    const validated = impersonateUserInputSchema.parse(input);

    // Prevent self-impersonation
    if (validated.userId === currentUser.id) {
      return {
        success: false,
        error: 'Cannot impersonate yourself',
      };
    }

    // Call Better Auth Admin API to impersonate user
    await auth.api.impersonateUser({
      headers: await headers(),
      body: {
        userId: validated.userId,
      },
    });

    // Redirect to home page as impersonated user
    redirect('/');
  } catch (error) {
    // Re-throw redirect errors (Next.js uses errors for redirects)
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message);
      if (errorMessage === 'NEXT_REDIRECT' || errorMessage.includes('NEXT_REDIRECT')) {
        throw error;
      }
    }

    console.error('[impersonateUser] error:', error);

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
      error: 'Failed to impersonate user',
    };
  }
}
