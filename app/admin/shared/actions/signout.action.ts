"use server";

import { signOut } from "@/shared/behaviors/signout/actions/signout";

export async function signOutAction() {
  await signOut();
}
