'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const banUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  banReason: z.string().optional(),
  banExpiresIn: z.number().positive().optional(), // in seconds
});

export type BanUserInput = z.infer<typeof banUserInputSchema>;

export interface BanUserResult {
  success: boolean;
  error?: string;
}

export async function banUser(input: unknown): Promise<BanUserResult> {
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
    const validated = banUserInputSchema.parse(input);

    // Prevent self-ban
    if (validated.userId === currentUser.id) {
      return {
        success: false,
        error: 'Cannot ban your own account',
      };
    }

    // Call Better Auth Admin API to ban user
    await auth.api.banUser({
      headers: await headers(),
      body: {
        userId: validated.userId,
        ...(validated.banReason && { banReason: validated.banReason }),
        ...(validated.banExpiresIn && { banExpiresIn: validated.banExpiresIn }),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[banUser] error:', error);

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
      error: 'Failed to ban user',
    };
  }
}
