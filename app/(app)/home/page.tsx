import { LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { signOut as signOutAction } from "@/app/auth/behaviors/signout/actions/signout";
import { redirect } from "next/navigation";
import { SIGNIN_URL } from "@/app.config";

async function handleSignOut() {
  "use server";
  await signOutAction();
}

export default async function HomePage() {
  const { user } = await getUser();

  if (!user) redirect(SIGNIN_URL);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-16 sm:p-24 text-center min-h-[500px] flex flex-col items-center justify-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <FileText className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
            </div>

            <h1 className="mt-8 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome to Home Page
            </h1>

            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
              This is the first page users will see after logging in. Start building your application here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
