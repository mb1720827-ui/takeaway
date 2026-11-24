export type Platform = "tiktok" | "youtube" | "instagram" | "x" | "web";

/** Share menus often send "Check out this video! https://vt.tiktok.com/abc/": pull out the first link. */
export function extractUrl(text: string): string | null {
  const match = /https?:\/\/[^\s<>"']+/i.exec(text ?? "");
  if (!match) return null;
  const url = match[0].replace(/[).,!?]+$/, ""); // trailing punctuation from the surrounding sentence
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): Platform {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return "web";
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  return "web";
}
