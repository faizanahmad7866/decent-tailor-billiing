import { getDatabase } from '../db/database';
import type { DataSummary } from '../utils/dataSummary';
import { clearClothPhotos, listClothPhotoFiles } from './clothImageStore';
import { clearPatternMedia, listPatternMediaFiles } from './patternMediaStore';

// What the app holds, counted — and the one way to wipe it.

/**
 * Counts what a backup carries (and what a delete removes). Photos and videos
 * are counted from the files on the phone, since those are what a backup
 * packs, not from what the database says should be there.
 */
export async function loadDataSummary(): Promise<DataSummary> {
  const db = getDatabase();
  const count = async (table: string): Promise<number> =>
    (
      await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${table}`
      )
    )?.n ?? 0;

  const [bills, cloths, designs] = await Promise.all([
    count('bills'),
    count('cloths'),
    count('pattern_items'),
  ]);
  const videoNames = new Set(
    (
      await db.getAllAsync<{ video_name: string }>(
        'SELECT video_name FROM pattern_items WHERE video_name IS NOT NULL'
      )
    ).map((row) => row.video_name)
  );
  const catalogue = listPatternMediaFiles();
  const videos = catalogue.filter((file) => videoNames.has(file.name)).length;
  return {
    bills,
    cloths,
    designs,
    photos: listClothPhotoFiles().length + catalogue.length - videos,
    videos,
  };
}

/**
 * Deletes every bill (with its cloths, garments and payments), every cloth,
 * every design, and every photo and video. What is kept: the Rate Master, the
 * catalogue's categories, and the printer and voice settings. Bills number
 * from 1 again; cloths and their types do not, since a label still stuck on a
 * roll must never come to mean a different cloth.
 *
 * The database goes in one transaction — all of it or none — and the files
 * after, since they cannot be rolled back; a photo left behind by a failure is
 * only wasted space, and the next delete clears it.
 */
export async function deleteAllData(): Promise<void> {
  const db = getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    // Children before parents.
    for (const table of [
      'payments',
      'bill_garments',
      'bill_cloths',
      'bills',
      'pattern_item_images',
      'pattern_item_cloths',
      'pattern_items',
      'cloth_types',
      'cloths',
    ]) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
    await tx.runAsync(
      `DELETE FROM sqlite_sequence WHERE name IN
         ('payments', 'bill_garments', 'bill_cloths', 'bills',
          'pattern_item_images', 'pattern_item_cloths', 'pattern_items')`
    );
  });
  clearClothPhotos();
  clearPatternMedia();
  // Hand the freed pages back, so the database file shrinks with the data.
  try {
    await db.execAsync('VACUUM');
  } catch {
    // Only the file's size: the data is gone either way.
  }
}
