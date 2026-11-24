"use client";

import { useState } from "react";
import { gradeCard } from "../actions";

const BUTTONS = [
  { grade: "forgot", label: "Forgot", hint: "again tomorrow", style: "bg-rose-600 hover:bg-rose-700" },
  { grade: "got_it", label: "Got it", hint: "a bit later", style: "bg-violet-600 hover:bg-violet-700" },
  { grade: "easy", label: "Easy", hint: "much later", style: "bg-emerald-600 hover:bg-emerald-700" },
] as const;

/** Question first; the answer and grading buttons appear only after the user has tried to recall it. */
export function RecallCard({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl font-semibold leading-relaxed">{question}</p>
      {shown ? (
        <>
          <p className="rounded-xl bg-violet-50 p-4 leading-relaxed dark:bg-violet-950/50">{answer}</p>
          <p className="text-sm text-zinc-500">How well did you remember it?</p>
          <div className="grid grid-cols-3 gap-2">
            {BUTTONS.map((b) => (
              <form key={b.grade} action={gradeCard}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="grade" value={b.grade} />
                <button className={`w-full rounded-xl px-3 py-3 font-semibold text-white ${b.style}`}>
                  {b.label}
                  <span className="block text-xs font-normal opacity-80">{b.hint}</span>
                </button>
              </form>
            ))}
          </div>
        </>
      ) : (
        <button onClick={() => setShown(true)} autoFocus className="rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700">
          Show answer
        </button>
      )}
    </div>
  );
}
