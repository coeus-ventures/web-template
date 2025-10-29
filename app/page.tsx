import { Database, Zap, Shield, Package, TestTube, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const features = [
    {
      icon: Zap,
      title: "Next.js 16",
      description: "Built on the latest Next.js with React 19, leveraging cutting-edge features and performance optimizations.",
    },
    {
      icon: Database,
      title: "Database Ready",
      description: "Drizzle ORM with SQLite for development and Turso support for production. Type-safe queries out of the box.",
    },
    {
      icon: TestTube,
      title: "Testing Included",
      description: "Vitest for unit testing and Playwright for E2E tests. Write reliable code with confidence.",
    },
    {
      icon: Package,
      title: "Bun Runtime",
      description: "Lightning-fast package manager and runtime. Install dependencies and run scripts in milliseconds.",
    },
    {
      icon: Shield,
      title: "Type Safe",
      description: "Full TypeScript support with strict type checking. Catch errors before they reach production.",
    },
    {
      icon: Sparkles,
      title: "Modern UI",
      description: "shadcn/ui components with Tailwind CSS. Build beautiful interfaces with accessible components.",
    },
  ];

  const techStack = [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Drizzle ORM",
    "SQLite",
    "Vitest",
    "Playwright",
    "Bun",
    "shadcn/ui",
    "Tailwind CSS",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-24">
          <section className="space-y-8 text-center">
            <div className="inline-block rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
              Production-Ready Boilerplate
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
                Next.js Web Template
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                A modern, type-safe web application starter with database integration,
                testing infrastructure, and beautiful UI components. Ship faster with confidence.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
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
                  <Card key={index} className="border-zinc-200 dark:border-zinc-800">
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
                <Badge key={index} variant="secondary" className="px-4 py-2 text-sm">
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
              <Button size="lg">
                Start Building
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
