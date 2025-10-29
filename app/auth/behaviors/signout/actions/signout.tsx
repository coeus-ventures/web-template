"use server";
import { SIGNIN_URL } from "@/app.config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signOut(
  shouldRedirect: boolean = true,
  redirectUrl: string = SIGNIN_URL
) {
  await auth.api.signOut({
    headers: await headers(),
  });

  if (shouldRedirect) {
    redirect(redirectUrl);
  }
}
