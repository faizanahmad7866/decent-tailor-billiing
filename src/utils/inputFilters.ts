// Filters applied to what is typed into a number field, so a wrong character
// never lands in it: the field simply doesn't take it. The rules match what
// the form's own parsers accept (parseRupees, parseMeters), so what the
// keyboard lets through is always something that can be read back.

export interface DecimalLimits {
  /** Most digits before the point. */
  int: number;
  /** Most digits after it. */
  frac: number;
}

// How much each kind of figure may hold. These mirror what the form's parsers
// accept (parseMeters, parseRupees, the discount percentage); the tests check
// that whatever passes a limit can be read back.
export const METER_LIMITS: DecimalLimits = { int: 3, frac: 2 };
export const RUPEE_LIMITS: DecimalLimits = { int: 7, frac: 2 };
export const PERCENT_LIMITS: DecimalLimits = { int: 3, frac: 2 };

/**
 * Keeps digits and a single point. A comma becomes the point, because many
 * keyboards show "," where "." belongs; anything else is dropped; digits past
 * the limits are cut off.
 */
export function sanitizeDecimal(
  text: string,
  { int, frac }: DecimalLimits
): string {
  const cleaned = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const point = cleaned.indexOf('.');
  if (point === -1) return cleaned.slice(0, int);

  const whole = cleaned.slice(0, point).slice(0, int);
  const fraction = cleaned
    .slice(point + 1)
    .replace(/\./g, '')
    .slice(0, frac);
  return `${whole}.${fraction}`;
}

/** Only digits, at most `max` of them — a mobile number. */
export function sanitizeDigits(text: string, max: number): string {
  return text.replace(/\D/g, '').slice(0, max);
}
