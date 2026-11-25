import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { NotesSchema } from "@/lib/notes";
import { setReviewStatus } from "../actions";
import { Icon } from "../icons";
import { Page, panel, platformName, primaryButton, secondaryButton, SectionTitle } from "../ui";

export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <Suspense fallback={<Page title="Review">{null}</Page>}>
      <Review searchParams={searchParams} />
    </Suspense>
  );
}

/** One new save at a time, oldest first. "Later" skips it for this session only. */
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
      <Page title="Review" guide={skipped.length ? "Only the saves you put off are left" : "You're all caught up"}>
        <section className="flex flex-col items-start gap-4 px-1">
          <p className="text-lg font-semibold">{skipped.length ? "You've seen everything except the ones you put off." : "Nothing new to review."}</p>
          <p className="text-muted">New saves appear here when your laptop has made their notes.</p>
          <Link href={skipped.length ? "/review" : "/"} className={primaryButton}>
            {skipped.length ? "Start again" : "Back to saves"}
          </Link>
        </section>
      </Page>
    );
  }

  const notes = NotesSchema.safeParse(item.notes).data;
  const later = `/review?skip=${[...skipped, item.id].join(",")}`;
  const next = `/review${skipped.length ? `?skip=${skipped.join(",")}` : ""}`;

  return (
    <Page title={item.title} guide={`${skipped.length + 1} of ${(count ?? 0) + skipped.length} new ∙ ${platformName(item.platform)}`}>
      <section className={`${panel} p-4`}>
        <p className="text-lg leading-relaxed font-semibold text-balance">{item.takeaway}</p>
      </section>

      {notes && notes.key_points.length > 0 && (
        <section>
          <SectionTitle>Key points</SectionTitle>
          <ol className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.key_points.slice(0, 5).map((p, i) => (
              <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem] gap-x-2 px-4 py-3 leading-snug">
                <span className="tnum font-extrabold text-tape">{String(i + 1).padStart(2, "0")}</span>
                <span>{p.text}</span>
                <span className="tnum text-right text-sm font-extrabold text-muted">{p.at ?? ""}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {notes && notes.action_items.length > 0 && (
        <section>
          <SectionTitle>Try this</SectionTitle>
          <ul className={`${panel} divide-y divide-rule overflow-hidden`}>
            {notes.action_items.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 leading-snug">
                <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 rounded-md border-2 border-tape" />
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/i/${item.id}`} className="inline-flex items-center gap-1 self-start px-1 font-extrabold text-tape hover:underline">
        Full notes and transcript
        <Icon name="chevron" className="size-4" />
      </Link>

      <section className="grid grid-cols-[1fr_1fr_auto] gap-2">
        {(["reviewed", "applied"] as const).map((status) => (
          <form key={status} action={setReviewStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="next" value={next} />
            <button className={status === "applied" ? `${secondaryButton} w-full py-3.5` : `${primaryButton} w-full py-3.5`}>
              {status === "applied" ? "Applied" : "Reviewed"}
            </button>
          </form>
        ))}
        <Link href={later} className={`${secondaryButton} py-3.5`}>
          Later
        </Link>
      </section>
    </Page>
  );
}
