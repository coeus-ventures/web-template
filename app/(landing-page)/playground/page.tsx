"use client";

import { useHello } from "./behaviors/hello-world/use-hello";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Loader2 } from "lucide-react";

export default function PlaygroundPage() {
  const { state, formAction, isLoading } = useHello();

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm">
            <FlaskConical className="h-4 w-4" />
            <span>Playground - AutoTracer Test</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Hello World Behavior
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Teste a arquitetura Behave.js e o plugin de instrumentação AutoTracer
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Testar Server Action</CardTitle>
            <CardDescription>
              Digite um nome e clique em &quot;Testar Trace&quot; para validar o fluxo
              completo: Hook → Action → Response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Nome
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Digite seu nome..."
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Testar Trace"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {state.error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Badge variant="destructive">Erro</Badge>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {state.error}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {state.result && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">Sucesso</Badge>
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  Resposta do Servidor
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-white dark:bg-zinc-900 p-4 border border-green-200 dark:border-green-800">
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {state.result.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Server Time:</span>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                  {new Date(state.result.serverTime).toISOString()}
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              Informações de Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Behavior:</span>
                <code className="ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  hello-world
                </code>
              </div>
              <div>
                <span className="text-zinc-500">Page Layer:</span>
                <code className="ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  component
                </code>
              </div>
              <div>
                <span className="text-zinc-500">Hook Layer:</span>
                <code className="ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  hook
                </code>
              </div>
              <div>
                <span className="text-zinc-500">Action Layer:</span>
                <code className="ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  server-action
                </code>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              Verifique <code>logs/debug.log</code> após clicar em &quot;Testar Trace&quot;
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
