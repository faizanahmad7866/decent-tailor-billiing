import { getDatabase } from '../db/database';

export interface GarmentRate {
  id: number;
  name: string;
  /** The usual making charge for one piece. */
  makingPaise: number;
}

export const garmentRateRepo = {
  /** In the shop's own order, most common garment first. */
  list(): Promise<GarmentRate[]> {
    return getDatabase().getAllAsync<GarmentRate>(
      `SELECT id, name, making_paise AS makingPaise
       FROM garment_rates ORDER BY sort_order, id`
    );
  },

  async updateRate(id: number, makingPaise: number): Promise<void> {
    if (!Number.isInteger(makingPaise) || makingPaise < 0) {
      throw new Error('Rate must be ₹0 or more');
    }
    await getDatabase().runAsync(
      'UPDATE garment_rates SET making_paise = ? WHERE id = ?',
      [makingPaise, id]
    );
  },
};
