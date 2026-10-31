import { getDatabase } from '../db/database';
import { deleteClothPhoto } from '../storage/clothImageStore';

export interface Cloth {
  id: number;
  name: string;
  /** The name in Hindi letters; null until one is saved for the cloth. */
  nameHindi: string | null;
  pricePerMeterPaise: number;
  imageName: string | null;
  /** An optional note on the cloth ("Dry clean only"). */
  note: string | null;
  /** The note in Hindi, as saved with it. */
  noteHindi: string | null;
}

export type ClothInput = Omit<Cloth, 'id'>;

/** Another cloth already has this name (names are unique, ignoring case). */
export class DuplicateClothNameError extends Error {
  constructor(name: string) {
    super(`A cloth named "${name}" already exists`);
    this.name = 'DuplicateClothNameError';
  }
}

const SELECT_CLOTH = `
  SELECT id, name, name_hi AS nameHindi,
         price_per_meter_paise AS pricePerMeterPaise,
         image_name AS imageName,
         note, note_hi AS noteHindi
  FROM cloths`;

// Checked before writing so the tailor gets a plain message; the UNIQUE
// constraint on the column is what actually guarantees it.
async function assertNameFree(name: string, exceptId?: number): Promise<void> {
  const taken = await getDatabase().getFirstAsync<{ id: number }>(
    'SELECT id FROM cloths WHERE name = ? AND id IS NOT ?',
    [name, exceptId ?? null]
  );
  if (taken) throw new DuplicateClothNameError(name);
}

export const clothRepo = {
  list(): Promise<Cloth[]> {
    return getDatabase().getAllAsync<Cloth>(`${SELECT_CLOTH} ORDER BY name`);
  },

  get(id: number): Promise<Cloth | null> {
    return getDatabase().getFirstAsync<Cloth>(`${SELECT_CLOTH} WHERE id = ?`, [
      id,
    ]);
  },

  async create(input: ClothInput): Promise<number> {
    await assertNameFree(input.name);
    const result = await getDatabase().runAsync(
      `INSERT INTO cloths
         (name, name_hi, price_per_meter_paise, image_name, note, note_hi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.nameHindi,
        input.pricePerMeterPaise,
        input.imageName,
        input.note,
        input.noteHindi,
      ]
    );
    return result.lastInsertRowId;
  },

  // A photo lives exactly as long as the cloth pointing at it: replacing or
  // removing it here, or deleting the cloth, deletes the file too.
  async update(id: number, input: ClothInput): Promise<void> {
    await assertNameFree(input.name, id);
    const previous = await clothRepo.get(id);
    await getDatabase().runAsync(
      `UPDATE cloths
       SET name = ?, name_hi = ?, price_per_meter_paise = ?, image_name = ?,
           note = ?, note_hi = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       WHERE id = ?`,
      [
        input.name,
        input.nameHindi,
        input.pricePerMeterPaise,
        input.imageName,
        input.note,
        input.noteHindi,
        id,
      ]
    );
    if (previous?.imageName && previous.imageName !== input.imageName) {
      deleteClothPhoto(previous.imageName);
    }
  },

  async remove(id: number): Promise<void> {
    const cloth = await clothRepo.get(id);
    const typePhotos = await getDatabase().getAllAsync<{ image_name: string }>(
      `SELECT image_name FROM cloth_types
       WHERE cloth_id = ? AND image_name IS NOT NULL`,
      [id]
    );
    // Its types go with it, by the table's own ON DELETE CASCADE.
    await getDatabase().runAsync('DELETE FROM cloths WHERE id = ?', [id]);
    if (cloth?.imageName) deleteClothPhoto(cloth.imageName);
    typePhotos.forEach((row) => deleteClothPhoto(row.image_name));
  },
};
