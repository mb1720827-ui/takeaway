"use client";

import { useActionState } from "react";
import { createInboxToken, type TokenState } from "../actions";
import { primaryButton } from "../ui";

export function TokenForm({ hasToken }: { hasToken: boolean }) {
  const [state, action, pending] = useActionState<TokenState>(createInboxToken, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.token ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold">Your inbox token. It&apos;s shown only once, so copy it now:</p>
          <code className="rounded-xl bg-wash p-3 font-mono text-sm break-all">{state.token}</code>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {hasToken ? "You have a token. Making a new one stops the old one from working." : "Make a token for your phone's share shortcut."}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-risk">
          {state.error}
        </p>
      )}
      <button disabled={pending} className={`${primaryButton} self-start`}>
        {hasToken || state.token ? "Make a new token" : "Make token"}
      </button>
    </form>
  );
}
