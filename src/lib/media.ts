/** 75.4 → "1:15", 3725 → "1:02:05". */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export interface Segment {
  start: number;
  text: string;
}

/**
 * Turns WebVTT captions into clean segments: no tags, no cue settings, and none of the repeated lines
 * that auto-captions produce when each cue re-shows the previous line.
 */
export function parseVtt(vtt: string): Segment[] {
  const segments: Segment[] = [];
  const blocks = vtt.replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const timing = lines.findIndex((l) => l.includes("-->"));
    if (timing === -1) continue;
    const start = toSeconds(lines[timing].split("-->")[0].trim());
    const text = lines
      .slice(timing + 1)
      .map((l) => l.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ");
    if (!text || Number.isNaN(start)) continue;
    const previous = segments.at(-1);
    if (previous && (previous.text === text || previous.text.endsWith(text))) continue;
    if (previous && text.startsWith(previous.text)) {
      previous.text = text; // rolling caption that grew; keep the fuller line
      continue;
    }
    segments.push({ start, text });
  }
  return segments;
}

function toSeconds(stamp: string): number {
  const parts = stamp.split(/[:.,]/).map(Number);
  const [h, m, s, ms] = parts.length === 4 ? parts : [0, ...parts];
  return h * 3600 + m * 60 + s + (ms ?? 0) / 1000;
}

export const transcriptText = (segments: Segment[]) => segments.map((s) => `[${formatTime(s.start)}] ${s.text}`).join("\n");

export interface Frame {
  file: string;
  at: number;
  bytes: number;
}

/**
 * Chooses which sampled frames the AI should look at. Black or transition frames compress to tiny JPEGs, and a
 * static screen produces near-identical file sizes, so both are dropped before spending tokens on them.
 */
export function pickFrames(frames: Frame[], max = 12, minBytes = 8000): Frame[] {
  const kept: Frame[] = [];
  for (const f of frames) {
    if (f.bytes < minBytes) continue;
    const last = kept.at(-1);
    if (last && Math.abs(f.bytes - last.bytes) / last.bytes < 0.02) continue;
    kept.push(f);
  }
  if (kept.length <= max) return kept;
  // Spread the picks evenly across the video.
  return Array.from({ length: max }, (_, i) => kept[Math.round((i * (kept.length - 1)) / (max - 1))]);
}

/** Readable text from an article's HTML: no scripts, styles, tags or runs of whitespace. */
export function htmlToText(html: string, maxChars = 60000): { title: string | null; text: string } {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || null;
  const text = html
    .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|pre|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, maxChars);
  return { title, text };
}

export interface VideoMeta {
  extractor_key?: string;
  duration?: number;
  formats?: { vcodec?: string }[];
}

/** Whether yt-dlp's metadata describes a video. Instagram leaves out "duration", so having a video stream also counts. */
export function looksLikeVideo<T extends VideoMeta>(info: T | null): info is T {
  if (!info || info.extractor_key === "Generic") return false;
  return Number(info.duration) > 0 || (info.formats ?? []).some((f) => Boolean(f.vcodec) && f.vcodec !== "none");
}

/** One frame every few seconds, so short clips get detail and long videos stay within budget. */
export const frameInterval = (durationSeconds: number) => Math.max(2, Math.ceil(durationSeconds / 24));
