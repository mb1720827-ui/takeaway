// Takeaway worker: runs on your laptop, picks up links saved from your phone, and turns each one into notes
// using Claude Code (your Claude plan, no API key). Start it with: npm run worker   (or: npm run worker -- --once)
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import type { Platform } from "../src/lib/links";
import { cookieArgs, downloadError, formatTime, frameInterval, htmlToText, looksLikeVideo, parseVtt, pickFrames, transcriptText, type Frame, type Segment, type VideoMeta } from "../src/lib/media";
import { AnswerSchema, answerJsonSchema, saveToMarkdown, searchTerms, type SaveForAsk } from "../src/lib/ask";
import { DEFAULT_COLLECTIONS, NotesSchema, notesJsonSchema, type Notes } from "../src/lib/notes";
import { CardsSchema, cardsJsonSchema } from "../src/lib/recall";
import { isUsageLimit, loadFallbackEnv } from "../src/lib/fallback";

const run = promisify(execFile);
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in .env.local (see .env.example)`);
  return value;
};

const POLL_MS = Number(process.env.TAKEAWAY_POLL_SECONDS ?? 15) * 1000;
const ONCE = process.argv.includes("--once");
const MAX_VIDEO_SECONDS = 45 * 60;
const WORK_ROOT = join(tmpdir(), "takeaway-worker");
const MB = 1024 * 1024;

const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
  auth: { persistSession: false },
});

interface Item {
  id: string;
  url: string;
  platform: string;
}
interface Collection {
  id: string;
  name: string;
}
/** The parts of yt-dlp's metadata the worker uses. */
interface VideoInfo extends VideoMeta {
  title?: string;
  uploader?: string;
  channel?: string;
  description?: string;
}
interface Prepared {
  author: string | null;
  transcript: string;
}

async function main() {
  const { error } = await supabase.auth.signInWithPassword({ email: required("TAKEAWAY_EMAIL"), password: required("TAKEAWAY_PASSWORD") });
  if (error) throw new Error(`Couldn't sign in as TAKEAWAY_EMAIL: ${error.message}`);
  const claude = findClaude();
  await run("yt-dlp", ["--version"]).catch(() => {
    throw new Error("yt-dlp isn't installed. On Windows: winget install yt-dlp.yt-dlp");
  });
  await run("ffmpeg", ["-version"]).catch(() => {
    throw new Error("ffmpeg isn't installed. On Windows: winget install Gyan.FFmpeg");
  });
  mkdirSync(WORK_ROOT, { recursive: true });

  await supabase.from("takeaway_collections").upsert(DEFAULT_COLLECTIONS.map((name) => ({ name })), { onConflict: "user_id,name", ignoreDuplicates: true });
  // Anything left "processing" was interrupted (this is the only worker), so try it again.
  await supabase.from("takeaway_items").update({ status: "queued" }).eq("status", "processing");
  await supabase.from("takeaway_questions").update({ status: "queued" }).eq("status", "answering");

  log(`Worker running with ${claude}. Checking for new saves and questions every ${POLL_MS / 1000}s.`);
  const cookiesFile = process.env.INSTAGRAM_COOKIES?.trim();
  if (cookiesFile) log(existsSync(cookiesFile) ? "Using your Instagram login for Instagram links." : `No Instagram cookies file at ${cookiesFile} yet, so Instagram links run without a login.`);
  for (;;) {
    // Questions first: they are quick, and someone is usually waiting for the answer.
    await answerQuestions(claude);
    for (let item = await claimNext(); item; item = await claimNext()) {
      await processItem(item, claude);
      await answerQuestions(claude);
    }
    await generateCards(claude);
    await remindDueCards();
    if (ONCE) return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function claimNext(): Promise<Item | null> {
  const { data: next } = await supabase
    .from("takeaway_items")
    .select("id, attempts")
    .eq("status", "queued")
    .lt("attempts", 3)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!next) return null;
  const { data } = await supabase
    .from("takeaway_items")
    .update({ status: "processing", attempts: next.attempts + 1, error: null })
    .eq("id", next.id)
    .eq("status", "queued")
    .select("id, url, platform")
    .maybeSingle();
  return data;
}

async function processItem(item: Item, claude: string) {
  const started = Date.now();
  log(`Processing ${item.url}`);
  const dir = mkdtempSync(join(WORK_ROOT, "item-"));
  try {
    const prepared = await prepare(item, dir);
    const [{ data: collections }, { data: recent }, { data: skillRows }] = await Promise.all([
      supabase.from("takeaway_collections").select("id, name").order("name"),
      supabase.from("takeaway_items").select("id, title, takeaway").eq("status", "ready").neq("id", item.id).order("processed_at", { ascending: false }).limit(40),
      // Stride skills, when Stride shares this project (an error just means it isn't set up).
      supabase.from("stride_plans").select("id, title").eq("kind", "skill").eq("status", "active"),
    ]);
    const skills = skillRows ?? [];
    const notes = await askClaude(claude, dir, collections ?? [], recent ?? [], skills);
    const recentIds = new Set((recent ?? []).map((r) => r.id));
    notes.connections = notes.connections.filter((c) => recentIds.has(c.id));
    const skillId = skills.some((s) => s.id === notes.skill_id) ? notes.skill_id : null;

    const { error } = await supabase
      .from("takeaway_items")
      .update({
        status: "ready",
        title: notes.title,
        author: notes.author ?? prepared.author,
        takeaway: notes.takeaway,
        notes,
        transcript: prepared.transcript || null,
        collection_id: await collectionId(notes.collection, collections ?? []),
        ...(skills.length > 0 ? { skill_id: skillId } : {}),
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", item.id);
    if (error) throw new Error(`Saving notes failed: ${error.message}`);
    log(`Ready in ${Math.round((Date.now() - started) / 1000)}s: ${notes.title} → ${notes.collection}`);
    await notify(`/i/${item.id}`, `Ready: ${notes.title}`, notes.takeaway);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Failed: ${message}`);
    await supabase.from("takeaway_items").update({ status: "failed", error: message.slice(0, 500) }).eq("id", item.id);
    await notify(`/i/${item.id}`, "Couldn't make notes", message);
  } finally {
    rmSync(dir, { recursive: true, force: true }); // never keep downloaded videos
  }
}

/** Downloads what Claude needs into `dir`: context.md plus transcript.txt and frames/ for videos, or page.txt for articles. */
async function prepare(item: Item, dir: string): Promise<Prepared> {
  let info: VideoInfo | null = null;
  const cookiesFile = process.env.INSTAGRAM_COOKIES?.trim();
  // Checked on every save, so a cookies file you add later works without restarting the worker.
  const cookies = cookieArgs(item.platform as Platform, cookiesFile && existsSync(cookiesFile) ? cookiesFile : undefined);
  try {
    const { stdout } = await run("yt-dlp", [...cookies, "--dump-single-json", "--no-warnings", "--no-playlist", item.url], { timeout: 120_000, maxBuffer: 64 * MB });
    info = JSON.parse(stdout) as VideoInfo;
  } catch (err) {
    // On a video platform the page reader can't help, so say why the download failed instead.
    const reason = downloadError(item.platform as Platform, String((err as { stderr?: string }).stderr || err), cookies.length > 0);
    if (reason) throw new Error(reason);
    info = null;
  }
  if (!looksLikeVideo(info)) return preparePage(item, dir);
  const tooLong = () => new Error("Videos longer than 45 minutes aren't supported yet.");
  if (Number(info.duration) > MAX_VIDEO_SECONDS) throw tooLong();

  await run(
    "yt-dlp",
    [...cookies, "--no-warnings", "--no-playlist", "--write-subs", "--write-auto-subs", "--sub-langs", "en.*,eng.*", "--sub-format", "vtt",
      "--max-filesize", "500M", "-f", "b[height<=720]/bv*[height<=720]+ba/b", "--merge-output-format", "mp4", "-o", join(dir, "video.%(ext)s"), item.url],
    { timeout: 10 * 60_000, maxBuffer: 16 * MB },
  );
  const files = readdirSync(dir);
  const video = files.find((f) => /^video\.(mp4|webm|mkv|mov)$/.test(f));
  // Some platforms (Instagram) don't report the length up front, so measure the downloaded file.
  const duration = Number(info.duration) > 0 ? Number(info.duration) : video ? await probeDuration(join(dir, video)) : 0;
  if (duration > MAX_VIDEO_SECONDS) throw tooLong();
  const captions = files.find((f) => f.endsWith(".vtt"));
  let segments: Segment[] = captions ? parseVtt(readFileSync(join(dir, captions), "utf8")) : [];
  if (segments.length === 0 && video) segments = await transcribe(dir, video);
  const frames = video ? await extractFrames(dir, video, duration) : [];
  const transcript = transcriptText(segments);

  writeFileSync(join(dir, "transcript.txt"), transcript || "No transcript is available for this video. Rely on the frames and caption.");
  writeFileSync(
    join(dir, "context.md"),
    [
      `# Saved ${item.platform} video`,
      `- URL: ${item.url}`,
      `- Title: ${info.title ?? "unknown"}`,
      `- Creator: ${info.uploader ?? info.channel ?? "unknown"}`,
      `- Length: ${formatTime(duration)}`,
      `- Transcript source: ${captions ? "the platform's captions" : segments.length ? "speech-to-text" : "none"}`,
      "",
      "## Caption / description",
      String(info.description ?? "(none)").slice(0, 4000),
      "",
      "## Frames",
      ...(frames.length ? frames.map((f) => `- ${f.file} at about ${formatTime(f.at)}`) : ["(none)"]),
    ].join("\n"),
  );
  return { author: info.uploader ?? info.channel ?? null, transcript };
}

async function preparePage(item: Item, dir: string): Promise<Prepared> {
  const res = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0 (Takeaway personal reader)" }, redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`The page returned HTTP ${res.status}.`);
  const { title, text } = htmlToText(await res.text());
  if (text.length < 200) throw new Error("Couldn't read this page. It may need a login or block automated readers.");
  writeFileSync(join(dir, "page.txt"), text);
  writeFileSync(join(dir, "context.md"), `# Saved article\n- URL: ${item.url}\n- Title: ${title ?? "unknown"}\n\nThe article text is in page.txt.`);
  return { author: new URL(res.url).hostname.replace(/^www\./, ""), transcript: "" };
}

/** Speech-to-text fallback for videos without captions, if whisper-ctranslate2 is installed (pip install whisper-ctranslate2). */
async function transcribe(dir: string, video: string): Promise<Segment[]> {
  try {
    await run("whisper-ctranslate2", ["--help"], { timeout: 30_000 });
  } catch {
    return [];
  }
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", join(dir, video), "-vn", "-ac", "1", "-ar", "16000", join(dir, "audio.wav")], { timeout: 5 * 60_000 });
  await run("whisper-ctranslate2", [join(dir, "audio.wav"), "--model", "small", "--output_format", "vtt", "--output_dir", dir], { timeout: 30 * 60_000, maxBuffer: 16 * MB });
  const out = join(dir, "audio.vtt");
  return existsSync(out) ? parseVtt(readFileSync(out, "utf8")) : [];
}

/** Length of a media file in seconds, read with ffprobe (installed with ffmpeg). */
async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { timeout: 60_000 });
  const seconds = Number.parseFloat(stdout);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
}

async function extractFrames(dir: string, video: string, duration: number): Promise<Frame[]> {
  const framesDir = join(dir, "frames");
  mkdirSync(framesDir);
  const every = frameInterval(duration);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", join(dir, video), "-vf", `fps=1/${every},scale=480:-2`, "-q:v", "4", join(framesDir, "f_%03d.jpg")], { timeout: 5 * 60_000 });
  const all = readdirSync(framesDir)
    .sort()
    .map((file, i) => ({ file: `frames/${file}`, at: i * every, bytes: statSync(join(framesDir, file)).size }));
  const kept = pickFrames(all);
  const keep = new Set(kept.map((f) => f.file));
  for (const f of all) if (!keep.has(f.file)) rmSync(join(dir, f.file));
  return kept;
}

async function askClaude(
  claude: string,
  dir: string,
  collections: Collection[],
  recent: { id: string; title: string | null; takeaway: string | null }[],
  skills: { id: string; title: string }[],
): Promise<Notes> {
  const prompt = [
    readFileSync(new URL("./prompt.md", import.meta.url), "utf8"),
    "## Your collections",
    ...collections.map((c) => `- ${c.name}`),
    "",
    "## Earlier saves (for connections)",
    ...(recent.length ? recent.map((r) => `- ${r.id}: ${r.title ?? "untitled"}: ${r.takeaway ?? ""}`) : ["(none yet)"]),
    "",
    "## Skills they are learning in Stride (for skill_id; null when none clearly fits)",
    ...(skills.length ? skills.map((s) => `- ${s.id}: ${s.title}`) : ["(none)"]),
  ].join("\n");

  return NotesSchema.parse(await runClaude(claude, dir, prompt, notesJsonSchema()));
}

/** Runs Claude Code headless in `dir` and returns its structured output, validated by Claude Code against `schema`. */
async function runClaude(claude: string, dir: string, prompt: string, schema: object): Promise<unknown> {
  // Read-only and isolated: no shell or code tools, files limited to this folder, no personal hooks, plugins or MCP servers.
  const args = ["-p", "--output-format", "json", "--json-schema", JSON.stringify(schema), "--allowedTools", "Read",
    "--permission-mode", "dontAsk", "--restricted", "--setting-sources", "project", "--strict-mcp-config", "--no-session-persistence"];

  // `free` swaps Claude for the free models (see src/lib/fallback.ts); TAKEAWAY_MODEL names a Claude model, so it only applies to Claude.
  const attempt = async (free?: Record<string, string>): Promise<unknown> => {
    const runArgs = !free && process.env.TAKEAWAY_MODEL ? [...args, "--model", process.env.TAKEAWAY_MODEL] : args;
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(claude, runArgs, { cwd: dir, stdio: ["pipe", "pipe", "pipe"], env: free ? { ...process.env, ...free } : process.env });
      let out = "";
      let err = "";
      const timer = setTimeout(() => child.kill(), 15 * 60_000);
      child.stdout.on("data", (d) => (out += d));
      child.stderr.on("data", (d) => (err += d));
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(out);
        else reject(Object.assign(new Error(`Claude Code exited with ${code}: ${(err || out).slice(0, 300)}`), { output: `${err}\n${out}` }));
      });
      child.stdin.end(prompt);
    });
    const result = JSON.parse(stdout);
    if (result.is_error) throw new Error(`Claude Code: ${String(result.result).slice(0, 300)}`);
    return result.structured_output;
  };

  try {
    return await attempt();
  } catch (err) {
    const free = isUsageLimit(String((err as { output?: string }).output ?? err)) ? loadFallbackEnv() : null;
    if (!free) throw err;
    log("Claude's usage limit is reached; using the free models (FreeLLMAPI).");
    try {
      return await attempt(free);
    } catch (freeErr) {
      throw new Error(`Claude's usage limit is reached, and the free models failed too (is the FreeLLMAPI app open?): ${String(freeErr).slice(0, 300)}`);
    }
  }
}

// ---------- Ask: questions about your saves ----------

interface Question {
  id: string;
  question: string;
  scope: "all" | "collection" | "item";
  collection_id: string | null;
  item_id: string | null;
}

const SAVE_FIELDS = "id, url, title, takeaway, notes, transcript, collection:takeaway_collections(name)";
type SaveRow = Omit<SaveForAsk, "collection"> & { collection: { name: string } | { name: string }[] | null };
const toSave = (r: SaveRow): SaveForAsk => ({
  ...r,
  collection: Array.isArray(r.collection) ? (r.collection[0]?.name ?? null) : (r.collection?.name ?? null),
});

async function answerQuestions(claude: string) {
  for (;;) {
    const { data: next } = await supabase
      .from("takeaway_questions")
      .select("id, attempts")
      .eq("status", "queued")
      .lt("attempts", 3)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!next) return;
    const { data: q } = await supabase
      .from("takeaway_questions")
      .update({ status: "answering", attempts: next.attempts + 1, error: null })
      .eq("id", next.id)
      .eq("status", "queued")
      .select("id, question, scope, collection_id, item_id")
      .maybeSingle();
    if (q) await answerQuestion(q as Question, claude);
  }
}

/** The saves a question is about: one item, a whole collection, or the best search matches across everything. */
async function savesFor(q: Question): Promise<{ included: SaveForAsk[]; others: { id: string; title: string | null }[] }> {
  if (q.scope === "item") {
    const { data } = await supabase.from("takeaway_items").select(SAVE_FIELDS).eq("id", q.item_id!).eq("status", "ready");
    return { included: ((data ?? []) as SaveRow[]).map(toSave), others: [] };
  }
  if (q.scope === "collection") {
    const { data } = await supabase.from("takeaway_items").select(SAVE_FIELDS).eq("collection_id", q.collection_id!).eq("status", "ready").order("processed_at", { ascending: false }).limit(25);
    return { included: ((data ?? []) as SaveRow[]).map(toSave), others: [] };
  }
  const terms = searchTerms(q.question);
  const { data: matches } = terms ? await supabase.rpc("takeaway_search", { p_query: terms, p_limit: 12 }) : { data: [] };
  let ids = ((matches ?? []) as { id: string }[]).map((m) => m.id);
  const { data: recent } = await supabase.from("takeaway_items").select("id, title").eq("status", "ready").order("processed_at", { ascending: false }).limit(40);
  if (ids.length === 0) ids = (recent ?? []).slice(0, 8).map((r) => r.id); // nothing matched: give it the latest saves to work with
  const { data } = ids.length ? await supabase.from("takeaway_items").select(SAVE_FIELDS).in("id", ids) : { data: [] };
  const byId = new Map(((data ?? []) as SaveRow[]).map((r) => [r.id, toSave(r)]));
  const included = ids.map((id) => byId.get(id)).filter((s): s is SaveForAsk => Boolean(s)); // keep search-rank order
  return { included, others: (recent ?? []).filter((r) => !byId.has(r.id)) };
}

async function answerQuestion(q: Question, claude: string) {
  log(`Answering: ${q.question}`);
  const dir = mkdtempSync(join(WORK_ROOT, "ask-"));
  try {
    const { included, others } = await savesFor(q);
    mkdirSync(join(dir, "saves"));
    for (const s of included) writeFileSync(join(dir, "saves", `${s.id}.md`), saveToMarkdown(s, q.scope === "item" ? 30_000 : 3_000));
    const scope = q.scope === "item" ? "one save" : q.scope === "collection" ? `the collection "${included[0]?.collection ?? ""}"` : "all of the user's saves (best matches below)";
    writeFileSync(
      join(dir, "index.md"),
      [
        `# Question about ${scope}`,
        "",
        "## Included saves (read these in saves/)",
        ...(included.length ? included.map((s) => `- ${s.id}: ${s.title ?? "untitled"}: ${s.takeaway ?? ""}`) : ["(none)"]),
        ...(others.length ? ["", "## Other saves, titles only (not included)", ...others.map((o) => `- ${o.title ?? "untitled"}`)] : []),
      ].join("\n"),
    );
    const prompt = `${readFileSync(new URL("./ask-prompt.md", import.meta.url), "utf8")}\n## The question\n${q.question}`;
    const answer = AnswerSchema.parse(await runClaude(claude, dir, prompt, answerJsonSchema()));
    const known = new Set(included.map((s) => s.id));
    answer.sources = answer.sources.filter((s) => known.has(s.id));

    const { error } = await supabase.from("takeaway_questions").update({ status: "answered", answer, answered_at: new Date().toISOString(), error: null }).eq("id", q.id);
    if (error) throw new Error(`Saving the answer failed: ${error.message}`);
    log(`Answered (${answer.sources.length} sources): ${q.question}`);
    await notify(`/ask/${q.id}`, "Answer ready", q.question);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Couldn't answer: ${message}`);
    await supabase.from("takeaway_questions").update({ status: "failed", error: message.slice(0, 500) }).eq("id", q.id);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- Recall: spaced-repetition cards ----------

/** Writes recall cards for up to `limit` ready saves that don't have any yet (new saves and older ones). */
async function generateCards(claude: string, limit = 5) {
  const { data } = await supabase
    .from("takeaway_items")
    .select(SAVE_FIELDS)
    .eq("status", "ready")
    .is("cards_generated_at", null)
    .order("processed_at", { ascending: false })
    .limit(limit);
  for (const save of ((data ?? []) as SaveRow[]).map(toSave)) {
    const dir = mkdtempSync(join(WORK_ROOT, "cards-"));
    try {
      writeFileSync(join(dir, "save.md"), saveToMarkdown(save, 3_000));
      const prompt = readFileSync(new URL("./recall-prompt.md", import.meta.url), "utf8");
      const { cards } = CardsSchema.parse(await runClaude(claude, dir, prompt, cardsJsonSchema()));
      if (cards.length) {
        const { error } = await supabase.from("takeaway_cards").insert(cards.map((c) => ({ item_id: save.id, question: c.question, answer: c.answer })));
        if (error) throw new Error(error.message);
      }
      await supabase.from("takeaway_items").update({ cards_generated_at: new Date().toISOString() }).eq("id", save.id);
      log(`Recall: ${cards.length} card${cards.length === 1 ? "" : "s"} for ${save.title ?? save.id}`);
    } catch (err) {
      log(`Recall cards failed for ${save.id}: ${err instanceof Error ? err.message : err}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

const STATE_FILE = join(process.cwd(), ".worker-state.json");
const RECALL_HOUR = Number(process.env.TAKEAWAY_RECALL_HOUR ?? 8);

/** Once a day, from RECALL_HOUR (local time), tells the phone how many cards are due. */
async function remindDueCards() {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  let state: { lastRecallReminder?: string } = {};
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    /* first run */
  }
  if (now.getHours() < RECALL_HOUR || state.lastRecallReminder === today) return;
  const { count } = await supabase.from("takeaway_cards").select("id", { count: "exact", head: true }).lte("due_at", now.toISOString());
  if (count) await notify("/recall", `${count} card${count === 1 ? "" : "s"} to recall today`, "Two minutes of recall makes what you saved stick.");
  writeFileSync(STATE_FILE, JSON.stringify({ ...state, lastRecallReminder: today }));
}

async function collectionId(name: string, collections: Collection[]): Promise<string | null> {
  const existing = collections.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing.id;
  const { data } = await supabase
    .from("takeaway_collections")
    .insert({ name: name.trim(), suggested: !(DEFAULT_COLLECTIONS as readonly string[]).includes(name.trim()) })
    .select("id")
    .single();
  return data?.id ?? null;
}

/** Push notification through ntfy (free Android app). The topic name works like a password: make it long and random. */
async function notify(path: string, title: string, message: string) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const appUrl = process.env.TAKEAWAY_APP_URL;
  await fetch("https://ntfy.sh", {
    method: "POST",
    body: JSON.stringify({ topic, title: title.slice(0, 120), message: message.slice(0, 300), ...(appUrl ? { click: `${appUrl}${path}` } : {}) }),
  }).catch((err) => log(`Notification failed: ${err}`));
}

/** Claude Code: CLAUDE_BIN, then `claude` on PATH, then the newest copy bundled with the VS Code extension. */
function findClaude(): string {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const exe = process.platform === "win32" ? "claude.exe" : "claude";
  for (const dir of (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":")) {
    if (dir && existsSync(join(dir, exe))) return join(dir, exe);
  }
  const extensions = join(homedir(), ".vscode", "extensions");
  const bundled = existsSync(extensions)
    ? readdirSync(extensions)
        .filter((d) => d.startsWith("anthropic.claude-code-"))
        .map((d) => join(extensions, d, "resources", "native-binary", exe))
        .filter((p) => existsSync(p))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    : [];
  if (bundled[0]) return bundled[0];
  throw new Error("Claude Code isn't installed. Install it (npm install -g @anthropic-ai/claude-code) or set CLAUDE_BIN.");
}

const log = (message: string) => console.log(`[${new Date().toLocaleTimeString()}] ${message}`);

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
