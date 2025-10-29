import { useActionState } from "react";
import { signup, type ActionResult } from "./actions/signup.action";
import { HOME_URL } from "@/app.config";

interface UseSignupReturn {
  state: ActionResult;
  formAction: (formData: FormData) => void;
  isLoading: boolean;
}

export function useSignup(redirectURL: string = HOME_URL): UseSignupReturn {
  const [state, formAction, isLoading] = useActionState<ActionResult, FormData>(
    (prevState: ActionResult, formData: FormData) =>
      signup(prevState, formData, redirectURL),
    { error: null }
  );

  return {
    state,
    formAction,
    isLoading,
  };
}
