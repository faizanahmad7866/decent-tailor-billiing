import { isInRange, monthsAgo, startOfDay, type DateRange } from './dateRange';

// What the Analytics page shows: which cloth sold how much in a stretch of days,
// and what the cloth business came to. Worked out from the bills' own cloth
// lines, so it is what was actually charged. A discount is on the whole bill, not
// on a cloth, so these are the amounts before any discount.

/** A cloth line of a bill, as the database hands it over. */
export interface ClothSaleLine {
  billId: number;
  createdAt: string;
  /** Null for a line from before bills remembered their cloth. */
  clothId: number | null;
  clothName: string;
  clothNameHindi: string | null;
  variant: string | null;
  lengthCm: number;
  amountPaise: number;
}

export interface ClothTypeSale {
  /** Null for what was sold with no type on it. */
  name: string | null;
  lengthCm: number;
  amountPaise: number;
}

export interface ClothSale {
  key: string;
  clothName: string;
  clothNameHindi: string | null;
  lengthCm: number;
  amountPaise: number;
  billCount: number;
  /** This cloth's part of all the cloth sold, 0 to 1. */
  share: number;
  /** By type, most sold first; empty for a cloth sold with no types at all. */
  types: ClothTypeSale[];
}

export interface ClothSalesSummary {
  amountPaise: number;
  lengthCm: number;
  billCount: number;
  /** Most sold first, by amount. */
  cloths: ClothSale[];
}

export type SalesPeriod = 1 | 2 | 6;

export const SALES_PERIODS: readonly SalesPeriod[] = [1, 2, 6];

/** The default the page opens on. */
export const DEFAULT_SALES_PERIOD: SalesPeriod = 1;

/** The days a period covers: back that many months from today. */
export function salesRange(
  months: SalesPeriod,
  now: Date = new Date()
): DateRange {
  const today = startOfDay(now);
  return { from: monthsAgo(today, months), to: today };
}

/** Adds up the lines that fall in `range`, cloth by cloth. */
export function summarizeClothSales(
  lines: readonly ClothSaleLine[],
  range: DateRange
): ClothSalesSummary {
  interface Group {
    sale: ClothSale;
    bills: Set<number>;
    types: Map<string, ClothTypeSale>;
  }
  const groups = new Map<string, Group>();
  const allBills = new Set<number>();
  let amountPaise = 0;
  let lengthCm = 0;

  for (const line of lines) {
    if (!isInRange(line.createdAt, range)) continue;
    amountPaise += line.amountPaise;
    lengthCm += line.lengthCm;
    allBills.add(line.billId);

    // By the catalog's cloth, so a renamed cloth stays one; a line with none is
    // known only by its name.
    const key =
      line.clothId !== null
        ? `id:${line.clothId}`
        : `name:${line.clothName.trim().toLowerCase()}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        sale: {
          key,
          clothName: line.clothName,
          clothNameHindi: line.clothNameHindi,
          lengthCm: 0,
          amountPaise: 0,
          billCount: 0,
          share: 0,
          types: [],
        },
        bills: new Set(),
        types: new Map(),
      };
      groups.set(key, group);
    }
    group.sale.lengthCm += line.lengthCm;
    group.sale.amountPaise += line.amountPaise;
    group.bills.add(line.billId);

    const variant = line.variant?.trim() || null;
    const typeKey = variant?.toLowerCase() ?? '';
    const type = group.types.get(typeKey) ?? {
      name: variant,
      lengthCm: 0,
      amountPaise: 0,
    };
    type.lengthCm += line.lengthCm;
    type.amountPaise += line.amountPaise;
    group.types.set(typeKey, type);
  }

  const cloths = [...groups.values()]
    .map(({ sale, bills, types }) => {
      const byType = [...types.values()].sort(
        (a, b) => b.amountPaise - a.amountPaise
      );
      return {
        ...sale,
        billCount: bills.size,
        share: amountPaise > 0 ? sale.amountPaise / amountPaise : 0,
        // Nothing to split if the only "type" is having none.
        types: byType.some((type) => type.name !== null) ? byType : [],
      };
    })
    .sort(
      (a, b) =>
        b.amountPaise - a.amountPaise || a.clothName.localeCompare(b.clothName)
    );

  return { amountPaise, lengthCm, billCount: allBills.size, cloths };
}
