import type { ClothSaleLine } from '../utils/clothSales';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../db/database';
import {
  clothLineAmount,
  computeBillTotals,
  garmentLineAmount,
  type Discount,
} from '../utils/billMath';

export interface NewBillCloth {
  /** Null for a line made before bills remembered which cloth it came from. */
  clothId: number | null;
  clothName: string;
  /** The name in Hindi as it stood when the bill was made. */
  clothNameHindi: string | null;
  /** The sub-type the tailor typed, e.g. "Royal Blue Linen". */
  variant: string | null;
  /** Catalog price plus the extra: the rate this bill charges. */
  pricePerMeterPaise: number;
  /** Charged on top of the catalog price, for this bill only. */
  extraPerMeterPaise: number;
  lengthCm: number;
}

export interface NewBill {
  customerName: string;
  customerMobile: string | null;
  /** The tailor's DT number, without the "DT"; null for none. */
  dtNumber: string | null;
  cloths: NewBillCloth[];
  garments: { name: string; quantity: number; makingPaise: number }[];
  discount: Discount;
  /** Taken from the customer as the bill is made; 0 for none. */
  paidNowPaise: number;
}

/** A bill's contents as edited: everything but the payments, which have
 *  their own screen and are never rewritten here. */
export type BillEdit = Omit<NewBill, 'paidNowPaise'>;

/** The new total would be less than what the customer has already paid. */
export class BillBelowPaymentsError extends Error {
  constructor(readonly paidPaise: number) {
    super('A bill cannot come to less than has already been paid on it');
    this.name = 'BillBelowPaymentsError';
  }
}

export interface BillSummary {
  id: number;
  customerName: string;
  customerMobile: string | null;
  /** The tailor's DT number, without the "DT"; null for none. */
  dtNumber: string | null;
  totalPaise: number;
  paidPaise: number;
  createdAt: string;
  /** Every cloth and sub-type on the bill, comma-separated: listed, and searched. */
  clothText: string | null;
  /** The meters of cloth on the bill, in cm. */
  totalLengthCm: number;
}

export interface BillClothRow {
  id: number;
  clothId: number | null;
  clothName: string;
  clothNameHindi: string | null;
  /** The catalog photo of the cloth; null if it has none or was deleted. */
  imageName: string | null;
  variant: string | null;
  pricePerMeterPaise: number;
  extraPerMeterPaise: number;
  lengthCm: number;
  amountPaise: number;
}

/** What shows of a cloth line: a saved bill's, or one still being made. */
export type ClothLineData = Pick<
  BillClothRow,
  | 'clothName'
  | 'clothNameHindi'
  | 'imageName'
  | 'variant'
  | 'lengthCm'
  | 'pricePerMeterPaise'
  | 'extraPerMeterPaise'
  | 'amountPaise'
>;

export interface BillGarmentRow {
  id: number;
  name: string;
  quantity: number;
  makingPaise: number;
  amountPaise: number;
}

export interface PaymentRow {
  id: number;
  amountPaise: number;
  createdAt: string;
}

export interface Bill extends BillSummary {
  clothPaise: number;
  makingPaise: number;
  discountPaise: number;
  cloths: BillClothRow[];
  garments: BillGarmentRow[];
  payments: PaymentRow[];
}

/** What the customer still owes. */
export function pendingPaise(
  bill: Pick<BillSummary, 'totalPaise' | 'paidPaise'>
): number {
  return Math.max(bill.totalPaise - bill.paidPaise, 0);
}

/** "Armani — Royal Blue Linen", or just "Armani" without a sub-type. */
export function clothLineName({
  clothName,
  variant,
}: Pick<BillClothRow, 'clothName' | 'variant'>): string {
  return variant ? `${clothName} — ${variant}` : clothName;
}

// Read from `bills b`. What has been paid is always summed from the payments
// themselves, never stored, so it can't drift from them.
const SUMMARY_COLUMNS = `
  b.id, b.customer_name AS customerName, b.customer_mobile AS customerMobile,
  b.dt_number AS dtNumber,
  b.total_paise AS totalPaise, b.created_at AS createdAt,
  COALESCE((SELECT SUM(p.amount_paise) FROM payments p
            WHERE p.bill_id = b.id), 0) AS paidPaise,
  (SELECT GROUP_CONCAT(c.cloth_name || COALESCE(' ' || c.variant, ''), ', ')
   FROM bill_cloths c WHERE c.bill_id = b.id) AS clothText,
  COALESCE((SELECT SUM(c.length_cm) FROM bill_cloths c
            WHERE c.bill_id = b.id), 0) AS totalLengthCm`;

/** Writes a bill's cloth and garment lines. Runs inside a transaction. */
async function insertLines(
  tx: SQLiteDatabase,
  billId: number,
  bill: BillEdit
): Promise<void> {
  for (const cloth of bill.cloths) {
    await tx.runAsync(
      `INSERT INTO bill_cloths (bill_id, cloth_id, cloth_name, cloth_name_hi,
                                variant, price_per_meter_paise,
                                extra_per_meter_paise, length_cm,
                                amount_paise)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billId,
        cloth.clothId,
        cloth.clothName,
        cloth.clothNameHindi,
        cloth.variant,
        cloth.pricePerMeterPaise,
        cloth.extraPerMeterPaise,
        cloth.lengthCm,
        clothLineAmount(cloth),
      ]
    );
  }
  for (const garment of bill.garments) {
    await tx.runAsync(
      `INSERT INTO bill_garments (bill_id, name, quantity, making_paise,
                                  amount_paise)
       VALUES (?, ?, ?, ?, ?)`,
      [
        billId,
        garment.name,
        garment.quantity,
        garment.makingPaise,
        garmentLineAmount(garment),
      ]
    );
  }
}

export const billRepo = {
  /** Newest first. */
  list(): Promise<BillSummary[]> {
    return getDatabase().getAllAsync<BillSummary>(
      `SELECT ${SUMMARY_COLUMNS} FROM bills b ORDER BY b.id DESC`
    );
  },

  async get(id: number): Promise<Bill | null> {
    const db = getDatabase();
    const bill = await db.getFirstAsync<
      Omit<Bill, 'cloths' | 'garments' | 'payments'>
    >(
      `SELECT ${SUMMARY_COLUMNS}, b.cloth_paise AS clothPaise,
              b.making_paise AS makingPaise, b.discount_paise AS discountPaise
       FROM bills b WHERE b.id = ?`,
      [id]
    );
    if (!bill) return null;

    const [cloths, garments, payments] = await Promise.all([
      db.getAllAsync<BillClothRow>(
        `SELECT bc.id, bc.cloth_id AS clothId, bc.cloth_name AS clothName,
                bc.cloth_name_hi AS clothNameHindi,
                cl.image_name AS imageName, bc.variant,
                bc.price_per_meter_paise AS pricePerMeterPaise,
                bc.extra_per_meter_paise AS extraPerMeterPaise,
                bc.length_cm AS lengthCm, bc.amount_paise AS amountPaise
         FROM bill_cloths bc LEFT JOIN cloths cl ON cl.id = bc.cloth_id
         WHERE bc.bill_id = ? ORDER BY bc.id`,
        [id]
      ),
      db.getAllAsync<BillGarmentRow>(
        `SELECT id, name, quantity, making_paise AS makingPaise,
                amount_paise AS amountPaise
         FROM bill_garments WHERE bill_id = ? ORDER BY id`,
        [id]
      ),
      db.getAllAsync<PaymentRow>(
        `SELECT id, amount_paise AS amountPaise, created_at AS createdAt
         FROM payments WHERE bill_id = ? ORDER BY id`,
        [id]
      ),
    ]);
    return { ...bill, cloths, garments, payments };
  },

  /**
   * Saves the bill with all its lines and any payment taken now, together:
   * either the whole bill is saved or none of it is.
   */
  async create(bill: NewBill): Promise<number> {
    const totals = computeBillTotals(bill.cloths, bill.garments, bill.discount);
    if (bill.paidNowPaise > totals.totalPaise) {
      throw new Error('Payment is more than the bill total');
    }

    let billId = 0;
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      const result = await tx.runAsync(
        `INSERT INTO bills (customer_name, customer_mobile, dt_number,
                            cloth_paise, making_paise, discount_paise,
                            total_paise)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bill.customerName,
          bill.customerMobile,
          bill.dtNumber,
          totals.clothPaise,
          totals.makingPaise,
          totals.discountPaise,
          totals.totalPaise,
        ]
      );
      billId = result.lastInsertRowId;

      await insertLines(tx, billId, bill);
      if (bill.paidNowPaise > 0) {
        await tx.runAsync(
          'INSERT INTO payments (bill_id, amount_paise) VALUES (?, ?)',
          [billId, bill.paidNowPaise]
        );
      }
    });
    return billId;
  },

  /**
   * Replaces what a bill is made of — customer, cloth, stitching, discount —
   * and works its totals out again, keeping its number, its date and every
   * payment already taken. All or nothing, like making one.
   */
  async update(billId: number, bill: BillEdit): Promise<void> {
    const totals = computeBillTotals(bill.cloths, bill.garments, bill.discount);

    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      const existing = await tx.getFirstAsync<{ paid: number }>(
        `SELECT COALESCE((SELECT SUM(amount_paise) FROM payments
                          WHERE bill_id = b.id), 0) AS paid
         FROM bills b WHERE b.id = ?`,
        [billId]
      );
      if (!existing) throw new Error('Bill not found');
      // Read inside the transaction, so a payment saved a moment ago counts.
      if (totals.totalPaise < existing.paid) {
        throw new BillBelowPaymentsError(existing.paid);
      }

      await tx.runAsync(
        `UPDATE bills
         SET customer_name = ?, customer_mobile = ?, dt_number = ?,
             cloth_paise = ?, making_paise = ?, discount_paise = ?,
             total_paise = ?
         WHERE id = ?`,
        [
          bill.customerName,
          bill.customerMobile,
          bill.dtNumber,
          totals.clothPaise,
          totals.makingPaise,
          totals.discountPaise,
          totals.totalPaise,
          billId,
        ]
      );
      await tx.runAsync('DELETE FROM bill_cloths WHERE bill_id = ?', [billId]);
      await tx.runAsync('DELETE FROM bill_garments WHERE bill_id = ?', [
        billId,
      ]);
      await insertLines(tx, billId, bill);
    });
  },

  /**
   * Deletes a bill with its lines and its payments, all or nothing. Each
   * table is cleared by hand rather than left to ON DELETE CASCADE: SQLite
   * enforces that per connection, and a transaction runs on its own
   * connection. The bill's number is never given out again.
   */
  async remove(billId: number): Promise<void> {
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM bill_cloths WHERE bill_id = ?', [billId]);
      await tx.runAsync('DELETE FROM bill_garments WHERE bill_id = ?', [
        billId,
      ]);
      await tx.runAsync('DELETE FROM payments WHERE bill_id = ?', [billId]);
      await tx.runAsync('DELETE FROM bills WHERE id = ?', [billId]);
    });
  },

  /**
   * Every cloth line of every bill, for the Analytics page to add up. A cloth
   * still in the catalog goes by its name today, so a renamed one stays one.
   */
  clothSaleLines(): Promise<ClothSaleLine[]> {
    return getDatabase().getAllAsync<ClothSaleLine>(
      `SELECT bc.bill_id AS billId, b.created_at AS createdAt,
              bc.cloth_id AS clothId,
              COALESCE(c.name, bc.cloth_name) AS clothName,
              COALESCE(c.name_hi, bc.cloth_name_hi) AS clothNameHindi,
              bc.variant AS variant, bc.length_cm AS lengthCm,
              bc.amount_paise AS amountPaise
       FROM bill_cloths bc
       JOIN bills b ON b.id = bc.bill_id
       LEFT JOIN cloths c ON c.id = bc.cloth_id`
    );
  },

  /** Sub-types used for this cloth on earlier bills, most recent first. */
  async recentVariants(clothId: number, limit = 6): Promise<string[]> {
    const rows = await getDatabase().getAllAsync<{ variant: string }>(
      `SELECT variant FROM bill_cloths
       WHERE cloth_id = ? AND variant IS NOT NULL
       GROUP BY variant COLLATE NOCASE
       ORDER BY MAX(id) DESC
       LIMIT ?`,
      [clothId, limit]
    );
    return rows.map((row) => row.variant);
  },

  async addPayment(billId: number, amountPaise: number): Promise<void> {
    await getDatabase().withExclusiveTransactionAsync(async (tx) => {
      // Re-read inside the transaction, so two quick payments can't both
      // pass the check against the same stale balance.
      const bill = await tx.getFirstAsync<BillSummary>(
        `SELECT ${SUMMARY_COLUMNS} FROM bills b WHERE b.id = ?`,
        [billId]
      );
      if (!bill) throw new Error('Bill not found');
      if (amountPaise <= 0 || amountPaise > pendingPaise(bill)) {
        throw new Error('Payment is more than the amount due');
      }
      await tx.runAsync(
        'INSERT INTO payments (bill_id, amount_paise) VALUES (?, ?)',
        [billId, amountPaise]
      );
    });
  },
};
