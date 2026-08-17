# Change Ledger — Product Requirements

**Product:** Change Ledger
**Owner:** Growthmak Delivery
**Status:** v1 prototype validated · Next.js build specified
**Stack:** Next.js 15 (App Router) · TypeScript · Postgres · Vercel
**Last updated:** 17 August 2026

---

## In one line

A shared ledger where the client logs every change they ask for, Growthmak marks whether it sits inside the agreed scope, and both sides watch the same number move.

---

## The problem

Growthmak sells two engagements that fail in opposite directions, and neither has a system to catch it.

**Foundation Build is fixed scope over 4–8 weeks.** The deliverable list is agreed before work starts. Every request that arrives after that point either eats margin or gets billed — and today there is no artifact that establishes which. The conversation happens at the end, from memory, against a client who remembers the project differently.

**Growth Marketing is a monthly retainer with a three-month minimum.** Here the risk is not billing, it is capacity. Requests arrive faster than a month's hours can absorb them, and the team discovers this in week four rather than week one.

Both problems have the same root cause: **requests arrive through channels that do not count.** WhatsApp, email threads, calls, comments in a shared doc. Nothing aggregates. Nobody can answer "how many changes have we asked for?" without an afternoon of scrolling.

This is sharper for Growthmak than for most agencies because of geography. Nine markets — United States, Canada, United Kingdom, Australia, New Zealand, UAE, Saudi Arabia, Qatar, Kuwait, India — means most requests arrive while the delivery team is asleep, stripped of the context a live conversation would have supplied.

### What this is not

This is not a scope-policing tool, and it must never read as one. Growthmak's positioning rests on transparent reporting, and client reviews name that specifically. The same data framed as a gotcha damages the relationship the agency is built on. Framed as a live, shared record, it strengthens it. **The client should be able to see the cost number before Growthmak sends the invoice, not after.**

---

## Two products, one codebase

The ledger ships as two surfaces with deliberately opposite requirements. Conflating them is the main architectural risk.

| | **Public Ledger** | **Client Ledger** |
|---|---|---|
| Where | `growthmak.com/tools/change-ledger` | `ledger.growthmak.com` |
| Who | Anyone — agencies, in-house marketers | Growthmak clients and delivery team |
| Purpose | Lead magnet, SEO surface, proof of method | Live commercial record |
| Persistence | Browser-local only, no account | Postgres, per-project |
| Auth | None | Magic link (client) · Google Workspace (team) |
| Indexed | Yes, aggressively | Never — `noindex` enforced at middleware |
| Data | Nothing leaves the browser | Rates, hours, cost |
| Release cadence | With marketing site | Independent |

**Why they cannot live on the same domain.** The client surface holds rate and cost data and must not be indexed; a single missed `noindex` on a marketing-site route is a real exposure. It also needs to deploy on its own cadence — a bug fix in the ledger should not require redeploying the site that generates pipeline, and a marketing deploy should never be able to take down a live client record.

**Why they should share a codebase.** The interface is identical; only persistence and auth differ. A monorepo with a shared UI package means the design system is defined once and the public tool doubles as a live demo of the paid one.

---

## Goals

| # | Goal | How we know it worked |
|---|---|---|
| G1 | Produce one unambiguous count of requested changes, visible to both sides | Client and delivery lead quote the same number without checking with each other |
| G2 | Establish scope status at the moment of request, not at invoice | Median time from request logged to scope verdict under 24 hours |
| G3 | Make requests submittable in under 30 seconds by a non-technical founder | Client logs their second request without being asked to |
| G4 | Reduce change requests arriving through WhatsApp and email | Under 20% of requests still arriving off-channel by week four |
| G5 | Surface which Growth Engine layer attracts the most change | Layer distribution referenced in at least one renewal or upsell conversation |
| G6 | Public tool earns qualified attention | 200+ monthly sessions and 20+ email captures by month three |

## Non-goals

- **Not a project manager.** No assignees, due dates, dependencies, or sprints.
- **Not a bug tracker for engineers.** No reproduction steps, environment fields, or severity matrices.
- **Not a communication channel.** No threaded comments or chat. Discussion happens on calls; this records outcomes.
- **Not an invoicing system.** It produces the number that informs an invoice. It does not issue one.
- **Not a client portal.** It does not host deliverables, files, reports, or credentials.
- **No real-time collaboration.** Polling on focus is sufficient; websockets are not warranted at this concurrency.

Every one of these, added, turns a 30-second tool into Jira. Adoption is the whole product. A tool the client abandons in week two has negative value, because it creates the appearance of a record where none exists.

---

## Users

### The client — a founder or marketing lead, non-technical

Submits at odd hours from their own timezone, often on a phone, often having just noticed something. Will not learn a taxonomy. Will not fill in seven fields. Will not create a password.

**Their job:** get the request out of their head and into a place that counts it.

### The Growthmak delivery lead

Reviews a queue each morning across several projects, decides what is covered and what is not, estimates effort, keeps clients informed without a meeting. Needs a defensible record months later.

**Their job:** classify quickly, and let the record make the commercial argument so they don't have to.

### The Growthmak principal

Does not use the tool daily. Wants a cross-project view: which engagements are running past scope, and by how much.

**Their job:** see the pattern before it becomes a margin problem.

---

## Requirements

### Layer 1 — Capture

| ID | Requirement | Priority |
|---|---|---|
| C1 | The client can log a request with a single required field: a plain-language description | Must |
| C2 | Kind of change: Bug, Design change, Content, New feature, Ads & creative, Other | Must |
| C3 | Location field — page, campaign, or asset | Must |
| C4 | Optional: detail, external link | Must |
| C5 | Each request receives a per-project sequential human-readable ID (GM-001) | Must |
| C6 | Submission timestamped in UTC, displayed in client market time and India time | Must |
| C7 | Requester captured from session, not typed | Must |
| C8 | Image and file attachment, stored in blob storage | Should — v1.1 |

**C1 is the load-bearing requirement.** Every additional required field measurably reduces the chance a request gets logged at all rather than sent by WhatsApp. Any future proposal to add a required field must be argued against this line.

**C8 is the main upgrade Next.js unlocks.** The prototype could not accept uploads, forcing clients to paste Loom links. Direct paste-to-upload of screenshots removes the last real reason to use WhatsApp instead. It is Should rather than Must only because it must not delay the pilot.

### Layer 2 — Triage

Server-enforced: mutation is rejected unless the session role is `team`.

| ID | Requirement | Priority |
|---|---|---|
| T1 | Scope verdict: In scope, Beyond scope, Needs quote, or unset (Pending review) | Must |
| T2 | Growth Engine layer: Foundation, Traffic, Conversion, Operations, Social Proof | Must |
| T3 | Effort estimate in hours, half-hour increments | Must |
| T4 | Status: New, Reviewed, In progress, Done, Won't do | Must |
| T5 | All four editable inline with optimistic update and rollback on failure | Must |
| T6 | Unset scope renders as "Pending review" — never as "In scope" by default | Must |
| T7 | Every triage change written to an append-only audit trail | Must |

**T6 is a correctness requirement, not a display preference.** An untriaged request must never be silently counted as covered. Same principle as the audit skill's rule on skipped layers: not looked at is not the same as fine. Unreviewed hours render as hatched fill on the meter — visibly not yet counted either way.

**T7 exists because the ledger's value is evidential.** If a scope verdict can be changed months later with no record, the document stops being defensible in exactly the conversation it was built for. The trail is not shown by default; it is retrievable.

### Layer 3 — The meter

The signature element and the reason the tool exists.

| ID | Requirement | Priority |
|---|---|---|
| M1 | Horizontal hours bar with a hard contract line marking agreed hours or monthly capacity | Must |
| M2 | Three fills: in-scope (green), pending review (hatched), beyond scope (orange) | Must |
| M3 | Bar auto-scales so beyond-scope hours remain visible past the line | Must |
| M4 | Four-figure readout: requests logged, beyond scope, extra hours, additional cost | Must |
| M5 | Additional cost = beyond-scope hours × configured rate, computed server-side | Must |
| M6 | Readout figures turn orange once beyond-scope is non-zero | Must |
| M7 | Totals derived from a single query, never assembled client-side | Must |

**M5 and M7 are server-side by requirement, not convenience.** The cost figure is commercially consequential; it must not be computable or alterable from the browser, and both parties must be reading a number produced by the same code path.

### Layer 4 — Operations

| ID | Requirement | Priority |
|---|---|---|
| O1 | Mode per project: Foundation Build (fixed scope) or Growth Marketing (retainer) | Must |
| O2 | Per-project config: client, project, contracted hours or monthly capacity, rate, currency, client market | Must |
| O3 | Currencies covering all nine served markets | Must |
| O4 | Filter by pending review, beyond scope, still open, or kind of change; free-text search | Must |
| O5 | CSV export of the full log with both timestamp columns | Must |
| O6 | Distribution charts by kind of change and by Growth Engine layer | Should |
| O7 | Retainer mode: monthly period boundaries, meter resets each cycle, history retained | Must |
| O8 | Team dashboard listing all projects with scope status at a glance | Should |
| O9 | Weekly digest email to the client: what was logged, what was triaged, where the meter sits | Could — v1.2 |

**Mode changes the meaning, not the data.** Foundation Build reads the line as contracted scope and the overage as billable. Growth Marketing reads the same line as monthly capacity and the overage as a staffing conversation. One schema, two arguments.

**O7 moves to Must in this version.** The prototype could not do periods; without them retainer mode reports a meaningless lifetime total.

### Layer 5 — Signal

The layer tagging in T2 is the part that separates this from any generic tracker, and it is deliberate.

Tagging every request to one of the five Growth Engine layers does three things at once: it reinforces the model in every client interaction rather than being neutral admin; it converts the log into a diagnostic — a client whose requests cluster 60% in Conversion is telling you where their real problem sits; and it produces evidence for the next engagement that was gathered as a by-product of delivery rather than assembled for a pitch.

The distribution chart is the deliverable. It should be read at each monthly review, not left to accumulate.

### Layer 6 — Access

| ID | Requirement | Priority |
|---|---|---|
| A1 | Client signs in by magic link — no password, no registration | Must |
| A2 | Team signs in with Google Workspace, restricted to the growthmak.com domain | Must |
| A3 | A client session can read and write only its own project | Must |
| A4 | Role is resolved server-side per request; the client bundle never decides permission | Must |
| A5 | Delivery can invite additional client-side users to a project by email | Should |
| A6 | Sessions expire after 30 days; magic links after 15 minutes, single use | Must |
| A7 | All `ledger.growthmak.com` routes return `noindex`, enforced in middleware | Must |

**A1 is a product requirement, not a security one.** A password is a reason not to file a request. The client should reach their ledger from an emailed link in one tap, on a phone, at 11pm.

**A4 restates a rule the prototype could not enforce.** The Client/Growthmak view switch was presentation only. Here the boundary is real: triage mutations and rate data are gated server-side, and the client bundle is never trusted to hide anything that matters.

---

## Data model

Postgres. Four tables. Money stored as integer minor units — never float.

```sql
-- Projects
id            uuid pk
slug          text unique          -- ledger.growthmak.com/acme-build
client_name   text not null
project_name  text not null
mode          project_mode not null              -- foundation | retainer
contracted_hours   numeric(6,1) not null         -- or monthly capacity
rate_minor    integer not null                   -- 4500 = $45.00
currency      char(3) not null
client_tz     text not null                      -- IANA, e.g. America/Chicago
started_on    date not null
archived_at   timestamptz
created_at    timestamptz default now()

-- Requests
id            uuid pk
project_id    uuid fk → projects on delete cascade
ref           text not null                      -- GM-001, unique per project
title         text not null
type          request_type not null
location      text
detail        text
link          text
attachments   jsonb default '[]'
layer         growth_layer                       -- null = untagged
scope         scope_verdict                      -- null = pending review
hours         numeric(5,1)
status        request_status not null default 'new'
period        date                               -- retainer cycle, first of month
requested_by  uuid fk → users
created_at    timestamptz default now()
updated_at    timestamptz

unique (project_id, ref)
index (project_id, scope), (project_id, status), (project_id, period)

-- Users
id            uuid pk
email         citext unique not null
name          text
role          user_role not null                 -- team | client
created_at    timestamptz default now()

-- Project members
project_id    uuid fk
user_id       uuid fk
primary key (project_id, user_id)

-- Audit trail (append only)
id            bigserial pk
request_id    uuid fk
actor_id      uuid fk → users
field         text not null
from_value    text
to_value      text
at            timestamptz default now()
```

**Enums**

```
project_mode    foundation | retainer
request_type    bug | design | content | feature | ads | other
growth_layer    foundation | traffic | conversion | operations | social_proof
scope_verdict   in_scope | beyond_scope | needs_quote
request_status  new | reviewed | in_progress | done | wont_do
user_role       team | client
```

**Notes on shape.** `scope` and `layer` are nullable by design — null *is* pending review, and there is no default value that could accidentally read as covered (T6). `period` is stamped at insert for retainer projects and left null for fixed-scope, which keeps the meter query identical across both modes with a single predicate. `ref` is generated in the same transaction as the insert, against a per-project count, so two simultaneous submissions cannot collide on GM-007.

---

## Architecture

### Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Already the house stack — the marketing site and client builds run on it |
| Hosting | Vercel | Already in use; preview deploys per PR |
| Database | Postgres (Neon or Railway) | Both already in the stack; relational fits the four-table shape exactly |
| ORM | Drizzle | Typed schema, SQL-shaped, no generated client to keep in sync |
| Auth | Auth.js — magic link + Google | Covers both roles without a vendor |
| Email | Resend | Magic links, weekly digest |
| Files | Vercel Blob | Attachments (C8) |
| Styling | Tailwind, tokens from the design system | Values below map 1:1 to `tailwind.config` |
| Validation | Zod, shared client and server | One schema, both sides |
| Charts | Hand-built SVG | The meter is bespoke; a chart library would be more code, not less |

**No state management library.** Server Components fetch, Server Actions mutate, `useOptimistic` handles inline triage. Anything more is unnecessary at this scale.

### Repository

```
growthmak-ledger/
├── apps/
│   ├── ledger/          → ledger.growthmak.com   (auth, Postgres)
│   └── public-tool/     → embedded in marketing  (localStorage only)
├── packages/
│   ├── ui/              → design system, meter, cards, tokens
│   ├── core/            → scope maths, formatting, Zod schemas
│   └── db/              → Drizzle schema + migrations
```

`packages/core` holds every calculation that produces a number a client will see. It is imported by both apps and unit-tested independently, so the public tool and the paid one can never disagree about what "extra hours" means.

### Routes

**Client Ledger — `apps/ledger`**

```
/                          → project list (team) or redirect to own project (client)
/[slug]                    → the ledger: readout, meter, list
/[slug]/settings           → project config (team only)
/[slug]/export             → CSV stream (team only)
/login                     → magic link request
/api/auth/[...nextauth]
```

**Server Actions:** `createRequest`, `triageRequest`, `updateProject`, `inviteMember`, `archiveProject`. Every one revalidates its project tag and re-checks role server-side before touching the database.

### Rendering

The ledger page is a Server Component. Totals come from one aggregate query (M7); the request list from a second. The submit form and the triage row are the only Client Components on the page.

Inline triage uses `useOptimistic` — the select updates instantly, the action runs, and a failure rolls the value back and surfaces an inline error rather than a toast. Toasts are for confirmations; a failed write is a decision the person needs to see.

### Security

- Role resolved from the session on every request. `A4` is enforced in a shared `requireTeam(projectId)` guard called at the top of each privileged action, not in the component tree.
- `rate_minor` is never serialised into a client payload on the client-facing view — the computed cost is, the rate is not.
- Middleware sets `X-Robots-Tag: noindex, nofollow` on every response from the ledger subdomain (A7).
- Magic links single-use, 15-minute expiry, rate limited per email.
- All user text escaped at render; links rendered with `rel="noopener nofollow"`.

### Environment

```
DATABASE_URL
AUTH_SECRET
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
AUTH_ALLOWED_DOMAIN=growthmak.com
RESEND_API_KEY
BLOB_READ_WRITE_TOKEN
NEXT_PUBLIC_APP_URL=https://ledger.growthmak.com
```

---

## Design system

### Direction

Growthmak's proposition is measurement, so the interface borrows from **instrumentation** — a laboratory readout, a metered gauge — rather than from the SaaS dashboard vocabulary of gradient cards and rounded pill statistics. Light, precise, tabular. The client should feel they are reading an instrument, not browsing an app.

This direction is a constraint, not a mood board. It rules things out: no gradients, no shadows used decoratively, no illustration, no icon set, no colour used for personality rather than meaning. Every visual decision below traces back to it.

**Spend the boldness in one place.** The meter is the memorable element. Everything around it stays quiet so the meter can carry the argument.

---

### Colour

Seven tokens. No value enters the interface that is not on this list.

| Token | Hex | Role | Where it may be used |
|---|---|---|---|
| `paper` | `#F7F7F5` | Page ground | App background, inset field fills |
| `card` | `#FFFFFF` | Raised surface | Panels, cards, form containers |
| `ink` | `#14161A` | Primary | Body text, contract line, primary button, active toggle |
| `mute` | `#6B7079` | Secondary | Labels, metadata, timestamps, placeholder text |
| `rule` | `#DFDFDA` | Boundary | All hairlines, borders, dividers |
| `signal` | `#2F4FE0` | Attention | Focus rings, links, "Needs quote" |
| `clear` | `#157F5B` | Confirmed covered | "In scope" fill, tag, card edge |
| `over` | `#C2410C` | Beyond agreement | "Beyond scope" fill, tag, card edge, breached figures |

**Tinted backgrounds** for tags only, derived from the semantic three: `#E4F2EC` (clear), `#FBEAE0` (over), `#E6EAFC` (signal), `#EDEDE9` (pending).

**Pending review** has no colour. It renders as a diagonal hatch — `repeating-linear-gradient(-45deg, #C7C7C1 0 4px, #E7E7E2 4px 8px)`. This is deliberate and load-bearing: an untriaged request must not borrow the visual authority of either verdict. Hatch reads as *not yet measured*, which is exactly what it is. It is the visual form of requirement T6.

**Semantic discipline.** `clear`, `over` and `signal` carry meaning and may never be used decoratively. If something is green in this interface, it is in scope. Nothing else.

**Contrast.** Body `ink` on `paper` is 15.8:1. `mute` on `card` is 4.9:1 — passes AA for the small sizes it appears at. `over` on its tint is 4.6:1. All interactive text meets AA. **Colour never carries meaning alone**: every scope state pairs its colour with a written label, so the meter and the cards remain legible to colour-blind readers and in print.

---

### Type

Two families, one superfamily. **IBM Plex Sans** for interface prose, **IBM Plex Mono** for every number, label, identifier and timestamp.

The reasoning is not stylistic. Plex was drawn for technical documentation and instrument interfaces, so it carries the direction natively rather than by association. The mono set supplies tabular figures — counts and hours hold column alignment as they change, which a proportional face cannot do. In a tool whose entire purpose is a number that moves, that is a functional requirement.

**Mono is a semantic assignment, not a texture.** If a value is measured, counted, or machine-assigned, it is mono. If it is written by a person, it is sans. Request titles are sans. Request IDs are mono. That rule holds everywhere with no exceptions.

| Role | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Readout figure | Mono | 31px / 26px mobile | 500 | −0.03em | The four headline numbers |
| Project title | Sans | 26px / 21px mobile | 600 | −0.025em | Client and project name |
| Panel heading | Sans | 15px | 600 | −0.01em | Form and settings headings |
| Request title | Sans | 14.5px | 500 | 0 | What the client wrote |
| Body | Sans | 13px–13.5px | 400 | 0 | Detail text, hints, inputs |
| Field label | Mono | 9.5px | 400 | 0.12em, uppercase | Every form label |
| Panel label | Mono | 9.5px | 400 | 0.13em, uppercase | Readout and section labels |
| Metadata | Mono | 10.5px | 400 | 0.05em | IDs, type, layer, status |
| Timestamp | Mono | 10px | 400 | 0 | Dual-timezone line |
| Tag | Mono | 9px | 400 | 0.11em, uppercase | Scope tags |
| Brand rule | Mono | 11px | 400/600 | 0.16em, uppercase | Masthead |

**Line height:** 1.15 on display, 1.4 on titles, 1.55 on body prose, 1.7 on stacked metadata.

Uppercase appears only at 11px and below, always with generous tracking, always in mono, always on labels — never on content. Uppercase is how the interface marks *this is a label for something*, and that meaning breaks if it is used for emphasis.

---

### Space, edges, surface

**Spacing scale:** 4 · 6 · 9 · 13 · 16 · 22 · 26 · 34 px. Non-doubling by design — a 4pt grid produces even rhythm, and this interface wants slightly compressed, instrument-panel density. Nothing between the steps.

**Radius:** 11px panels · 10px cards · 8px buttons · 7px inputs · 6px inline controls · 4px tags · 3px meter fills · 20px filter chips. Radius decreases with element size, so small elements read as machined rather than soft.

**Borders:** 1px `rule`, everywhere. Dashed `rule` for the triage divider — it separates internal work from client-visible content, and dashed says *different kind of thing* without adding a colour.

**Elevation:** none. No shadows anywhere. Depth is expressed by `card` against `paper` and by hairlines. Shadow would break the instrument direction immediately.

**Left edge as status.** Request cards carry a 3px left border in their scope colour. This is the only place structural chrome encodes state, and it lets a long list be scanned for orange without reading a word.

---

### Layout

Single column, `940px` max, centred. No sidebar — the tool has one job and does not need navigation.

Vertical order is fixed and meaningful, running from conclusion to evidence: **masthead → readout → meter → actions → form → filters → list → distribution → notes.** The client sees the answer before the detail. A person who reads only the top of the screen has still received the point.

**Breakpoint at 720px.** Readout goes 4-up to 2×2. Form grid goes two columns to one. Distribution boxes stack. Type scale steps down one notch on display sizes only. Every control keeps a 44px minimum touch target — clients file from phones, usually one-handed, often at night.

---

### Components

**Readout cell.** Mono uppercase label, then the figure at 31px. Four cells in a hairline-divided row, no internal borders on the outer edges. Figures turn `over` when the value they report is non-zero and represents a breach. Unit suffixes ("hrs") sit at 15px in `mute` — the unit should never compete with the magnitude.

**The meter.** 20px track on `paper`-tinted ground, 34px total zone. Eleven hairline ticks at decile intervals, purely to make the bar read as a measuring instrument rather than a progress bar — a distinction worth defending, since progress bars imply completion and this bar implies consumption. Three fills in fixed order: `clear`, hatch, `over`. The contract line is a 2px `ink` rule spanning the full zone height with a mono uppercase label to its right. Scale is `max(contract × 1.28, used + over, 1)` so overage is always visible past the line and the line never pins to the far edge.

**Button.** Primary is `ink` fill, white text, 8px radius, 11/17px padding. Ghost is transparent with a `rule` border, darkening to `ink` on hover. Small variant at 12px/7px for secondary actions. Focus is a 2px `signal` ring at 2px offset — never removed, never replaced with a colour change alone.

**Field.** Mono uppercase label above, `paper`-filled input with `rule` border. On focus the border becomes `signal` and the fill lifts to `card` — the field visibly comes forward. Placeholder text is a real example of what to write, never a restatement of the label.

**Filter chip.** 20px radius, mono at 10.5px. Selected inverts to `ink`. Uses `aria-pressed`, not a class alone.

**Request card.** Three-part head: mono ID, sans title, scope tag — the eye lands on identity, content, verdict in that order. Metadata line below in mono. Optional detail and link. Dual timestamp last. Triage row appended below a dashed divider in the Growthmak view only. Cards at Done or Won't do drop to 55% opacity rather than moving or hiding, so the count stays visibly intact.

**Toast.** Fixed bottom centre, `ink` on white, mono 11.5px, 2.6s. Confirmations only. Errors that need a decision use inline messaging instead — a toast that disappears is the wrong place for something a person must act on.

**Empty state.** Dashed `rule` border, centred, one paragraph capped at 400px. Direction, not decoration.

---

### Motion

Almost none, and each instance justified.

| Element | Motion |
|---|---|
| Meter fills, contract line | 450ms `cubic-bezier(.22,.7,.3,1)` on width and position |
| New request card | 300ms rise, 5px, ease |
| Toast | 250ms opacity |
| Hover | Opacity or border colour only |

Nothing else animates. The meter transition exists because the bar is the argument and watching it move is how the change registers. Everything else is instant, because in an interface about accuracy, motion reads as latency.

`prefers-reduced-motion: reduce` disables all animation and transition globally. Not reduced — off.

---

### Voice

Words are design material here, and the tool's tone carries the same commercial risk as its data. The interface must sound like a shared record, never like an audit of the client.

- **Sentence case throughout.** Title Case reads as marketing.
- **Controls state what happens.** "Log this request", not "Submit". "Save settings", not "Update".
- **A name survives the flow.** The button that says *Log this request* produces a toast that says *Logged*.
- **Errors name the cause and the fix**, without apology and without vagueness: *"Could not save. Check your connection, then try again."*
- **Empty states invite action**: *"No changes logged yet. Every time something new is asked for, add it here. That's how the count stays honest for both sides."*
- **Nothing does double duty.** A label labels. A hint demonstrates. Neither sells.

**On framing.** Interface copy never uses "creep", "overrun", "excess", or any word that positions the client as the problem. The neutral term throughout is **beyond scope** — factual, unarguable, and it describes the request rather than the requester. The panel that reports the money says *Additional cost*, not *Overage*. Same number, and the difference decides whether the client keeps using the tool.

---

### Quality floor

Met without being announced: responsive to 320px, visible keyboard focus on every interactive element, `aria-pressed` on all toggles, AA contrast throughout, colour never the sole carrier of meaning, reduced motion respected, 44px touch targets, and all user content escaped before render.

---

### Implementing the tokens

The design system above is defined in `packages/ui` as CSS custom properties on `:root`, with `tailwind.config.ts` mapping them to utility names so the values exist in exactly one place:

```ts
colors: {
  paper:'var(--paper)', card:'var(--card)', ink:'var(--ink)',
  mute:'var(--mute)', rule:'var(--rule)', signal:'var(--signal)',
  clear:'var(--clear)', over:'var(--over)',
}
fontFamily: { sans:['var(--font-plex-sans)'], mono:['var(--font-plex-mono)'] }
```

**No arbitrary values in components.** `text-[#14161A]` is a review rejection; `text-ink` is the only way to write it. The spacing scale is registered the same way, so the non-doubling steps are enforced rather than remembered.

Both Plex faces load through `next/font/google` with `display: 'swap'` and are subset to Latin. Self-hosting via `next/font` also removes the third-party request the prototype's `@import` introduced.

The meter is a single presentational component in `packages/ui` taking only computed numbers as props. It performs no arithmetic — all scope maths lives in `packages/core` (M7), so the bar cannot drift from the readout above it.

---

## Failure states

| Situation | Behaviour |
|---|---|
| Server Action fails on submit | Inline error above the form, input preserved, request not lost from the field |
| Triage update fails | Optimistic value rolls back, inline error on the row, no toast |
| Magic link expired or reused | Plain explanation and a one-tap resend, not an auth error code |
| Client opens a project they don't belong to | 404, not 403 — a 403 confirms the project exists |
| Filter returns nothing | State the total that exists and how to get back to it |
| No requests at all | Invitation to act, not a shrug |
| Two people triage the same request | Last write wins; the audit trail records both, so the change is recoverable |
| Database unreachable | Static error page naming the state and a contact route — never a stack trace |

---

## Constraints

**Attachments are capped** at 10MB and to image and PDF types. A change request is not a file transfer.

**No offline mode.** Requests require connectivity. Acceptable — every user is filing from a browser with a live session.

**Client-side users are read-plus-submit only.** They cannot triage, cannot edit settings, and cannot see the hourly rate — only the computed cost. Full transparency on the number, not on the internal working.

**Single Postgres instance, no tenancy isolation.** Row-level scoping by `project_id` is sufficient at this scale. If Growthmak ever white-labels the ledger, this is the assumption that has to be revisited first.

---

## Rollout

**Phase 0 — Prototype pilot, in flight.** The existing single-file build runs on one live Foundation Build for four weeks. Purpose is not the tool; it is answering the open questions below with real usage before any schema is committed. **Do not start the Next.js build until this closes.** Porting a data model that hasn't met a real client means porting twice.

**Phase 1 — Public Ledger.** Ship `growthmak.com/tools/change-ledger` first. No auth, no database, localStorage only — a fraction of the work, and it starts earning attention and email captures while Phase 0 is still running. It also proves the shared UI package before anything commercially sensitive depends on it.

**Phase 2 — Client Ledger, single project.** `ledger.growthmak.com` with the pilot client migrated across. Foundation Build mode only. Ship without C8 and O8 if they threaten the date.

**Phase 3 — All active projects.** Retainer mode with periods (O7) must be complete before any Growth Marketing account joins. Add the team dashboard (O8).

**Phase 4 — Standard onboarding.** Ledger issued at kickoff alongside access handover and the reporting dashboard, and referenced in the proposal so the client meets the idea before the project starts.

**Measure at four weeks after Phase 2** against G1–G5. The one to watch is G4: if requests are still arriving by WhatsApp, the intake is too heavy or the tool was introduced badly. Fix the cause, not the symptom.

---

## Later

- **Ops stack integration.** Growthmak already runs Airtable, Zapier, n8n and Make. An outbound webhook on `createRequest` and `triageRequest` puts the ledger inside the existing pipeline rather than beside it.
- **Revision rounds.** Foundation Build contracts often allow a fixed number. Counting rounds alongside hours would match how the contract is actually written.
- **Proposal link.** Generate the contracted-hours figure from the signed proposal instead of typing it into settings.
- **Cross-project margin view.** Which engagements are running past scope, ranked. The principal's view (O8 extended).
- **Layer distribution as a sales asset.** A client's own layer chart, exported, is evidence for the next engagement — gathered during delivery rather than assembled for a pitch.

---

## Open questions

Four are commercial and block the schema. Three are technical and block the build.

1. **Does a bug ever count against scope?** Assumed no. Needs to match the contract language, or the client will find the gap.
2. **Should "Needs quote" hours count toward the additional cost figure?** Counted in the prototype, which slightly overstates the confirmed number. The alternative understates it. Pick deliberately.
3. **Who sets the hours estimate — delivery lead or the person doing the work?** Affects triage latency (G2) and how far the estimate can be trusted.
4. **Does the out-of-scope rate vary across the nine markets?** Currency is per project already. Whether rate should differ by market is a commercial decision, not a product one.
5. **Neon or Railway for Postgres?** Both are in the stack. Neon suits Vercel's connection model better; Railway is already operated by the team.
6. **Does the public tool capture email before or after use?** Before converts worse but qualifies better. Gate on export rather than entry is the likely answer, but it should be tested.
7. **Is the audit trail (T7) ever shown to the client?** Hidden by default in v1. Full transparency would argue for showing it; it may also invite argument over working notes rather than outcomes.
