import { t } from '../i18n/t';
import { parseRupees } from './money';

export const CLOTH_NAME_MAX_LENGTH = 40;

export interface ClothFormErrors {
  name?: string;
  price?: string;
}

export type ClothFormResult =
  | { ok: true; name: string; pricePerMeterPaise: number }
  | { ok: false; errors: ClothFormErrors };

/** "  Cotton   Blue " → "Cotton Blue": stray spaces never make a new name. */
export function normalizeClothName(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Checks the form as typed and, when it holds up, returns what to save. */
export function validateClothForm(
  nameText: string,
  priceText: string
): ClothFormResult {
  const name = normalizeClothName(nameText);
  const paise = parseRupees(priceText);
  const errors: ClothFormErrors = {};

  if (!name) errors.name = t('Enter the cloth name');

  if (!priceText.trim()) errors.price = t('Enter the price per meter');
  else if (paise === null) errors.price = t('Enter a price like 450 or 450.50');
  else if (paise === 0) errors.price = t('Price must be more than ₹0');

  if (errors.name || errors.price || paise === null) {
    return { ok: false, errors };
  }
  return { ok: true, name, pricePerMeterPaise: paise };
}
