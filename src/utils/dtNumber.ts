// The DT number a tailor can put on a bill: the "DT" is fixed, and what follows
// is theirs, letters and numbers as they write it on a cloth tag — "1", "-1",
// "A-1". It is printed exactly as written. Optional, and not checked against
// other bills: it is the tailor's own reference.

export const DT_VALUE_MAX_LENGTH = 12;

/** What may be typed: what a tag and the printer's own font can both carry. */
export function sanitizeDtInput(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ./-]/g, '')
    .slice(0, DT_VALUE_MAX_LENGTH);
}

/**
 * The value to keep, without the "DT" the box already has — so typing "DT-5"
 * doesn't print "DT DT-5" — or null where there is none. A word that only
 * begins with those letters ("DTX") is left whole.
 */
export function normalizeDtValue(text: string): string | null {
  const value = text
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/^DT(?=$|[\s./-]|\d)\s*/, '');
  return value || null;
}

/** "DT 1", "DT A-1"; a value that brings its own dash reads "DT-1". */
export function formatDt(value: string): string {
  return /^[-./]/.test(value) ? `DT${value}` : `DT ${value}`;
}
