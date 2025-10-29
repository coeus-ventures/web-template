import Link from 'next/link';
import SignUpForm from './components/signup-form';
import { HOME_URL, APP_NAME } from "@/app.config";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface SignUpPageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectURL = params.redirectTo;
  
  // If user is already authenticated, redirect them away from signup
  const { user } = await getUser();
  if (user) {
    redirect(redirectURL || HOME_URL);
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              <Link href="/">{APP_NAME}</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Already have an account?</span>
              <Link
                href={`/auth/signin${redirectURL ? `?redirectTo=${encodeURIComponent(redirectURL)}` : ''}`}
                className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sign Up Form Container */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center w-full pt-16 pb-24">
          {/* Info badge */}
          <div className="inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm mb-8">
            <span className="text-zinc-700 dark:text-zinc-300">This is a placeholder for your Signup Page. Customize it!</span>
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
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-zinc-900 dark:hover:text-zinc-50 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-zinc-50 font-medium">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
