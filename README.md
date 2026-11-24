# Takeaway

**Share a TikTok, YouTube video or article from your phone in two taps. Your laptop's AI watches it (captions, frames, on-screen code) and turns it into notes you can review, search and act on.**

Saved videos pile up unwatched. Takeaway is a personal "send-to" inbox that turns them into organised, reviewable knowledge, without leaving the app you're scrolling.

## How it works

```
Phone (Android share menu → HTTP Shortcuts, or iPhone Shortcut)
   │  POST /api/inbox   "Bearer <inbox token>" + the shared link
   ▼
Next.js app on Vercel ──► Supabase (Postgres, row-level security)
                                 ▲
                                 │ new links / finished notes
Worker on your laptop (npm run worker), every minute:
   1. yt-dlp: metadata, the platform's captions, the video (720p max)
   2. captions → clean timestamped transcript (Whisper fallback if there are none)
   3. ffmpeg: frames every few seconds, blank and duplicate frames dropped
   4. Claude Code, headless and read-only: reads transcript + frames → structured notes (JSON schema)
   5. saves notes, files them in a collection, deletes the video, sends a push notification (ntfy)
```

Each save becomes:
- a one-line **takeaway**
- **key points** with timestamps
- **steps**
- **concepts explained**
- **code** copied from the screen
- **tools and resources**
- **things to try**
- links to related earlier saves ("connects to")
- the full transcript

## Features

- **Two-tap saving** from any app's share menu, with no context switching. A paste box works too.
- **Collections** such as AI Tips, AI Innovation, Software Architecture, Inspiration and Life Tips. The AI suggests new ones; you keep, rename or move items.
- **Review mode**: one card at a time, marked **Reviewed** or **Applied**, or saved for later.
- **Search** across every transcript and note (Postgres full-text search).
- **Ask**: question one save, a collection or everything ("What have I saved about microservices?"). The laptop worker answers only from your saves, citing the videos and timestamps it used, usually within a minute.
- **Notifications** on your phone when notes are ready.

## Design decisions

- **The AI runs on your laptop through Claude Code.** It uses your Claude plan, so there's no API key and no per-video bill. The trade-off is that saves are processed only while your laptop is on.
- **Captions first.** Platforms like TikTok often provide timestamped captions, which are faster and free compared with speech-to-text.
- **Frames are filtered before the AI sees them.** Black or transition frames compress to tiny files, and static screens give near-identical sizes, so both are skipped to save tokens.
- **The worker is locked down.** Claude Code runs with `--restricted` (no shell or code tools; file access confined to one temporary folder), read-only `--allowedTools Read`, no personal hooks, plugins or MCP servers, and a JSON schema for its output. Downloaded content is treated as data: the prompt says to ignore any instructions inside it.
- **The phone needs no login.** It sends an inbox token that is stored only as a SHA-256 hash and checked by a `SECURITY DEFINER` database function. All tables use row-level security, and the worker signs in as you rather than using an admin key.
- **Videos aren't kept.** They're deleted after processing; only text notes are stored.

## Set up

1. **Database:** create a Supabase project and run every file in [`supabase/migrations/`](supabase/migrations/), oldest first, in the SQL Editor.
2. **App:**
   1. Copy `.env.example` to `.env.local` and add your Supabase URL and publishable key.
   2. Deploy to Vercel with those two variables.
   3. Add `https://<your-app>/auth/callback` to Supabase's redirect URLs.
3. **Account:** sign up in your app, then open **Settings** and create an inbox token.
4. **Phone:** follow the steps in Settings (Android: HTTP Shortcuts; iPhone: a Shortcut with "Get Contents of URL").
5. **Laptop:**
   1. Install Claude Code, `yt-dlp` and `ffmpeg`.
   2. Fill in the worker section of `.env.local`.
   3. Run:
   ```bash
   npm install
   npm run worker          # keeps running; or: npm run worker -- --once
   # Windows: start it automatically at login (hidden, restarts if it stops, logs to worker.log)
   powershell -ExecutionPolicy Bypass -File worker\install-autostart.ps1
   ```
6. **Notifications (optional):** install ntfy on your phone and set `NTFY_TOPIC` to a long random name.

Want your own copy without doing this by hand? Use [**takeaway-builder**](https://github.com/mb1720827-ui/takeaway-builder): install it in your AI coding agent and ask it to build you one.

## Development

```bash
npm test     # captions, frame picking, link parsing, notes schema
npm run lint
npm run build
```

## Roadmap

- Semantic search (embeddings), so Ask also finds saves that use different words
- X (Twitter) posts, and private or login-only Instagram posts (public Reels already work)
- A native Android share screen that closes instantly
- Spaced-repetition reminders

## License

MIT
