import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AnswerSchema, parseBlocks, type Inline } from "@/lib/ask";
import { requireUser } from "@/lib/auth";
import { retryQuestion } from "../../actions";
import { card, Header, Page } from "../../ui";
import { AutoRefresh } from "./auto-refresh";

export default function AnswerPage({ params }: PageProps<"/ask/[id]">) {
  return (
    <Page>
      <Header />
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Answer params={params} />
      </Suspense>
    </Page>
  );
}

function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.code ? (
          <code key={i} className="rounded bg-zinc-100 px-1 font-mono text-sm dark:bg-zinc-800">
            {p.text}
          </code>
        ) : p.bold ? (
          <strong key={i}>{p.text}</strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

async function Answer({ params }: Pick<PageProps<"/ask/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireUser();
  const { data: q } = await supabase.from("takeaway_questions").select("*").eq("id", id).maybeSingle();
  if (!q) notFound();
  const scopeParam = q.scope === "item" ? `item:${q.item_id}` : q.scope === "collection" ? `collection:${q.collection_id}` : "all";

  const header = (
    <section className={card}>
      <p className="text-sm text-zinc-500">You asked</p>
      <h1 className="mt-1 text-xl font-semibold">{q.question}</h1>
    </section>
  );

  if (q.status === "queued" || q.status === "answering") {
    return (
      <>
        {header}
        <section className={`${card} text-zinc-600 dark:text-zinc-400`} role="status">
          {q.status === "answering" ? "Reading your saves…" : "Waiting for your laptop's worker to pick this up…"} This page updates by itself.
        </section>
        <AutoRefresh />
      </>
    );
  }

  if (q.status === "failed") {
    return (
      <>
        {header}
        <section className={`${card} flex flex-col gap-3`}>
          <p className="text-rose-600">Couldn&apos;t answer this: {q.error}</p>
          <form action={retryQuestion}>
            <input type="hidden" name="id" value={q.id} />
            <button className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white">Try again</button>
          </form>
        </section>
      </>
    );
  }

  const answer = AnswerSchema.safeParse(q.answer).data;
  if (!answer) notFound();
  const ids = answer.sources.map((s) => s.id);
  const { data: rows } = ids.length ? await supabase.from("takeaway_items").select("id, title").in("id", ids) : { data: [] as { id: string; title: string | null }[] };
  const titles = new Map((rows ?? []).map((r) => [r.id, r.title ?? "A save"]));

  return (
    <>
      {header}
      <section className={`${card} flex flex-col gap-3 leading-relaxed`}>
        {parseBlocks(answer.answer).map((block, i) =>
          block.kind === "p" ? (
            <p key={i} className={block.heading ? "font-semibold" : undefined}>
              <Text parts={block.parts} />
            </p>
          ) : block.kind === "ul" ? (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Text parts={item} />
                </li>
              ))}
            </ul>
          ) : (
            <ol key={i} className="flex list-decimal flex-col gap-1 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Text parts={item} />
                </li>
              ))}
            </ol>
          ),
        )}
      </section>

      {answer.sources.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">From your saves</h2>
          <ul className="flex flex-col gap-2">
            {answer.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/i/${s.id}`} className="font-medium underline">
                  {titles.get(s.id) ?? "A save"}
                </Link>
                {s.at && <span className="ml-1.5 font-mono text-xs text-zinc-500">{s.at}</span>}
                <span className="block text-sm text-zinc-600 dark:text-zinc-400">{s.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {answer.follow_ups.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-500">Ask next</h2>
          {answer.follow_ups.map((f) => (
            <Link
              key={f}
              href={`/ask?${new URLSearchParams({ q: f, scope: scopeParam })}`}
              className="rounded-xl border border-zinc-300 px-4 py-2 hover:border-violet-500 dark:border-zinc-700"
            >
              {f}
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
