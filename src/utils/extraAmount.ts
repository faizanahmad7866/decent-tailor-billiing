import { t } from '../i18n/t';
import { formatRupees, parseSignedRupees } from './money';

// The extra per meter on a cloth: added to the catalog price, or — when the
// cloth sells for less than the catalog says ("Royal Armani" at ₹1,000 where
// Armani is ₹1,200) — taken off it, typed as a minus.

export type ExtraResult =
  { ok: true; paise: number } | { ok: false; error: string };

/**
 * The extra as typed, against the cloth's catalog price. Blank is no extra.
 * A reduction may not take the rate to nothing: a cloth is never free.
 */
export function readExtra(text: string, basePaise: number): ExtraResult {
  if (!text.trim()) return { ok: true, paise: 0 };
  const paise = parseSignedRupees(text);
  if (paise === null)
    return { ok: false, error: t('Enter an amount like 100') };
  if (basePaise + paise <= 0) {
    return {
      ok: false,
      error: t(
        "Take off less than {0}, the cloth's price",
        formatRupees(basePaise)
      ),
    };
  }
  return { ok: true, paise };
}
