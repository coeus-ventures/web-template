"use client";

import { useActionState } from "react";
import { hello, HelloState } from "./hello.action";

interface UseHelloReturn {
  state: HelloState;
  formAction: (formData: FormData) => void;
  isLoading: boolean;
}

export function useHello(): UseHelloReturn {
  const [state, formAction, isLoading] = useActionState<HelloState, FormData>(
    hello,
    { result: null, error: null }
  ) as [HelloState, (formData: FormData) => void, boolean];

  return {
    state,
    formAction,
    isLoading,
  };
}
