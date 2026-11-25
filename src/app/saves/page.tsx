import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { numberSaves, Page, SaveList, type ItemRow } from "../ui";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "applied", label: "Applied" },
] as const;

export default function AllSavesPage({ searchParams }: PageProps<"/saves">) {
  return (
    <Suspense fallback={<Page title="All saves" back={{ href: "/", label: "Saves" }}>{null}</Page>}>
      <AllSaves searchParams={searchParams} />
    </Suspense>
  );
}

/** Every save in one list, newest first, filterable by review state; ?collection=none shows the ones in no collection. */
async function AllSaves({ searchParams }: Pick<PageProps<"/saves">, "searchParams">) {
  const { supabase } = await requireUser();
  const { status, collection } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  const loose = collection === "none";

  const [{ data: items }, { data: collections }] = await Promise.all([
    supabase
      .from("takeaway_items")
      .select("id, url, platform, status, review_status, title, takeaway, collection_id, error, created_at")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("takeaway_collections").select("id, name"),
  ]);
  const all = (items ?? []) as ItemRow[];
  const numbers = numberSaves(all);
  const names = new Map((collections ?? []).map((c) => [c.id, c.name]));
  const scoped = loose ? all.filter((i) => !i.collection_id) : all;
  const shown = filter === "all" ? scoped : scoped.filter((i) => i.review_status === filter);
  const href = (f: string) => {
    const q = new URLSearchParams({ ...(f !== "all" ? { status: f } : {}), ...(loose ? { collection: "none" } : {}) }).toString();
    return q ? `/saves?${q}` : "/saves";
  };

  return (
    <Page title={loose ? "Not in a collection" : "All saves"} back={{ href: "/", label: "Saves" }} guide={`${scoped.length} ${scoped.length === 1 ? "save" : "saves"}`}>
      <nav aria-label="Filter" className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={href(f.value)}
            aria-current={f.value === filter ? "page" : undefined}
            className={`press rounded-lg py-2 text-center text-sm font-extrabold ${f.value === filter ? "bg-tape text-white" : "text-muted hover:text-ink"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      <SaveList items={shown} numbers={numbers} collections={names} empty={filter === "all" ? "Nothing here yet." : `No ${filter} saves here.`} />
    </Page>
  );
}
