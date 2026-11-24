import { describe, expect, it } from "vitest";
import { answerJsonSchema, parseBlocks, parseInline, saveToMarkdown, searchTerms } from "./ask";

describe("searchTerms", () => {
  it("keeps the meaningful words and ORs them", () => {
    expect(searchTerms("What have I saved about microservices?")).toBe("microservices");
    expect(searchTerms("Which tools help with Kafka and event-driven design?")).toBe("tools or help or kafka or event-driven or design");
  });

  it("keeps tech names like c++, node.js and c#", () => {
    expect(searchTerms("Anything on C++ or Node.js or C#?")).toBe("c++ or node.js or c#");
  });

  it("returns null when there's nothing to search for", () => {
    expect(searchTerms("What have I saved?")).toBeNull();
  });
});

describe("answer rendering", () => {
  it("splits bold and code spans as plain text", () => {
    expect(parseInline("Use **RLS** with `auth.uid()` <script>")).toEqual([
      { text: "Use " },
      { text: "RLS", bold: true },
      { text: " with " },
      { text: "auth.uid()", code: true },
      { text: " <script>" },
    ]);
  });

  it("builds paragraphs and lists", () => {
    const blocks = parseBlocks("## Summary\nYou saved two videos.\nBoth use queues.\n\n- First\n- Second\n\n1. Do this\n2. Then that");
    expect(blocks).toEqual([
      { kind: "p", parts: [{ text: "Summary" }], heading: true },
      { kind: "p", parts: [{ text: "You saved two videos." }, { text: " " }, { text: "Both use queues." }] },
      { kind: "ul", items: [[{ text: "First" }], [{ text: "Second" }]] },
      { kind: "ol", items: [[{ text: "Do this" }], [{ text: "Then that" }]] },
    ]);
  });

  it("produces a draft-07 JSON Schema for Claude Code", () => {
    const schema = answerJsonSchema() as { $schema: string; required: string[] };
    expect(schema.$schema).toContain("draft-07");
    expect(schema.required).toEqual(["answer", "sources", "follow_ups"]);
  });
});

describe("saveToMarkdown", () => {
  const save = {
    id: "abc",
    url: "https://vt.tiktok.com/x/",
    title: "Queues 101",
    takeaway: "Use a queue to decouple slow work.",
    collection: "Software Architecture",
    notes: { key_points: [{ text: "Producers don't wait", at: "0:12" }, { text: "Retry failed jobs", at: null }], steps: [], code: [{ language: "ts", snippet: "a\nb", explanation: "two lines" }] },
    transcript: "x".repeat(50),
  };

  it("writes the notes with ids, timestamps and only non-empty sections", () => {
    const md = saveToMarkdown(save, 1000);
    expect(md).toContain("- id: abc");
    expect(md).toContain("- [0:12] Producers don't wait\n- Retry failed jobs");
    expect(md).toContain("(ts) a ⏎ b | two lines");
    expect(md).not.toContain("## Steps");
  });

  it("shortens long transcripts", () => {
    expect(saveToMarkdown(save, 10)).toContain(`${"x".repeat(10)}\n[transcript shortened]`);
  });
});
