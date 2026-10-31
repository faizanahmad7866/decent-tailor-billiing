import { Directory, File, Paths } from 'expo-file-system';
import {
  backupDatabaseSync,
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, migrateDatabase } from '../db/database';
import { listClothPhotoFiles, replaceClothPhotos } from './clothImageStore';
import {
  listPatternMediaFiles,
  replacePatternMedia,
} from './patternMediaStore';

// A backup is one file: a copy of the SQLite database made with SQLite's own
// backup API, with every cloth photo, and every photo and video of the pattern
// catalogue, packed into extra tables. The same
// approach as the main Decent Tailor app — one file is one share to Google
// Drive or WhatsApp, and a restore can't lose data in a format conversion.

// Tables any backup of this app has, from its first version on. Newer
// tables are added by migrateDatabase() after a restore.
const EXPECTED_TABLES = [
  'cloths',
  'bills',
  'bill_cloths',
  'bill_garments',
  'payments',
];

const PHOTOS_TABLE = 'backup_photos';
const PATTERN_MEDIA_TABLE = 'backup_pattern_media';

// A photo's name comes out of a file the user picked, so it is only used if
// it is a plain file name — nothing that could point outside the folder.
const SAFE_FILE_NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export class InvalidBackupError extends Error {
  constructor() {
    super('This file is not a DT Billing backup.');
    this.name = 'InvalidBackupError';
  }
}

/** Opens the SQLite file at a file:// uri, e.g. one the document picker gave. */
function openDatabaseAtUri(uri: string): SQLiteDatabase {
  const slash = uri.lastIndexOf('/');
  return openDatabaseSync(uri.slice(slash + 1), undefined, uri.slice(0, slash));
}

/** Writes a backup into the app's cache and returns its uri, ready to share. */
export async function exportBackup(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const name = `dt-billing-backup-${date}-${Date.now()}.db`;
  const file = new File(Paths.cache, name);

  try {
    const backupDb = openDatabaseSync(name, undefined, Paths.cache.uri);
    try {
      backupDatabaseSync({
        sourceDatabase: getDatabase(),
        destDatabase: backupDb,
      });
      for (const table of [PHOTOS_TABLE, PATTERN_MEDIA_TABLE]) {
        backupDb.execSync(
          `CREATE TABLE ${table} (file_name TEXT PRIMARY KEY NOT NULL, data BLOB NOT NULL)`
        );
      }
      // Safe as an async transaction: nothing else ever touches this copy.
      // One file at a time, so a video is never held in memory with another.
      await backupDb.withTransactionAsync(async () => {
        const packed: [string, File[]][] = [
          [PHOTOS_TABLE, listClothPhotoFiles()],
          [PATTERN_MEDIA_TABLE, listPatternMediaFiles()],
        ];
        for (const [table, files] of packed) {
          for (const file of files) {
            await backupDb.runAsync(
              `INSERT INTO ${table} (file_name, data) VALUES (?, ?)`,
              [file.name, await file.bytes()]
            );
          }
        }
      });
    } finally {
      backupDb.closeSync();
    }
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
  return file.uri;
}

/**
 * Lets the tailor pick a backup file and checks it is one before anything
 * is replaced. Null when they cancel. The uri is the picker's own copy in
 * the cache, never their original, so restoring may change it freely.
 */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;

  let db: SQLiteDatabase | null = null;
  try {
    db = openDatabaseAtUri(asset.uri);
    const tables = new Set(
      db
        .getAllSync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table'"
        )
        .map((row) => row.name)
    );
    if (!EXPECTED_TABLES.every((table) => tables.has(table))) {
      throw new InvalidBackupError();
    }
  } catch {
    // Not SQLite at all, or SQLite without our tables: the same to the tailor.
    throw new InvalidBackupError();
  } finally {
    db?.closeSync();
  }
  return asset.uri;
}

/**
 * Replaces all bills, cloths, rates, patterns and their photos and videos
 * with the backup's. Files are unpacked into staging folders first, so a
 * backup that fails part-way through leaves the current data untouched.
 */
export async function restoreBackup(uri: string): Promise<void> {
  const stamp = Date.now();
  const stagedPhotos = new Directory(Paths.cache, `restore-photos-${stamp}`);
  const stagedPattern = new Directory(Paths.cache, `restore-pattern-${stamp}`);
  try {
    const backupDb = openDatabaseAtUri(uri);
    try {
      await extractFiles(backupDb, PHOTOS_TABLE, stagedPhotos);
      await extractFiles(backupDb, PATTERN_MEDIA_TABLE, stagedPattern);
      dropPackedFiles(backupDb);
      backupDatabaseSync({
        sourceDatabase: backupDb,
        destDatabase: getDatabase(),
      });
    } finally {
      backupDb.closeSync();
    }
    replaceClothPhotos(stagedPhotos);
    replacePatternMedia(stagedPattern);
    // A backup from an older version lacks newer tables; bring it up to date
    // now, before any screen reads from it.
    await migrateDatabase();
  } finally {
    for (const staged of [stagedPhotos, stagedPattern]) {
      if (staged.exists) staged.delete();
    }
  }
}

/** Writes the files packed in `table` into `staged`. A backup without it has none. */
async function extractFiles(
  backupDb: SQLiteDatabase,
  table: string,
  staged: Directory
): Promise<void> {
  staged.create({ intermediates: true });
  const hasTable = backupDb.getFirstSync(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [table]
  );
  if (!hasTable) return;

  const rows = backupDb.getEachAsync<{ file_name: string; data: Uint8Array }>(
    `SELECT file_name, data FROM ${table}`
  );
  for await (const row of rows) {
    if (!SAFE_FILE_NAME.test(row.file_name)) continue;
    const file = new File(staged, row.file_name);
    file.create();
    file.write(row.data);
  }
}

/**
 * Drops the packed files from the copy so the restored database doesn't
 * carry a second copy of every one. VACUUM too: the backup API copies every
 * page, freed ones included.
 */
function dropPackedFiles(backupDb: SQLiteDatabase): void {
  backupDb.execSync(
    `DROP TABLE IF EXISTS ${PHOTOS_TABLE}; DROP TABLE IF EXISTS ${PATTERN_MEDIA_TABLE}; VACUUM;`
  );
}
