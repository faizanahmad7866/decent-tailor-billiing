import { t } from '../i18n/t';
import { parseRupees } from './money';

export const CLOTH_TYPE_NAME_MAX_LENGTH = 40;

interface NamedType {
  name: string;
  pricePerMeterPaise: number;
}

const same = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** The defined type a typed name is, whatever its capitals; undefined if none. */
export function matchType<T extends NamedType>(
  types: readonly T[],
  text: string
): T | undefined {
  return text.trim() ? types.find((type) => same(type.name, text)) : undefined;
}

/**
 * The rate a bill line should move to as its cloth type changes, or undefined
 * to leave it. Choosing a defined type takes its rate; leaving one for anything
 * else goes back to the cloth's. A name typed by hand, where no defined type is
 * involved, leaves the rate alone — so editing an old bill's note never quietly
 * reprices it.
 */
export function rateAfterTypeChange(
  types: readonly NamedType[],
  clothPricePaise: number,
  previousText: string,
  nextText: string
): number | undefined {
  const next = matchType(types, nextText);
  if (next) return next.pricePerMeterPaise;
  return matchType(types, previousText) ? clothPricePaise : undefined;
}

export type ClothTypeResult =
  | { ok: true; name: string; pricePerMeterPaise: number }
  | { ok: false; errors: { name?: string; price?: string } };

/** A type as typed on its sheet, against the names the cloth's others have. */
export function validateClothType(
  nameText: string,
  priceText: string,
  otherNames: readonly string[]
): ClothTypeResult {
  const name = nameText.trim().replace(/\s+/g, ' ');
  const paise = parseRupees(priceText);
  const errors: { name?: string; price?: string } = {};

  if (!name) errors.name = t('Enter the type name');
  else if (otherNames.some((other) => same(other, name))) {
    errors.name = t('“{0}” is already on this cloth', name);
  }

  if (!priceText.trim()) errors.price = t('Enter the price per meter');
  else if (paise === null) errors.price = t('Enter a price like 450 or 450.50');
  else if (paise === 0) errors.price = t('Price must be more than ₹0');

  if (errors.name || errors.price || paise === null) {
    return { ok: false, errors };
  }
  return { ok: true, name, pricePerMeterPaise: paise };
}
