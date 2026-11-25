"use client";

import { useActionState } from "react";
import { askQuestion, type FormState } from "../actions";
import { input, primaryButton } from "../ui";

interface Props {
  initialQuestion: string;
  scope: string;
  scopes: { value: string; label: string }[];
}

export function AskForm({ initialQuestion, scope, scopes }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(askQuestion, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="question" className="text-lg font-extrabold">
        What do you want to know?
      </label>
      <textarea
        id="question"
        name="question"
        rows={3}
        maxLength={1000}
        required
        defaultValue={state.value ?? initialQuestion}
        placeholder="What have I saved about microservices?"
        className={`${input} resize-none leading-relaxed`}
      />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Ask about
        <select name="scope" defaultValue={scope} className={`${input} py-2.5`}>
          {scopes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-risk">
          {state.error}
        </p>
      )}
      <button disabled={pending} className={primaryButton}>
        {pending ? "Sending…" : "Ask"}
      </button>
    </form>
  );
}
