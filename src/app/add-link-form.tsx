"use client";

import { useActionState } from "react";
import { addLink, type FormState } from "./actions";

export function AddLinkForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addLink, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="link"
          type="text"
          inputMode="url"
          required
          defaultValue={state.value}
          placeholder="Paste a TikTok, YouTube or article link"
          aria-label="Link to save"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button disabled={pending} className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-60">
          Save
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>}
    </form>
  );
}
