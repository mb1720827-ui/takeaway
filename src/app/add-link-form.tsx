"use client";

import { useActionState } from "react";
import { addLink, type FormState } from "./actions";
import { Icon } from "./icons";
import { input, primaryButton } from "./ui";

export function AddLinkForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addLink, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="link" className="font-extrabold">
        Save a link
      </label>
      <div className="flex gap-2">
        <input
          id="link"
          name="link"
          type="text"
          inputMode="url"
          required
          defaultValue={state.value}
          placeholder="Paste a TikTok, YouTube or article link"
          className={`${input} min-w-0 flex-1`}
        />
        <button disabled={pending} className={`${primaryButton} px-4`} aria-label="Save link">
          {pending ? "…" : <Icon name="arrow" className="size-5" />}
        </button>
      </div>
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
    </form>
  );
}
