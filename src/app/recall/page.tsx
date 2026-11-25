import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { Icon } from "../icons";
import { Page, panel, primaryButton } from "../ui";
import { RecallCard } from "./recall-card";

export default function RecallPage() {
  return (
    <Suspense fallback={<Page title="Recall">{null}</Page>}>
      <Recall />
    </Suspense>
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
      <Page title="Recall" guide="Nothing to recall right now">
        <section className="flex flex-col items-start gap-4 px-1">
          <p className="text-lg font-semibold">
            {next
              ? `Next card: ${new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(next))}.`
              : "Cards appear a minute or two after your saves are processed."}
          </p>
          <Link href="/" className={primaryButton}>
            Back to saves
          </Link>
        </section>
      </Page>
    );
  }

  const item = Array.isArray(current.item) ? current.item[0] : current.item;
  return (
    <Page title="Recall" guide={`${count} ${count === 1 ? "card" : "cards"} due ∙ try before you look`}>
      <section className={`${panel} p-5`}>
        <RecallCard key={current.id} id={current.id} question={current.question} answer={current.answer} />
      </section>
      {item && (
        <Link href={`/i/${item.id}`} className="inline-flex items-center gap-1 self-start px-1 text-sm font-semibold text-muted hover:text-ink hover:underline">
          From: {item.title ?? "a save"}
          <Icon name="chevron" className="size-4" />
        </Link>
      )}
    </Page>
  );
}
