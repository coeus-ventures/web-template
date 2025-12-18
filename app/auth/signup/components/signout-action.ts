"use server";

import { signOut } from "@/shared/behaviors/signout/actions/signout";
import { SIGNUP_URL } from "@/app.config";

export async function signOutAction() {
  await signOut(true, SIGNUP_URL);
}
