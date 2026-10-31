import { t } from '../i18n/t';
import type { Bill, ClothLineData, NewBill } from '../repositories/billRepo';
import {
  clothLineAmount,
  computeBillTotals,
  garmentLineAmount,
  metersToInput,
  parseMeters,
  type BillTotals,
  type Discount,
} from './billMath';
import { clothHindi } from './clothHindi';
import { normalizeDtValue } from './dtNumber';
import { readExtra } from './extraAmount';
import {
  formatRupees,
  paiseToInput,
  paiseToSignedInput,
  parseRupees,
  parseSignedRupees,
} from './money';

// The New Bill form as the tailor fills it in — every number still the text
// they typed — and the rules that turn it into a bill to save.

export interface ClothEntry {
  /** Tells two lines of the same cloth apart. */
  key: string;
  /** Null for a bill line made before bills remembered the cloth. */
  clothId: number | null;
  clothName: string;
  /** The Hindi saved for the cloth, if any — see clothHindi. */
  clothNameHindi: string | null;
  imageName: string | null;
  /** The catalog price, before any extra. */
  pricePerMeterPaise: number;
  /** Optional sub-type, as typed. */
  variant: string;
  /** Optional extra per meter for this bill, as typed. */
  extra: string;
  meters: string;
}

export interface GarmentEntry {
  key: string;
  name: string;
  /** Typed in by the tailor ("Other"), rather than picked from the list. */
  custom: boolean;
  quantity: number;
  /** Making charge for one piece, as typed. */
  making: string;
}

export type DiscountMode = 'amount' | 'percent';

export interface BillForm {
  customerName: string;
  customerMobile: string;
  /** What follows "DT", as typed. */
  dtNumber: string;
  cloths: ClothEntry[];
  garments: GarmentEntry[];
  discountMode: DiscountMode;
  discount: string;
  paidNow: string;
}

export interface BillFormErrors {
  customerMobile?: string;
  /** The bill has nothing on it. */
  items?: string;
  /** By entry key. */
  cloths: Record<string, { extra?: string; meters?: string }>;
  garments: Record<string, { name?: string; making?: string }>;
  discount?: string;
  paidNow?: string;
  /** The edited bill would come to less than has been paid on it. */
  total?: string;
}

export type BillFormResult =
  { ok: true; bill: NewBill } | { ok: false; errors: BillFormErrors };

export const EMPTY_BILL_FORM: BillForm = {
  customerName: '',
  customerMobile: '',
  dtNumber: '',
  cloths: [],
  garments: [],
  discountMode: 'amount',
  discount: '',
  paidNow: '',
};

const PERCENT_INPUT = /^\d{1,3}(\.\d{0,2})?$/;
const MOBILE = /^\d{10}$/;

/** The discount as typed; blank is no discount, null is not a number. */
export function readDiscount(
  mode: DiscountMode,
  text: string
): Discount | null {
  const trimmed = text.trim();
  if (mode === 'amount') {
    const paise = trimmed ? parseRupees(trimmed) : 0;
    return paise === null ? null : { kind: 'amount', paise };
  }
  if (!trimmed) return { kind: 'percent', percent: 0 };
  if (!PERCENT_INPUT.test(trimmed)) return null;
  const percent = Number(trimmed);
  return percent <= 100 ? { kind: 'percent', percent } : null;
}

/**
 * The rate a cloth line charges per meter: its catalog price plus whatever
 * extra was typed (an extra not yet a valid number counts as none).
 */
export function clothRate(cloth: ClothEntry): number {
  return cloth.pricePerMeterPaise + (parseSignedRupees(cloth.extra) ?? 0);
}

/**
 * The totals for what is on the form right now, reading anything not yet a
 * valid number as nothing — so the summary follows along as the tailor types.
 */
export function draftTotals(form: BillForm): BillTotals {
  return computeBillTotals(
    form.cloths.map((cloth) => ({
      pricePerMeterPaise: clothRate(cloth),
      lengthCm: parseMeters(cloth.meters) ?? 0,
    })),
    form.garments.map((garment) => ({
      quantity: garment.quantity,
      makingPaise: parseRupees(garment.making) ?? 0,
    })),
    readDiscount(form.discountMode, form.discount) ?? {
      kind: 'amount',
      paise: 0,
    }
  );
}

/** A cloth line of the bill being made, as the summary shows it. */
export interface DraftClothLine extends ClothLineData {
  key: string;
}

/** A stitching line of the bill being made, as the summary shows it. */
export interface DraftGarmentLine {
  key: string;
  name: string;
  quantity: number;
  makingPaise: number;
  amountPaise: number;
}

/**
 * Every line on the form as it will be billed, worked out the way the bill
 * is: the rate charged (catalog plus extra), the meters, what each comes to.
 * Anything not yet a valid number counts as nothing, like draftTotals.
 */
export function draftLines(form: BillForm): {
  cloths: DraftClothLine[];
  garments: DraftGarmentLine[];
} {
  return {
    cloths: form.cloths.map((cloth) => {
      const lengthCm = parseMeters(cloth.meters) ?? 0;
      const pricePerMeterPaise = clothRate(cloth);
      return {
        key: cloth.key,
        clothName: cloth.clothName,
        clothNameHindi: cloth.clothNameHindi,
        imageName: cloth.imageName,
        variant: cloth.variant.trim() || null,
        lengthCm,
        pricePerMeterPaise,
        extraPerMeterPaise: parseSignedRupees(cloth.extra) ?? 0,
        amountPaise: clothLineAmount({ pricePerMeterPaise, lengthCm }),
      };
    }),
    garments: form.garments.map((garment) => {
      const makingPaise = parseRupees(garment.making) ?? 0;
      return {
        key: garment.key,
        name: garment.name,
        quantity: garment.quantity,
        makingPaise,
        amountPaise: garmentLineAmount({
          quantity: garment.quantity,
          makingPaise,
        }),
      };
    }),
  };
}

export interface ValidateOptions {
  /**
   * Set when editing a bill that has had payments: what has been paid so far.
   * The payments stay as they are, so the bill may not come to less, and
   * "paid now" doesn't apply.
   */
  editingPaidPaise?: number;
}

export function validateBillForm(
  form: BillForm,
  { editingPaidPaise }: ValidateOptions = {}
): BillFormResult {
  const editing = editingPaidPaise !== undefined;
  const errors: BillFormErrors = { cloths: {}, garments: {} };
  let valid = true;
  const fail = (): void => {
    valid = false;
  };

  // The name is optional: a walk-in customer may be billed with none.
  const customerName = form.customerName.trim().replace(/\s+/g, ' ');

  const mobile = form.customerMobile.replace(/\s+/g, '');
  if (mobile && !MOBILE.test(mobile)) {
    errors.customerMobile = t('Enter a 10-digit mobile number');
    fail();
  }

  if (form.cloths.length === 0 && form.garments.length === 0) {
    errors.items = t('Add a cloth or a garment to make a bill');
    fail();
  }

  const cloths: NewBill['cloths'] = [];
  for (const cloth of form.cloths) {
    const lengthCm = parseMeters(cloth.meters);
    const extra = readExtra(cloth.extra, cloth.pricePerMeterPaise);
    const extraPaise = extra.ok ? extra.paise : null;
    const lineErrors: { extra?: string; meters?: string } = {};
    if (!extra.ok) lineErrors.extra = extra.error;
    if (lengthCm === null || lengthCm === 0) {
      lineErrors.meters = cloth.meters.trim()
        ? t('Enter meters like 2.5')
        : t('Enter meters');
    }
    if (
      lineErrors.extra ||
      lineErrors.meters ||
      !lengthCm ||
      extraPaise === null
    ) {
      errors.cloths[cloth.key] = lineErrors;
      fail();
    } else {
      const variant = cloth.variant.trim().replace(/\s+/g, ' ');
      cloths.push({
        clothId: cloth.clothId,
        clothName: cloth.clothName,
        // Written onto the bill as it reads now, so the bill never changes
        // with the catalog or with how Hindi is worked out later.
        clothNameHindi: clothHindi(cloth.clothName, cloth.clothNameHindi),
        variant: variant || null,
        pricePerMeterPaise: cloth.pricePerMeterPaise + extraPaise,
        extraPerMeterPaise: extraPaise,
        lengthCm,
      });
    }
  }

  const garments: NewBill['garments'] = [];
  for (const garment of form.garments) {
    const name = garment.name.trim().replace(/\s+/g, ' ');
    const makingPaise = parseRupees(garment.making);
    const lineErrors: { name?: string; making?: string } = {};
    if (!name) lineErrors.name = t('Enter the garment name');
    if (makingPaise === null) {
      lineErrors.making = garment.making.trim()
        ? t('Enter a charge like 400')
        : t('Enter making charge');
    }
    if (lineErrors.name || lineErrors.making || makingPaise === null) {
      errors.garments[garment.key] = lineErrors;
      fail();
    } else {
      garments.push({ name, quantity: garment.quantity, makingPaise });
    }
  }

  const discount = readDiscount(form.discountMode, form.discount);
  if (!discount) {
    errors.discount =
      form.discountMode === 'percent'
        ? t('Enter a percentage from 0 to 100')
        : t('Enter an amount like 100');
    fail();
  }

  const totalPaise = draftTotals(form).totalPaise;
  const paidNowPaise =
    editing || !form.paidNow.trim() ? 0 : parseRupees(form.paidNow);
  if (editing && totalPaise < editingPaidPaise) {
    errors.total = t(
      "The bill can't come to less than the {0} already paid",
      formatRupees(editingPaidPaise)
    );
    fail();
  }
  if (paidNowPaise === null) {
    errors.paidNow = t('Enter an amount like 500');
    fail();
  } else if (paidNowPaise > totalPaise) {
    errors.paidNow = t('More than the bill total');
    fail();
  }

  if (!valid || !discount || paidNowPaise === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    bill: {
      customerName,
      customerMobile: mobile || null,
      dtNumber: normalizeDtValue(form.dtNumber),
      cloths,
      garments,
      discount,
      paidNowPaise,
    },
  };
}

/**
 * An existing bill laid back out as the form that made it, to be changed.
 *
 * The catalog price is worked back out of the rate that was charged (rate
 * less the extra), so the extra still reads as an extra. A garment that
 * isn't one of the usual garments comes back as a typed-in one. The bill
 * keeps only a discount amount, so that is how it comes back — whichever way
 * it was first typed.
 */
export function formFromBill(
  bill: Bill,
  usualGarments: readonly string[],
  photoByClothId: ReadonlyMap<number, string | null>,
  nextKey: () => string
): BillForm {
  const usual = new Set(usualGarments.map((name) => name.toLowerCase()));
  return {
    customerName: bill.customerName,
    customerMobile: bill.customerMobile ?? '',
    dtNumber: bill.dtNumber ?? '',
    cloths: bill.cloths.map((cloth) => ({
      key: nextKey(),
      clothId: cloth.clothId,
      clothName: cloth.clothName,
      clothNameHindi: cloth.clothNameHindi,
      imageName:
        cloth.clothId === null
          ? null
          : (photoByClothId.get(cloth.clothId) ?? null),
      pricePerMeterPaise: cloth.pricePerMeterPaise - cloth.extraPerMeterPaise,
      variant: cloth.variant ?? '',
      extra: cloth.extraPerMeterPaise
        ? paiseToSignedInput(cloth.extraPerMeterPaise)
        : '',
      meters: metersToInput(cloth.lengthCm),
    })),
    garments: bill.garments.map((garment) => ({
      key: nextKey(),
      name: garment.name,
      custom: !usual.has(garment.name.toLowerCase()),
      quantity: garment.quantity,
      making: paiseToInput(garment.makingPaise),
    })),
    discountMode: 'amount',
    discount: bill.discountPaise ? paiseToInput(bill.discountPaise) : '',
    paidNow: '',
  };
}
