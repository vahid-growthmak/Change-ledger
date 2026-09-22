# Design

The world is a **shipping manifest** — the multi-part carbon document that is counted at
handover and settles the dispute afterwards. That is what Change Ledger is, so the interface
is the document rather than a console reporting on one.

It replaced a build that had drifted into the SaaS admin vocabulary the PRD explicitly ruled
out (line 358: "instrumentation … rather than the SaaS dashboard vocabulary of gradient cards
and rounded pill statistics"). The old look is anti-reference, not authority.

## Three rules

1. **Elevation is declared once, as a printed rule.** There are no shadows in the token file
   and none in any component. The previous build shipped a 1px border *under* a soft shadow —
   the ghost card — and that is the thing this world most deliberately refuses.
2. **Ink is semantic.** Green, red and purple mean in scope, beyond scope and needs attention.
   None of the three is ever spent decoratively. If something is green here, it is in scope.
3. **Pending has no ink at all.** It hatches. An untriaged request must not borrow the visual
   authority of a verdict it has not been given (T6).

## Colour

Defined once in `packages/ui/src/tokens.css`, mapped to utilities in `tailwind-preset.js`.
No arbitrary values in components: `text-[#1A1815]` is a review rejection, `text-ink` is the
only way to write it.

| Token | Hex | Role |
|---|---|---|
| `stock` | `#E9E7E0` | Page ground — document stock: warm, low-chroma, slightly green |
| `stock-2` | `#E1DED5` | Recessed cells, block headers, inset fills |
| `sheet` | `#FCFCFA` | The writing surface: inputs, the log, raised blocks |
| `ink` | `#1A1815` | Body, values, headings — 14.0:1 on stock |
| `pencil` | `#5F5A52` | Labels, metadata, timestamps — 5.6:1 on stock |
| `pencil-2` | `#8A857B` | Placeholders and disabled only; never load-bearing prose |
| `rule` / `rule-soft` / `rule-ink` | `#C9C4B8` / `#DDD9CF` / `#1A1815` | Pre-printed rules, hairlines, the title block's own rules |
| `signal` | `#4A3C8C` | Indelible copying pencil — focus, links, needs quote — 8.8:1 on sheet |
| `clear` | `#1F6F4A` | In scope — 6.0:1 on sheet |
| `over` | `#B3302A` | Beyond scope — 6.1:1 on sheet |

Stamped boxes carry the faintest wash of their ink (`wash-clear`, `wash-over`, `wash-signal`)
plus a 1px rule *of that ink* — never a soft tinted pill on white. Pending uses `.hatch`.

**Colour never carries meaning alone.** Every scope state pairs its ink with a written label,
so the record survives greyscale, print and colour-blind reading.

## Type

Three faces, three jobs — the real distinction between what a form prints and what is written
into it. All loaded through `next/font`, subset to latin.

- **Archivo** — interface prose, headings, entry titles. Written by a person.
- **Archivo Narrow** — pre-printed labels, stamps, tabs. Uppercase, `tracking-label`/`tracking-stamp`.
- **Courier Prime** — every value that was measured, counted or machine-assigned: request
  refs, hours, money, timestamps, counts, scale graduations.

**The mono assignment is semantic, not textural.** If a value is measured or machine-assigned
it is Courier; if a person wrote it, it is Archivo. Request titles are Archivo, request refs
are Courier. Monospace as a costume for "technical" is a review rejection. Measured values
carry `.tabular` so columns hold as numbers change.

Scale (`fontSize` in the preset): `label` 10 · `stamp` 10 · `meta` 12 · `body` 14 ·
`entry` 15 · `figure` 19 · `ref` 22 · `title` 30.

## Space and edges

Spacing is tight and non-doubling (4, 6, 9, 12, 16, 20, 26, 32, 44, 64) so rows meet on their
rules rather than drifting apart on margins. Radii top out at 3px — a form has no pills; `sm`
(2px) and `control` (3px) exist only so interactive controls read as touchable. `full` is
reserved for the one true circle.

**There is no `boxShadow` scale.** Adding one is a design-system change, not a component
decision.

## Components

- **`Sheet` / `SheetHead`** — the writing surface and the ruled strip that names the block
  beneath it. Replaces cards as the page's structure.
- **`RequestCard`** — one *entry*, not a card. Entries tile hairline to hairline inside a
  `Sheet` whose `divide-y` rules separate them, so a hundred requests read as one document.
  The ref is the headline; the verdict is stamped in a right-hand column. An entry never
  wears a coloured edge.
- **`Tag`** — a stamped verdict: ruled box in the ink itself, condensed caps, landing rather
  than fading.
- **`Meter`** — the signature element and the one place boldness is spent. A measuring scale,
  not a progress bar: an unbroken full-width ruled band with graduated ticks and printed
  decile figures. The contract line is the only 2px ink rule in the interface.
- **`ReadoutRow` / `ReadoutCell`** — the title block: boxed cells meeting on shared rules,
  values at field scale. Deliberately **not** the hero-metric arrangement (a big number over a
  small caption) the previous build used.
- **`FilterChip`** — index tabs meeting on their rules (`-ml-px`); the pressed tab is solid ink.

## Motion

One authored moment: **the stamp landing** — `stamp-land`, 90ms, `--ease-stamp`, no bounce.
Entries file in at 220ms. The meter's fills move at 450ms because watching the bar move *is*
how the change registers. Nothing else animates; in an interface about accuracy, motion reads
as latency. `prefers-reduced-motion: reduce` disables everything — off, not reduced.

The meter animates `width`/`left` rather than a transform, deliberately: each segment carries
a pixel minimum so a single beyond-scope hour stays visible (M6), and a transform would scale
that minimum away. The cost is bounded with `contain: layout paint`.

## Browser surfaces

Themed from the palette, because the parts we did not draw still carry the design: text
selection, caret, `accent-color`, the scrollbar (thin, `rule` thumb on a `stock` border),
focus rings (2px `signal`, 2px offset, square), and link underline offset.

## Cross-surface

The public tool is the same document with the money boxes simply not carbon-copied through —
same stock, same rules, fewer fields. Both apps import `tokens.css`, the Tailwind preset and
every primitive from `packages/ui`, so the system is defined once.

## Verified

Checked at a true 390px and 320px viewport and at 1440px via CDP device metrics:
`scrollWidth === clientWidth`, zero overflowing elements at all three. The mechanical design
detector reports clean. Contrast ratios above are computed, not estimated.
