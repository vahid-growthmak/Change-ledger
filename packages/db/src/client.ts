import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * DATABASE_URL set → real Postgres (Neon, Railway, anything wire-compatible).
 * DATABASE_URL unset → PGlite: a real Postgres engine compiled to WASM,
 * running in-process against a local directory. Same schema, same SQL,
 * zero external services — meant for local dev and testing before a
 * hosted database is wired up. Swapping later is only an env var change.
 *
 * `@auth/drizzle-adapter` type-checks its `db` argument against
 * `PgDatabase` at call time (`is(db, PgDatabase)`), so this has to be a
 * real instance, not a lazy proxy — auth.ts constructs its adapter at
 * module scope, and merely importing this package must produce something
 * that check accepts.
 *
 * PGlite is single-process: only one Node process may hold a given
 * PGLITE_DATA_DIR open at a time. `next build` runs page-data-collection
 * across multiple worker processes, and each one imports every route
 * module — including this one — to decide static vs. dynamic, whether or
 * not a page actually renders. Several build workers eagerly opening the
 * same file-backed `.pglite/` directory at once corrupts its file locks
 * and crashes. During a build (`NEXT_PHASE=phase-production-build`, which
 * Next.js sets itself) each worker gets its own **in-memory** PGlite
 * instead — a real PgDatabase, so the adapter check still passes, but
 * with no shared file for concurrent workers to corrupt. `next dev` and
 * `next start` still use the real file-backed directory, so data persists
 * across requests and hot reloads as normal. This build-time state is
 * simply discarded — nothing built here ends up in the served data.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { max: 10 });
    return { db: drizzlePostgres(client, { schema }), kind: 'postgres' as const };
  }

  const isBuildWorker = process.env.NEXT_PHASE === 'phase-production-build';
  const dataDir = isBuildWorker ? undefined : (process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), '.pglite'));
  const client = new PGlite(dataDir);
  return { db: drizzlePglite(client, { schema }), kind: 'pglite' as const, pglite: client };
}

type DbInstance = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __growthmakDb?: DbInstance };

// Reuse one instance across Next.js dev hot-reloads — the file-backed
// PGlite path holds an exclusive lock on its data directory, so a fresh
// instance per module reload would fail to open it.
const instance = globalForDb.__growthmakDb ?? createDb();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__growthmakDb = instance;
}

export const db = instance.db;
export const dbKind = instance.kind;
export type Database = typeof db;
