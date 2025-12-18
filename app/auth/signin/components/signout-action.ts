"use server";

import { signOut } from "@/shared/behaviors/signout/actions/signout";
import { SIGNIN_URL } from "@/app.config";

export async function signOutAction() {
  await signOut(true, SIGNIN_URL);
}
