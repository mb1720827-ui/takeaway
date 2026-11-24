import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { retryItem } from "./actions";
import { AddLinkForm } from "./add-link-form";
import { Badge, card, Header, ItemList, Page, type ItemRow } from "./ui";

const ITEM_FIELDS = "id, url, platform, status, review_status, title, takeaway, collection_id, error, created_at";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Page>
      <Header />
      <section className={card}>
        <AddLinkForm />
      </section>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { supabase } = await requireUser();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const searchForm = (
    <form className="flex gap-2" role="search">
      <input
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Search everything you've saved"
        aria-label="Search"
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
        Search
      </button>
    </form>
  );

  if (query) {
    const { data } = await supabase
      .from("takeaway_items")
      .select(ITEM_FIELDS)
      .textSearch("search", query, { type: "websearch", config: "english" })
      .limit(50);
    return (
      <>
        {searchForm}
        <section className={card}>
          <h2 className="mb-2 font-semibold">Results for “{query}”</h2>
          <ItemList items={(data ?? []) as ItemRow[]} empty="Nothing matches yet. Try other words." />
        </section>
      </>
    );
  }

  const [{ data: itemData }, { data: collectionData }] = await Promise.all([
    supabase.from("takeaway_items").select(ITEM_FIELDS).order("created_at", { ascending: false }).limit(500),
    supabase.from("takeaway_collections").select("id, name, suggested").order("name"),
  ]);
  const items = (itemData ?? []) as ItemRow[];
  const collections = collectionData ?? [];
  const pending = items.filter((i) => i.status !== "ready");
  const ready = items.filter((i) => i.status === "ready");
  const unread = ready.filter((i) => i.review_status === "new").length;

  return (
    <>
      {searchForm}

      {pending.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">Processing</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{item.url}</span>
                  {item.error && <span className="block text-rose-600">{item.error}</span>}
                </span>
                {item.status === "failed" ? (
                  <form action={retryItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Retry</button>
                  </form>
                ) : (
                  <Badge tone="amber">{item.status}</Badge>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">Items are processed while the worker is running on your laptop.</p>
        </section>
      )}

      {unread > 0 && (
        <Link href="/review" className="rounded-2xl bg-violet-600 p-5 text-white hover:bg-violet-700">
          <span className="text-lg font-semibold">Review {unread} new {unread === 1 ? "item" : "items"} →</span>
          <span className="block text-sm text-violet-100">One at a time, at your own pace.</span>
        </Link>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {collections.map((c) => {
          const inside = ready.filter((i) => i.collection_id === c.id);
          if (inside.length === 0 && !c.suggested) return null;
          return (
            <Link key={c.id} href={`/c/${c.id}`} className={`${card} flex flex-col gap-1 hover:border-violet-400`}>
              <span className="flex items-center gap-2 font-semibold">
                {c.name}
                {c.suggested && <Badge tone="amber">suggested</Badge>}
              </span>
              <span className="text-sm text-zinc-500">
                {inside.length} saved · {inside.filter((i) => i.review_status === "new").length} new ·{" "}
                {inside.filter((i) => i.review_status === "applied").length} applied
              </span>
            </Link>
          );
        })}
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">Latest</h2>
        <ItemList items={ready.slice(0, 15)} empty="Nothing processed yet. Share a link from your phone, or paste one above." />
      </section>
    </>
  );
}
