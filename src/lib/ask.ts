import { z } from "zod";
import type { Notes } from "./notes";

/** What the worker asks Claude to return for a question about the user's saves. */
export const AnswerSchema = z.object({
  answer: z.string().min(1).max(6000).describe("The answer in plain markdown: short paragraphs, '- ' bullets, **bold** and `code` only"),
  sources: z
    .array(z.object({ id: z.string(), at: z.string().nullable().describe('Timestamp like "1:05", or null'), note: z.string().describe("What this save contributed") }))
    .max(12)
    .describe("Saves the answer used, by id, only from the files provided"),
  follow_ups: z.array(z.string()).max(3).describe("Up to three useful follow-up questions"),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const answerJsonSchema = () => z.toJSONSchema(AnswerSchema, { target: "draft-7" });

const STOP_WORDS = new Set(
  "a about above after again all also am an and any are as at be been before being below between both but by can did do does doing down during each few for from further had has have having how i if in into is it its just me more most my no nor not of off on once only or other our out over own same saved save she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with you your tell show give list summarise summarize explain anything everything something things thing stuff video videos".split(" "),
);

/** Turns a question into an OR search, e.g. "What have I saved about microservices?" → "microservices". */
export function searchTerms(question: string): string | null {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  const unique = [...new Set(words)].slice(0, 12);
  return unique.length ? unique.join(" or ") : null;
}

export interface SaveForAsk {
  id: string;
  url: string;
  title: string | null;
  takeaway: string | null;
  collection: string | null;
  notes: Partial<Notes> | null;
  transcript: string | null;
}

/** One save as a markdown file for the answering model: the notes first, then as much transcript as fits. */
export function saveToMarkdown(save: SaveForAsk, transcriptChars: number): string {
  const n = save.notes ?? {};
  const list = (title: string, lines: string[] | undefined) => (lines && lines.length ? [`## ${title}`, ...lines.map((l) => `- ${l}`), ""] : []);
  const transcript = save.transcript ?? "";
  return [
    `# ${save.title ?? "Untitled save"}`,
    `- id: ${save.id}`,
    `- link: ${save.url}`,
    `- collection: ${save.collection ?? "none"}`,
    "",
    "## Takeaway",
    save.takeaway ?? "",
    "",
    ...list("Key points", n.key_points?.map((p) => `${p.at ? `[${p.at}] ` : ""}${p.text}`)),
    ...list("Steps", n.steps),
    ...list("Concepts", n.concepts?.map((c) => `${c.term}: ${c.explanation}`)),
    ...list("Code", n.code?.map((c) => `(${c.language}) ${c.snippet.replace(/\n/g, " ⏎ ")} | ${c.explanation}`)),
    ...list("Tools and resources", n.resources?.map((r) => `${r.name} (${r.kind})${r.url ? ` ${r.url}` : ""}`)),
    ...list("Action items", n.action_items),
    ...list("On screen", n.on_screen),
    ...(transcript
      ? ["## Transcript", transcript.length > transcriptChars ? `${transcript.slice(0, transcriptChars)}\n[transcript shortened]` : transcript]
      : []),
  ].join("\n");
}

export type Inline = { text: string; bold?: boolean; code?: boolean };
export type Block = { kind: "p"; parts: Inline[]; heading?: boolean } | { kind: "ul" | "ol"; items: Inline[][] };

/** Splits **bold** and `code` spans. Everything stays plain text, so model output can never inject HTML. */
export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], code: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** A tiny markdown subset for answers: paragraphs, "- " bullets and "1. " numbered lists. */
export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks.at(-1);
    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const item = parseInline((bullet ?? numbered)![1]);
      if (last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (/^#+\s/.test(line)) {
      blocks.push({ kind: "p", parts: parseInline(line.replace(/^#+\s*/, "")), heading: true }, { kind: "p", parts: [] });
    } else if (!line) {
      blocks.push({ kind: "p", parts: [] }); // paragraph break marker
    } else if (last && last.kind === "p" && last.parts.length) {
      last.parts.push({ text: " " }, ...parseInline(line));
    } else {
      blocks.push({ kind: "p", parts: parseInline(line) });
    }
  }
  return blocks.filter((b) => b.kind !== "p" || b.parts.length > 0);
}
