import { clothNameToHindi } from './clothHindi';

// A design's name in Hindi, worked out as it is typed. The words a design is
// called by — the garment, the occasion, the style — are looked up first;
// anything else goes through the cloth names' own rules (their fabric, brand
// and colour words, then letter by letter), so nothing is left in English.

const DESIGN_WORDS: Record<string, string> = {
  // Garments
  bandhgala: 'बंदगला',
  bandgala: 'बंदगला',
  bandhgalla: 'बंदगला',
  jodhpuri: 'जोधपुरी',
  sherwani: 'शेरवानी',
  achkan: 'अचकन',
  indo: 'इंडो',
  western: 'वेस्टर्न',
  indowestern: 'इंडो वेस्टर्न',
  nehru: 'नेहरू',
  koti: 'कोटी',
  waistcoat: 'वेस्टकोट',
  jacket: 'जैकेट',
  blazer: 'ब्लेज़र',
  tuxedo: 'टक्सीडो',
  coat: 'कोट',
  suit: 'सूट',
  kurta: 'कुर्ता',
  pajama: 'पजामा',
  pyjama: 'पजामा',
  pathani: 'पठानी',
  sadri: 'सदरी',
  pant: 'पैंट',
  trouser: 'ट्राउज़र',
  shirt: 'शर्ट',
  piece: 'पीस',
  set: 'सेट',
  // Kind and cut
  long: 'लॉन्ग',
  short: 'शॉर्ट',
  half: 'हाफ',
  full: 'फुल',
  sleeves: 'स्लीव्स',
  sleeveless: 'स्लीवलेस',
  collar: 'कॉलर',
  mandarin: 'मैंडरिन',
  double: 'डबल',
  single: 'सिंगल',
  breasted: 'ब्रेस्टेड',
  shawl: 'शॉल',
  lapel: 'लैपल',
  peak: 'पीक',
  slim: 'स्लिम',
  regular: 'रेगुलर',
  // Occasion and style
  wedding: 'वेडिंग',
  groom: 'ग्रूम',
  bride: 'ब्राइड',
  party: 'पार्टी',
  festive: 'फेस्टिव',
  formal: 'फॉर्मल',
  casual: 'कैज़ुअल',
  traditional: 'ट्रेडिशनल',
  designer: 'डिज़ाइनर',
  premium: 'प्रीमियम',
  collection: 'कलेक्शन',
  special: 'स्पेशल',
  royal: 'रॉयल',
  classic: 'क्लासिक',
  prince: 'प्रिंस',
  modern: 'मॉडर्न',
  stylish: 'स्टाइलिश',
  trendy: 'ट्रेंडी',
  latest: 'लेटेस्ट',
  new: 'न्यू',
  with: 'विद',
  // Work and finish
  embroidered: 'एम्ब्रॉइडर्ड',
  embroidery: 'एम्ब्रॉइडरी',
  printed: 'प्रिंटेड',
  print: 'प्रिंट',
  plain: 'प्लेन',
  floral: 'फ्लोरल',
  zari: 'ज़री',
  zardozi: 'ज़रदोज़ी',
  work: 'वर्क',
  mirror: 'मिरर',
  thread: 'थ्रेड',
  buttons: 'बटन',
  button: 'बटन',
  velvet: 'वेलवेट',
  silver: 'सिल्वर',
  // Counts
  one: 'वन',
  two: 'टू',
  three: 'थ्री',
};

/**
 * A design name written in Hindi letters. Numbers and punctuation stay as
 * they are, and a name already in Hindi comes back untouched.
 */
export function designNameToHindi(name: string): string {
  // "Prince's" is Prince: the possessive is not a word to read out.
  const plain = name.replace(/([A-Za-z])['’]s\b/g, '$1');
  return plain.replace(/[A-Za-z]+/g, (word) => {
    return DESIGN_WORDS[word.toLowerCase()] ?? clothNameToHindi(word);
  });
}

/**
 * The Hindi to show beside a design's name. Null when there is nothing to
 * add: a name that is already Hindi, or has no letters to change.
 */
export function designHindi(name: string): string | null {
  const hindi = designNameToHindi(name).trim();
  return hindi && hindi !== name.trim() ? hindi : null;
}
