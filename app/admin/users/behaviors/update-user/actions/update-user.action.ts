"use server";

import { z } from "zod";
import { auth, getUser } from "@/lib/auth";
import { headers } from "next/headers";

// Input validation schema
const updateUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name cannot be empty").optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export interface UpdateUserResult {
  user?: {
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
  };
  error?: string;
}

export async function updateUser(input: unknown): Promise<UpdateUserResult> {
  try {
    // Authentication check - requires admin role
    const { user: currentUser } = await getUser();

    if (!currentUser) {
      return {
        error: "Unauthorized - please sign in",
      };
    }

    if (currentUser.role !== "admin") {
      return {
        error: "Forbidden - admin role required",
      };
    }

    // Validate and parse input
    const validated = updateUserInputSchema.parse(input);

    // Build update data object
    const updateData: {
      email?: string;
      name?: string;
      role?: "user" | "admin";
    } = {};
    if (validated.email) updateData.email = validated.email;
    if (validated.name) updateData.name = validated.name;
    if (validated.role) updateData.role = validated.role;

    // Call Better Auth Admin API to update user
    const response = await auth.api.adminUpdateUser({
      headers: await headers(),
      body: {
        userId: validated.userId,
        data: updateData,
      },
    });

    // The response from Better Auth is the user object directly
    if (!response) {
      return {
        error: "Failed to update user - no user returned",
      };
    }

    // Transform response to match expected structure
    return {
      user: {
        id: response.id,
        email: response.email,
        name: response.name ?? null,
        role: response.role ?? null,
        banned: response.banned ?? null,
        banReason: response.banReason ?? null,
        banExpires: response.banExpires ? new Date(response.banExpires) : null,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        emailVerified: response.emailVerified,
        image: response.image ?? null,
      },
    };
  } catch (error) {
    console.error("[updateUser] error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    // Handle Better Auth API errors
    if (error && typeof error === "object" && "message" in error) {
      return {
        error: String(error.message),
      };
    }

    return {
      error: "Failed to update user",
    };
  }
}
