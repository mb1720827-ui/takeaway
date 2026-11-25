import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { Notes } from "@/lib/notes";
import { Icon, type IconName } from "./icons";
import { TabBar, TabBarFrame } from "./tab-bar";

export const input =
  "w-full rounded-xl border-2 border-field bg-white px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-tape focus-visible:outline-none";
export const primaryButton =
  "press inline-flex items-center justify-center gap-2 rounded-xl bg-tape px-5 py-3 text-base font-extrabold text-white hover:bg-tape-deep disabled:opacity-60";
export const secondaryButton =
  "press inline-flex items-center justify-center gap-2 rounded-xl bg-wash px-4 py-2.5 font-extrabold text-ink hover:bg-wash-hover disabled:opacity-60";
export const quietButton = "press inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted hover:bg-wash hover:text-ink";
export const panel = "rounded-2xl bg-white";

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

const PLATFORM: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram", x: "X", web: "Article" };
export const platformName = (p: string) => PLATFORM[p] ?? p;

export function Logo({ className = "" }: { className?: string }) {
  return <span className={`text-base font-extrabold tracking-tight ${className}`}>Takeaway</span>;
}

/** Every signed-in screen: an indigo header band (what this is, where you are) over the grey ground, plus the tab bar. */
export function Page({ title, back, guide, brand = false, children }: { title: ReactNode; back?: { href: string; label: string }; guide?: ReactNode; brand?: boolean; children: ReactNode }) {
  return (
    <>
      <header className="on-tape bg-tape text-white md:pt-16">
        <div className="mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),20px)] pb-6 md:pt-8">
          {back ? (
            <div className="mb-3 flex h-8 items-center">
              <Link href={back.href} className="press -ml-2 inline-flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-on-tape hover:bg-tape-deep">
                <Icon name="back" className="size-5 shrink-0" />
                <span className="truncate">{back.label}</span>
              </Link>
            </div>
          ) : brand ? (
            <Logo className="mb-4 block text-xl text-white md:hidden" />
          ) : null}
          <h1 className="pt-1 text-[1.875rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance">{title}</h1>
          {guide && <div className="mt-3 text-sm font-semibold text-on-tape">{guide}</div>}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-6 pb-32 md:pb-16">{children}</main>
      <Suspense fallback={<TabBarFrame path="" />}>
        <TabBar />
      </Suspense>
    </>
  );
}

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
      <h2 id={id} className="text-lg font-extrabold tracking-[-0.01em]">
        {children}
      </h2>
      {aside && <span className="text-xs font-semibold text-muted">{aside}</span>}
    </div>
  );
}

/** The red REC dot: this save is being recorded (processed) right now. */
export function RecDot({ waiting = false }: { waiting?: boolean }) {
  if (waiting) return <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full border-2 border-muted" />;
  return <span aria-hidden="true" className="rec-dot inline-block size-2.5 shrink-0 rounded-full bg-rec" />;
}

/** One row in a list of prompts or links: icon, text, and a chevron when it leads somewhere. */
export function Row({ icon, href, children, trailing, tone = "ink" }: { icon: IconName; href?: string; children: ReactNode; trailing?: ReactNode; tone?: "ink" | "tape" | "risk" }) {
  const color = { ink: "text-muted", tape: "text-tape", risk: "text-risk" }[tone];
  const body = (
    <>
      <span className={`mt-0.5 ${color}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {trailing ?? (href && <Icon name="chevron" className="mt-0.5 size-5 text-muted" />)}
    </>
  );
  const cls = "flex items-start gap-3 px-4 py-3.5";
  return href ? (
    <Link href={href} className={`press ${cls} hover:bg-ground/60`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Saves as rows: their number in the collection, the title, the takeaway and where it came from.
 * New (unreviewed) saves carry a small indigo dot; applied ones a green "applied".
 */
export function SaveList({
  items,
  numbers,
  collections,
  fresh,
  empty,
}: {
  items: ItemRow[];
  numbers?: Map<string, number>;
  collections?: Map<string, string>;
  /** Saves that just finished processing: they arrive with one short flip. */
  fresh?: Set<string>;
  empty: string;
}) {
  if (items.length === 0) return <p className="px-1 text-sm text-muted">{empty}</p>;
  return (
    <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
      {items.map((item) => {
        const no = numbers?.get(item.id);
        // In a mixed list a number only means something next to its collection ("Software Architecture ∙ No.2").
        const mixed = Boolean(collections);
        const collection = item.collection_id ? collections?.get(item.collection_id) : null;
        const where = [platformName(item.platform), mixed && collection ? `${collection}${no ? ` ∙ No.${no}` : ""}` : null].filter(Boolean).join(" ∙ ");
        return (
          <li key={item.id} className={fresh?.has(item.id) ? "arrive" : undefined}>
            <Link href={`/i/${item.id}`} className={`press grid gap-x-2 px-4 py-3.5 hover:bg-ground/60 ${mixed ? "grid-cols-1" : "grid-cols-[2.5rem_minmax(0,1fr)]"}`}>
              {!mixed && <span className="tnum pt-0.5 text-sm font-extrabold text-tape">{no ? `No.${no}` : ""}</span>}
              <span className="min-w-0">
                <span className="flex items-start gap-2">
                  <span className="min-w-0 flex-1 leading-snug font-extrabold">{item.title ?? item.url}</span>
                  {item.review_status === "new" && <span role="img" aria-label="New" className="mt-1.5 size-2 shrink-0 rounded-full bg-tape" />}
                </span>
                {item.takeaway && <span className="mt-1 line-clamp-2 block text-sm leading-snug text-muted">{item.takeaway}</span>}
                <span className="mt-1 block text-[13px] text-muted">
                  {where}
                  {item.review_status === "applied" && <span className="font-semibold text-applied"> ∙ applied</span>}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Each save's number within its collection, oldest first (No.1 is the first save you put there). */
export function numberSaves(items: { id: string; collection_id: string | null; created_at: string }[]) {
  const byCollection = new Map<string, { id: string; created_at: string }[]>();
  for (const i of items) {
    if (!i.collection_id) continue;
    byCollection.set(i.collection_id, [...(byCollection.get(i.collection_id) ?? []), i]);
  }
  const numbers = new Map<string, number>();
  for (const list of byCollection.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach((i, n) => numbers.set(i.id, n + 1));
  }
  return numbers;
}

/** A tracklist: numbers in one column, the text, and running times right-aligned in their own column. */
function Tracklist({ rows }: { rows: { text: ReactNode; at?: string | null }[] }) {
  return (
    <ol className={`${panel} divide-y divide-rule overflow-hidden`}>
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem] gap-x-2 px-4 py-3 leading-snug">
          <span className="tnum font-extrabold text-tape">{String(i + 1).padStart(2, "0")}</span>
          <span>{r.text}</span>
          <span className="tnum text-right text-sm font-extrabold text-muted">{r.at ?? ""}</span>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section>
      <SectionTitle aside={aside}>{title}</SectionTitle>
      {children}
    </section>
  );
}

/** The learning breakdown the worker wrote for one save. */
export function NotesView({ notes, related, afterTry }: { notes: Notes; related: Map<string, string>; afterTry?: ReactNode }) {
  const stride = process.env.STRIDE_URL;
  return (
    <div className="flex flex-col gap-6">
      {notes.key_points.length > 0 && (
        <Section title="Key points">
          <Tracklist rows={notes.key_points.map((p) => ({ text: p.text, at: p.at }))} />
        </Section>
      )}
      {notes.steps.length > 0 && (
        <Section title="Steps">
          <Tracklist rows={notes.steps.map((s) => ({ text: s }))} />
        </Section>
      )}
      {notes.action_items.length > 0 && (
        <Section title="Try this">
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.action_items.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 rounded-md border-2 border-tape" />
                <span className="min-w-0 flex-1 leading-snug">
                  {a}
                  {/* STRIDE_URL links each idea to Stride's chat box, so it can become a task or habit. */}
                  {stride && (
                    <a href={`${stride}/?q=${encodeURIComponent(a)}`} className="mt-1 block text-sm font-extrabold text-applied hover:underline">
                      Plan it in Stride
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {afterTry}
      {notes.concepts.length > 0 && (
        <Section title="Concepts explained">
          <dl className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.concepts.map((c, i) => (
              <div key={i} className="px-4 py-3">
                <dt className="font-extrabold">{c.term}</dt>
                <dd className="mt-0.5 leading-snug text-muted">{c.explanation}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {notes.code.length > 0 && (
        <Section title="Code">
          <div className="flex flex-col gap-3">
            {notes.code.map((c, i) => (
              <figure key={i} className={`${panel} overflow-hidden`}>
                <pre className="overflow-x-auto bg-ink p-4 text-sm leading-relaxed text-white">
                  <code>{c.snippet}</code>
                </pre>
                <figcaption className="px-4 py-3 text-sm leading-snug text-muted">
                  <span className="font-extrabold text-ink">{c.language}</span> ∙ {c.explanation}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}
      {notes.resources.length > 0 && (
        <Section title="Tools and resources">
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.resources.map((r, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                {r.url && /^https?:\/\//i.test(r.url) ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 font-extrabold hover:underline">
                    {r.name}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 font-extrabold">{r.name}</span>
                )}
                <span className="text-[13px] text-muted">{r.kind}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {notes.on_screen.length > 0 && (
        <Section title="On screen">
          <ul className={`${panel} flex flex-col gap-2 px-4 py-3 text-sm leading-snug text-muted`}>
            {notes.on_screen.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Section>
      )}
      {notes.connections.length > 0 && (
        <Section title="Connects to">
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.connections.map((c) => (
              <li key={c.id}>
                <Link href={`/i/${c.id}`} className="press flex items-start gap-3 px-4 py-3 hover:bg-ground/60">
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-extrabold">{related.get(c.id) ?? "An earlier save"}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">{c.why}</span>
                  </span>
                  <Icon name="chevron" className="mt-0.5 size-5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
