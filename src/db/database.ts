import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

let database: SQLiteDatabase | null = null;

export function getDatabase(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync('decent_tailor_billing.db');
    // SQLite leaves REFERENCES unenforced unless asked, per connection.
    database.execSync('PRAGMA foreign_keys = ON');
  }
  return database;
}

export async function migrateDatabase(): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  for (let step = row?.user_version ?? 0; step < MIGRATIONS.length; step++) {
    // A step and its version bump commit together, so a launch cut short
    // mid-step simply runs that step again next time.
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(MIGRATIONS[step]);
      await tx.execAsync(`PRAGMA user_version = ${step + 1}`);
    });
  }
}
