'use server';

import { z } from 'zod';
import { auth, getUser } from '@/lib/auth';
import { headers } from 'next/headers';

// Input validation schema
const listUsersInputSchema = z.object({
  searchValue: z.string().optional(),
  searchField: z.enum(['email', 'name']).optional(),
  searchOperator: z.enum(['contains', 'starts_with', 'ends_with']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
  filterField: z.string().optional(),
  filterValue: z.string().optional(),
  filterOperator: z.enum(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']).optional(),
});

export type ListUsersInput = z.infer<typeof listUsersInputSchema>;

export interface ListUsersResult {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
    emailVerified: boolean;
    image: string | null;
  }>;
  total: number;
  limit?: number;
  offset?: number;
  error?: string;
}

export async function listUsers(input?: ListUsersInput): Promise<ListUsersResult> {
  try {
    // Authentication check - requires admin role
    const { user } = await getUser();

    if (!user) {
      return {
        users: [],
        total: 0,
        error: 'Unauthorized - please sign in',
      };
    }

    if (user.role !== 'admin') {
      return {
        users: [],
        total: 0,
        error: 'Forbidden - admin role required',
      };
    }

    // Validate and parse input
    const validated = listUsersInputSchema.parse(input || {});

    // Build query object for Better Auth API
    const query: Record<string, unknown> = {
      limit: validated.limit,
      offset: validated.offset,
    };

    // Add search parameters if provided
    if (validated.searchValue) {
      query.searchValue = validated.searchValue;
      if (validated.searchField) {
        query.searchField = validated.searchField;
      }
      if (validated.searchOperator) {
        query.searchOperator = validated.searchOperator;
      }
    }

    // Add sort parameters if provided
    if (validated.sortBy) {
      query.sortBy = validated.sortBy;
      query.sortDirection = validated.sortDirection;
    }

    // Add filter parameters if provided
    if (validated.filterField && validated.filterValue) {
      query.filterField = validated.filterField;
      query.filterValue = validated.filterValue;
      if (validated.filterOperator) {
        query.filterOperator = validated.filterOperator;
      }
    }

    // Call Better Auth Admin API
    const response = await auth.api.listUsers({
      headers: await headers(),
      query,
    });

    // Transform response to match expected structure
    return {
      users: response.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: user.role ?? null,
        banned: user.banned ?? null,
        banReason: user.banReason ?? null,
        banExpires: user.banExpires ? new Date(user.banExpires) : null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        emailVerified: user.emailVerified,
        image: user.image ?? null,
      })),
      total: response.total,
      limit: validated.limit,
      offset: validated.offset,
    };
  } catch (error) {
    console.error('[listUsers] error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        users: [],
        total: 0,
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    // Handle Better Auth API errors
    return {
      users: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}
