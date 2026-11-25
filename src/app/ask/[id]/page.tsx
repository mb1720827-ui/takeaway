import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AnswerSchema, parseBlocks, type Inline } from "@/lib/ask";
import { requireUser } from "@/lib/auth";
import { retryQuestion } from "../../actions";
import { Icon } from "../../icons";
import { Page, panel, primaryButton, RecDot, SectionTitle } from "../../ui";
import { AutoRefresh } from "./auto-refresh";

export default function AnswerPage({ params }: PageProps<"/ask/[id]">) {
  return (
    <Suspense fallback={<Page title="Your answer" back={{ href: "/ask", label: "Ask" }}>{null}</Page>}>
      <Answer params={params} />
    </Suspense>
  );
}

function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.code ? (
          <code key={i} className="rounded bg-wash px-1 font-mono text-sm">
            {p.text}
          </code>
        ) : p.bold ? (
          <strong key={i} className="font-extrabold">
            {p.text}
          </strong>
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
  const back = { href: "/ask", label: "Ask" };

  if (q.status === "queued" || q.status === "answering") {
    return (
      <Page title={q.question} back={back} guide="You asked">
        <section className={`${panel} flex items-center gap-3 p-4`} role="status">
          <RecDot waiting={q.status === "queued"} />
          <span className="text-muted">
            {q.status === "answering" ? "Reading your saves…" : "Waiting for your laptop to pick this up…"} This page updates by itself.
          </span>
        </section>
        <AutoRefresh />
      </Page>
    );
  }

  if (q.status === "failed") {
    return (
      <Page title={q.question} back={back} guide="You asked">
        <section className={`${panel} flex flex-col gap-3 p-4`}>
          <p className="text-risk">Couldn&apos;t answer this: {q.error}</p>
          <form action={retryQuestion}>
            <input type="hidden" name="id" value={q.id} />
            <button className={primaryButton}>Try again</button>
          </form>
        </section>
      </Page>
    );
  }

  const answer = AnswerSchema.safeParse(q.answer).data;
  if (!answer) notFound();
  const ids = answer.sources.map((s) => s.id);
  const { data: rows } = ids.length ? await supabase.from("takeaway_items").select("id, title").in("id", ids) : { data: [] as { id: string; title: string | null }[] };
  const titles = new Map((rows ?? []).map((r) => [r.id, r.title ?? "A save"]));

  return (
    <Page title={q.question} back={back} guide="You asked">
      <section className={`${panel} flex flex-col gap-3 p-4 leading-relaxed`}>
        {parseBlocks(answer.answer).map((block, i) =>
          block.kind === "p" ? (
            <p key={i} className={block.heading ? "font-extrabold" : undefined}>
              <Text parts={block.parts} />
            </p>
          ) : block.kind === "ul" ? (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5 marker:text-tape">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Text parts={item} />
                </li>
              ))}
            </ul>
          ) : (
            <ol key={i} className="flex list-decimal flex-col gap-1 pl-5 marker:font-extrabold marker:text-tape">
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
        <section>
          <SectionTitle>From your saves</SectionTitle>
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {answer.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/i/${s.id}`} className="press grid grid-cols-[minmax(0,1fr)_3rem] gap-x-2 px-4 py-3.5 hover:bg-ground/60">
                  <span>
                    <span className="block leading-snug font-extrabold">{titles.get(s.id) ?? "A save"}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">{s.note}</span>
                  </span>
                  <span className="tnum pt-0.5 text-right text-sm font-extrabold text-muted">{s.at ?? ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {answer.follow_ups.length > 0 && (
        <section>
          <SectionTitle>Ask next</SectionTitle>
          <div className="flex flex-col gap-2">
            {answer.follow_ups.map((f) => (
              <Link key={f} href={`/ask?${new URLSearchParams({ q: f, scope: scopeParam })}`} className={`press flex items-center gap-3 ${panel} px-4 py-3 hover:bg-wash`}>
                <span className="min-w-0 flex-1 leading-snug font-semibold">{f}</span>
                <Icon name="arrow" className="size-5 text-tape" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
