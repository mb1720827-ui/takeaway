import Link from "next/link";
import type { ReactNode } from "react";
import type { Notes } from "@/lib/notes";
import { signOut } from "./actions";

export const card = "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950";

export interface ItemRow {
  id: string;
  url: string;
  platform: string;
  status: "queued" | "processing" | "ready" | "failed";
  review_status: "new" | "reviewed" | "applied";
  title: string | null;
  takeaway: string | null;
  collection_id: string | null;
  error: string | null;
  created_at: string;
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>;
}

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/" className="text-xl font-bold tracking-tight">
        Take<span className="text-violet-600 dark:text-violet-400">away</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/review" className="rounded-lg px-3 py-1.5 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Review
        </Link>
        <Link href="/settings" className="rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Settings
        </Link>
        <form action={signOut}>
          <button className="rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">Sign out</button>
        </form>
      </nav>
    </header>
  );
}

const reviewStyles = {
  new: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  reviewed: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  applied: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | keyof typeof reviewStyles | "amber" | "rose" }) {
  const styles = { zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200", rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200", ...reviewStyles };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

export function ItemList({ items, empty }: { items: ItemRow[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/i/${item.id}`} className="flex flex-col gap-1 py-3 hover:opacity-80">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title ?? item.url}</span>
            </span>
            {item.takeaway && <span className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{item.takeaway}</span>}
            <span className="flex flex-wrap gap-1.5">
              <Badge>{item.platform}</Badge>
              {item.status === "ready" ? (
                <Badge tone={item.review_status}>{item.review_status}</Badge>
              ) : (
                <Badge tone={item.status === "failed" ? "rose" : "amber"}>{item.status}</Badge>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** The learning breakdown the worker wrote for one item. */
export function NotesView({ notes, related }: { notes: Notes; related: Map<string, string> }) {
  return (
    <div className="flex flex-col gap-6">
      {notes.key_points.length > 0 && (
        <Section title="Key points">
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {notes.key_points.map((p, i) => (
              <li key={i}>
                {p.at && <span className="mr-1.5 font-mono text-xs text-zinc-500">{p.at}</span>}
                {p.text}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {notes.steps.length > 0 && (
        <Section title="Steps">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {notes.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Section>
      )}
      {notes.concepts.length > 0 && (
        <Section title="Concepts explained">
          <dl className="flex flex-col gap-2">
            {notes.concepts.map((c, i) => (
              <div key={i}>
                <dt className="font-medium">{c.term}</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">{c.explanation}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {notes.code.length > 0 && (
        <Section title="Code">
          {notes.code.map((c, i) => (
            <div key={i} className="flex flex-col gap-1">
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100">
                <code>{c.snippet}</code>
              </pre>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-mono text-xs">{c.language}</span> · {c.explanation}
              </p>
            </div>
          ))}
        </Section>
      )}
      {notes.resources.length > 0 && (
        <Section title="Tools and resources">
          <ul className="flex flex-col gap-1">
            {notes.resources.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                {r.url && /^https?:\/\//i.test(r.url) ? (
                  <a href={r.url} className="font-medium underline" target="_blank" rel="noopener noreferrer">
                    {r.name}
                  </a>
                ) : (
                  <span className="font-medium">{r.name}</span>
                )}
                <Badge>{r.kind}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {notes.action_items.length > 0 && (
        <Section title="Try this">
          <ul className="flex flex-col gap-1.5">
            {notes.action_items.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>☐</span>
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {notes.on_screen.length > 0 && (
        <Section title="On screen">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {notes.on_screen.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Section>
      )}
      {notes.connections.length > 0 && (
        <Section title="Connects to">
          <ul className="flex flex-col gap-1.5">
            {notes.connections.map((c) => (
              <li key={c.id}>
                <Link href={`/i/${c.id}`} className="font-medium underline">
                  {related.get(c.id) ?? "An earlier save"}
                </Link>{" "}
                <span className="text-zinc-600 dark:text-zinc-400">{c.why}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
