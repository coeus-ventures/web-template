"use server";

import { auth } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { authErrorHandler, throwAuthError } from "@/lib/auth-error";
import { HOME_URL } from "@/app.config";

export interface ActionResult {
  error: string | null;
}

const signupSchema = z
  .object({
    email: z.string().email({ message: "INVALID_EMAIL" }),
    password: z
      .string()
      .min(6, { message: "WEAK_PASSWORD" })
      .max(255, { message: "WEAK_PASSWORD" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });

export async function signup(
  _prevState: ActionResult,
  formData: FormData,
  redirectURL: string
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const errorCode = firstError.message;

    if (errorCode === "INVALID_EMAIL") {
      return { error: throwAuthError("invalidEmail").message };
    }

    if (errorCode === "WEAK_PASSWORD") {
      return { error: throwAuthError("weakPassword").message };
    }

    if (errorCode === "PASSWORDS_DO_NOT_MATCH") {
      return { error: "Passwords do not match" };
    }

    return { error: "Validation error" };
  }

  const { email, password } = parsed.data;

  const result = await auth.api
    .signUpEmail({
      body: {
        email,
        password,
        name: "", // Better Auth requires name field
      },
    })
    .catch((err) => {
      const handled = authErrorHandler(err);
      return { error: handled.message };
    });

  if ("error" in result) {
    return result;
  }

  if (!result || (!result.user && !result.token)) {
    return {
      error: throwAuthError("internalServerError").message,
    };
  }

  redirect(redirectURL || HOME_URL);
}
