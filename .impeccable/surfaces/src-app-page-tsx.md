---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/i/[id]/page.tsx","src/app/c/[id]/page.tsx","src/app/review/page.tsx","src/app/recall/page.tsx","src/app/ask/page.tsx","src/app/settings/page.tsx","src/app/login/page.tsx"]
---

# Takeaway app surfaces (home, a save's notes, collection, Review, Recall, Ask, Settings, login)

Mode: Operate. Mobile-first (Android phone: right after sharing, reviewing in batches, daily Recall, asking). Code-led.

Audience and job: the owner, a student in Nigeria, checks that a save came out well, reviews and recalls notes, asks across saves, and finds any save again in seconds. Constraints: same family as Stride (shared Overpass type and calm craft) with its own identity; must not feel childish, dark or techy, cold or corporate, or busy.

## Direction contract

THESIS: Every save is a tape you recorded. Its notes read like a J-card tracklist, numbered key points with running timestamps, and collections sit labelled on one shelf. Refuses the read-later default of a thumbnail card feed.

OWN-WORLD: Cassette J-card material. Cool grey ground #F1F2F6, ink #161833, tape-label indigo #3436A8 carries the header band, primary actions and track numbers, white label panels, muted #5A5E7A, rule #E3E5EE. A small red REC dot #E5484D only for saves being recorded (processed). Overpass for everything; track numbers and timestamps in tabular numerals in fixed columns. Flat colour, no gradients or shadows. Product words stay plain (saves, collections, review); the world shows in type, palette, density and the tracklist, never in renamed features.

STORY: Share a video, open Takeaway and see it recording with a red dot, then ready. Open it: the one-line takeaway, then the tracklist of key points with times, then "Try this". Mark it reviewed or applied. Later, find it by search, by collection, or by its number in that collection.

FIRST VIEWPORT: Phone 390x844, home. Indigo header band: Takeaway wordmark, "Saves" large, guide line "3 new to review ∙ 1 recording". Below on the grey ground: one field to paste a link, then search; a Recording group (rows with the REC dot); a Review prompt row and a Recall prompt row; Collections as a list of labelled rows with counts in a right-aligned tabular column; Latest saves as rows with title, takeaway line, and source with the collection and its number ("Software Architecture ∙ No.2"), then "See all N saves". (Video length was dropped: Takeaway does not store it.) Bottom tab bar: Home, Review, Recall, Ask, Settings; a top bar on desktop, max 576px column.

FORM: Tracklist, candidate 4 of 7 on the grounded list (assigned by the roll), raised by five declined challengers: one in-place status flip from REC to ready (split-flap board), a number on every save within its collection (boarding pass), one fixed scale for importance: takeaway, key points, details (star atlas), a strict grid for number, text and time columns (Crouwel specimen), connections shown as links between saves (metro map). seed:88b4ddf6894afddf

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
