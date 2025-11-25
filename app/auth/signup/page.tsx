import Link from "next/link";
import SignUpForm from "./components/signup-form";
import { HOME_URL } from "@/app.config";

interface SignUpPageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectURL = params.redirectTo;

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center w-full pt-16 pb-24">
        {/* Info badge */}
        <div className="inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm mb-8">
          <span className="text-zinc-700 dark:text-zinc-300">
            This is a placeholder for your Signup Page. Customize it!
          </span>
        </div>

        <div className="w-full max-w-md">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Create Account
              </h1>
            </div>
            <SignUpForm redirectURL={redirectURL || HOME_URL} />
          </div>

          <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-50 font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-50 font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
