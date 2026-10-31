import { t } from '../i18n/t';
import { parseMeters } from './billMath';
import { readExtra } from './extraAmount';
import { parseRupees } from './money';

export const PATTERN_NAME_MAX_LENGTH = 60;
export const CATEGORY_NAME_MAX_LENGTH = 30;

/** Photos an item may carry; the first is its cover. */
export const MAX_PATTERN_IMAGES = 3;

export interface PatternItemErrors {
  name?: string;
  /** One entry per cloth, in order: what is wrong with its extra. */
  extras: (string | undefined)[];
  /** One entry per cloth, in order: what is wrong with its meters. */
  meters: (string | undefined)[];
  stitching?: string;
}

export type PatternItemResult =
  | {
      ok: true;
      name: string;
      /** The meters of each cloth, in cm, in the order given. */
      lengthsCm: number[];
      /** The extra per meter of each cloth, in paise, in the order given. */
      extrasPaise: number[];
      stitchingPaise: number;
    }
  | { ok: false; errors: PatternItemErrors };

/** "  Royal   Jodhpuri " → "Royal Jodhpuri": stray spaces never make a new name. */
export function normalizePatternName(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Checks a design as typed — its name, the extra and meters beside each cloth
 * it needs, and its stitching charge (blank is none) — and, when it holds up, returns
 * what to save. The price is not typed: it is worked out from these.
 */
export function validatePatternItem(
  nameText: string,
  lines: readonly {
    extra: string;
    meters: string;
    /** The cloth's catalog price, which a reduction may not reach. */
    pricePerMeterPaise: number;
  }[],
  stitchingText: string
): PatternItemResult {
  const name = normalizePatternName(nameText);
  const errors: PatternItemErrors = { extras: [], meters: [] };

  if (!name) errors.name = t('Enter the design name');

  const lengthsCm: number[] = [];
  const extrasPaise: number[] = [];
  let linesOk = true;
  lines.forEach(({ extra, meters, pricePerMeterPaise }, index) => {
    const cm = parseMeters(meters);
    if (cm === null || cm <= 0) {
      errors.meters[index] = t('Enter the meters, like 2.5');
      linesOk = false;
    } else {
      lengthsCm.push(cm);
    }
    // Blank is no extra, and a minus takes off, as on a bill.
    const extraResult = readExtra(extra, pricePerMeterPaise);
    if (!extraResult.ok) {
      errors.extras[index] = extraResult.error;
      linesOk = false;
    } else {
      extrasPaise.push(extraResult.paise);
    }
  });

  const stitchingPaise = stitchingText.trim() ? parseRupees(stitchingText) : 0;
  if (stitchingPaise === null) {
    errors.stitching = t('Enter an amount like 1500');
  }

  if (errors.name || !linesOk || stitchingPaise === null) {
    return { ok: false, errors };
  }
  return { ok: true, name, lengthsCm, extrasPaise, stitchingPaise };
}

export type CategoryNameResult =
  { ok: true; name: string } | { ok: false; error: string };

/** A category's name as typed, tidied, or why it can't be one. */
export function validateCategoryName(text: string): CategoryNameResult {
  const name = normalizePatternName(text);
  return name
    ? { ok: true, name }
    : { ok: false, error: t('Enter a category name') };
}
