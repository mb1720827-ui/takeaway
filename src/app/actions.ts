"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { detectPlatform, extractUrl } from "@/lib/links";
import { GRADES, schedule, type Grade } from "@/lib/recall";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
  message?: string;
  /** What the user typed, so a failed submit doesn't wipe the field (React resets forms after actions). */
  value?: string;
}

export async function authenticate(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { error: "Enter your email and a password of at least 8 characters.", value: email };
  const supabase = await createClient();
  if (formData.get("intent") === "signup") {
    const origin = (await headers()).get("origin") ?? "";
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback` } });
    if (error) return { error: error.message, value: email };
    if (!data.session) return { message: "Check your email and click the link to confirm your account.", value: email };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, value: email };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const text = String(formData.get("link") ?? "").trim();
  const url = extractUrl(text);
  if (!url) return { error: "Paste a link starting with http:// or https://", value: text };
  const supabase = await createClient();
  const { error } = await supabase.from("takeaway_items").insert({ url, platform: detectPlatform(url) });
  if (error?.code === "23505") return { message: "Already saved." };
  if (error) return { error: "Couldn't save that link. Are you signed in?", value: text };
  revalidatePath("/");
  return { message: "Saved. Your laptop worker will process it." };
}

const Id = z.uuid();
const ReviewStatus = z.enum(["new", "reviewed", "applied"]);

export async function setReviewStatus(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const status = ReviewStatus.parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("takeaway_items").update({ review_status: status }).eq("id", id);
  revalidatePath("/", "layout");
  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/")) redirect(next);
}

export async function moveToCollection(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const collection = String(formData.get("collection") ?? "");
  const supabase = await createClient();
  await supabase.from("takeaway_items").update({ collection_id: collection ? Id.parse(collection) : null }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function renameCollection(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const name = z.string().trim().min(1).max(60).parse(formData.get("name"));
  const supabase = await createClient();
  // Renaming (or keeping) an AI-suggested collection confirms it.
  await supabase.from("takeaway_collections").update({ name, suggested: false }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function retryItem(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("takeaway_items").update({ status: "queued", attempts: 0, error: null }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteItem(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("takeaway_items").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Queues a question for the laptop worker. `scope` is "all", "collection:<id>" or "item:<id>".
 * Row-level security means ids that aren't the user's simply won't match anything.
 */
export async function askQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const question = String(formData.get("question") ?? "").trim();
  if (question.length < 3 || question.length > 1000) return { error: "Ask a question between 3 and 1,000 characters.", value: question };
  const [kind, target] = String(formData.get("scope") ?? "all").split(":");
  const row: Record<string, string> = { question, scope: "all" };
  if ((kind === "collection" || kind === "item") && Id.safeParse(target).success) {
    row.scope = kind;
    row[kind === "item" ? "item_id" : "collection_id"] = target;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("takeaway_questions").insert(row).select("id").single();
  if (error || !data) return { error: "Couldn't send your question. Are you signed in?", value: question };
  redirect(`/ask/${data.id}`);
}

export async function retryQuestion(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("takeaway_questions").update({ status: "queued", attempts: 0, error: null }).eq("id", id);
  revalidatePath(`/ask/${id}`);
}

/** Records how well the user recalled a card and schedules when it comes back. */
export async function gradeCard(formData: FormData) {
  const id = Id.parse(formData.get("id"));
  const grade = z.enum(GRADES as [Grade, ...Grade[]]).parse(formData.get("grade"));
  const supabase = await createClient();
  const { data: card } = await supabase.from("takeaway_cards").select("box, reviews").eq("id", id).maybeSingle();
  if (!card) return;
  const next = schedule(card.box, grade);
  await supabase
    .from("takeaway_cards")
    .update({ box: next.box, due_at: next.due_at.toISOString(), reviews: card.reviews + 1, last_reviewed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/recall");
}

export interface TokenState {
  token?: string;
  error?: string;
}

/** Creates a new inbox token for the phone's share shortcut. Only its hash is stored, so it's shown once. */
export async function createInboxToken(): Promise<TokenState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const token = randomBytes(24).toString("base64url");
  const token_hash = createHash("sha256").update(token, "utf8").digest("hex");
  const { error } = await supabase.from("takeaway_inbox_tokens").upsert({ user_id: user.id, token_hash });
  if (error) return { error: "Couldn't create a token. Please try again." };
  return { token };
}
