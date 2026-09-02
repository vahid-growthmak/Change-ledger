import path from 'node:path';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { db, dbKind } from './client';

const migrationsFolder = path.join(__dirname, '..', 'migrations');

/** Applies any pending SQL migrations from packages/db/migrations. Idempotent. */
export async function runMigrations(): Promise<void> {
  if (dbKind === 'pglite') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migratePglite(db as any, { migrationsFolder });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migratePostgres(db as any, { migrationsFolder });
  }
}
