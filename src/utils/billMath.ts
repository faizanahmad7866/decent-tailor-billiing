// A bill's arithmetic, in one place, on integers only: money in paise and
// cloth lengths in centimeters. Screens, the saved bill and the printout
// all take their numbers from here, so they can never disagree.

const CM_PER_METER = 100;

// What a meters field accepts: up to three digits of meters and two of
// centimeters — "2", "2.5", "2.25".
const METERS_INPUT = /^(\d{1,3}(\.\d{0,2})?|\.\d{1,2})$/;

/** "2.25" as 225 cm; null when the text isn't a length. */
export function parseMeters(text: string): number | null {
  const trimmed = text.trim();
  if (!METERS_INPUT.test(trimmed)) return null;
  return Math.round(Number(trimmed) * CM_PER_METER);
}

/** 225 cm as "2.25", 250 as "2.5", 300 as "3" — as the meters field shows it. */
export function metersToInput(cm: number): string {
  return String(Number((cm / CM_PER_METER).toFixed(2)));
}

// What the meters field accepts at most: 999 m (three digits of meters).
const MAX_FIELD_CM = 99900;

/**
 * The meters field after a − or + tap: moved by `deltaCm`, blank rather than
 * zero or negative, and never past what the field takes. Text that isn't a
 * length counts as nothing, so + on it starts from the step.
 */
export function stepMeters(text: string, deltaCm: number): string {
  const next = Math.min((parseMeters(text) ?? 0) + deltaCm, MAX_FIELD_CM);
  return next <= 0 ? '' : metersToInput(next);
}

/** 225 cm as "2.25 m", 250 as "2.5 m", 300 as "3 m". */
export function formatMeters(cm: number): string {
  return `${Number((cm / CM_PER_METER).toFixed(2))} m`;
}

/** The meters of cloth across a bill's lines, in cm. */
export function totalLengthCm(cloths: readonly { lengthCm: number }[]): number {
  return cloths.reduce((sum, cloth) => sum + cloth.lengthCm, 0);
}

export interface ClothLine {
  pricePerMeterPaise: number;
  lengthCm: number;
}

export interface GarmentLine {
  quantity: number;
  /** Making (stitching) charge for one piece. */
  makingPaise: number;
}

export type Discount =
  { kind: 'amount'; paise: number } | { kind: 'percent'; percent: number };

export interface BillTotals {
  clothPaise: number;
  makingPaise: number;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
}

export function clothLineAmount({
  pricePerMeterPaise,
  lengthCm,
}: ClothLine): number {
  return Math.round((pricePerMeterPaise * lengthCm) / CM_PER_METER);
}

export function garmentLineAmount({
  quantity,
  makingPaise,
}: GarmentLine): number {
  return quantity * makingPaise;
}

/**
 * The discount in paise. Never more than the subtotal, so a bill can't go
 * below ₹0 however the discount was typed.
 */
export function discountAmount(
  discount: Discount,
  subtotalPaise: number
): number {
  const paise =
    discount.kind === 'amount'
      ? discount.paise
      : Math.round((subtotalPaise * discount.percent) / 100);
  return Math.min(Math.max(paise, 0), subtotalPaise);
}

export function computeBillTotals(
  cloths: readonly ClothLine[],
  garments: readonly GarmentLine[],
  discount: Discount
): BillTotals {
  const clothPaise = cloths.reduce((sum, l) => sum + clothLineAmount(l), 0);
  const makingPaise = garments.reduce(
    (sum, line) => sum + garmentLineAmount(line),
    0
  );
  const subtotalPaise = clothPaise + makingPaise;
  const discountPaise = discountAmount(discount, subtotalPaise);
  return {
    clothPaise,
    makingPaise,
    subtotalPaise,
    discountPaise,
    totalPaise: subtotalPaise - discountPaise,
  };
}
