# Growthmak Change Ledger

A shared ledger where the client logs every change they ask for, Growthmak marks whether it
sits inside the agreed scope, and both sides watch the same number move.
Built to [PRD-change-ledger.md](./PRD-change-ledger.md).

## Repository

```
├── apps/
│   └── public-tool/     Public Ledger — deployed standalone, its own domain (browser-local, no auth)
├── packages/
│   ├── core/            Scope maths, formatting, Zod schemas — every client-visible number
│   ├── ui/              Design system: tokens, meter, cards, primitives
│   └── db/              Drizzle Postgres schema for the Client Ledger (Phase 2)
```

Per the PRD rollout, **Phase 1 (the Public Ledger) is built here**. The Client Ledger
(`apps/ledger` — auth, Postgres, audit trail) is deliberately not started: Phase 0 pilot
learnings gate it. Its data model is already committed in `packages/db`, and everything it
will share — scope maths, meter, design system — lives in `packages/core` and `packages/ui`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Verify

```bash
npm test           # unit tests for packages/core (scope maths, money, periods, CSV)
npm run build      # production build of the public tool
```

## Deploy (standalone)

This ships as its own Vercel project — not a route inside the growthmak.com marketing
site's codebase. The monorepo layout needs one setting to deploy correctly:

1. Import this repo into Vercel.
2. Project Settings → **Root Directory**: `apps/public-tool`.
3. Framework preset: Next.js (auto-detected). Build and install commands: leave as
   Vercel's Next.js defaults — it resolves `npm install` from the repo root automatically
   because a `package-lock.json` lives there, so the `@growthmak/core` and `@growthmak/ui`
   workspace packages install correctly.
4. No environment variables are required — the app has no backend, no database, no API
   keys. Everything is browser-local.
5. Point whatever domain or subdomain you want at the project (e.g. a `tools.growthmak.com`
   CNAME, or Vercel's default `*.vercel.app` URL to start). If you'd rather it live at
   `growthmak.com/tools/change-ledger` specifically, that's a rewrite rule on the main
   marketing site pointing that one path at this project's URL — it doesn't require merging
   the codebases.

## Decisions inherited from the PRD

- **Money is integer minor units** everywhere (`rate_minor: 4500` = $45.00), formatted per
  currency — including 3-decimal KWD.
- **Unset scope is "Pending review"**, rendered as a hatch — never counted as in scope (T6).
- **"Needs quote" hours are excluded from the cost figure** (open question 2, resolved
  conservatively: the reported number is never larger than what has been agreed). They render
  hatched with pending. Flip this in `packages/core/src/scope.ts` if the commercial call goes
  the other way.
- **Additional cost is computed in `packages/core`**, the same code path both surfaces will
  use (M5/M7) — the meter component does no arithmetic.
- **Retainer mode stamps a monthly period** on each request at insert; the meter counts the
  current cycle and history stays in the list (O7).
