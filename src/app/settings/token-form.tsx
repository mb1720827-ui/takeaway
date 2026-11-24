"use client";

import { useActionState } from "react";
import { createInboxToken, type TokenState } from "../actions";

export function TokenForm({ hasToken }: { hasToken: boolean }) {
  const [state, action, pending] = useActionState<TokenState>(createInboxToken, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      {state.token ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Your inbox token (shown only once; copy it now):</p>
          <code className="break-all rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">{state.token}</code>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasToken ? "You have a token. Creating a new one stops the old one from working." : "Create a token for your phone's share shortcut."}
        </p>
      )}
      {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
      <button disabled={pending} className="self-start rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-60">
        {hasToken || state.token ? "Create a new token" : "Create token"}
      </button>
    </form>
  );
}
