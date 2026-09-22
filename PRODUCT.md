# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**The client — a founder or marketing lead, non-technical.** Submits at odd hours from
their own timezone, often on a phone, often having just noticed something. Will not learn a
taxonomy, will not fill in seven fields, will not create a password. Their job: get the
request out of their head and into a place that counts it.

**The Growthmak delivery lead.** Reviews a queue each morning across several projects,
decides what is covered and what is not, estimates effort, keeps clients informed without a
meeting. Needs a defensible record months later. Their job: classify quickly, and let the
record make the commercial argument so they don't have to.

**The Growthmak principal.** Not a daily user. Wants a cross-project view: which engagements
are running past scope, and by how much. Their job: see the pattern before it becomes a
margin problem.

Clients span nine markets (US, Canada, UK, Australia, New Zealand, UAE, Saudi Arabia, Qatar,
Kuwait, India), so most requests arrive while the delivery team is asleep, stripped of the
context a live conversation would have supplied.

## Product Purpose

A shared ledger where the client logs every change they ask for, Growthmak marks whether it
sits inside the agreed scope, and both sides watch the same number move.

It exists because requests arrive through channels that do not count — WhatsApp, email
threads, calls, doc comments. Nothing aggregates, and nobody can answer "how many changes
have we asked for?" without an afternoon of scrolling. Fixed-scope Foundation Builds lose
margin to it; retainers lose capacity to it.

Success is one unambiguous count both sides quote without checking with each other; a scope
verdict within 24 hours of the request rather than at invoice; and a non-technical founder
logging a second request without being prompted.

## Positioning

**This is not a scope-policing tool, and must never read as one.** Growthmak's positioning
rests on transparent reporting, and client reviews name that specifically. The same data
framed as a gotcha damages the relationship the agency is built on; framed as a live shared
record, it strengthens it. The client sees the cost number before the invoice, not after.

The mechanism a neighbouring product could not truthfully copy: scope status is established
at the moment of request, by both parties, against a record that was agreed in advance — not
reconstructed from memory at the end of an engagement.

## Operating Context

Two surfaces, one codebase, deliberately opposite requirements:

- **Public Ledger** (`growthmak.com/tools/change-ledger`) — anyone; browser-local only, no
  account, no auth; aggressively indexed; a lead magnet and live demo of the paid tool.
- **Client Ledger** (`ledger.growthmak.com`) — Growthmak clients and delivery team; Postgres
  per project; magic link for clients, Google Workspace for team; `noindex` enforced at
  middleware, never indexed; holds rates, hours and cost.

The interface is identical across both; only persistence and auth differ. They cannot share a
domain (rate data must not be indexed; each must deploy on its own cadence) but do share a UI
package, so the design system is defined once.

Two engagement types shape the data: Foundation Build (fixed scope, 4–8 weeks) and Growth
Marketing (monthly retainer, three-month minimum).

## Capabilities and Constraints

**Capture.** One required field — a plain-language description. Kind of change (bug, design,
content, new feature, ads & creative, other), location (page/campaign/asset), optional detail
and link, optional image/PDF attachments up to 25MB. Per-project sequential human-readable ID
(GM-001). Timestamped UTC, displayed in both client-market and India time. Requester captured
from session, never typed.

**Triage.** Delivery team assigns a scope verdict — in scope, beyond scope, needs quote — plus
effort and a Growth Engine layer. Unset scope is "Pending review" and is never counted as in
scope. "Needs quote" hours are excluded from the cost figure, so the reported number is never
larger than what has been agreed.

**Client-side users are read-plus-submit only.** They cannot triage, cannot edit settings, and
cannot see the hourly rate — only the computed cost. Full transparency on the number, not on
the internal working. The client surface carries no effort or money figures at all: only the
two counts, the scope verdict per request, and the log.

**Money is integer minor units** everywhere, formatted per currency, including 3-decimal KWD.

**Not a project manager** (no assignees, due dates, dependencies, sprints). **Not a bug
tracker** (no repro steps, environment fields, severity matrices). **Not a communication
channel** (no threaded comments or chat). **Not an invoicing system.** **Not a client portal.**
**No real-time collaboration** — polling on focus is sufficient. Each of these, added, turns a
30-second tool into Jira. Adoption is the whole product: a tool the client abandons in week
two has negative value, because it creates the appearance of a record where none exists.

No offline mode. Single Postgres instance, row-level scoping by `project_id`, no tenancy
isolation — the assumption to revisit first if the ledger is ever white-labelled.

## Brand Commitments

**Voice — binding.** Words are design material here, and tone carries the same commercial risk
as the data. The interface must sound like a shared record, never like an audit of the client.

- Sentence case throughout. Title Case reads as marketing.
- Controls state what happens: "Log this request", not "Submit".
- A name survives the flow: the button that says *Log this request* produces a toast that says
  *Logged*.
- Errors name the cause and the fix, without apology or vagueness.
- Empty states invite action rather than shrugging.
- Nothing does double duty. A label labels, a hint demonstrates, neither sells.

**On framing — load-bearing.** Copy never uses "creep", "overrun", "excess", or any word that
positions the client as the problem. The neutral term is **beyond scope** — factual, and it
describes the request rather than the requester. The panel reporting money says *Additional
cost*, not *Overage*. Same number; the difference decides whether the client keeps using the
tool.

**Name:** Change Ledger, by Growthmak. As of this redesign the tool is explicitly **not**
required to inherit growthmak.com's visual theme — the user has confirmed a break from it.
The voice and framing commitments above are unaffected and remain binding.

## Evidence on Hand

- `PRD-change-ledger.md` — full product requirements, user research, goals and non-goals.
- `README.md` — architecture decisions and where the build deliberately departs from the PRD.
- Working production app: capture, triage, meter, magic-link auth, attachments, CSV export.
- Real usage is Growthmak's own client engagements across nine markets.

No testimonials, case studies, press, benchmarks or customer logos exist for this tool. Do not
fabricate any. No illustration or icon-set assets exist.

## Product Principles

1. **Adoption is the whole product.** A 30-second capture beats a complete taxonomy. Any
   addition that slows the client down costs more than the data it collects.
2. **The number is the argument.** One count, computed in one place, that both sides trust and
   quote without cross-checking.
3. **A record, never an audit.** Every surface and every word must read as shared, not as
   evidence assembled against the client.
4. **Unmeasured is its own state.** Pending is never quietly folded into either verdict; the
   reported figure is never larger than what has been agreed.
5. **Two audiences, one truth.** The client sees fewer figures than the team, never different
   ones.

## Accessibility & Inclusion

AA contrast throughout, and **colour never carries meaning alone** — every scope state pairs
its colour with a written label, so the record stays legible to colour-blind readers and in
print. Visible keyboard focus on every interactive element, `aria-pressed` on toggles, 44px
touch targets, responsive to 320px, `prefers-reduced-motion` honoured as off rather than
reduced. Non-technical users on phones at odd hours are the primary capture path, so the
submit flow must survive small screens and interruption.
