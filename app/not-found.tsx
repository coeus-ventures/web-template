"use client";

import { Ghost, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

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

        {/* Error code */}
        <div className="space-y-2">
          <h1 className="text-8xl font-bold tracking-tighter text-zinc-200 dark:text-zinc-800">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Page under construction
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base">
            The page you&apos;re looking for hasn&apos;t been built yet.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Error 404 | Page under construction
          </p>
        </div>
      </div>
    </div>
  );
}
