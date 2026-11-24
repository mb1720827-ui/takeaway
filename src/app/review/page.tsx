import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { NotesSchema } from "@/lib/notes";
import { setReviewStatus } from "../actions";
import { Badge, card, Header, Page } from "../ui";

export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <Page>
      <Header />
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Review searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

/** One new item at a time, oldest first. "Later" skips it for this session only. */
async function Review({ searchParams }: Pick<PageProps<"/review">, "searchParams">) {
  const { supabase } = await requireUser();
  const { skip } = await searchParams;
  const skipped = typeof skip === "string" ? skip.split(",").filter((s) => /^[0-9a-f-]{36}$/.test(s)) : [];

  let query = supabase
    .from("takeaway_items")
    .select("id, title, takeaway, platform, notes", { count: "exact" })
    .eq("status", "ready")
    .eq("review_status", "new")
    .order("created_at")
    .limit(1);
  if (skipped.length) query = query.not("id", "in", `(${skipped.join(",")})`);
  const { data, count } = await query;
  const item = data?.[0];

  if (!item) {
    return (
      <section className={`${card} text-center`}>
        <p className="text-lg font-semibold">You&apos;re all caught up.</p>
        <p className="mt-1 text-zinc-500">{skipped.length ? "Only the items you put off are left." : "New saves will appear here when they're ready."}</p>
        <Link href={skipped.length ? "/review" : "/"} className="mt-4 inline-block font-medium text-violet-700 underline dark:text-violet-400">
          {skipped.length ? "Start again" : "Back home"}
        </Link>
      </section>
    );
  }

  const notes = NotesSchema.safeParse(item.notes).data;
  const later = `/review?skip=${[...skipped, item.id].join(",")}`;

  return (
    <>
      <p className="text-sm text-zinc-500">{count} new to review</p>
      <section className={`${card} flex flex-col gap-4`}>
        <Badge>{item.platform}</Badge>
        <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
        <p className="rounded-xl bg-violet-50 p-4 text-lg leading-relaxed dark:bg-violet-950/50">{item.takeaway}</p>
        {notes && notes.key_points.length > 0 && (
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {notes.key_points.slice(0, 5).map((p, i) => (
              <li key={i}>{p.text}</li>
            ))}
          </ul>
        )}
        {notes && notes.action_items.length > 0 && (
          <div>
            <h2 className="font-semibold">Try this</h2>
            <ul className="mt-1 flex flex-col gap-1">
              {notes.action_items.map((a, i) => (
                <li key={i}>☐ {a}</li>
              ))}
            </ul>
          </div>
        )}
        <Link href={`/i/${item.id}`} className="text-sm font-medium text-violet-700 underline dark:text-violet-400">
          Full breakdown and transcript
        </Link>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {(["reviewed", "applied"] as const).map((status) => (
          <form key={status} action={setReviewStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="next" value={`/review${skipped.length ? `?skip=${skipped.join(",")}` : ""}`} />
            <button className={`w-full rounded-xl px-4 py-3 font-semibold ${status === "applied" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
              {status === "applied" ? "Applied ✓" : "Reviewed"}
            </button>
          </form>
        ))}
        <Link href={later} className="rounded-xl border border-zinc-300 px-4 py-3 text-center font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Later
        </Link>
      </div>
    </>
  );
}
