import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Animated ghost icon */}
        <div className="relative mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="relative flex h-32 w-32 items-center justify-center mx-auto">
            <Ghost className="h-16 w-16 text-zinc-400 dark:text-zinc-500 animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
            Under Construction
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xl">
            This page is currently being built.
          </p>
          <p className="text-zinc-500 dark:text-zinc-500 text-lg">
            We&apos;re working on it and it will be ready soon!
          </p>
        </div>
      </div>

      {/* Dotted frame */}
      <div className="absolute inset-[20%] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg pointer-events-none" />
    </div>
  );
}
