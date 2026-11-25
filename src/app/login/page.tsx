import { Suspense } from "react";
import { AuthForm } from "../auth-form";
import { Logo } from "../ui";

// What a save turns into, shown rather than described: a short tracklist.
const SAMPLE = [
  { text: "Don't do heavy work inside the request", at: "0:04" },
  { text: "Put a job on a queue and return at once", at: "0:21" },
  { text: "A worker retries failed jobs with backoff", at: "0:48" },
];

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="on-tape bg-tape text-white">
        <div className="mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),24px)] pb-8">
          <Logo className="text-on-tape" />
          <h1 className="mt-6 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance">Save a video. Get the notes.</h1>
          <p className="mt-3 text-on-tape">Share from your phone. Takeaway turns it into key points, steps and code you can review, recall and ask about.</p>
          <ol aria-label="Example notes" className="mt-6 divide-y divide-white/15 rounded-2xl bg-tape-deep">
            {SAMPLE.map((s, i) => (
              <li key={s.at} className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] gap-x-2 px-4 py-2.5 text-[15px] leading-snug">
                <span className="tnum font-extrabold text-on-tape">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-semibold">{s.text}</span>
                <span className="tnum text-right text-sm font-extrabold text-on-tape">{s.at}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 py-8">
        <Suspense fallback={null}>
          <ConfirmError searchParams={searchParams} />
        </Suspense>
        <AuthForm />
      </main>
    </div>
  );
}

async function ConfirmError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  if (error !== "confirm") return null;
  return (
    <p role="alert" className="font-semibold text-risk">
      That confirmation link didn&apos;t work. It may have expired, so try signing up again.
    </p>
  );
}
