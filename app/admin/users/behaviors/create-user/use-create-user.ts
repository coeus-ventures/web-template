'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useSetAtom } from 'jotai';
import { usersAtom } from '@/app/admin/users/state';
import { createUser } from './actions/create-user.action';

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUsers = useSetAtom(usersAtom);

  const handleCreateUser = async (rawData: unknown) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Client-side validation
      const validated = createUserSchema.parse(rawData);

      // 2. Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempUser = {
        id: tempId,
        email: validated.email,
        name: validated.name,
        role: validated.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        image: null,
        banned: null,
        banReason: null,
        banExpires: null,
        pending: true,
      };
      setUsers((prev) => [tempUser, ...prev]);

      // 3. Call server action
      const result = await createUser(validated);

      // 4. Handle result
      if (result.error) {
        // Rollback on error
        setUsers((prev) => prev.filter((u) => u.id !== tempId));
        setError(result.error);
        throw new Error(result.error);
      }

      // Replace temp user with real user
      if (result.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === tempId ? result.user! : u))
        );
      }
    } catch (err) {
      // Error already handled above
      if (err instanceof z.ZodError) {
        const errorMessage = err.issues.map((e) => e.message).join(', ');
        setError(errorMessage);
      } else if (err instanceof Error) {
        // Error is already set in the result.error case
        if (!error) {
          setError(err.message);
        }
      } else {
        setError('Failed to create user');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCreateUser,
    isLoading,
    error,
  };
}
