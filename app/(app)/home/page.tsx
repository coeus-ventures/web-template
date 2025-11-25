import { FileText } from "lucide-react";

export default async function HomePage() {
  return (
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
            This is the first page users will see after logging in. Start
            building your application here.
          </p>
        </div>
      </div>
    </main>
  );
}
