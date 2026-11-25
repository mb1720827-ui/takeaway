import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { Icon } from "../icons";
import { Page, panel, RecDot, SectionTitle } from "../ui";
import { AskForm } from "./ask-form";

export default function AskPage({ searchParams }: PageProps<"/ask">) {
  return (
    <Page title="Ask your saves" guide="Answers come only from what you've saved, with links to the exact videos.">
      <Suspense fallback={null}>
        <Ask searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const STATUS = { queued: "Waiting for your laptop", answering: "Reading your saves…", answered: "Answered", failed: "Couldn't answer" } as const;

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
      <section className={`${panel} p-4`}>
        <AskForm initialQuestion={q} scope={scope} scopes={scopes} />
      </section>
      <section>
        <SectionTitle>Your questions</SectionTitle>
        {history && history.length > 0 ? (
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {history.map((h) => {
              const status = h.status as keyof typeof STATUS;
              return (
                <li key={h.id}>
                  <Link href={`/ask/${h.id}`} className="press flex items-start gap-3 px-4 py-3.5 hover:bg-ground/60">
                    <span className="min-w-0 flex-1">
                      <span className="block leading-snug font-extrabold">{h.question}</span>
                      <span className={`mt-0.5 flex items-center gap-1.5 text-sm ${status === "failed" ? "text-risk" : "text-muted"}`}>
                        {(status === "queued" || status === "answering") && <RecDot waiting={status === "queued"} />}
                        {STATUS[status] ?? h.status}
                      </span>
                    </span>
                    <Icon name="chevron" className="mt-0.5 size-5 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 text-sm text-muted">No questions yet. Try: “What have I saved about AI agents?”</p>
        )}
      </section>
    </>
  );
}
