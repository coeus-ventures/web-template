"use server";

import { z } from "zod";

const helloSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export interface HelloResult {
  message: string;
  serverTime: number;
}

export interface HelloState {
  result: HelloResult | null;
  error: string | null;
}

export async function hello(
  _prevState: HelloState,
  formData: FormData
): Promise<HelloState> {
  const raw = {
    name: formData.get("name"),
  };

  const parsed = helloSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      result: null,
      error: parsed.error.issues[0].message,
    };
  }

  const { name } = parsed.data;

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    result: {
      message: "Hello World, " + name,
      serverTime: Date.now(),
    },
    error: null,
  };
}
