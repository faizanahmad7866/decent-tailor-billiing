// Searching a list of priced things by what was typed: a price is found by
// its digits, the way a tailor says it — "1200", "₹1200", "450.50" — and by
// the front of them while the typing goes on.

// What counts as an amount: digits with an optional ₹ in front and up to two
// paise digits.
const AMOUNT_QUERY = /^₹?\s*(\d+)(\.\d{1,2})?$/;

/**
 * The rupees written in a search, or null when it isn't an amount. Returned as
 * the digits typed, so "12" can be matched against the front of "1200" while
 * the tailor is still typing.
 */
function amountDigits(query: string): string | null {
  const match = AMOUNT_QUERY.exec(query.trim());
  return match ? match[1] + (match[2] ?? '') : null;
}

/** 120000 paise as "1200", 45050 as "450.50" — the way a price is typed. */
function rupeesText(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction
    ? `${rupees}.${String(fraction).padStart(2, '0')}`
    : `${rupees}`;
}

/** Whether a search that is an amount matches this price. False for words. */
export function priceMatchesQuery(paise: number, query: string): boolean {
  const amount = amountDigits(query);
  return amount !== null && rupeesText(paise).startsWith(amount);
}
