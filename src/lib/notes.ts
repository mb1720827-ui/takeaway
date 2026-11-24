import { z } from "zod";

/** Collections every new user starts with. The AI can suggest others; the user keeps, renames or merges them. */
export const DEFAULT_COLLECTIONS = ["AI Tips", "AI Innovation", "Software Architecture", "Inspiration", "Life Tips"] as const;

/** The learning breakdown the worker asks Claude to produce for every saved link. */
export const NotesSchema = z.object({
  title: z.string().min(1).max(200).describe("A clear title for what this teaches, not the clickbait caption"),
  author: z.string().max(100).nullable().describe("Creator or site name, or null"),
  takeaway: z.string().min(1).max(400).describe("The single most useful lesson, in one sentence"),
  key_points: z
    .array(z.object({ text: z.string(), at: z.string().nullable().describe('Timestamp like "1:05", or null') }))
    .max(12),
  steps: z.array(z.string()).max(15).describe("Concrete steps to do what the content shows, if any"),
  resources: z
    .array(
      z.object({
        name: z.string(),
        kind: z.enum(["tool", "library", "website", "course", "book", "paper", "person", "other"]),
        url: z.string().nullable(),
      }),
    )
    .max(20)
    .describe("Only things actually mentioned or shown"),
  code: z.array(z.object({ language: z.string(), snippet: z.string(), explanation: z.string() })).max(10),
  concepts: z.array(z.object({ term: z.string(), explanation: z.string() })).max(10).describe("Ideas a learner needs explained simply"),
  action_items: z.array(z.string()).max(8).describe("What the viewer could try this week"),
  on_screen: z.array(z.string()).max(20).describe("Important text, code or diagrams seen in the frames"),
  collection: z.string().min(1).max(60).describe("An existing collection name, or a short new one if none fits"),
  tags: z.array(z.string()).max(8),
  connections: z
    .array(z.object({ id: z.string(), why: z.string() }))
    .max(5)
    .describe("Earlier saves (by id, only from the list given) that this relates to, and how"),
});
export type Notes = z.infer<typeof NotesSchema>;

/** JSON Schema for Claude Code's --json-schema option, which validates against draft-07. */
export const notesJsonSchema = () => z.toJSONSchema(NotesSchema, { target: "draft-7" });
