"use server";

import { z } from "zod";
import { auth, getUser } from "@/lib/auth";
import { headers } from "next/headers";

// Input validation schema
const createUserInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export interface CreateUserResult {
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

export async function createUser(input: unknown): Promise<CreateUserResult> {
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
    const validated = createUserInputSchema.parse(input);

    // Call Better Auth Admin API to create user
    const response = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: validated.email,
        password: validated.password,
        name: validated.name,
        role: validated.role,
      },
    });

    // The response from Better Auth is { user: UserWithRole }
    const createdUser = response.user;

    // Transform response to match expected structure
    return {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name ?? null,
        role: createdUser.role ?? null,
        banned: createdUser.banned ?? null,
        banReason: createdUser.banReason ?? null,
        banExpires: createdUser.banExpires
          ? new Date(createdUser.banExpires)
          : null,
        createdAt: new Date(createdUser.createdAt),
        updatedAt: new Date(createdUser.updatedAt),
        emailVerified: createdUser.emailVerified,
        image: createdUser.image ?? null,
      },
    };
  } catch (error) {
    console.error("[createUser] error:", error);

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
      error: "Failed to create user",
    };
  }
}
