'use server';

import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export interface StopImpersonatingResult {
  success: boolean;
  error?: string;
}

export async function stopImpersonating(): Promise<StopImpersonatingResult> {
  try {
    // Authentication check
    const { user: currentUser } = await getUser();

    if (!currentUser) {
      return {
        success: false,
        error: 'Unauthorized - please sign in',
      };
    }

    // Call Better Auth Admin API to stop impersonating
    await auth.api.stopImpersonating({
      headers: await headers(),
    });

    // Redirect to admin users page
    redirect('/admin/users');
  } catch (error) {
    // Re-throw redirect errors (Next.js uses errors for redirects)
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message);
      if (errorMessage === 'NEXT_REDIRECT' || errorMessage.includes('NEXT_REDIRECT')) {
        throw error;
      }
    }

    console.error('[stopImpersonating] error:', error);

    // Handle Better Auth API errors
    if (error && typeof error === 'object' && 'message' in error) {
      return {
        success: false,
        error: String(error.message),
      };
    }

    return {
      success: false,
      error: 'Failed to stop impersonating',
    };
  }
}
