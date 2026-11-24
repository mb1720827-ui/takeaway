import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { card, Header, Page } from "../ui";
import { TokenForm } from "./token-form";

export default function SettingsPage() {
  return (
    <Page>
      <Header />
      <h1 className="text-2xl font-bold tracking-tight">Set up</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Settings />
      </Suspense>
    </Page>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className={`${card} flex flex-col gap-3`}>
      <h2 className="font-semibold">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

const code = "rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800";

async function Settings() {
  const { supabase, user } = await requireUser();
  const { data: token } = await supabase.from("takeaway_inbox_tokens").select("created_at").maybeSingle();
  const host = (await headers()).get("host") ?? "your-app.vercel.app";
  const inbox = `${host.startsWith("localhost") ? "http" : "https"}://${host}/api/inbox`;

  return (
    <>
      <Step n={1} title="Create your inbox token">
        <TokenForm hasToken={Boolean(token)} />
      </Step>

      <Step n={2} title="Add “Save to Takeaway” to your Android share menu">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          <li>
            Install <strong>HTTP Shortcuts</strong> from the Play Store (free, open source).
          </li>
          <li>
            Create a variable named <span className={code}>shared</span> and turn on <em>Allow receiving value from Share dialog</em>.
          </li>
          <li>
            Create a shortcut named <strong>Save to Takeaway</strong>: method <span className={code}>POST</span>, URL <span className={code}>{inbox}</span>.
          </li>
          <li>
            Add a header <span className={code}>Authorization</span> with the value <span className={code}>Bearer YOUR_TOKEN</span>.
          </li>
          <li>
            Set the body to custom text, content type <span className={code}>text/plain</span>, containing just the <span className={code}>shared</span> variable.
          </li>
          <li>Under response handling, choose to show the response as a toast. You&apos;ll see &ldquo;Saved to Takeaway&rdquo;.</li>
        </ol>
        <p className="text-sm text-zinc-500">
          Now in TikTok: Share → More (or Share to…) → HTTP Shortcuts → Save to Takeaway. Menu names can vary slightly between versions.
        </p>
      </Step>

      <Step n={3} title="Get notified when notes are ready (optional)">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          <li>
            Install <strong>ntfy</strong> from the Play Store and subscribe to a long, random topic name only you know. Anyone with the name can read the
            notifications.
          </li>
          <li>
            Put the same name in <span className={code}>NTFY_TOPIC</span> in your laptop&apos;s <span className={code}>.env.local</span>.
          </li>
        </ol>
      </Step>

      <Step n={4} title="Run the worker on your laptop">
        <p className="text-sm leading-relaxed">
          The worker turns saved links into notes using Claude Code, so it needs your laptop on. In the project folder, with{" "}
          <span className={code}>TAKEAWAY_EMAIL</span> set to <span className={code}>{user.email}</span> and your password in{" "}
          <span className={code}>.env.local</span>:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100">npm run worker</pre>
        <p className="text-sm text-zinc-500">It checks for new saves every minute. Needs Claude Code, yt-dlp and ffmpeg installed.</p>
      </Step>
    </>
  );
}
