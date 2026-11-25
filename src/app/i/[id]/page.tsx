import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { NotesSchema } from "@/lib/notes";
import { deleteItem, moveToCollection, retryItem, setReviewStatus } from "../../actions";
import { Icon } from "../../icons";
import { input, NotesView, Page, panel, platformName, primaryButton, quietButton, RecDot, secondaryButton } from "../../ui";

export default function ItemPage({ params }: PageProps<"/i/[id]">) {
  return (
    <Suspense fallback={<Page title="Save" back={{ href: "/", label: "Saves" }}>{null}</Page>}>
      <Item params={params} />
    </Suspense>
  );
}

const STATUS = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "applied", label: "Applied" },
] as const;

async function Item({ params }: Pick<PageProps<"/i/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireUser();
  const [{ data: item }, { data: collections }] = await Promise.all([
    supabase.from("takeaway_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("takeaway_collections").select("id, name").order("name"),
  ]);
  if (!item) notFound();
  const collection = (collections ?? []).find((c) => c.id === item.collection_id);
  const back = collection ? { href: `/c/${collection.id}`, label: collection.name } : { href: "/", label: "Saves" };

  if (item.status !== "ready") {
    return (
      <Page title={item.status === "failed" ? "Couldn't make notes" : "Recording"} back={back} guide={platformName(item.platform)}>
        <section className={`${panel} flex flex-col gap-3 p-4`}>
          <p className="flex items-center gap-2 font-semibold">
            {item.status === "failed" ? <Icon name="alert" className="size-5 text-risk" /> : <RecDot waiting={item.status === "queued"} />}
            {item.status === "failed" ? "Something went wrong" : item.status === "processing" ? "Your laptop is making notes" : "Waiting for your laptop"}
          </p>
          <p className="text-sm wrap-anywhere text-muted">{item.url}</p>
          {item.error && <p className="text-sm text-risk">{item.error}</p>}
          {item.status === "failed" && (
            <div className="grid grid-cols-2 gap-2">
              <form action={retryItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className={`${primaryButton} w-full`}>Try again</button>
              </form>
              <form action={deleteItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className={`${secondaryButton} w-full py-3 text-base`}>Cancel save</button>
              </form>
            </div>
          )}
        </section>
      </Page>
    );
  }

  // Its number in its collection: No.1 is the first save you put there.
  const { count: before } = item.collection_id
    ? await supabase.from("takeaway_items").select("id", { count: "exact", head: true }).eq("collection_id", item.collection_id).eq("status", "ready").lt("created_at", item.created_at)
    : { count: null };
  const parsed = NotesSchema.safeParse(item.notes);
  const notes = parsed.success ? parsed.data : null;
  const relatedIds = notes?.connections.map((c) => c.id) ?? [];
  const { data: relatedRows } = relatedIds.length
    ? await supabase.from("takeaway_items").select("id, title").in("id", relatedIds)
    : { data: [] as { id: string; title: string | null }[] };
  const related = new Map((relatedRows ?? []).map((r) => [r.id, r.title ?? "An earlier save"]));
  const meta = [platformName(item.platform), item.author ? `by ${item.author}` : null].filter(Boolean).join(" ∙ ");
  const guide = (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {before !== null && <span className="tnum rounded-[5px] bg-white px-1.5 font-extrabold text-tape">No.{(before ?? 0) + 1}</span>}
      {meta}
    </span>
  );

  const controls = (
        <section className={`${panel} flex flex-col gap-3 p-4`}>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-ground p-1" role="group" aria-label="Review status">
            {STATUS.map((s) => (
              <form key={s.value} action={setReviewStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value={s.value} />
                <button
                  aria-pressed={item.review_status === s.value}
                  className={`press w-full rounded-lg py-2 text-sm font-extrabold ${
                    item.review_status === s.value ? (s.value === "applied" ? "bg-applied text-white" : "bg-white text-ink") : "text-muted hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
          <form action={moveToCollection} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <input type="hidden" name="id" value={item.id} />
            <label htmlFor="collection" className="col-span-2 text-sm font-semibold">
              Collection
            </label>
            <select id="collection" name="collection" defaultValue={item.collection_id ?? ""} className={`${input} min-w-0 py-2.5`}>
              <option value="">No collection</option>
              {(collections ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className={`${secondaryButton} py-3`}>Move</button>
          </form>
        </section>
  );

  return (
    <Page title={item.title} back={back} guide={guide}>
      <section className={`${panel} flex flex-col gap-4 p-4`}>
        <p className="text-lg leading-relaxed font-semibold text-balance">{item.takeaway}</p>
        <div className="flex flex-wrap gap-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${secondaryButton} px-3 py-2 text-sm`}>
            <Icon name="external" className="size-4" />
            Open the original
          </a>
          <Link href={`/ask?scope=item:${item.id}`} className={`${secondaryButton} px-3 py-2 text-sm`}>
            <Icon name="ask" className="size-4" />
            Ask about it
          </Link>
        </div>
      </section>

      {notes ? (
        <NotesView notes={notes} related={related} afterTry={controls} />
      ) : (
        <>
          <p className="px-1 text-sm text-risk">These notes are in an old format. Try again to make new ones.</p>
          {controls}
        </>
      )}

      {item.transcript && (
        <details className={`${panel} group`}>
          <summary className="press flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 font-extrabold">
            <Icon name="chevron" className="size-5 text-muted transition-transform group-open:rotate-90 motion-reduce:transition-none" />
            Transcript
          </summary>
          <pre className="px-4 pb-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-muted">{item.transcript}</pre>
        </details>
      )}

      {/* Deleting stands apart from everything else. */}
      <form action={deleteItem} className="mt-4 flex justify-center">
        <input type="hidden" name="id" value={item.id} />
        <button className={`${quietButton} text-risk hover:text-risk`}>Delete this save</button>
      </form>
    </Page>
  );
}
