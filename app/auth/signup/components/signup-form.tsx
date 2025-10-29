"use client";

import { useSignup } from "../behaviors/signup/use-signup";

// Simple Lock Icon for Password Field
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5 text-gray-400"
  >
    <path
      fillRule="evenodd"
      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
      clipRule="evenodd"
    />
  </svg>
);

// Simple User Icon for Email Field
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5 text-gray-400"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

interface SignUpFormProps {
  redirectURL: string;
}

export default function SignUpForm({ redirectURL }: SignUpFormProps) {
  const { state, formAction, isLoading } = useSignup(redirectURL);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div
          className="border-2 border-dashed border-red-400 bg-red-50/30 px-4 py-3 relative"
          role="alert"
        >
          <span className="text-xs font-mono text-red-400 absolute -top-2 -left-2 bg-gray-50 px-1">
            ERROR
          </span>
          <span className="block font-mono text-red-700 text-sm mt-2">
            {state.error}
          </span>
        </div>
      )}

      {/* Email Field */}
      <div className="relative border border-dashed border-gray-300 bg-white/30 p-1">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <UserIcon />
        </div>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          className="block w-full pl-10 pr-3 py-2 bg-transparent border-none placeholder-gray-500 text-gray-900 focus:outline-none font-mono text-sm"
        />
      </div>

      {/* Password Field */}
      <div className="relative border border-dashed border-gray-300 bg-white/30 p-1">
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <LockIcon />
        </div>
        <input
          type="password"
          id="password"
          name="password"
          required
          placeholder="Create a password (min. 8 characters)"
          className="block w-full pl-10 pr-3 py-2 bg-transparent border-none placeholder-gray-500 text-gray-900 focus:outline-none font-mono text-sm"
        />
      </div>

      {/* Confirm Password Field */}
      <div className="relative border border-dashed border-gray-300 bg-white/30 p-1">
        <label htmlFor="confirmPassword" className="sr-only">
          Confirm Password
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <LockIcon />
        </div>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          placeholder="Confirm your password"
          className="block w-full pl-10 pr-3 py-3 bg-transparent border-none placeholder-gray-500 text-gray-900 focus:outline-none font-mono text-sm"
        />
      </div>

      <div className="relative">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-amber-400 text-gray-900 font-mono font-bold border-2 border-dashed border-amber-600 hover:bg-amber-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              CREATING ACCOUNT...
            </>
          ) : (
            <>
              CREATE ACCOUNT
              <span className="text-amber-700">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
