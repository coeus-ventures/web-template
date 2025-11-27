"use server";

import { z } from "zod";
import { auth, getUser } from "@/lib/auth";
import { headers } from "next/headers";
import { Session } from "@/app/admin/users/state";

// Input validation schema
const listSessionsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ListSessionsInput = z.infer<typeof listSessionsInputSchema>;

export interface ListSessionsResult {
  sessions: Session[];
  error?: string;
}

export async function listSessions(
  input: unknown
): Promise<ListSessionsResult> {
  try {
    // Authentication check - requires admin role
    const { user: currentUser } = await getUser();

    if (!currentUser) {
      return {
        sessions: [],
        error: "Unauthorized - please sign in",
      };
    }

    if (currentUser.role !== "admin") {
      return {
        sessions: [],
        error: "Forbidden - admin role required",
      };
    }

    // Validate and parse input
    const validated = listSessionsInputSchema.parse(input);

    // Call Better Auth Admin API to list user sessions
    const response = await auth.api.listUserSessions({
      headers: await headers(),
      body: {
        userId: validated.userId,
      },
    });

    // Transform response to match expected structure
    const sessions = response.sessions.map((session: any) => ({
      id: session.id,
      userId: session.userId,
      token: session.token,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      expiresAt: new Date(session.expiresAt),
      impersonatedBy: session.impersonatedBy ?? null,
    }));

    return {
      sessions,
    };
  } catch (error) {
    console.error("[listSessions] error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        sessions: [],
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    // Handle Better Auth API errors
    if (error && typeof error === "object" && "message" in error) {
      return {
        sessions: [],
        error: String(error.message),
      };
    }

    return {
      sessions: [],
      error: "Failed to fetch sessions",
    };
  }
}
