# Design

The world is a **modern financial console** — the kind of surface a figure that moves is read
off every day. The page is a pale periwinkle ground; the content sits on white cards that
float above it; black is the only accent strong enough to be an action, and exactly one card
per page is allowed to be black.

It replaced a printed-manifest build whose entire system was the opposite of this one: no
shadows at all, square corners, three type families split by semantics, and a tight,
non-doubling spacing scale. That world is gone, not partially retuned — the token file, the
Tailwind preset, every primitive and every page were rewritten together, which is why the
rules below hold without exception rather than mostly.

## Four rules

1. **Elevation is a shadow, not a rule.** A card is separated from the ground by a wide, soft,
   low-opacity shade and carries no border at all. A hairline only ever divides content
   *inside* a card — `divide-rule` between log entries, the rule above a triage row. A card
   with both a border and a shadow is a review rejection.
2. **Corners are generous.** 20px on cards, 12px on controls and fields, 8px on chips, full on
   pills. Nothing in the interface has a square corner.
3. **Black is the accent.** Every colour in the palette carries meaning, which leaves black as
   the only thing available to mark an action. The primary button, the pressed filter pill, the
   tally bars, the brand mark and the one feature card are ink.
4. **Colour is still semantic.** Green, red and indigo mean in scope, beyond scope and needs
   attention. None of the three is ever spent decoratively. Pending has no colour at all — it
   is neutral grey, because an untriaged request must not borrow the authority of a verdict it
   has not been given (T6).

## Colour

Defined once in `packages/ui/src/tokens.css`, mapped to utilities in `tailwind-preset.js`.
No arbitrary values in components: `text-[#121218]` is a review rejection, `text-ink` is the
only way to write it.

| Token | Hex | Role |
|---|---|---|
| `stock` | `#EEEFF8` | Page ground — pale periwinkle, cool, barely saturated |
| `stock-2` | `#E3E4F0` | Recessed fills: chart tracks, inset cells, neutral chips |
| `sheet` | `#FFFFFF` | The card |
| `ink` | `#121218` | Headings, figures, the black card — 18.7:1 on sheet |
| `ink-2` | `#26262F` | The hover state of anything that is ink |
| `pencil` | `#636375` | Captions, metadata, timestamps — 5.9:1 on sheet |
| `pencil-2` | `#808094` | Placeholders and disabled only; never load-bearing prose |
| `rule` / `rule-soft` | `#E5E5EF` / `#EEEEF5` | Hairlines, inside a card only |
| `signal` | `#4A41D8` | Focus, links, needs quote — 6.9:1 on sheet |
| `clear` | `#107A48` | In scope — 5.4:1 on sheet |
| `over` | `#C62B2B` | Beyond scope — 5.6:1 on sheet |

Verdict chips are a soft tint of their own colour (`wash-clear`, `wash-over`, `wash-signal`)
with **no border**. Pending uses `wash-pending`, a neutral grey.

Every ratio above is computed, not estimated, and each of `signal`, `clear` and `over` clears
AA on all three of its grounds — the sheet, the page, and its own wash.

**Colour never carries meaning alone.** Every scope state pairs its colour with a written
label, so the record survives greyscale, print and colour-blind reading.

### The black card

One element per page may be ink, and it is whatever that page is actually about — here, the
hours standing against the agreement. It carries its own palette, measured against `--ink`
rather than against the sheet: `on-ink` (18.7:1), `on-ink-soft` (8.1:1), `clear-on-ink`
(10.7:1), `over-on-ink` (7.4:1), plus the track and rule alphas. Anything placed inside it has
to opt in — `Meter` and `MeterLegend` take `tone="ink"`, `SheetHead` takes `onInk`.

## Type

**One face: Plus Jakarta Sans**, loaded through `next/font` as a variable font, subset to
latin. Weight and size do the work three families used to: 800 for figures, 600–700 for
headings and actions, 500 for metadata, 400 for prose. It is geometric with open counters,
which keeps a 34px total legible and an 11px chip readable without a second family being
brought in to rescue either.

There is deliberately **no `font-mono` and no `font-narrow`** in the preset. Adding a family
back is a design-system change, not a component decision. Measured values are distinguished by
`.tabular` instead of by family — which is the part that was ever load-bearing, since the
requirement was always that columns hold as numbers change, not that numbers look technical.

Scale (`fontSize` in the preset): `label` 11 · `stamp` 11 · `meta` 12 · `ref` 12 · `body` 14 ·
`entry` 15 · `lead` 16 · `head` 17 · `title` 28 · `figure` 34.

Labels are **sentence case**. The old world printed its labels in narrow uppercase with wide
tracking because a form has a pre-printed voice; this one does not — everything on screen is
written in the same voice, and an uppercase micro-label here reads as a leftover.

## Space and edges

Spacing is a clean 4px ramp (4, 6, 8, 12, 16, 20, 24, 32, 40, 56, 72). Cards carry 24px of
padding and sit 24px apart, which is what makes the ground visible between them — and the
ground being visible is the whole reason the cards read as lifted.

Radii: `sm` 8 · `control` 12 · `lg` 16 · `card` 20 · `xl` 24 · `full`.

**There is a `boxShadow` scale, and it is short**: `card`, `raised`, `float`, `ink`, `focus`.
Reaching for a shadow outside it is a design-system change.

## Controls

Everything a person can click or type into is **44px tall with a 12px radius**:
buttons, links that act like buttons, filter toggles, inputs and selects alike. 44 is the
touch-target minimum, so the default size is the accessible one and nobody has to remember
it. The single exception is the four controls inside a log entry's triage row, which stand at
38px because they sit four-across under an entry rather than on their own.

A field uses an exact `height`, not a `minHeight`. A minimum is only a floor: with vertical
padding on top of it, a 14px input computed out at 48px and a select at 46px while the button
beside them sat at 44 — close enough to look like a mistake rather than a distinction.

`Button`, `ButtonLink` and `FilterChip` in `packages/ui/src/primitives.tsx` are the only places
these numbers appear, and `CONTROL_MD` / `CONTROL_SM` are exported so the fields can stand
exactly as tall as the buttons beside them. **A hand-rolled control in an app is a review
rejection**: the first pass of this theme shipped six copies of button styling across the two
apps, which drifted into five heights (40, 42, 44, 46 and one that just took whatever its
padding gave it) and three radii. "Export CSV" was a 44px anchor in the ledger and a 40px
button in the public tool — the same action wearing two faces.

Three variants, and no more: `primary` (ink, the one strong action), `ghost` (the same shape in
white) and `quiet` (type alone, for an action that sits inside a line of text — Sign out,
Close, Remove — which were otherwise four divergent hand-rolled underline styles).

Non-interactive labels are `Badge` and `Tag`: 8px radius, never 12 and never a pill, because a
word *about* something must not look like something to press.

## Components

- **`Sheet`** — the white card: `rounded-card shadow-card`, no border. The page's structure.
- **`InkSheet`** — the feature card, in ink. Exactly one per page.
- **`SheetHead`** — a card's name and whatever acts on it, on one line, with no divider beneath;
  the padding is what separates it from the content.
- **`ReadoutCell` / `ReadoutRow`** — one figure per card: a glyph tile marking what is being
  counted, the number at 34px extrabold, the caption beneath. The row's column count follows the
  number of cells, so the client view's two figures fill their row rather than stranding half of
  an empty one.
- **`RequestCard`** — one *entry*, not a card. Entries are rows inside the log's card, divided
  by hairlines, so a hundred requests read as one list. The ref leads as a soft neutral chip,
  the title is the headline, and the verdict is the chip on the right. An entry never wears a
  coloured edge.
- **`Tag`** — a soft verdict chip: a tint of its colour, no border, settling in rather than
  popping.
- **`Meter`** — the signature element and the one place boldness is spent. A measuring scale,
  not a progress bar: one soft-capped band with faint quarter marks and printed decile figures.
  The contract line overshoots the track at both ends and carries a floating label chip; whether
  the fills have passed it is the entire question.
- **`FilterChip`** — a toggle; the pressed one is solid ink. Same height and radius as a
  `Button`, differing only in the pressed state.
- **`Button` / `ButtonLink`** — every action in the interface, in three variants.
- **`Badge`** — a non-interactive label, sharing the verdict chip's radius and scale.
- **`Mark`** — the brand square. Lives in the package because it appeared in four places as
  four identical copies, which is three chances for it to drift between surfaces.
- **`IconTile`** — a rounded tile holding one glyph. Decorative by definition: every tile has a
  written caption, and no glyph is the only carrier of any meaning.

## Motion

Soft and quick: things settle in rather than snapping. A chip lands at 160ms (`pop-in`), a log
entry files in at 240ms (`row-in`), the toast at 240ms, and hover transitions run 200ms on
`--ease-soft`. The meter's fills move at 500ms on `--ease-out`, because watching the bar move
*is* how the change registers.

`prefers-reduced-motion: reduce` disables everything — off, not reduced.

The meter animates `width`/`left` rather than a transform, deliberately: each segment carries a
pixel minimum so a single beyond-scope hour stays visible (M6), and a transform would scale that
minimum away. The cost is bounded with `contain: layout paint`.

## Browser surfaces

Themed from the palette, because the parts we did not draw still carry the design: text
selection, caret, `accent-color`, the scrollbar (thin, rounded, on a transparent track), and
link underline offset.

Focus is declared **once**, globally, in each app's `globals.css`: a 2px `signal` outline,
offset 2px, with `border-radius: inherit` so it follows the control's own corners. Doing it
there rather than per-component means it lands on every focusable thing in the interface,
including the ones nobody remembered to style. Inside `.on-ink` the outline switches to white,
because indigo has nothing to separate it from black.

## Cross-surface

The public tool is the same console with the money boxes simply not shown — same ground, same
cards, same black meter, fewer fields. Both apps import `tokens.css`, the Tailwind preset and
every primitive from `packages/ui`, so the system is defined once.

## Verified

Both apps build clean and typecheck clean. Checked in a real browser at 1440px and at a true
390px viewport, signed in and driving the actual forms: `scrollWidth === clientWidth` with zero
overflowing elements at both. The contrast ratios above are computed. The meter was exercised
with all three segments non-zero, so the pending fill's separation from its track is observed
rather than assumed.
