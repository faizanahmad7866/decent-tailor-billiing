import type { PatternItemSummary } from '../repositories/patternRepo';
import { priceMatchesQuery } from './amountSearch';

/**
 * The designs matching what was typed into a category's search. Words match
 * the name ("jodhpuri"); an amount matches the price ("15000" finds every
 * design at ₹15,000, and "15" those from ₹15 up through ₹15,xxx as the
 * tailor keeps typing). A number can also be part of a name, so both are
 * tried.
 */
export function searchPatternItems(
  items: readonly PatternItemSummary[],
  query: string
): PatternItemSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...items];
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) ||
      priceMatchesQuery(item.pricePaise, needle)
  );
}
