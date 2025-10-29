import { useActionState } from "react";
import { signIn } from "./actions/signin.action";

interface SignInState {
  error: string | null;
}

interface UseSignInReturn {
  state: SignInState;
  formAction: (formData: FormData) => void;
  isLoading: boolean;
}

export function useSignIn(redirectURL: string): UseSignInReturn {
  const [state, formAction, isLoading] = useActionState<SignInState, FormData>(
    (prevState: SignInState, formData: FormData) =>
      signIn(prevState, formData, redirectURL),
    { error: null }
  ) as [SignInState, (formData: FormData) => void, boolean];

  return {
    state,
    formAction,
    isLoading,
  };
}
