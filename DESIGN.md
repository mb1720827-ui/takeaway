---
name: Takeaway
description: Every save is a tape you recorded; its notes read like a cassette J-card tracklist.
colors:
  tape: "#3436a8"
  tape-deep: "#282a8c"
  on-tape: "#d9daf5"
  rec: "#e5484d"
  applied: "#0b7a45"
  risk: "#b42318"
  ink: "#161833"
  muted: "#5a5e7a"
  ground: "#f1f2f6"
  surface: "#ffffff"
  wash: "#e8e9f6"
  wash-hover: "#dadcf2"
  rule: "#e3e5ee"
  field: "#8a8ea8"
typography:
  display:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.375
  title:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.5556
    letterSpacing: "-0.01em"
  takeaway:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.625
  body:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.375
  body-small:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
  numeral:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.375
    fontFeature: '"tnum"'
  numeral-small:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.4286
    fontFeature: '"tnum"'
  label:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4286
  caption:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  label: "5px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  row-y: "14px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  track-column: "36px"
  number-column: "40px"
  time-column: "48px"
components:
  button-primary:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.surface}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.tape-deep}"
  button-secondary:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.wash-hover}"
  button-quiet:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
  button-quiet-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 14px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  header-band:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.surface}"
    typography: "{typography.display}"
    padding: "20px 20px 24px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
  tab-active:
    textColor: "{colors.tape}"
  filter-tab-active:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 0"
  status-option-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 0"
  status-option-applied:
    backgroundColor: "{colors.applied}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "8px 0"
  number-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tape}"
    typography: "{typography.numeral-small}"
    rounded: "{rounded.label}"
    padding: "0 6px"
  track-number:
    textColor: "{colors.tape}"
    typography: "{typography.numeral}"
    width: "36px"
  track-time:
    textColor: "{colors.muted}"
    typography: "{typography.numeral-small}"
    width: "48px"
  rec-dot:
    backgroundColor: "{colors.rec}"
    rounded: "{rounded.full}"
    size: "10px"
  rec-dot-waiting:
    rounded: "{rounded.full}"
    size: "10px"
  new-dot:
    backgroundColor: "{colors.tape}"
    rounded: "{rounded.full}"
    size: "8px"
  code-block:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    padding: "16px"
---

# Design System: Takeaway

## Overview

**Creative North Star: "The J-Card"**

Every save is a tape you recorded, and Takeaway prints its J-card. A save's notes open with the one-line takeaway, then a tracklist: key points numbered 01, 02, 03 in an indigo column, the text beside them, and each running time right-aligned in a column of its own. Collections sit labelled on one shelf as rows with their counts, and every save inside one carries a catalogue number ("No.4"). A save that is still being processed shows a small red REC dot. The system refuses the read-later default of a thumbnail card feed; nothing here is an image grid.

The material is the printed cassette insert: a cool grey ground, deep indigo-navy ink, white label panels, and one tape-label indigo that carries the header band, the single filled action, track numbers, counts and the active tab. Overpass sets everything, at three weights, with heavy tabular numerals for numbers and times. Colour is flat. Depth comes from the indigo band over the grey ground and from white panels resting on it, never from shadows. The world shows in type, palette, density and the tracklist, never in renamed features: saves are "saves", collections are "collections", and the one borrowed word is "Recording" for a save being processed.

Density is calm and thumb-first. Visits last minutes, so each screen answers one thing: the band names the screen and gives a one-line guide ("9 new to review ∙ 1 recording ∙ 1 waiting"), and everything below is lists of rows in white panels. Takeaway shares Overpass, the 576px column, the band, the tab bar, the press response and the flat rule with its sibling Stride; the indigo, the tracklist and the REC dot are its own.

**Key Characteristics:**
- Notes read as a tracklist: zero-padded track numbers, the text, right-aligned running times, each in a fixed column.
- Every save in a collection has a catalogue number, written "No.N" with no space.
- One tape indigo does the work; the red REC dot means the laptop is working on this right now.
- Flat colour on a cool grey ground; white panels; no shadows or gradients.
- Overpass at 400, 600 and 800; tabular figures for every number; tracking only tightens.
- One centred 576px column, an indigo band on every screen, a bottom tab bar on phones and a top bar on desktop.
- Two authored motions (the REC breathe and the arrive flip), both switched off under reduced motion.

## Colors

One tape-label indigo carries the system on a cool grey ground, with a red kept for the REC dot, Stride's green for "applied", and a darker red for trouble.

### Primary
- **Tape Indigo** (#3436a8): the header band, the one filled button in an action row, track numbers, "No.N" labels, collection counts, the new-save dot, the selected filter tab, the active tab, the "Try this" box outline, list markers in answers, focus rings, the text caret and the selection highlight. White text on it reaches 9.4:1. The browser theme colour matches it, so on Android the status bar runs straight into the band.
- **Deep Tape** (#282a8c): the hover of anything filled Tape Indigo, the back link's hover inside the band, and the panel behind the sample tracklist on the login band.
- **Label Lavender** (#d9daf5): the softer text on the band: the guide line, the back link and the login wordmark and sample numbers. It holds 6.8:1 on Tape Indigo.

### Secondary
- **Recording Red** (#e5484d): the REC dot and nothing else. A 10px dot that breathes while the laptop records a save or writes an answer. It is never text, never a fill behind text, never an error colour.
- **Applied Green** (#0b7a45): Stride's brand green, the family's colour for "done". The trailing "∙ applied" on a save row, the selected Applied option in a save's status switch and the "Plan it in Stride" link. White text on it reaches 5.4:1; as text it needs a white ground (5.4:1), because on Tape Wash it falls to 4.48:1, under AA.

### Tertiary
- **Signal Red** (#b42318): failed saves (alert icon and message), error text under forms, and the "Delete this save" quiet button. Used as text and icon colour only, never as a fill.

### Neutral
- **Cassette Ink** (#161833): all primary text, and the fill of code blocks and the worker command, with white text on it.
- **Label Grey** (#5a5e7a): meta lines, takeaway previews, running times, placeholders, inactive tabs, chevrons, and the ring of the waiting dot. 5.7:1 on the ground, 6.3:1 on white.
- **J-Card Grey** (#f1f2f6): the page ground beneath the band, the track of the status switch, and (at 60% over white) the hover of every row.
- **Label White** (#ffffff): panels, inputs, the tab bar, the filter track, the selected status option, the "No.N" label in the band, and text on Tape Indigo.
- **Tape Wash** (#e8e9f6): secondary buttons, quiet-button hover, the revealed recall answer, the new-token box, inline code, and the hover of the "See all" and follow-up rows.
- **Pressed Wash** (#dadcf2): the hover of anything filled Tape Wash.
- **Faint Rule** (#e3e5ee): 1px dividers between rows and the tab bar's edge.
- **Field Edge** (#8a8ea8): the 2px resting border of inputs, selects and the Forgot grade button (3.2:1 on white, the minimum for a control's edge).

### Named Rules
**The Tape Label Rule.** Tape Indigo carries the band, the single filled action, numbers and the current place. Text on it is Label White or Label Lavender only.

**The REC Rule.** Recording Red is the REC dot and nothing else: the laptop is working on this right now. Errors use Signal Red; done uses Applied Green.

**The Family Green Rule.** Applied Green means applied or done, and it is the one bridge to Stride. It never becomes a second brand colour on Takeaway screens.

## Typography

**Display Font:** Overpass (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Overpass (same stack)
**Label/Mono Font:** code uses the platform monospace stack (Tailwind's default mono), never a loaded face.

**Character:** One family with road-sign lineage, shared with Stride: clear at a glance, with sturdy figures for numbers and times. Hierarchy comes from scale and weight, never from a second face, capitals or letter-spacing.

### Hierarchy
- **Display** (800, 1.875rem, 1.08, -0.02em, balanced wrapping): the screen title in the band ("Saves", a save's title, a collection name, "Recall"). The login band alone sets it larger (2.25rem, 1.05).
- **Headline** (800, 1.25rem, 1.375, balanced): the recall question. One per screen.
- **Title** (800, 1.125rem, 1.5556, -0.01em): section titles ("Recording", "Collections", "Key points"), Settings step titles, the Ask prompt label.
- **Takeaway** (600, 1.125rem, 1.625, balanced): the one-line takeaway at the top of a save and of each Review card.
- **Body** (400, 1rem, 1.5): running text, track text, input values, the recall answer.
- **Body Strong** (800, 1rem, 1.375): save and collection titles in rows, concept terms, button text, prompt rows.
- **Body Small** (400, 0.875rem, 1.375): the takeaway preview under a save title (clamped to two lines), prompt descriptions, connection reasons.
- **Numeral** (800, 1rem, tabular): track numbers in Tape Indigo. Collection counts use the same treatment at 1.125rem.
- **Numeral Small** (800, 0.875rem, tabular): running times in Label Grey, and "No.N" in the save-number column and on the band label.
- **Label** (600, 0.875rem, 1.4286): the guide line in the band, form labels, quiet buttons, error and status text.
- **Caption** (400, 0.8125rem, 1.5): the source line under a save ("TikTok ∙ Software Architecture ∙ No.4") and a collection's "2 new".
- **Tab label** (0.75rem on phones, 0.875rem from 768px): 600 when inactive, 800 when active.
- **Wordmark** (800, 1.25rem, -0.025em): "Takeaway", set as type, never as an image. The login band currently sets it at 1rem in Label Lavender.

### Named Rules
**The Three Weights Rule.** Only 400, 600 and 800 are loaded. 400 is for reading, 600 for labels and the takeaway line, 800 for anything you scan for or act on: titles, numbers, times, buttons.

**The Plain Label Rule.** No eyebrows, kickers, uppercase labels or positive letter-spacing. Tracking only tightens: display (-0.02em), title (-0.01em) and the wordmark.

**The Centred Dot Rule.** Meta parts are joined by U+2219 "∙" with a space either side ("Making notes ∙ TikTok"). Overpass sets the usual middle dot (U+00B7) off-centre, so it is not used.

**The Catalogue Number Rule.** A save's number in its collection is written "No.N" with no space, counted oldest first (No.1 is the first save put there). In a list from one collection it sits in its own column; in a mixed list it follows the collection name ("Software Architecture ∙ No.2"), because the number means nothing without it. Tracks and setup steps are zero-padded ("01"); running times are right-aligned in their own column.

## Layout

One centred column, max 576px wide, on every screen and at every width. The indigo band spans the full viewport; its content and the main column share the 576px measure. The band has 20px side padding, a top of 20px or the safe-area inset (whichever is larger) and 24px below the guide line. The main column has 16px side gutters and 24px at the top, sections stack 24px apart, and it keeps 128px of bottom padding on phones so the fixed tab bar never covers the last row (64px from 768px up). Section titles sit 4px in from the panel edge with 8px below them.

Lists are white panels with 1px Faint Rule dividers. Navigational rows have 16px side and 14px vertical padding, with 12px between an icon and its text; note rows (tracks, concepts, tools) use 12px vertical padding. Tracklists use a three-column grid: a 36px number column, a flexible text column allowed to shrink so long text wraps, and a 48px time column, with 8px gaps. Save rows from one collection put "No.N" in a 40px column before the title; mixed lists drop the column. Collection rows end with a right-aligned count and a chevron.

From 768px the tab bar moves to a fixed 64px top bar and the band gains 64px of top padding to clear it. Nothing else changes with width: desktop is the phone column, centred. Safe-area insets are respected at the top of the band and the bottom of the tab bar.

### Named Rules
**The Fixed Column Rule.** Anything numbered uses fixed columns: 36px for track numbers, 40px for "No.N", 48px for running times, so numbers and times align from row to row and screen to screen.

## Elevation & Depth

The system is flat. No element casts a box-shadow, glows or blurs, and there are no gradients. Depth is tonal: the Tape Indigo band sits above the J-Card Grey ground, and white panels, inputs and the tab bar rest on the ground as lighter planes. Inside a white panel the order flips: the status switch is a grey track holding a white selected option, and code blocks are Cassette Ink panels set into the white. The only stacking is structural: the tab bar sits above the content.

### Named Rules
**The Flat Colour Rule.** No drop shadows, glows, blurs or gradients. A plane is lifted only by being lighter or darker than what it sits on.

## Shapes

The form language is the cassette insert: rectangles with gently rounded corners, read as printed labels rather than cards. Corners step up with size: 4px for inline code, 5px for the "No.N" label in the band, 6px for the "Try this" box, 8px for quiet buttons, the back link and segmented options, 12px for buttons, inputs and segmented tracks, 16px for panels, and fully round for the REC dot, the waiting ring and the new-save dot. Borders are 1px for dividers and bar edges and 2px for inputs, the waiting ring, the Forgot button and the "Try this" box. The only circles in the system are status marks.

## Components

### Buttons
Firm, heavy and immediate: every press answers the thumb.
- **Shape:** gently rounded (12px) for primary and secondary, 8px for quiet.
- **Primary:** Tape Indigo with white 800-weight text, 12px by 20px padding, an optional 20px icon at an 8px gap. The save-a-link button is icon-only (an arrow) with 16px side padding and a label for screen readers. Show answer and the Review actions grow to 14px vertical padding.
- **Secondary:** Tape Wash with Cassette Ink 800-weight text, 10px by 16px padding. Used for Retry, Move, Keep or Save on a collection name, Later, Create account, and the paired links under a takeaway ("Open the original", "Ask about it", at 14px text with a 16px icon). In Review, Applied is a secondary button with Applied Green text.
- **Quiet:** no fill, Label Grey 600-weight 14px text, 6px by 8px padding; Tape Wash fill and ink text on hover. Used for Sign out, and in Signal Red for "Delete this save".
- **Hover / Focus / Press:** filled buttons deepen on hover (Tape Indigo to Deep Tape; Tape Wash to Pressed Wash). Focus shows a 3px Tape Indigo outline at 2px offset, white inside the band. Pressing scales to 0.97 over 160ms on cubic-bezier(0.23, 1, 0.32, 1). Disabled drops to 60% opacity; a pending icon button shows "…" and a pending text button says what is happening ("Sending…").
- **Recall grades:** after the answer shows, three equal 12px-cornered buttons with the grade over a 12px 600 hint of when the card returns ("tomorrow", "a bit later", "much later"). Forgot is white with a 2px Field Edge border, Got it is the filled Tape Indigo primary. Easy is a wash secondary in ink, so Got it stays the one fill.

### Chips
- **No.N label:** in a save's band, a Label White chip with 5px corners and 6px side padding holds "No.4" in Tape Indigo 800 tabular, followed by the source and author in Label Lavender.
- **Filter tabs:** on collection and All saves screens, a Label White 12px-cornered track with 4px padding holds four equal options (All, New, Reviewed, Applied) at 14px 800. The selected option is filled Tape Indigo with white text at 8px corners and marked as the current page; the others are Label Grey and turn ink on hover.
- **Status switch:** inside a save's control panel, a J-Card Grey 12px-cornered track with 4px padding holds New, Reviewed and Applied at 14px 800. The selected option is a white 8px-cornered tab in ink, or Applied Green with white text when the save is applied; it is marked pressed.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Label White on the J-Card Grey ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** none; rows inside are divided by 1px Faint Rule lines.
- **Internal Padding:** 16px, or 20px for the recall card.
- **Code:** a white panel with a Cassette Ink block on top (16px padding, 14px white monospace text, 1.625 line height, scrolling sideways), then a caption: the language in 800 ink, "∙", and the explanation in Label Grey.

### Inputs / Fields
- **Style:** Label White fill, 2px Field Edge border, 12px corners, 12px by 14px padding, 16px text, Label Grey placeholder, Tape Indigo caret. Selects use the same style at 10px vertical padding. Labels sit above at 14px 600 (or 800 for the one form on a panel: "Save a link", "Rename").
- **Search:** the same field with a 20px search icon inset 14px from the left and 44px of left padding.
- **Focus:** the border turns Tape Indigo over the colour transition; the outline ring is suppressed because the border carries focus.
- **Error / Status:** 14px 600 Signal Red text under the form, announced as an alert; confirmations in Tape Indigo, announced as status.

### Navigation
- **Header band:** every signed-in screen opens with the band: an optional back link or wordmark, the display title, then the guide line in Label Lavender. Inner screens replace the wordmark with a back link (a 20px back chevron plus the parent's name, 14px 600 Label Lavender, Deep Tape on hover). A save's back link names its collection.
- **Phones:** a fixed white bar at the bottom with a 1px Faint Rule top edge and the bottom safe-area inset (at least 10px): Home, Review, Recall, Ask, Settings. Each tab is a 24px icon over a 12px label. Inactive tabs are Label Grey at 600 and turn ink on hover; the active tab is Tape Indigo at 800 and marked as the current page. Home stays active on a save, a collection and All saves.
- **From 768px:** the same bar becomes a 64px top bar with a bottom edge: the wordmark in Tape Indigo at the left, tabs with 20px icons beside 14px labels at the right.
- **Wordmark:** on phones it appears only on Home (white, above "Saves") and on the login band; from 768px it lives in the top bar on every screen and Home's band drops its copy.
- **Icons:** one set on a 24px grid with 2px round strokes and round joins, the same drawing rules as Stride. The Home icon is a cassette.

### Save Row (signature)
A save as one row: title, takeaway, source.
- **Title:** 16px 800, 1.375 line height, the URL when there is no title yet.
- **New:** an unreviewed save carries an 8px Tape Indigo dot at the end of the title line. Nothing else marks it.
- **Takeaway:** 14px Label Grey, clamped to two lines.
- **Source line:** 13px Label Grey: the platform, then (in mixed lists) the collection and its number, joined by "∙". An applied save ends with "∙ applied" in 600 Applied Green.
- **Number:** in a single-collection list, "No.N" stands in a 40px column to the left in 14px 800 tabular Tape Indigo.
- **Arrival:** a save that finished in the last two minutes arrives in place with one short flip (see motion below).

### Tracklist (signature)
Key points and steps as a J-card tracklist in a white panel: a 36px column of zero-padded track numbers in 16px 800 tabular Tape Indigo, the text at 16px with 1.375 line height, and a 48px right-aligned column of running times in 14px 800 tabular Label Grey. Steps leave the time column empty. Review shows the first five key points the same way. The login band shows a three-track sample in Label Lavender numbers on a Deep Tape panel, so the product shows what a save becomes instead of describing it.

### Recording Row and the REC Dot (signature)
- **Recording:** the save or answer being worked on shows a 10px Recording Red dot that breathes (opacity to 35% and back over 1400ms, ease-in-out, looping), beside "Making notes ∙ TikTok" or "Reading your saves…".
- **Waiting:** a queued save or question shows a hollow 10px ring with a 2px Label Grey border and no motion, beside "Waiting for your laptop".
- **Failed:** a 20px Signal Red alert icon replaces the dot, the message turns Signal Red, and a small secondary Retry sits at the end of the row.
- The dot is decorative; the words beside it always state the status.

### Prompt Rows and Try This
- **Prompt rows:** Review and Recall prompts on Home are rows in one panel: a 20px Tape Indigo icon, a Body Strong line ("Review 9 new saves"), a Label Grey reason under it, and a chevron.
- **Try this:** action items sit in a panel, each led by a 20px square with a 2px Tape Indigo border and 6px corners. With a Stride link configured, each item gains "Plan it in Stride" in 14px 800 Applied Green.

### Named Rules
**The One Filled Action Rule.** An action row has at most one filled Tape Indigo button. Its neighbours are secondary (Tape Wash) or quiet.

**The Set-Apart Rule.** Final or destructive actions are quiet buttons centred at the very end of the screen, apart from everything else: "Delete this save" in Signal Red, "Sign out" in Label Grey.

**The Two Motions Rule.** The REC breathe and the arrive flip are the only authored motion. Everything else answers a touch (the 0.97 press, colour transitions, the transcript chevron turning 90°). Reduced-motion preferences switch off all of it: the breathe, the flip, the press scale and its transitions, and the chevron's turn transition.

## Do's and Don'ts

### Do:
- **Do** set notes as a tracklist: zero-padded numbers in a 36px Tape Indigo column, the text, and running times right-aligned in a 48px column.
- **Do** write a save's number as "No.N" with no space, and in a mixed list only after its collection: "Software Architecture ∙ No.2".
- **Do** join meta parts with U+2219 "∙" and a space either side: "9 new to review ∙ 1 recording ∙ 1 waiting".
- **Do** set every number, count and time in Overpass 800 with tabular figures.
- **Do** show "the laptop is working on this" with the breathing 10px REC dot, and "waiting for the laptop" with a still hollow 2px Label Grey ring, always next to words that say the same.
- **Do** keep one filled Tape Indigo button per action row; make its neighbours secondary or quiet.
- **Do** open every signed-in screen with the indigo band: a back link (or the wordmark on Home), the display title, and a one-line guide.
- **Do** give every tappable element the press response: scale 0.97 over 160ms, removed under reduced motion.
- **Do** keep focus visible: a 3px Tape Indigo outline at 2px offset, white inside the band; text fields show focus with a Tape Indigo border.
- **Do** keep product words plain: saves, collections, Review, Recall, Ask.

### Don't:
- **Don't** use Recording Red for anything but the REC dot: not for errors, badges, text or fills.
- **Don't** use the U+00B7 middle dot as a separator; it sits off-centre in Overpass.
- **Don't** write "No. 4", "#4" or "No 4".
- **Don't** add eyebrow or kicker labels above headings, and don't set uppercase or letter-spaced labels.
- **Don't** add drop shadows, glows, blurs or gradients.
- **Don't** turn saves into a thumbnail card feed.
- **Don't** rename features into cassette jargon; the world lives in type, palette and the tracklist.
- **Don't** put a second filled button (Tape Indigo or Applied Green) in an action row.
