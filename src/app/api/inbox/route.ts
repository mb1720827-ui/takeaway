import { createClient } from "@supabase/supabase-js";
import { detectPlatform, extractUrl } from "@/lib/links";

/**
 * POST /api/inbox with "Authorization: Bearer <inbox token>" and the shared text or link as the body
 * (plain text, or JSON with "url" or "text"). Used by the phone's share shortcut, so it needs no login.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ error: "Missing inbox token" }, { status: 401 });

  const body = (await request.text()).slice(0, 10_000);
  let shared = body;
  try {
    const json = JSON.parse(body);
    shared = String(json.url ?? json.text ?? body);
  } catch {
    // plain text body
  }
  const url = extractUrl(shared);
  if (!url) return Response.json({ error: "No link found in what was shared" }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("takeaway_add_to_inbox", { p_token: token, p_url: url, p_platform: detectPlatform(url) });
  if (error?.code === "28000") return Response.json({ error: "Invalid inbox token" }, { status: 401 });
  if (error) return Response.json({ error: "Couldn't save that link" }, { status: 400 });
  return new Response("Saved to Takeaway", { headers: { "X-Item-Id": String(data) } });
}
