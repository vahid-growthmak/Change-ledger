# Growthmak Change Ledger

A shared ledger where the client logs every change they ask for, Growthmak marks whether it
sits inside the agreed scope, and both sides watch the same number move.
Built to [PRD-change-ledger.md](./PRD-change-ledger.md).

## Repository

```
├── apps/
│   ├── public-tool/     Public Ledger — deployed standalone, its own domain (browser-local, no auth)
│   └── ledger/           Client Ledger — Postgres, Auth.js, audit trail, server-enforced roles
├── packages/
│   ├── core/            Scope maths, formatting, Zod schemas — every client-visible number
│   ├── ui/               Design system: tokens, meter, cards, primitives, shared forms
│   └── db/               Drizzle schema + client for the Client Ledger
```

The PRD's rollout plan gates the Client Ledger build on a four-week pilot of the prototype
closing first. That gate is a business/pilot decision outside this repo — per direct
instruction, **both apps are built here now** so the whole system can be tested before any
move to growthmak.com's own infrastructure.

## Run the Public Ledger (browser-local, no setup)

```bash
npm install
npm run dev            # http://localhost:3000
```

## Run the Client Ledger

No external services required to test it locally — it runs against **PGlite**, a real
Postgres engine compiled to WASM, in a local directory (`apps/ledger/.pglite/`). Swapping to
a real hosted Postgres later is just setting `DATABASE_URL`.

```bash
npm install
npm run db:migrate     # applies the schema to apps/ledger/.pglite/
npm run dev:ledger     # http://localhost:3457
```

Open `/login`. In development, a **dev sign-in** field appears below the real sign-in
options — any `@growthmak.com` address signs in as team, anything else as client, and typing
a new email creates it on first use. That's the whole path to testing both roles without a
Google Workspace app or a Resend account:

- **Team**: create a project from the home page, then triage requests, invite a client, view
  settings, export CSV.
- **Client**: sign in with whatever email you invited (Settings → Invite a client) and you
  land on that project automatically — log requests, watch the meter, but no triage controls,
  no rate, no settings link. That boundary is enforced server-side (`lib/authz.ts`), not by a
  client-side view toggle.

The real providers (Google Workspace SSO restricted to `AUTH_ALLOWED_DOMAIN`, Resend magic
links) are fully wired in `auth.ts` — set the corresponding vars in `apps/ledger/.env.local`
(see `.env.example`) to use them instead. Without `RESEND_API_KEY`, magic links print to the
server console instead of sending an email, so the real (non-dev) sign-in flow is still
testable end-to-end.

## Logging requests from a meeting transcript

The PRD names calls as an intake channel that "does not count" — a request made out loud on
a call leaves nothing behind. **Log from a meeting transcript** (team view, on a project
page) closes that gap: paste the transcript from any AI notetaker, and Claude returns the
change requests it finds.

It **proposes; it never logs.** You get a list with each candidate's supporting quote, edit
whatever was read wrongly, deselect anything that isn't a request, then confirm. Only what
you keep is written, and it lands as **pending review** like any other request — finding a
request is not triaging it (T6). Low-confidence candidates are flagged rather than dropped,
so the judgement stays with you.

Requests logged this way carry their provenance: `source = 'transcript'` plus the verbatim
excerpt, shown on the card and included in the CSV export. That's deliberate — when a client
says "I never asked for that," the ledger can answer with what was actually said instead of
becoming an argument.

Needs `ANTHROPIC_API_KEY` in `apps/ledger/.env.local`. Without it the panel returns a clear
error and nothing else in the app is affected. It runs on `claude-opus-5` with adaptive
thinking; a call transcript is roughly 10–25k input tokens, so a few cents per meeting.
Team-only by design: a transcript is a whole meeting's conversation, including things that
were never meant for the client's side of the ledger.

**PGlite is single-process.** Only one Node process may hold `.pglite/` open at a time —
running a second one (a one-off query script, a second `next dev`, `db:migrate` while the
server's already running) corrupts its file locks and crashes both sides. Stop the dev
server first before running anything else against the local database. This constraint goes
away entirely once `DATABASE_URL` points at a real Postgres.

## Verify

```bash
npm test               # unit tests for packages/core (scope maths, money, periods, CSV)
npm run build           # production build of the public tool
npm run build:ledger    # production build of the client ledger
```

## Deploy (standalone)

Both apps ship as separate Vercel projects — neither is a route inside the growthmak.com
marketing site's codebase. The monorepo layout needs one setting per project to deploy
correctly:

1. Import this repo into Vercel (once per app — two separate Vercel projects).
2. Project Settings → **Root Directory**: `apps/public-tool` or `apps/ledger`.
3. Framework preset: Next.js (auto-detected). Build and install commands: leave as Vercel's
   Next.js defaults — it resolves `npm install` from the repo root automatically because a
   `package-lock.json` lives there, so the workspace packages install correctly.
4. **Public Ledger**: no environment variables needed — no backend, no database.
   **Client Ledger**: set `DATABASE_URL` (Neon or Railway — PRD open question 5, either
   works), `AUTH_SECRET`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_ALLOWED_DOMAIN`,
   `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` — then run
   `npm run db:migrate` once (from a machine with `DATABASE_URL` set) before first traffic.
   The dev sign-in provider is automatically excluded in production builds.
5. Point whatever domain or subdomain you want at each project. If you'd rather the public
   tool live at `growthmak.com/tools/change-ledger` specifically, that's a rewrite rule on
   the main marketing site pointing that path at this project's URL — it doesn't require
   merging the codebases.

## Decisions inherited from the PRD

- **Money is integer minor units** everywhere (`rate_minor: 4500` = $45.00), formatted per
  currency — including 3-decimal KWD.
- **Unset scope is "Pending review"**, rendered as a hatch — never counted as in scope (T6).
- **"Needs quote" hours are excluded from the cost figure** (open question 2, resolved
  conservatively: the reported number is never larger than what has been agreed). They render
  hatched with pending. Flip this in `packages/core/src/scope.ts` if the commercial call goes
  the other way.
- **Additional cost is computed server-side in `packages/core`** (M5/M7) — in the Client
  Ledger, `app/[slug]/page.tsx` computes it from the full project row (rate included) and
  only the resulting totals cross into the client bundle; the rate itself never does. The
  meter component does no arithmetic in either app.
- **Retainer mode stamps a monthly period** on each request at insert; the meter counts the
  current cycle and history stays in the list (O7).
- **Role is resolved server-side, every request** (A4) — `lib/authz.ts`'s `requireSession` /
  `requireTeam` / `requireProjectAccess` gate every page and Server Action. A client hitting a
  project they're not a member of gets a 404, not a 403 (a 403 would confirm the project
  exists) — verified end-to-end, not just asserted.
- **Every triage field change writes an audit trail row** (T7), in the same transaction as
  the update — `lib/actions.ts`'s `triageRequest`.
- **Transcript extraction is split from committing** on purpose: `extractFromTranscript`
  writes nothing, `createRequestsFromTranscript` writes only what a team member confirmed.
  An LLM's reading of a call must not become a billable line item unreviewed.
- **Both apps share `packages/ui`**, including `SubmitForm`, `TriageRow`, and `Distribution` —
  the Client Ledger doesn't reimplement these; it wires the same components to Server Actions
  instead of `localStorage`.
