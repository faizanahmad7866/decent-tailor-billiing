import type { Cloth } from '../repositories/clothRepo';
import { priceMatchesQuery } from './amountSearch';

/**
 * Cloths matching what was typed into a cloth search. Words match the name
 * ("armani"); an amount matches the price per meter ("1200" finds every
 * cloth sold at ₹1,200 a meter, and "12" those from ₹12 up through ₹1,2xx
 * as the tailor keeps typing). A number can also be part of a name, so both
 * are tried.
 */
export function searchCloths(cloths: readonly Cloth[], query: string): Cloth[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...cloths];

  return cloths.filter(
    (cloth) =>
      cloth.name.toLowerCase().includes(needle) ||
      // A name typed in Hindi finds the cloth by its Hindi name.
      (cloth.nameHindi ?? '').includes(needle) ||
      priceMatchesQuery(cloth.pricePerMeterPaise, needle)
  );
}
