'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { updateUser } from './actions/update-user.action';

// Input validation schema
const updateUserSchema = z.object({
  userId: z.string(),
  email: z.string().email('Invalid email').optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleUpdateUser = async (rawData: unknown) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Client-side validation
      const validated = updateUserSchema.parse(rawData);

      // 2. Optimistic update
      let previousState: any[] = [];
      setUsers((prev) => {
        previousState = prev;
        return prev.map((u) =>
          u.id === validated.userId
            ? {
                ...u,
                ...(validated.email && { email: validated.email }),
                ...(validated.name && { name: validated.name }),
                ...(validated.role && { role: validated.role }),
                pending: true,
              }
            : u
        );
      });

      // 3. Call server action
      const result = await updateUser(validated);

      // 4. Handle result
      if (result.error) {
        // Rollback on error
        setUsers(previousState);
        setError(result.error);
        throw new Error(result.error);
      }

      // Update with real data from server
      if (result.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === validated.userId ? result.user! : u))
        );
      }
    } catch (err) {
      // Error handling
      if (err instanceof z.ZodError) {
        const errorMessage = err.issues.map((e) => e.message).join(', ');
        setError(errorMessage);
      } else if (err instanceof Error && !error) {
        setError(err.message);
      } else if (!error) {
        setError('Failed to update user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUpdateUser,
    isLoading,
    error,
  };
}
