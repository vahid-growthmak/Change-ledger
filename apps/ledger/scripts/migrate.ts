import { dbKind } from '@growthmak/db';
import { runMigrations } from '@growthmak/db/src/migrate';

runMigrations()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`Migrations applied (${dbKind}).`);
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', err);
    process.exit(1);
  });
