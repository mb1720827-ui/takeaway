import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { renameCollection } from "../../actions";
import { Icon } from "../../icons";
import { input, numberSaves, Page, panel, SaveList, secondaryButton, type ItemRow } from "../../ui";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "applied", label: "Applied" },
] as const;

export default function CollectionPage({ params, searchParams }: PageProps<"/c/[id]">) {
  return (
    <Suspense fallback={<Page title="Collection" back={{ href: "/", label: "Saves" }}>{null}</Page>}>
      <Collection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Collection({ params, searchParams }: Pick<PageProps<"/c/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  const { supabase } = await requireUser();

  const [{ data: collection }, { data: items }] = await Promise.all([
    supabase.from("takeaway_collections").select("id, name, suggested").eq("id", id).maybeSingle(),
    supabase
      .from("takeaway_items")
      .select("id, url, platform, status, review_status, title, takeaway, collection_id, error, created_at")
      .eq("collection_id", id)
      .eq("status", "ready")
      .order("created_at", { ascending: false }),
  ]);
  if (!collection) notFound();
  const all = (items ?? []) as ItemRow[];
  const numbers = numberSaves(all);
  const shown = filter === "all" ? all : all.filter((i) => i.review_status === filter);
  const count = (s: string) => all.filter((i) => i.review_status === s).length;

  return (
    <Page
      title={collection.name}
      back={{ href: "/", label: "Saves" }}
      guide={`${all.length} ${all.length === 1 ? "save" : "saves"} ∙ ${count("new")} new ∙ ${count("applied")} applied${collection.suggested ? " ∙ suggested by AI" : ""}`}
    >
      <nav aria-label="Filter" className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? `/c/${id}` : `/c/${id}?status=${f.value}`}
            aria-current={f.value === filter ? "page" : undefined}
            className={`press rounded-lg py-2 text-center text-sm font-extrabold ${f.value === filter ? "bg-tape text-white" : "text-muted hover:text-ink"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <SaveList items={shown} numbers={numbers} empty={filter === "all" ? "Nothing here yet." : `No ${filter} saves here.`} />

      <section className={`${panel} flex flex-col gap-3 p-4`}>
        <form action={renameCollection} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={collection.id} />
          <label htmlFor="name" className="font-extrabold">
            {collection.suggested ? "Keep or rename this collection" : "Rename"}
          </label>
          <div className="flex gap-2">
            <input id="name" name="name" defaultValue={collection.name} maxLength={60} required className={`${input} min-w-0 flex-1 py-2.5`} />
            <button className={secondaryButton}>{collection.suggested ? "Keep" : "Save"}</button>
          </div>
        </form>
        <Link href={`/ask?scope=collection:${collection.id}`} className="press inline-flex items-center gap-2 self-start rounded-lg px-1 py-1 font-extrabold text-tape hover:underline">
          <Icon name="ask" className="size-5" />
          Ask about this collection
        </Link>
      </section>
    </Page>
  );
}
