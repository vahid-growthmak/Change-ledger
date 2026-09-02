export * from './schema';
export * from './client';
// migrate.ts deliberately NOT re-exported here: it pulls in drizzle-orm's
// migrator (raw node:fs/node:path/node:crypto usage), which every route
// that imports `db` would otherwise drag into its server bundle. Import
// it directly from '@growthmak/db/src/migrate' where actually needed
// (the migrate script, and nowhere else).
