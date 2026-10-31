import { designNameToHindi } from './designHindi';

// A note's Hindi, worked out as it is typed: the words a note about cloth or a
// design is made of are looked up first, then the design names' and cloth
// names' own rules, then letter by letter — so nothing is left in English.

const NOTE_WORDS: Record<string, string> = {
  // Small words
  a: 'ए',
  an: 'एन',
  the: 'द',
  is: 'इज़',
  are: 'आर',
  be: 'बी',
  of: 'ऑफ',
  to: 'टू',
  for: 'फॉर',
  and: 'एंड',
  or: 'ऑर',
  in: 'इन',
  on: 'ऑन',
  at: 'एट',
  by: 'बाय',
  it: 'इट',
  this: 'दिस',
  only: 'ओनली',
  not: 'नॉट',
  no: 'नो',
  do: 'डू',
  can: 'कैन',
  will: 'विल',
  may: 'मे',
  use: 'यूज़',
  very: 'वेरी',
  best: 'बेस्ट',
  good: 'गुड',
  // Care
  dry: 'ड्राई',
  clean: 'क्लीन',
  wash: 'वॉश',
  hand: 'हैंड',
  machine: 'मशीन',
  iron: 'आयरन',
  bleach: 'ब्लीच',
  steam: 'स्टीम',
  fade: 'फेड',
  shrink: 'श्रिंक',
  shrinkage: 'श्रिंकेज',
  wrinkle: 'रिंकल',
  free: 'फ्री',
  fast: 'फास्ट',
  // The cloth
  pure: 'प्योर',
  wool: 'वूल',
  soft: 'सॉफ्ट',
  smooth: 'स्मूद',
  fine: 'फाइन',
  rich: 'रिच',
  shine: 'शाइन',
  shiny: 'शाइनी',
  stretch: 'स्ट्रेच',
  imported: 'इम्पोर्टेड',
  original: 'ओरिजिनल',
  quality: 'क्वालिटी',
  fabric: 'फैब्रिक',
  cloth: 'क्लॉथ',
  lining: 'लाइनिंग',
  light: 'लाइट',
  heavy: 'हैवी',
  weight: 'वेट',
  comfortable: 'कम्फर्टेबल',
  durable: 'ड्यूरेबल',
  colour: 'कलर',
  color: 'कलर',
  matching: 'मैचिंग',
  look: 'लुक',
  extra: 'एक्स्ट्रा',
  // Making and delivery
  made: 'मेड',
  make: 'मेक',
  order: 'ऑर्डर',
  ready: 'रेडी',
  delivery: 'डिलीवरी',
  day: 'डे',
  days: 'डेज़',
  week: 'वीक',
  weeks: 'वीक्स',
  month: 'मंथ',
  months: 'मंथ्स',
  // Season and stock
  winter: 'विंटर',
  summer: 'समर',
  suitable: 'सूटेबल',
  available: 'अवेलेबल',
  stock: 'स्टॉक',
  limited: 'लिमिटेड',
  new: 'न्यू',
  pair: 'पेयर',
  inside: 'इनसाइड',
};

// "don't" is read as the two words it is, not as "don" and "t".
const CONTRACTIONS: [RegExp, string][] = [
  [/\bdon['’]t\b/gi, 'do not'],
  [/\bcan['’]t\b/gi, 'can not'],
  [/\bwon['’]t\b/gi, 'will not'],
];

/**
 * A note written in Hindi letters. Numbers and punctuation stay as they are,
 * and a note already in Hindi comes back untouched.
 */
export function noteToHindi(note: string): string {
  const expanded = CONTRACTIONS.reduce(
    (text, [pattern, words]) => text.replace(pattern, words),
    // "Raymond's" is Raymond: the possessive is not a word to read out.
    note.replace(/([A-Za-z])['’]s\b/g, '$1')
  );
  return expanded.replace(/[A-Za-z]+/g, (word) => {
    return NOTE_WORDS[word.toLowerCase()] ?? designNameToHindi(word);
  });
}

/**
 * The Hindi to show with a note: what the tailor saved for it, or what it
 * works out to. Null when there is nothing to add.
 */
export function noteHindi(note: string, saved: string | null): string | null {
  const hindi = saved?.trim() || noteToHindi(note).trim();
  return hindi && hindi !== note.trim() ? hindi : null;
}
