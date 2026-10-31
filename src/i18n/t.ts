import { HINDI } from './hindi';

// The app's words, in the language chosen in Settings. The English sentence is
// its own key, so a screen still reads as what it says: t('Save bill'). Numbers
// and names go in as {0}, {1}, because Hindi does not put them where English does:
// t('{0} of {1} designs', shown, all). Bills and PDFs sent to customers do not use
// this: they read the same whatever the tailor's phone is set to.

export type Language = 'en' | 'hi';

let language: Language = 'en';

export const getLanguage = (): Language => language;

export function setLanguage(next: Language): void {
  language = next;
}

/**
 * The Hindi of a word, or null where there is none. A label already written in
 * both, "Cloth · कपड़ा", needs no entry: it is its own Hindi.
 */
export function hindiOf(english: string): string | null {
  const own = HINDI[english];
  if (own !== undefined) return own;
  const [, written] = /·\s*([^·]*[ऀ-ॿ][^·]*)$/.exec(english) ?? [];
  return written?.trim().replace('(optional)', '(वैकल्पिक)') ?? null;
}

/** `english` in the app's language, with `values` in place of {0}, {1}. */
export function t(english: string, ...values: (string | number)[]): string {
  const text = language === 'hi' ? (hindiOf(english) ?? english) : english;
  return values.length
    ? text.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)]))
    : text;
}

/**
 * Marks a word kept in a constant, made before any language is chosen. The screen
 * that shows it puts it through t() then. Marked, so it is still checked for Hindi.
 */
export const later = (english: string): string => english;
