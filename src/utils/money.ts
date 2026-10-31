// Money is held as whole paise everywhere in the app and only turned into
// rupees at the edges — what the tailor types, and what the screen shows.
// Adding decimal rupees in floating point drifts (0.1 + 0.2), which a bill
// can't afford; integers never do.

const PAISE_PER_RUPEE = 100;

// What a price field accepts: up to seven digits of rupees and two of paise,
// no sign or separators. Seven digits (₹99,99,999) is far past any cloth.
const RUPEE_INPUT = /^(\d{1,7}(\.\d{0,2})?|\.\d{1,2})$/;

/** "450" or "450.5" as paise; null when the text isn't a price. */
export function parseRupees(text: string): number | null {
  const trimmed = text.trim();
  if (!RUPEE_INPUT.test(trimmed)) return null;
  return Math.round(Number(trimmed) * PAISE_PER_RUPEE);
}

/**
 * An amount that may be taken off as well as added: "200", "-200" or "−200"
 * (the minus sign of a keyboard, or the true one) as paise, negative for a
 * reduction; null when the text isn't an amount.
 */
export function parseSignedRupees(text: string): number | null {
  const trimmed = text.trim();
  const negative = /^[-−]/.test(trimmed);
  const paise = parseRupees(negative ? trimmed.slice(1) : trimmed);
  if (paise === null) return null;
  // A "-0" is no reduction at all.
  return negative && paise > 0 ? -paise : paise;
}

/** A signed amount in paise as the field shows it for editing: "-200", "-2.50". */
export function paiseToSignedInput(paise: number): string {
  return paise < 0 ? `-${paiseToInput(-paise)}` : paiseToInput(paise);
}

/** Paise back into the form the price field shows for editing: "450.50". */
export function paiseToInput(paise: number): string {
  const rupees = Math.floor(paise / PAISE_PER_RUPEE);
  const fraction = paise % PAISE_PER_RUPEE;
  return fraction
    ? `${rupees}.${String(fraction).padStart(2, '0')}`
    : String(rupees);
}

// Indian grouping: the last three digits, then pairs — 1,23,45,678.
function groupIndian(digits: string): string {
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  if (!rest) return lastThree;
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
}

/** "₹1,23,450" — paise are shown only when there are some: "₹450.50". */
export function formatRupees(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(Math.round(paise));
  const rupees = groupIndian(String(Math.floor(abs / PAISE_PER_RUPEE)));
  const fraction = abs % PAISE_PER_RUPEE;
  const decimals = fraction ? `.${String(fraction).padStart(2, '0')}` : '';
  return `${sign}₹${rupees}${decimals}`;
}
