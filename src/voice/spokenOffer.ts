import { daysLeft, type Offer } from '../utils/offers';
import { isDevanagari } from '../utils/hinglishHindi';
import { noteToHindi } from '../utils/noteHindi';

// An offer as the showroom says it, in Hindi, when its poster comes up: the
// occasion, the offer, its line, and until when — "ईद ऑफर। 10 परसेंट डिस्काउंट।
// ऑन ऑल जोधपुरी सूट्स। यह ऑफर 15 नवंबर तक है". The tailor writes offers in
// English, so the words are put into Devanagari for the Hindi voice to say as
// the counter says them (not translated), as the bill's voice does with
// "परसेंट डिस्काउंट". Figures stay digits: the voice reads them out itself.

// The words offers are written in, as they are said. Anything else goes through
// the notes' own rules, which are tuned for cloth rather than for occasions.
const OFFER_WORDS: Record<string, string> = {
  offer: 'ऑफर',
  offers: 'ऑफर्स',
  sale: 'सेल',
  discount: 'डिस्काउंट',
  off: 'ऑफ',
  special: 'स्पेशल',
  mega: 'मेगा',
  big: 'बिग',
  grand: 'ग्रैंड',
  super: 'सुपर',
  flat: 'फ्लैट',
  extra: 'एक्स्ट्रा',
  buy: 'बाय',
  get: 'गेट',
  free: 'फ्री',
  on: 'ऑन',
  all: 'ऑल',
  any: 'एनी',
  every: 'एवरी',
  with: 'विद',
  and: 'एंड',
  or: 'ऑर',
  of: 'ऑफ',
  for: 'फॉर',
  the: 'द',
  new: 'न्यू',
  year: 'ईयर',
  happy: 'हैप्पी',
  season: 'सीज़न',
  festive: 'फेस्टिव',
  festival: 'फेस्टिवल',
  wedding: 'वेडिंग',
  shaadi: 'शादी',
  summer: 'समर',
  winter: 'विंटर',
  monsoon: 'मानसून',
  clearance: 'क्लीयरेंस',
  stock: 'स्टॉक',
  limited: 'लिमिटेड',
  launch: 'लॉन्च',
  opening: 'ओपनिंग',
  anniversary: 'एनिवर्सरी',
  week: 'वीक',
  weekend: 'वीकेंड',
  day: 'डे',
  days: 'डेज़',
  only: 'ओनली',
  today: 'टुडे',
  eid: 'ईद',
  mubarak: 'मुबारक',
  ramzan: 'रमज़ान',
  ramadan: 'रमज़ान',
  bakrid: 'बकरीद',
  diwali: 'दिवाली',
  deepawali: 'दीपावली',
  dhanteras: 'धनतेरस',
  holi: 'होली',
  navratri: 'नवरात्रि',
  dussehra: 'दशहरा',
  durga: 'दुर्गा',
  puja: 'पूजा',
  rakhi: 'राखी',
  raksha: 'रक्षा',
  bandhan: 'बंधन',
  karwa: 'करवा',
  chauth: 'चौथ',
  lohri: 'लोहड़ी',
  pongal: 'पोंगल',
  onam: 'ओणम',
  christmas: 'क्रिसमस',
  xmas: 'क्रिसमस',
  independence: 'इंडिपेंडेंस',
  republic: 'रिपब्लिक',
  suit: 'सूट',
  suits: 'सूट्स',
  kurta: 'कुर्ता',
  kurtas: 'कुर्ते',
  sherwani: 'शेरवानी',
  stitching: 'स्टिचिंग',
  cloth: 'क्लॉथ',
  fabric: 'फैब्रिक',
};

const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

/** The occasion when the tailor gave none, as the poster shows "Special offer". */
const NO_OCCASION = 'स्पेशल ऑफर';

const AMOUNT = String.raw`(\d[\d,]*(?:\.\d+)?)`;

/** One part of an offer, in words the Hindi voice says well. */
export function spokenOfferText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || isDevanagari(trimmed)) return trimmed;
  return (
    trimmed
      // ₹500, Rs. 500, INR 500, 500 Rs, 500 rupees: all "500 रुपये".
      .replace(
        new RegExp(String.raw`(?:₹|\brs\b\.?|\binr\b)\s*${AMOUNT}`, 'gi'),
        ' $1 रुपये '
      )
      .replace(
        new RegExp(String.raw`${AMOUNT}\s*(?:\brs\b\.?|\brupees?\b|₹)`, 'gi'),
        ' $1 रुपये '
      )
      .replace(
        new RegExp(
          String.raw`${AMOUNT}\s*(?:%|\bper\s*cent\b|\bpercent\b)`,
          'gi'
        ),
        ' $1 परसेंट '
      )
      // "10% off" is the discount the bill's voice calls "10 परसेंट डिस्काउंट".
      .replace(/(परसेंट|रुपये)\s+(?:off|discount)\b/gi, '$1 डिस्काउंट')
      .replace(/\bup\s*to\b/gi, ' अप टू ')
      .replace(/(\d),(?=\d)/g, '$1')
      .replace(
        /[A-Za-z]+/g,
        (word) => OFFER_WORDS[word.toLowerCase()] ?? noteToHindi(word)
      )
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Until when: "यह ऑफर सिर्फ आज तक है", "यह ऑफर कल तक है", "यह ऑफर 15 नवंबर तक है". */
export function spokenOfferEnd(endsAt: string, now: Date = new Date()): string {
  const days = daysLeft(endsAt, now);
  if (days <= 0) return 'यह ऑफर सिर्फ आज तक है';
  if (days === 1) return 'यह ऑफर कल तक है';
  const end = new Date(endsAt);
  return `यह ऑफर ${end.getDate()} ${HINDI_MONTHS[end.getMonth()]} तक है`;
}

/** The whole offer, said as its poster comes up. */
export function spokenOffer(offer: Offer, now: Date = new Date()): string {
  const parts = [
    spokenOfferText(offer.occasion) || NO_OCCASION,
    spokenOfferText(offer.title),
    spokenOfferText(offer.note),
    spokenOfferEnd(offer.endsAt, now),
  ].filter(Boolean);
  // A full stop after each, so the voice pauses where the poster breaks a line.
  return parts.join('। ');
}
