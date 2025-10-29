import { Rocket, Code2, Zap, Shield, Clock, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signOut as signOutAction } from "@/app/auth/behaviors/signout/actions/signout";

async function handleSignOut() {
  "use server";
  await signOutAction();
}

export default async function HomePage() {
  const { user } = await getUser();
  const features = [
    {
      icon: Rocket,
      title: "Ship Faster",
      description:
        "Stop wasting weeks on setup. Start building your product immediately with everything configured and ready to go.",
    },
    {
      icon: Code2,
      title: "Developer First",
      description:
        "Built with modern TypeScript, comprehensive testing suite, and best practices baked in from day one.",
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description:
        "Authentication with Better Auth, type-safe database queries, and security best practices included out of the box.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Powered by Bun runtime and Next.js 16. Experience blazing fast builds, installs, and hot reload.",
    },
    {
      icon: Clock,
      title: "Save Time",
      description:
        "Skip the boring setup work. Authentication, database, testing, and UI components are already integrated.",
    },
    {
      icon: Users,
      title: "Production Ready",
      description:
        "Battle-tested stack used by developers to launch MVPs, SaaS products, and side projects.",
    },
  ];

  const techStack = [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Better Auth",
    "Drizzle ORM",
    "Vitest",
    "Playwright",
    "Bun",
    "shadcn/ui",
    "Tailwind CSS",
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {user && (
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
      )}
      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-24">
          <section className="space-y-8 text-center">
            <div className="inline-block rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
              Production-Ready Boilerplate
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
                Start Building, Not Configuring
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                A complete Next.js starter for developers who want to ship fast.
                Authentication, database, testing, and beautiful UI included.
                Focus on your product, not the setup.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Documentation
              </Button>
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Everything You Need
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Built with modern tools and best practices
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    <CardHeader>
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <Icon className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-zinc-600 dark:text-zinc-400">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Powerful Tech Stack
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Industry-leading tools and frameworks
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {techStack.map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Ready to Build?
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Get started in minutes with our comprehensive setup guide
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Start Building</Link>
              </Button>
              <Button size="lg" variant="ghost">
                Learn More
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Built with Next.js, Drizzle ORM, and shadcn/ui</p>
        </div>
      </footer>
    </div>
  );
}
