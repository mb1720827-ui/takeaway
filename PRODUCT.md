# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily the owner: a software engineering student in Nigeria who saves TikTok, YouTube and Instagram videos and articles on an Android phone to learn from later. Other people get their own copy through takeaway-builder (the AI runs on each owner's own laptop).

## Product Purpose

Takeaway turns what you save into notes you actually use. Tap Share on a video or article; a worker on your laptop reads the captions, looks at the frames (including on-screen code) and writes a breakdown: the takeaway, key points with timestamps, steps, concepts explained, code, tools, things to try. Saves are sorted into collections, reviewed one at a time, turned into Recall quiz cards, and can be questioned ("what have I saved about microservices?"). Success is that saving a video leads to learning it, not to a forgotten pile.

## Positioning

It reads the video itself (captions and frames, on-screen code included), not just the caption, and it closes the loop from save to notes to review to spaced recall to asking across everything saved. It shares an account with Stride, so saves can become resources for a skill and ideas can become tasks.

## Operating Context

- Right after sharing from the phone: check the save went through and the notes came out well.
- Reviewing in batches: going through several new notes at once (Review mode).
- Daily Recall: a few minutes of quiz cards, usually from a morning notification.
- Asking questions across saves, one collection or one save.
- Finding a particular save again later: every note must be well organised and quick to reach when needed (owner's words: "properly organized and easily accessible when I need each one").

## Capabilities and Constraints

- Screens: home (paste a link, search, processing queue, review and recall prompts, collections, latest), a save's notes page, a collection page, Review, Recall, Ask (question and answer pages), Settings (inbox token and phone setup), login.
- Item states: queued, processing, ready, failed; review states: new, reviewed, applied. Collections can be AI-suggested until kept or renamed.
- Next.js 16 App Router with Cache Components, Tailwind CSS 4, Supabase. Push notifications through ntfy. Links to Stride ("Plan it in Stride").

## Brand Commitments

- Name: Takeaway.
- No visual element is binding (owner, 2026-11-25): the current purple can change.
- Its own identity, but clearly in the same family as Stride (shared craft and calm feel).
- Inferred from the owner's answers for Stride, to confirm: must not feel childish or gamey, dark or techy, cold or corporate, or busy.

## Evidence on Hand

No testimonials, user counts or metrics exist; none may be invented.

## Product Principles

1. Every save findable in seconds: organised by collection, searchable, and one tap from where you are.
2. Notes over noise: the breakdown leads; the original video and transcript are one tap away, not in the way.
3. Learning sticks: review, recall and connections make saved knowledge come back, without guilt about the backlog.
4. Quick in, quick out: checking a save, a review pass or a recall session should take minutes on a phone.
