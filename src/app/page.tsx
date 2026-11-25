import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { deleteItem, retryItem } from "./actions";
import { AddLinkForm } from "./add-link-form";
import { Icon } from "./icons";
import { input, numberSaves, Page, panel, platformName, quietButton, RecDot, Row, SaveList, SectionTitle, secondaryButton, type ItemRow } from "./ui";

const ITEM_FIELDS = "id, url, platform, status, review_status, title, takeaway, collection_id, error, created_at, processed_at";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<Page title="Saves">{null}</Page>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { supabase } = await requireUser();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  await connection(); // "due" cards and "just finished" depend on the current time

  const [{ data: itemData }, { data: collectionData }, { count: dueCards }, search] = await Promise.all([
    supabase.from("takeaway_items").select(ITEM_FIELDS).order("created_at", { ascending: false }).limit(500),
    supabase.from("takeaway_collections").select("id, name, suggested").order("name"),
    supabase.from("takeaway_cards").select("id", { count: "exact", head: true }).lte("due_at", new Date().toISOString()),
    query
      ? supabase.from("takeaway_items").select(ITEM_FIELDS).textSearch("search", query, { type: "websearch", config: "english" }).limit(50)
      : Promise.resolve({ data: null }),
  ]);
  const items = (itemData ?? []) as (ItemRow & { processed_at: string | null })[];
  const collections = collectionData ?? [];
  const names = new Map(collections.map((c) => [c.id, c.name]));
  const numbers = numberSaves(items.filter((i) => i.status === "ready"));
  const pending = items.filter((i) => i.status !== "ready");
  const ready = items.filter((i) => i.status === "ready");
  const unread = ready.filter((i) => i.review_status === "new").length;
  const recording = pending.filter((i) => i.status === "processing").length;
  const waiting = pending.filter((i) => i.status === "queued").length;
  // Saves that finished in the last two minutes arrive with one short flip.
  const now = new Date().getTime();
  const fresh = new Set(ready.filter((i) => i.processed_at && now - new Date(i.processed_at).getTime() < 120_000).map((i) => i.id));
  const guide = [unread ? `${unread} new to review` : null, recording ? `${recording} recording` : null, waiting ? `${waiting} waiting` : null].filter(Boolean).join(" ∙ ") || "All caught up";
  const loose = ready.filter((i) => !i.collection_id).length;

  const searchForm = (
    <form role="search" className="relative">
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
      <input name="q" type="search" defaultValue={query} placeholder="Search everything you've saved" aria-label="Search your saves" className={`${input} pl-11`} />
    </form>
  );

  return (
    <Page title="Saves" guide={guide} brand>
      <section className={`${panel} p-4`}>
        <AddLinkForm />
      </section>
      {searchForm}

      {query ? (
        <section>
          <SectionTitle>Results for “{query}”</SectionTitle>
          <SaveList items={(search.data ?? []) as ItemRow[]} numbers={numbers} collections={names} empty="Nothing matches yet. Try other words." />
        </section>
      ) : (
        <>
          {pending.length > 0 && (
            <section aria-labelledby="recording">
              <SectionTitle id="recording">Recording</SectionTitle>
              <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
                {pending.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3.5">
                    {item.status === "failed" ? <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-risk" /> : <span className="mt-1.5"><RecDot waiting={item.status === "queued"} /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.url}</span>
                      <span className={`block text-sm ${item.status === "failed" ? "text-risk" : "text-muted"}`}>
                        {item.status === "failed" ? (item.error ?? "Couldn't make notes for this") : item.status === "processing" ? `Making notes ∙ ${platformName(item.platform)}` : "Waiting for your laptop"}
                      </span>
                    </span>
                    {item.status === "failed" && (
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <form action={retryItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className={`${secondaryButton} px-3 py-1.5 text-sm`}>Retry</button>
                        </form>
                        <form action={deleteItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className={quietButton} aria-label="Cancel this save">Cancel</button>
                        </form>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(unread > 0 || (dueCards ?? 0) > 0) && (
            <section className={`${panel} divide-y divide-rule overflow-hidden`} aria-label="To do">
              {unread > 0 && (
                <Row href="/review" icon="review" tone="tape">
                  <span className="block font-extrabold">Review {unread} new {unread === 1 ? "save" : "saves"}</span>
                  <span className="block text-sm text-muted">One at a time, at your own pace</span>
                </Row>
              )}
              {(dueCards ?? 0) > 0 && (
                <Row href="/recall" icon="recall" tone="tape">
                  <span className="block font-extrabold">
                    Recall {dueCards} {dueCards === 1 ? "card" : "cards"}
                  </span>
                  <span className="block text-sm text-muted">A few minutes so what you saved sticks</span>
                </Row>
              )}
            </section>
          )}

          <section aria-labelledby="collections">
            <SectionTitle id="collections">Collections</SectionTitle>
            <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
              {collections.map((c) => {
                const inside = ready.filter((i) => i.collection_id === c.id);
                if (inside.length === 0 && !c.suggested) return null;
                const newCount = inside.filter((i) => i.review_status === "new").length;
                return (
                  <li key={c.id}>
                    <Link href={`/c/${c.id}`} className="press flex items-center gap-3 px-4 py-3.5 hover:bg-ground/60">
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold">{c.name}</span>
                        <span className="block text-[13px] text-muted">
                          {c.suggested ? "Suggested ∙ " : ""}
                          {newCount ? `${newCount} new` : "Nothing new"}
                        </span>
                      </span>
                      <span className="tnum text-lg font-extrabold text-tape">{inside.length}</span>
                      <Icon name="chevron" className="size-5 text-muted" />
                    </Link>
                  </li>
                );
              })}
              {loose > 0 && (
                <li>
                  <Link href="/saves?collection=none" className="press flex items-center gap-3 px-4 py-3.5 hover:bg-ground/60">
                    <span className="min-w-0 flex-1 font-extrabold">Not in a collection</span>
                    <span className="tnum text-lg font-extrabold text-tape">{loose}</span>
                    <Icon name="chevron" className="size-5 text-muted" />
                  </Link>
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="latest">
            <SectionTitle id="latest">Latest</SectionTitle>
            <SaveList
              items={ready.slice(0, 15)}
              numbers={numbers}
              collections={names}
              fresh={fresh}
              empty="Nothing saved yet. Share a link from your phone, or paste one above."
            />
            {ready.length > 15 && (
              <Link href="/saves" className={`press mt-2 flex items-center justify-between ${panel} px-4 py-3.5 font-extrabold text-tape hover:bg-wash`}>
                See all {ready.length} saves
                <Icon name="chevron" className="size-5" />
              </Link>
            )}
          </section>
        </>
      )}
    </Page>
  );
}
