import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { NotesSchema } from "@/lib/notes";
import { deleteItem, moveToCollection, retryItem, setReviewStatus } from "../../actions";
import { Badge, card, Header, NotesView, Page } from "../../ui";

export default function ItemPage({ params }: PageProps<"/i/[id]">) {
  return (
    <Page>
      <Header />
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Item params={params} />
      </Suspense>
    </Page>
  );
}

async function Item({ params }: Pick<PageProps<"/i/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireUser();
  const [{ data: item }, { data: collections }] = await Promise.all([
    supabase.from("takeaway_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("takeaway_collections").select("id, name").order("name"),
  ]);
  if (!item) notFound();

  if (item.status !== "ready") {
    return (
      <section className={`${card} flex flex-col gap-3`}>
        <p className="break-all">{item.url}</p>
        <Badge tone={item.status === "failed" ? "rose" : "amber"}>{item.status}</Badge>
        {item.error && <p className="text-sm text-rose-600">{item.error}</p>}
        {item.status === "failed" && (
          <form action={retryItem}>
            <input type="hidden" name="id" value={item.id} />
            <button className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white">Retry</button>
          </form>
        )}
      </section>
    );
  }

  const parsed = NotesSchema.safeParse(item.notes);
  const notes = parsed.success ? parsed.data : null;
  const relatedIds = notes?.connections.map((c) => c.id) ?? [];
  const { data: relatedRows } = relatedIds.length
    ? await supabase.from("takeaway_items").select("id, title").in("id", relatedIds)
    : { data: [] as { id: string; title: string | null }[] };
  const related = new Map((relatedRows ?? []).map((r) => [r.id, r.title ?? "An earlier save"]));

  return (
    <>
      <section className={`${card} flex flex-col gap-3`}>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{item.platform}</Badge>
          <Badge tone={item.review_status}>{item.review_status}</Badge>
          {notes?.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
        {item.author && <p className="text-sm text-zinc-500">by {item.author}</p>}
        <p className="rounded-xl bg-violet-50 p-4 text-lg leading-relaxed dark:bg-violet-950/50">{item.takeaway}</p>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-violet-700 underline dark:text-violet-400">
          Open the original
        </a>
      </section>

      <section className={`${card} flex flex-wrap items-center gap-2`}>
        {(["reviewed", "applied", "new"] as const).map((status) => (
          <form key={status} action={setReviewStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={status} />
            <button
              disabled={item.review_status === status}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:bg-violet-600 disabled:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {status === "new" ? "Mark as new" : status === "reviewed" ? "Reviewed" : "Applied ✓"}
            </button>
          </form>
        ))}
        <form action={moveToCollection} className="ml-auto flex items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <select name="collection" defaultValue={item.collection_id ?? ""} aria-label="Collection" className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">No collection</option>
            {(collections ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Move</button>
        </form>
      </section>

      {notes ? (
        <section className={card}>
          <NotesView notes={notes} related={related} />
        </section>
      ) : (
        <p className="text-sm text-rose-600">These notes are in an old format. Retry the item to regenerate them.</p>
      )}

      {item.transcript && (
        <details className={card}>
          <summary className="cursor-pointer font-semibold">Transcript</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{item.transcript}</pre>
        </details>
      )}

      <form action={deleteItem}>
        <input type="hidden" name="id" value={item.id} />
        <button className="text-sm text-rose-600 underline">Delete this save</button>
      </form>
    </>
  );
}
