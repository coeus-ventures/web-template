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
    <div className="min-h-screen bg-gray-50 text-gray-900 bg-dotted-grid relative">
      {/* Construction elements scattered around */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-dashed border-blue-500 rotate-45"></div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 border border-dashed border-orange-500 rounded-full animate-[dot-fade_3s_ease-in-out_infinite]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-6xl mx-auto border-b border-dashed border-gray-300">
        <div className="text-2xl font-mono font-bold tracking-tight text-gray-900 relative">
          <span className="bg-yellow-200 px-2 py-1 text-sm absolute -top-6 -left-2 rotate-2 font-normal">
            starter template
          </span>
          <Link href="/">{APP_NAME}</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-600">Already have an account?</span>
          <Link 
            href={`/auth/signin${redirectURL ? `?redirectTo=${encodeURIComponent(redirectURL)}` : ''}`}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-dashed border-gray-400 hover:border-gray-600"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Sign Up Form Container */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full px-6 pt-16 pb-24">
        {/* Construction badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-amber-500 bg-amber-50 mb-8">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-mono text-amber-800">This is a placeholder for your Signup Page. Customize it!</span>
        </div>

        <div className="w-full max-w-md border-2 border-dashed border-gray-400 bg-white/50 backdrop-blur-sm relative p-8 md:p-10">
          <span className="text-xs font-mono text-gray-400 absolute top-2 left-2">SIGNUP_FORM</span>
          
          <div className="text-center mb-8 mt-4">
            <div className="bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center relative py-6 mb-4">
              <span className="text-sm font-mono text-gray-500 absolute top-2 left-2">H1</span>
              <h1 className="text-3xl font-bold font-mono text-gray-700">
                Create Account
              </h1>
            </div>
          </div>
          <SignUpForm redirectURL={redirectURL || HOME_URL} />
        </div>
        
        <div className="mt-8 border border-dashed border-gray-300 rounded-lg p-4 bg-white/30 relative max-w-md">
          <span className="text-xs font-mono text-gray-400 absolute top-1 left-2">LEGAL</span>
          <p className="text-xs font-mono text-gray-600 text-center mt-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-900">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-900">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Keyframes for blob animation */}
    </div>
  );
}
