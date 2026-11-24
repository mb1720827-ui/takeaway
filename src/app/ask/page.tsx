import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { Badge, card, Header, Page } from "../ui";
import { AskForm } from "./ask-form";

export default function AskPage({ searchParams }: PageProps<"/ask">) {
  return (
    <Page>
      <Header />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ask your saves</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Answers come only from what you&apos;ve saved, with links to the exact videos. Your laptop&apos;s worker answers within a minute.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Ask searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const statusTone = { queued: "amber", answering: "amber", answered: "applied", failed: "rose" } as const;

async function Ask({ searchParams }: Pick<PageProps<"/ask">, "searchParams">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 1000) : "";
  const requested = typeof params.scope === "string" ? params.scope : "all";

  const [{ data: collections }, { data: history }, itemRes] = await Promise.all([
    supabase.from("takeaway_collections").select("id, name").order("name"),
    supabase.from("takeaway_questions").select("id, question, status, created_at").order("created_at", { ascending: false }).limit(20),
    requested.startsWith("item:")
      ? supabase.from("takeaway_items").select("id, title").eq("id", requested.slice(5)).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const scopes = [
    { value: "all", label: "All my saves" },
    ...(itemRes.data ? [{ value: `item:${itemRes.data.id}`, label: `This save: ${itemRes.data.title ?? "untitled"}`.slice(0, 80) }] : []),
    ...(collections ?? []).map((c) => ({ value: `collection:${c.id}`, label: `Collection: ${c.name}` })),
  ];
  const scope = scopes.some((s) => s.value === requested) ? requested : "all";

  return (
    <>
      <section className={card}>
        <AskForm initialQuestion={q} scope={scope} scopes={scopes} />
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">Your questions</h2>
        {history && history.length > 0 ? (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/ask/${h.id}`} className="flex items-start justify-between gap-3 py-3 hover:opacity-80">
                  <span>{h.question}</span>
                  <Badge tone={statusTone[h.status as keyof typeof statusTone]}>{h.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No questions yet. Try: &ldquo;What have I saved about AI agents?&rdquo;</p>
        )}
      </section>
    </>
  );
}
