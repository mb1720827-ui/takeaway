import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { signOut } from "../actions";
import { Page, panel, quietButton } from "../ui";
import { TokenForm } from "./token-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<Page title="Set up">{null}</Page>}>
      <Settings />
    </Suspense>
  );
}

// Setup really is a sequence, so the steps are numbered like tracks.
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className={`${panel} grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 p-4`}>
      <span className="tnum pt-0.5 text-lg font-extrabold text-tape">{String(n).padStart(2, "0")}</span>
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg leading-snug font-extrabold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

const code = "rounded bg-wash px-1.5 py-0.5 font-mono text-[13px]";

async function Settings() {
  const { supabase, user } = await requireUser();
  const { data: token } = await supabase.from("takeaway_inbox_tokens").select("created_at").maybeSingle();
  const host = (await headers()).get("host") ?? "your-app.vercel.app";
  const inbox = `${host.startsWith("localhost") ? "http" : "https"}://${host}/api/inbox`;

  return (
    <Page title="Set up" guide={user.email}>
      <Step n={1} title="Make your inbox token">
        <TokenForm hasToken={Boolean(token)} />
      </Step>

      <Step n={2} title="Add “Save to Takeaway” to your Android share menu">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed marker:font-extrabold marker:text-tape">
          <li>
            Install <strong>HTTP Shortcuts</strong> from the Play Store (free, open source).
          </li>
          <li>
            Create a variable named <span className={code}>shared</span> and turn on <em>Allow receiving value from Share dialog</em>.
          </li>
          <li>
            Create a shortcut named <strong>Save to Takeaway</strong>: method <span className={code}>POST</span>, URL <span className={`${code} wrap-anywhere`}>{inbox}</span>.
          </li>
          <li>
            Add a header <span className={code}>Authorization</span> with the value <span className={code}>Bearer YOUR_TOKEN</span>.
          </li>
          <li>
            Set the body to custom text, content type <span className={code}>text/plain</span>, containing just the <span className={code}>shared</span> variable.
          </li>
          <li>Under response handling, show the response as a toast. You&apos;ll see “Saved to Takeaway”.</li>
        </ol>
        <p className="text-sm text-muted">
          Then in TikTok: Share › More (or Share to…) › HTTP Shortcuts › Save to Takeaway. Menu names vary a little between versions.
        </p>
      </Step>

      <Step n={3} title="Get notified when notes are ready (optional)">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed marker:font-extrabold marker:text-tape">
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
          The worker turns saved links into notes with Claude Code, so your laptop needs to be on. In the project folder, with{" "}
          <span className={code}>TAKEAWAY_EMAIL</span> set to <span className={`${code} wrap-anywhere`}>{user.email}</span> and your password in{" "}
          <span className={code}>.env.local</span>:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-ink p-3 text-sm text-white">npm run worker</pre>
        <p className="text-sm text-muted">It checks for new saves every few seconds. It needs Claude Code, yt-dlp and ffmpeg.</p>
      </Step>

      <Step n={5} title="Save Instagram reels that need a login (optional)">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed marker:font-extrabold marker:text-tape">
          <li>On your laptop, log in to instagram.com in Chrome.</li>
          <li>
            Install the <strong>Get cookies.txt LOCALLY</strong> extension (open source). On instagram.com, open it and export the cookies for this site
            only.
          </li>
          <li>
            Move the file out of the project folder, for example to <span className={`${code} wrap-anywhere`}>C:\Users\you\.takeaway\instagram-cookies.txt</span>.
          </li>
          <li>
            Put that path in <span className={code}>INSTAGRAM_COOKIES</span> in <span className={code}>.env.local</span> and restart the worker.
          </li>
        </ol>
        <p className="text-sm text-muted">
          The file is your Instagram login: anyone who has it can use your account, so never share it or commit it. Only Instagram links use it. If
          you log out of Instagram in Chrome it stops working; export it again.
        </p>
      </Step>

      <form action={signOut} className="flex justify-center">
        <button className={quietButton}>Sign out</button>
      </form>
    </Page>
  );
}
