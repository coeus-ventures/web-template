import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { signOut } from "./behaviors/signout/actions/signout";
import { AuthHeader } from "./components/auth-header";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUser();

  if (user) {
    await signOut(false);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <Suspense fallback={null}>
        <AuthHeader />
      </Suspense>
      {children}
    </div>
  );
}
