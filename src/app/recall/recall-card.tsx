"use client";

import { useState } from "react";
import { gradeCard } from "../actions";
import { primaryButton } from "../ui";

// Three plain choices; how soon the card comes back is said underneath each.
const BUTTONS = [
  { grade: "forgot", label: "Forgot", hint: "tomorrow", style: "bg-white text-ink border-2 border-field hover:bg-wash" },
  { grade: "got_it", label: "Got it", hint: "a bit later", style: "bg-tape text-white hover:bg-tape-deep" },
  { grade: "easy", label: "Easy", hint: "much later", style: "bg-wash text-ink hover:bg-wash-hover" },
] as const;

/** Question first; the answer and the grading buttons appear only after you've tried to remember it. */
export function RecallCard({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xl leading-snug font-extrabold text-balance">{question}</p>
      {shown ? (
        <>
          <p className="rounded-xl bg-wash p-4 leading-relaxed">{answer}</p>
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">How well did you remember it?</p>
            <div className="grid grid-cols-3 gap-2">
              {BUTTONS.map((b) => (
                <form key={b.grade} action={gradeCard}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="grade" value={b.grade} />
                  <button className={`press w-full rounded-xl px-2 py-3 font-extrabold ${b.style}`}>
                    {b.label}
                    <span className="block text-xs font-semibold opacity-80">{b.hint}</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </>
      ) : (
        <button onClick={() => setShown(true)} className={`${primaryButton} py-3.5`}>
          Show answer
        </button>
      )}
    </div>
  );
}
