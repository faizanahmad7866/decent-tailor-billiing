import { getDatabase } from '../db/database';
import { deleteClothPhoto } from '../storage/clothImageStore';

// The types a cloth comes in, each with its own rate and, if the tailor wants,
// its own photo and QR label: "Royal" and "Classic" of an Armani. Optional — a
// cloth with none works exactly as it always has.

export interface ClothType {
  id: number;
  clothId: number;
  name: string;
  pricePerMeterPaise: number;
  imageName: string | null;
}

/** A type as a form holds it; with no id it has not been saved yet. */
export interface ClothTypeDraft {
  id?: number;
  name: string;
  pricePerMeterPaise: number;
  imageName: string | null;
}

const SELECT_TYPE = `
  SELECT id, cloth_id AS clothId, name,
         price_per_meter_paise AS pricePerMeterPaise,
         image_name AS imageName
  FROM cloth_types`;

export const clothTypeRepo = {
  /** A cloth's types, A to Z. */
  list(clothId: number): Promise<ClothType[]> {
    return getDatabase().getAllAsync<ClothType>(
      `${SELECT_TYPE} WHERE cloth_id = ? ORDER BY name`,
      [clothId]
    );
  },

  get(id: number): Promise<ClothType | null> {
    return getDatabase().getFirstAsync<ClothType>(
      `${SELECT_TYPE} WHERE id = ?`,
      [id]
    );
  },

  async add(clothId: number, draft: ClothTypeDraft): Promise<number> {
    const result = await getDatabase().runAsync(
      `INSERT INTO cloth_types (cloth_id, name, price_per_meter_paise, image_name)
       VALUES (?, ?, ?, ?)`,
      [clothId, draft.name, draft.pricePerMeterPaise, draft.imageName]
    );
    return result.lastInsertRowId;
  },

  // A photo lives exactly as long as the type pointing at it.
  async update(id: number, draft: ClothTypeDraft): Promise<void> {
    const previous = await clothTypeRepo.get(id);
    await getDatabase().runAsync(
      `UPDATE cloth_types
       SET name = ?, price_per_meter_paise = ?, image_name = ?
       WHERE id = ?`,
      [draft.name, draft.pricePerMeterPaise, draft.imageName, id]
    );
    if (previous?.imageName && previous.imageName !== draft.imageName) {
      deleteClothPhoto(previous.imageName);
    }
  },

  async remove(id: number): Promise<void> {
    const previous = await clothTypeRepo.get(id);
    await getDatabase().runAsync('DELETE FROM cloth_types WHERE id = ?', [id]);
    if (previous?.imageName) deleteClothPhoto(previous.imageName);
  },

  /** Makes a cloth's types match what a form ended with: added, changed, gone. */
  async saveAll(clothId: number, drafts: ClothTypeDraft[]): Promise<void> {
    const before = await clothTypeRepo.list(clothId);
    const kept = new Set(drafts.map((draft) => draft.id));
    // Gone first, so a name let go of can be taken by another in the same save.
    for (const type of before) {
      if (!kept.has(type.id)) await clothTypeRepo.remove(type.id);
    }
    for (const draft of drafts) {
      if (draft.id === undefined) await clothTypeRepo.add(clothId, draft);
      else await clothTypeRepo.update(draft.id, draft);
    }
  },
};
