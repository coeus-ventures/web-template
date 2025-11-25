import { FileText } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-16 sm:p-24 text-center min-h-[500px] flex flex-col items-center justify-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <FileText className="h-10 w-10 text-zinc-400 dark:text-zinc-500 animate-pulse" />
            </div>

            <div className="mt-8 h-9 w-64 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />

            <div className="mt-4 h-6 w-80 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </main>
    </div>
  );
}
