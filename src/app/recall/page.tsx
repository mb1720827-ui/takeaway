import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { card, Header, Page } from "../ui";
import { RecallCard } from "./recall-card";

export default function RecallPage() {
  return (
    <Page>
      <Header />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recall</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Try to answer before you look. Cards you know well come back less often.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Recall />
      </Suspense>
    </Page>
  );
}

async function Recall() {
  const { supabase } = await requireUser();
  await connection(); // "due" depends on the current time
  const now = new Date().toISOString();
  const [{ data: due, count }, { data: upcoming }] = await Promise.all([
    supabase
      .from("takeaway_cards")
      .select("id, question, answer, item:takeaway_items(id, title)", { count: "exact" })
      .lte("due_at", now)
      .order("due_at")
      .limit(1),
    supabase.from("takeaway_cards").select("due_at").gt("due_at", now).order("due_at").limit(1),
  ]);
  const current = due?.[0];

  if (!current) {
    const next = upcoming?.[0]?.due_at;
    return (
      <section className={`${card} text-center`}>
        <p className="text-lg font-semibold">Nothing to recall right now.</p>
        <p className="mt-1 text-zinc-500">
          {next
            ? `Next card: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(next))}.`
            : "Cards appear here a minute or two after your saves are processed."}
        </p>
        <Link href="/" className="mt-4 inline-block font-medium text-violet-700 underline dark:text-violet-400">
          Back home
        </Link>
      </section>
    );
  }

  const item = Array.isArray(current.item) ? current.item[0] : current.item;
  return (
    <>
      <p className="text-sm text-zinc-500">
        {count} card{count === 1 ? "" : "s"} due
      </p>
      <section className={card}>
        <RecallCard key={current.id} id={current.id} question={current.question} answer={current.answer} />
      </section>
      {item && (
        <p className="text-sm text-zinc-500">
          From:{" "}
          <Link href={`/i/${item.id}`} className="underline">
            {item.title ?? "a save"}
          </Link>
        </p>
      )}
    </>
  );
}
