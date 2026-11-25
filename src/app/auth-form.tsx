"use client";

import { useActionState } from "react";
import { authenticate, type FormState } from "./actions";
import { input, primaryButton, secondaryButton } from "./ui";

export function AuthForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(authenticate, {});
  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="email" required defaultValue={state.value} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" minLength={8} required className={input} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-risk">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm font-semibold text-tape">
          {state.message}
        </p>
      )}
      <div className="flex gap-2.5">
        <button name="intent" value="signin" disabled={pending} className={`${primaryButton} flex-1`}>
          Sign in
        </button>
        <button name="intent" value="signup" disabled={pending} className={`${secondaryButton} flex-1`}>
          Create account
        </button>
      </div>
      <p className="text-sm text-muted">Already use Stride? Sign in with the same email and password.</p>
    </form>
  );
}
