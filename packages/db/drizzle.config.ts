import type { Config } from 'drizzle-kit';

// `generate` only reads schema.ts to produce SQL files — it never opens a
// connection, so dbCredentials.url is a placeholder when DATABASE_URL isn't
// set (PGlite/local dev). Migrations are applied at runtime via
// packages/db/src/migrate.ts, not drizzle-kit push, so this file is unused
// there.
export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder',
  },
} satisfies Config;
