import { getDatabase } from '../db/database';
import { deletePatternMedia } from '../storage/patternMediaStore';
import { clothLineAmount } from '../utils/billMath';
import { patternPrice, priceToSave, shownPrice } from '../utils/patternPricing';

// The pattern catalogue: categories (a Jodhpuri, a coat) and, in each, the
// shop's own designs. Only file names are kept here; the photos and the video
// live in the app's own folder (storage/patternMediaStore).

export interface PatternCategory {
  id: number;
  name: string;
  itemCount: number;
  /** The photo of the newest item that has one, shown as the category's face. */
  coverImage: string | null;
}

/** An item as the category's grid shows it. */
export interface PatternItemSummary {
  id: number;
  categoryId: number;
  name: string;
  pricePaise: number;
  coverImage: string | null;
  hasVideo: boolean;
}

/** A design as showroom mode shows it: at least one photo, the first the cover. */
export interface ShowroomDesign {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  pricePaise: number;
  images: string[];
}

/** One cloth a design needs, with the meters of it, at today's rate. */
export interface PatternCloth {
  /** Null once the cloth has been deleted from the catalog. */
  clothId: number | null;
  clothName: string;
  nameHindi: string | null;
  imageName: string | null;
  /** The cloth's type on this design, as on a bill line. */
  variant: string | null;
  /** The rate charged: the catalog rate today plus the extra. */
  pricePerMeterPaise: number;
  extraPerMeterPaise: number;
  lengthCm: number;
  amountPaise: number;
}

/** An item with everything on it, for its own page. */
export interface PatternItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  /** What it comes to: the cloths at today's rates plus the stitching. */
  pricePaise: number;
  clothPaise: number;
  stitchingPaise: number;
  /** The cloths it needs, in the order they were added. */
  cloths: PatternCloth[];
  /** An optional note on the design ("Dry clean only"). */
  note: string | null;
  /** The note in Hindi, as saved with it. */
  noteHindi: string | null;
  /** In the order they are shown; the first is the cover. */
  images: string[];
  videoName: string | null;
}

/** A cloth a design needs, as it is saved. */
export interface PatternClothInput {
  clothId: number | null;
  clothName: string;
  /** The cloth's catalog rate when it was chosen: kept for if the cloth is deleted. */
  pricePerMeterPaise: number;
  variant: string | null;
  extraPerMeterPaise: number;
  lengthCm: number;
}

export interface PatternItemInput {
  categoryId: number;
  name: string;
  cloths: PatternClothInput[];
  stitchingPaise: number;
  note: string | null;
  noteHindi: string | null;
  images: string[];
  videoName: string | null;
}

/** Another category already has this name (ignoring case). */
export class DuplicateCategoryNameError extends Error {
  constructor(name: string) {
    super(`A category named "${name}" already exists`);
    this.name = 'DuplicateCategoryNameError';
  }
}

// Checked before writing so the tailor gets a plain message; the UNIQUE
// constraint on the column is what actually guarantees it.
async function assertCategoryNameFree(
  name: string,
  exceptId?: number
): Promise<void> {
  const taken = await getDatabase().getFirstAsync<{ id: number }>(
    'SELECT id FROM pattern_categories WHERE name = ? AND id IS NOT ?',
    [name, exceptId ?? null]
  );
  if (taken) throw new DuplicateCategoryNameError(name);
}

// The files an item owns: its photos and its video.
async function mediaOfItems(itemIds: number[]): Promise<string[]> {
  if (!itemIds.length) return [];
  const marks = itemIds.map(() => '?').join(', ');
  const db = getDatabase();
  const images = await db.getAllAsync<{ image_name: string }>(
    `SELECT image_name FROM pattern_item_images WHERE item_id IN (${marks})`,
    itemIds
  );
  const videos = await db.getAllAsync<{ video_name: string }>(
    `SELECT video_name FROM pattern_items
     WHERE id IN (${marks}) AND video_name IS NOT NULL`,
    itemIds
  );
  return [
    ...images.map((row) => row.image_name),
    ...videos.map((row) => row.video_name),
  ];
}

const SELECT_CATEGORY = `
  SELECT c.id, c.name,
         (SELECT COUNT(*) FROM pattern_items i
          WHERE i.category_id = c.id) AS itemCount,
         (SELECT m.image_name
          FROM pattern_items i
          JOIN pattern_item_images m ON m.item_id = i.id
          WHERE i.category_id = c.id
          ORDER BY i.id DESC, m.position LIMIT 1) AS coverImage
  FROM pattern_categories c`;

interface ClothRow {
  itemId: number;
  clothId: number | null;
  clothName: string;
  nameHindi: string | null;
  imageName: string | null;
  variant: string | null;
  pricePerMeterPaise: number;
  extraPerMeterPaise: number;
  lengthCm: number;
}

// The cloth lines of the given items, at the catalog's rate today — or, for a
// cloth no longer in the catalog, the rate the line was saved with.
async function clothLinesOf(
  itemIds: number[]
): Promise<Map<number, PatternCloth[]>> {
  const lines = new Map<number, PatternCloth[]>();
  if (!itemIds.length) return lines;
  const rows = await getDatabase().getAllAsync<ClothRow>(
    `SELECT ic.item_id AS itemId, ic.cloth_id AS clothId,
            COALESCE(c.name, ic.cloth_name) AS clothName,
            c.name_hi AS nameHindi,
            COALESCE(t.image_name, c.image_name) AS imageName,
            ic.variant AS variant,
            COALESCE(t.price_per_meter_paise, c.price_per_meter_paise,
                     ic.price_per_meter_paise)
              + ic.extra_per_meter_paise AS pricePerMeterPaise,
            ic.extra_per_meter_paise AS extraPerMeterPaise,
            ic.length_cm AS lengthCm
     FROM pattern_item_cloths ic
     LEFT JOIN cloths c ON c.id = ic.cloth_id
     LEFT JOIN cloth_types t ON t.cloth_id = ic.cloth_id AND t.name = ic.variant
     WHERE ic.item_id IN (${itemIds.map(() => '?').join(', ')})
     ORDER BY ic.item_id, ic.position`,
    itemIds
  );
  for (const { itemId, ...row } of rows) {
    const line: PatternCloth = { ...row, amountPaise: clothLineAmount(row) };
    lines.set(itemId, [...(lines.get(itemId) ?? []), line]);
  }
  return lines;
}

// Written for every item saved; read for one made before prices were worked
// out, which has no cloth lines.
// What the item comes to as saved: kept in price_paise as the price a design
// without cloth lines falls back on.
const priceOf = (
  input: PatternItemInput,
  before: PatternItem | null = null
): number =>
  priceToSave(
    input.cloths.map((cloth) => ({
      pricePerMeterPaise: cloth.pricePerMeterPaise + cloth.extraPerMeterPaise,
      lengthCm: cloth.lengthCm,
    })),
    input.stitchingPaise,
    before
  );

const insertCloths = async (
  tx: Pick<ReturnType<typeof getDatabase>, 'runAsync'>,
  itemId: number,
  cloths: PatternClothInput[]
): Promise<void> => {
  for (const [position, cloth] of cloths.entries()) {
    await tx.runAsync(
      `INSERT INTO pattern_item_cloths
         (item_id, cloth_id, cloth_name, price_per_meter_paise, variant,
          extra_per_meter_paise, length_cm, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        cloth.clothId,
        cloth.clothName,
        cloth.pricePerMeterPaise,
        cloth.variant,
        cloth.extraPerMeterPaise,
        cloth.lengthCm,
        position,
      ]
    );
  }
};

export const patternRepo = {
  /**
   * Every category in the order it was made — which, for the ones made from
   * the Rate Master, is the Rate Master's order — with how many designs it holds.
   */
  listCategories(): Promise<PatternCategory[]> {
    return getDatabase().getAllAsync<PatternCategory>(
      `${SELECT_CATEGORY} ORDER BY c.id`
    );
  },

  getCategory(id: number): Promise<PatternCategory | null> {
    return getDatabase().getFirstAsync<PatternCategory>(
      `${SELECT_CATEGORY} WHERE c.id = ?`,
      [id]
    );
  },

  async createCategory(name: string): Promise<number> {
    await assertCategoryNameFree(name);
    const result = await getDatabase().runAsync(
      'INSERT INTO pattern_categories (name) VALUES (?)',
      [name]
    );
    return result.lastInsertRowId;
  },

  async renameCategory(id: number, name: string): Promise<void> {
    await assertCategoryNameFree(name, id);
    await getDatabase().runAsync(
      'UPDATE pattern_categories SET name = ? WHERE id = ?',
      [name, id]
    );
  },

  /** Removes the category with every item in it, and their photos and videos. */
  async removeCategory(id: number): Promise<void> {
    const db = getDatabase();
    const items = await db.getAllAsync<{ id: number }>(
      'SELECT id FROM pattern_items WHERE category_id = ?',
      [id]
    );
    const media = await mediaOfItems(items.map((item) => item.id));
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `DELETE FROM pattern_item_images WHERE item_id IN
           (SELECT id FROM pattern_items WHERE category_id = ?)`,
        [id]
      );
      await tx.runAsync(
        `DELETE FROM pattern_item_cloths WHERE item_id IN
           (SELECT id FROM pattern_items WHERE category_id = ?)`,
        [id]
      );
      await tx.runAsync('DELETE FROM pattern_items WHERE category_id = ?', [
        id,
      ]);
      await tx.runAsync('DELETE FROM pattern_categories WHERE id = ?', [id]);
    });
    media.forEach(deletePatternMedia);
  },

  /** A category's items, newest first, each at the price it works out to today. */
  async listItems(categoryId: number): Promise<PatternItemSummary[]> {
    const rows = await getDatabase().getAllAsync<
      Omit<PatternItemSummary, 'hasVideo' | 'pricePaise'> & {
        hasVideo: number;
        givenPaise: number;
        stitchingPaise: number;
      }
    >(
      `SELECT i.id, i.category_id AS categoryId, i.name,
              i.price_paise AS givenPaise, i.stitching_paise AS stitchingPaise,
              i.video_name IS NOT NULL AS hasVideo,
              (SELECT m.image_name FROM pattern_item_images m
               WHERE m.item_id = i.id ORDER BY m.position LIMIT 1) AS coverImage
       FROM pattern_items i
       WHERE i.category_id = ?
       ORDER BY i.id DESC`,
      [categoryId]
    );
    const cloths = await clothLinesOf(rows.map((row) => row.id));
    return rows.map(({ givenPaise, stitchingPaise, hasVideo, ...row }) => ({
      ...row,
      hasVideo: hasVideo === 1,
      pricePaise: shownPrice(
        cloths.get(row.id) ?? [],
        stitchingPaise,
        givenPaise
      ),
    }));
  },

  /**
   * Every design with a photo, in the order of the catalogue: category by category,
   * and the newest first in each, at the price it works out to today.
   */
  async listShowroomDesigns(): Promise<ShowroomDesign[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: number;
      categoryId: number;
      categoryName: string;
      name: string;
      givenPaise: number;
      stitchingPaise: number;
    }>(
      `SELECT i.id, i.category_id AS categoryId, c.name AS categoryName, i.name,
              i.price_paise AS givenPaise, i.stitching_paise AS stitchingPaise
       FROM pattern_items i
       JOIN pattern_categories c ON c.id = i.category_id
       WHERE EXISTS
         (SELECT 1 FROM pattern_item_images m WHERE m.item_id = i.id)
       ORDER BY c.id, i.id DESC`
    );
    const photos = await db.getAllAsync<{ itemId: number; imageName: string }>(
      `SELECT item_id AS itemId, image_name AS imageName
       FROM pattern_item_images ORDER BY item_id, position`
    );
    const images = new Map<number, string[]>();
    photos.forEach(({ itemId, imageName }) => {
      images.set(itemId, [...(images.get(itemId) ?? []), imageName]);
    });
    const cloths = await clothLinesOf(rows.map((row) => row.id));
    return rows.map(({ givenPaise, stitchingPaise, ...row }) => ({
      ...row,
      images: images.get(row.id) ?? [],
      pricePaise: shownPrice(
        cloths.get(row.id) ?? [],
        stitchingPaise,
        givenPaise
      ),
    }));
  },

  async getItem(id: number): Promise<PatternItem | null> {
    const db = getDatabase();
    const item = await db.getFirstAsync<{
      id: number;
      categoryId: number;
      categoryName: string;
      name: string;
      givenPaise: number;
      stitchingPaise: number;
      note: string | null;
      noteHindi: string | null;
      videoName: string | null;
    }>(
      `SELECT i.id, i.category_id AS categoryId, c.name AS categoryName,
              i.name, i.price_paise AS givenPaise,
              i.stitching_paise AS stitchingPaise,
              i.note, i.note_hi AS noteHindi,
              i.video_name AS videoName
       FROM pattern_items i
       JOIN pattern_categories c ON c.id = i.category_id
       WHERE i.id = ?`,
      [id]
    );
    if (!item) return null;
    const images = await db.getAllAsync<{ image_name: string }>(
      'SELECT image_name FROM pattern_item_images WHERE item_id = ? ORDER BY position',
      [id]
    );
    const cloths = (await clothLinesOf([id])).get(id) ?? [];
    const { givenPaise, ...rest } = item;
    return {
      ...rest,
      cloths,
      clothPaise: patternPrice(cloths, 0).clothPaise,
      pricePaise: shownPrice(cloths, item.stitchingPaise, givenPaise),
      images: images.map((row) => row.image_name),
    };
  },

  async createItem(input: PatternItemInput): Promise<number> {
    let itemId = 0;
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      const result = await tx.runAsync(
        `INSERT INTO pattern_items
           (category_id, name, price_paise, stitching_paise, note, note_hi,
            video_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.categoryId,
          input.name,
          priceOf(input),
          input.stitchingPaise,
          input.note,
          input.noteHindi,
          input.videoName,
        ]
      );
      itemId = result.lastInsertRowId;
      await insertCloths(tx, itemId, input.cloths);
      for (const [position, imageName] of input.images.entries()) {
        await tx.runAsync(
          `INSERT INTO pattern_item_images (item_id, image_name, position)
           VALUES (?, ?, ?)`,
          [itemId, imageName, position]
        );
      }
    });
    return itemId;
  },

  /**
   * Replaces the item's fields, photos and video. A photo or video the item
   * no longer has is deleted from the phone as well.
   */
  async updateItem(id: number, input: PatternItemInput): Promise<void> {
    const before = await patternRepo.getItem(id);
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE pattern_items
         SET category_id = ?, name = ?, price_paise = ?, stitching_paise = ?,
             note = ?, note_hi = ?, video_name = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
         WHERE id = ?`,
        [
          input.categoryId,
          input.name,
          priceOf(input, before),
          input.stitchingPaise,
          input.note,
          input.noteHindi,
          input.videoName,
          id,
        ]
      );
      await tx.runAsync('DELETE FROM pattern_item_cloths WHERE item_id = ?', [
        id,
      ]);
      await insertCloths(tx, id, input.cloths);
      await tx.runAsync('DELETE FROM pattern_item_images WHERE item_id = ?', [
        id,
      ]);
      for (const [position, imageName] of input.images.entries()) {
        await tx.runAsync(
          `INSERT INTO pattern_item_images (item_id, image_name, position)
           VALUES (?, ?, ?)`,
          [id, imageName, position]
        );
      }
    });
    if (!before) return;
    const kept = new Set([
      ...input.images,
      ...(input.videoName ? [input.videoName] : []),
    ]);
    [...before.images, ...(before.videoName ? [before.videoName] : [])]
      .filter((name) => !kept.has(name))
      .forEach(deletePatternMedia);
  },

  async removeItem(id: number): Promise<void> {
    const media = await mediaOfItems([id]);
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM pattern_item_cloths WHERE item_id = ?', [
        id,
      ]);
      await tx.runAsync('DELETE FROM pattern_item_images WHERE item_id = ?', [
        id,
      ]);
      await tx.runAsync('DELETE FROM pattern_items WHERE id = ?', [id]);
    });
    media.forEach(deletePatternMedia);
  },
};
