import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { renameCollection } from "../../actions";
import { Badge, card, Header, ItemList, Page, type ItemRow } from "../../ui";

const FILTERS = ["all", "new", "reviewed", "applied"] as const;

export default function CollectionPage({ params, searchParams }: PageProps<"/c/[id]">) {
  return (
    <Page>
      <Header />
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Collection params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Collection({ params, searchParams }: Pick<PageProps<"/c/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f === status) ?? "all";
  const { supabase } = await requireUser();

  let itemsQuery = supabase
    .from("takeaway_items")
    .select("id, url, platform, status, review_status, title, takeaway, collection_id, error, created_at")
    .eq("collection_id", id)
    .eq("status", "ready")
    .order("created_at", { ascending: false });
  if (filter !== "all") itemsQuery = itemsQuery.eq("review_status", filter);

  const [{ data: collection }, { data: items }] = await Promise.all([
    supabase.from("takeaway_collections").select("id, name, suggested").eq("id", id).maybeSingle(),
    itemsQuery,
  ]);
  if (!collection) notFound();

  return (
    <>
      <section className={`${card} flex flex-col gap-3`}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          {collection.name}
          {collection.suggested && <Badge tone="amber">suggested by AI</Badge>}
        </h1>
        <form action={renameCollection} className="flex gap-2">
          <input type="hidden" name="id" value={collection.id} />
          <input
            name="name"
            defaultValue={collection.name}
            maxLength={60}
            required
            aria-label="Collection name"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {collection.suggested ? "Keep / rename" : "Rename"}
          </button>
        </form>
      </section>

      <nav className="flex gap-1 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? `/c/${id}` : `/c/${id}?status=${f}`}
            className={`rounded-full px-3 py-1 capitalize ${f === filter ? "bg-violet-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            {f}
          </Link>
        ))}
      </nav>

      <section className={card}>
        <ItemList items={(items ?? []) as ItemRow[]} empty="Nothing here yet." />
      </section>
    </>
  );
}
