"use server";

import { signOut } from "@/app/auth/behaviors/signout/actions/signout";

export async function signOutAction() {
  await signOut();
}
