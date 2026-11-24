"use client";

import { useActionState } from "react";
import { askQuestion, type FormState } from "../actions";

interface Props {
  initialQuestion: string;
  scope: string;
  scopes: { value: string; label: string }[];
}

export function AskForm({ initialQuestion, scope, scopes }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(askQuestion, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <textarea
        name="question"
        rows={3}
        maxLength={1000}
        required
        defaultValue={state.value ?? initialQuestion}
        placeholder="e.g. What have I saved about microservices?"
        aria-label="Your question"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="scope"
          defaultValue={scope}
          aria-label="What to ask about"
          className="max-w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {scopes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button disabled={pending} className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-60">
          {pending ? "Sending…" : "Ask"}
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}
