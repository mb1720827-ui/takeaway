import { describe, expect, it } from "vitest";
import { detectPlatform, extractUrl } from "./links";
import { formatTime, frameInterval, looksLikeVideo, parseVtt, pickFrames, transcriptText } from "./media";
import { notesJsonSchema, NotesSchema } from "./notes";

describe("links", () => {
  it("pulls the link out of share text", () => {
    expect(extractUrl("Check out this video! https://vt.tiktok.com/ZSsFxBd92/")).toBe("https://vt.tiktok.com/ZSsFxBd92/");
    expect(extractUrl("Watch (https://youtu.be/abc123).")).toBe("https://youtu.be/abc123");
    expect(extractUrl("no link here")).toBeNull();
  });

  it.each([
    ["https://vt.tiktok.com/ZSsFxBd92/", "tiktok"],
    ["https://www.tiktok.com/@a/video/1", "tiktok"],
    ["https://youtu.be/abc", "youtube"],
    ["https://m.youtube.com/watch?v=abc", "youtube"],
    ["https://www.instagram.com/reel/abc/", "instagram"],
    ["https://x.com/a/status/1", "x"],
    ["https://twitter.com/a/status/1", "x"],
    ["https://martinfowler.com/articles/microservices.html", "web"],
    ["https://nottiktok.com/x", "web"],
  ] as const)("detects %s as %s", (url, platform) => {
    expect(detectPlatform(url)).toBe(platform);
  });
});

describe("captions", () => {
  const vtt = [
    "WEBVTT",
    "",
    "00:00:00.000 --> 00:00:01.100",
    "This is part 4 of my series",
    "",
    "00:00:01.101 --> 00:00:03.741 align:start position:0%",
    "where I build <c>tools</c> with code",
    "",
    "00:00:03.742 --> 00:00:05.000",
    "where I build tools with code",
    "",
    "00:01:05.000 --> 00:01:06.000",
    "to make my work &amp; life faster.",
  ].join("\r\n");

  it("parses timings, strips tags and drops repeated lines", () => {
    expect(parseVtt(vtt)).toEqual([
      { start: 0, text: "This is part 4 of my series" },
      { start: 1.101, text: "where I build tools with code" },
      { start: 65, text: "to make my work & life faster." },
    ]);
  });

  it("keeps the fuller line when a rolling caption grows", () => {
    const rolling = "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n\n00:00:01.000 --> 00:00:02.000\nhello world";
    expect(parseVtt(rolling)).toEqual([{ start: 0, text: "hello world" }]);
  });

  it("formats a readable timestamped transcript", () => {
    expect(transcriptText(parseVtt(vtt))).toBe("[0:00] This is part 4 of my series\n[0:01] where I build tools with code\n[1:05] to make my work & life faster.");
    expect(formatTime(3725)).toBe("1:02:05");
  });
});

describe("frames", () => {
  const f = (at: number, bytes: number) => ({ file: `f${at}.jpg`, at, bytes });

  it("drops black transition frames and near-duplicates", () => {
    const picked = pickFrames([f(0, 40000), f(4, 40300), f(8, 3000), f(12, 52000), f(16, 61000)]);
    expect(picked.map((p) => p.at)).toEqual([0, 12, 16]);
  });

  it("spreads picks across the video when there are too many", () => {
    const many = Array.from({ length: 30 }, (_, i) => f(i * 2, 20000 + i * 5000));
    const picked = pickFrames(many, 5);
    expect(picked.map((p) => p.at)).toEqual([0, 14, 30, 44, 58]);
  });

  it("samples short clips densely and long videos sparsely", () => {
    expect(frameInterval(36)).toBe(2);
    expect(frameInterval(1200)).toBe(50);
  });
});

describe("looksLikeVideo", () => {
  it("treats Instagram reels as video even though yt-dlp gives no duration", () => {
    const instagram = { extractor_key: "Instagram", formats: [{ vcodec: "none" }, { vcodec: "avc1.64001f" }] };
    expect(looksLikeVideo(instagram)).toBe(true);
  });

  it("uses the duration when there is one", () => {
    expect(looksLikeVideo({ extractor_key: "TikTok", duration: 36 })).toBe(true);
  });

  it("rejects pages, audio-only results and missing metadata", () => {
    expect(looksLikeVideo({ extractor_key: "Generic", duration: 120 })).toBe(false);
    expect(looksLikeVideo({ extractor_key: "Instagram", formats: [{ vcodec: "none" }] })).toBe(false);
    expect(looksLikeVideo(null)).toBe(false);
  });
});

describe("notes schema", () => {
  it("produces a JSON Schema Claude Code can enforce", () => {
    const schema = notesJsonSchema() as { type: string; required: string[] };
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(expect.arrayContaining(["takeaway", "collection", "connections"]));
  });

  it("rejects notes missing required parts", () => {
    expect(NotesSchema.safeParse({ title: "x" }).success).toBe(false);
  });

  it("keeps the Stride skill a save belongs to, and allows none", () => {
    const notes = {
      title: "SQL joins in 60 seconds",
      author: null,
      takeaway: "An INNER JOIN keeps only rows that match in both tables.",
      key_points: [],
      steps: [],
      resources: [],
      code: [],
      concepts: [],
      action_items: [],
      on_screen: [],
      collection: "Software Architecture",
      tags: [],
      connections: [],
    };
    const skill = "11111111-1111-4111-8111-111111111111";
    expect(NotesSchema.parse({ ...notes, skill_id: skill }).skill_id).toBe(skill);
    expect(NotesSchema.parse({ ...notes, skill_id: null }).skill_id).toBeNull();
    expect(NotesSchema.safeParse(notes).success).toBe(true);
  });
});
