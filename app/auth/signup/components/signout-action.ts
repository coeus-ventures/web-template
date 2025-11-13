"use server";

import { signOut } from "@/app/auth/behaviors/signout/actions/signout";
import { SIGNUP_URL } from "@/app.config";

export async function signOutAction() {
  await signOut(true, SIGNUP_URL);
}
