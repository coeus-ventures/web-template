"use server";

import { auth } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { authErrorHandler, throwAuthError } from "@/lib/auth-error";
import { HOME_URL } from "@/app.config";
import { getUser } from "@/lib/auth";

interface ActionResult {
  error: string | null;
}

const signInSchema = z.object({
  email: z.string().email({ message: "INVALID_EMAIL" }),
  password: z.string().min(6, { message: "WEAK_PASSWORD" }),
});

export async function signIn(
  _prevState: ActionResult,
  formData: FormData,
  redirectURL: string
): Promise<ActionResult> {
  const { user } = await getUser();
  if (user) {
    return { error: "You are already logged in. Please sign out first." };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  console.log("signing in", raw);
  const parsed = signInSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const errorCode = firstError.message;

    if (errorCode === "INVALID_EMAIL") {
      return { error: throwAuthError("invalidEmail").message };
    }

    if (errorCode === "WEAK_PASSWORD") {
      return { error: throwAuthError("weakPassword").message };
    }

    return { error: "Validation error" };
  }

  const { email, password } = parsed.data;

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
  } catch (err) {
    const handled = authErrorHandler(err);
    return { error: handled.message };
  }

  redirect(redirectURL || HOME_URL);
}
